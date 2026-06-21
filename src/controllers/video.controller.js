import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadToCloudinary} from "../utils/cloudinary.js"
import {deleteFromCloudinary} from "../utils/cloudinaryDelete.js"

// GET /videos?page=1&limit=10&query=&sortBy=createdAt&sortType=desc&userId=&tag=
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId,
        tag
    } = req.query

    const matchStage = {
        isPublished: true
    }

    if (query?.trim()) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (tag && tag !== "All") {
        matchStage.tag = tag
    }

    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    const videosAggregate = Video.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $project: {
                videFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                owner: 1,
                createdAt: 1,
                tag: 1,
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const videos = await Video.aggregatePaginate(videosAggregate, options)

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const {title, description, tag} = req.body

    if (!title?.trim()) {
        throw new ApiError(400, "Title is required")
    }

    if (!description?.trim()) {
        throw new ApiError(400, "Description is required")
    }

    if (!tag?.trim()) {
        throw new ApiError(400, "Category / Tag is required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const videoFile = await uploadToCloudinary(videoLocalPath)

    if (!videoFile?.url) {
        throw new ApiError(500, "Failed to upload video")
    }

    let thumbnailUrl = "";
    if (thumbnailLocalPath) {
        const thumbnail = await uploadToCloudinary(thumbnailLocalPath)
        if (!thumbnail?.url) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }
        thumbnailUrl = thumbnail.url;
    } else {
        // Assume thumbnail from video URL by replacing the video extension with .jpg
        const lastDot = videoFile.url.lastIndexOf('.');
        thumbnailUrl = lastDot !== -1 ? videoFile.url.substring(0, lastDot) + ".jpg" : videoFile.url;
    }

    const video = await Video.create({
        videFile: videoFile.url,
        thumbnail: thumbnailUrl,
        title,
        description,
        duration: videoFile.duration || 0,
        owner: req.user._id,
        isPublished: true,
        tag: tag,
    })

    if (!video) {
        throw new ApiError(500, "Failed to publish video")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLikedByUser: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                videFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                likesCount: 1,
                isLikedByUser: 1,
                createdAt: 1,
                tag: 1,
            }
        }
    ])

    if (!video?.length) {
        throw new ApiError(404, "Video not found")
    }

    const videoData = video[0]
    if (!videoData.isPublished) {
        if (!req.user || videoData.owner?._id?.toString() !== req.user._id?.toString()) {
            throw new ApiError(403, "This video is private")
        }
    }

    // Increment views and add to watch history
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId }
        })
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {title, description, tag} = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!title?.trim() && !description?.trim() && !tag?.trim() && !req.file) {
        throw new ApiError(400, "At least one field is required to update")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    let thumbnailUrl = video.thumbnail

    if (req.file?.path) {
        // Upload new thumbnail
        const uploadedThumbnail = await uploadToCloudinary(req.file.path)
        if (!uploadedThumbnail?.url) {
            throw new ApiError(500, "Failed to upload new thumbnail")
        }

        // Delete old thumbnail
        if (video.thumbnail) {
            try {
                await deleteFromCloudinary(video.thumbnail)
            } catch (error) {
                console.log("Old thumbnail deletion failed:", error.message)
            }
        }

        thumbnailUrl = uploadedThumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                ...(title && { title }),
                ...(description && { description }),
                ...(tag && { tag }),
                thumbnail: thumbnailUrl,
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    // Delete files from Cloudinary
    if (video.videFile) {
        try {
            await deleteFromCloudinary(video.videFile)
        } catch (error) {
            console.log("Video file deletion from Cloudinary failed:", error.message)
        }
    }

    if (video.thumbnail) {
        try {
            await deleteFromCloudinary(video.thumbnail)
        } catch (error) {
            console.log("Thumbnail deletion from Cloudinary failed:", error.message)
        }
    }

    await Video.findByIdAndDelete(videoId)

    // Cleanup associated data
    await Like.deleteMany({ video: videoId })
    await Comment.deleteMany({ video: videoId })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle publish status of this video")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { isPublished: updatedVideo.isPublished },
            `Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`
        ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}