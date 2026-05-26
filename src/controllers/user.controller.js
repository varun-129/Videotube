import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async(userId) => {
    try{
       const user = await User.findById(userId);
       const accessToken = await user.generateAccessToken();
       const refreshToken = await user.generateRefreshToken();
       
       user.refreshToken = refreshToken;
         await user.save({validateBeforeSave : false});

         return {accessToken, refreshToken};
    }
    catch(error){
        throw new ApiError(500, "Failed to generate access and refresh token");
    }

}

const registerUser = asyncHandler(async (req, res) => {
    //get user detail from frontend
    //validate user detail (user name empty to nahi hai,email valid hai ya nahi, password strong hai ya nahi etc)
    //check if user already exist : using email id or username.
    //check for images ,check for avatar
    //upload them to cloudinary and get the url , check for avatar if it is successfully uploaded or not to cloudinary
    // create user object - create entry in database
    //remove password and refresh token field from response
    //check for user creation
    //return response


    //1. get user detail from frontend
    const { username, email, password ,fullName} = req.body;

    
    // console.log(req.body);
    // console.log("email", email);

    //validate user detail (user name empty to nahi hai,email valid hai ya nahi, password strong hai ya nahi etc)
    if(
        [username, email, password, fullName].some(               
            (field) => field?.trim()==="" || field === undefined || field === null
            /*this is array method , some method checks if any of the element in the array satisfies the condition 
            provided in the callback function, here we are checking if any of the field is empty or not*/
        )
    ){
        throw new ApiError(400, "All fields are required");
    }
     //check if user already exist : using email id or username.
    const existedUser = await User.findOne({
        $or: [{ email },{ username }]
    })

    if(existedUser){
        throw new ApiError(409, "User already exist with this email or username");
    }

    // console.log("req.files", req.files);
    //upload them to cloudinary and get the url , check for avatar if it is successfully uploaded or not to cloudinary
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    //upload them to cloudinary and get the url , check for avatar if it is successfully uploaded or not to cloudinary
    const avatar =  await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    //check again if avatar is successfully uploaded or not to cloudinary
    if(!avatar){
        throw new ApiError(400,"Failed to upload avatar to cloudinary")
    }

    // create user object - create entry in database
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        username : username.toLowerCase(),
        password
    })

    //checking if user is successfully created or not then remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //check for user creation
    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }
    
    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // bring data from request body
    //check if user exist with email or username
    //if user exist then compare password
    //if password match then generate access token and refresh token & save refresh token in database
    //return response with access token and refresh token
    //send them in cookies

    const {email,username,password} = req.body;

    if(!username && !email){
        throw new ApiError(400," Email or username is required " );
    }

    /* we can also do : if we want ki ek se bhin kaam chal jayega
     if(!(username || email)){
        throw new ApiError(400," Email or username is required " );
    }*/

    if(!password){
        throw new ApiError(400," Password is required " );
    }

    //check if user exist with email or username
    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User not found with this email or username");
    }

    //checking password
    const isPasswordValid = await user.isPasswordCorrect(password);

     if(!isPasswordValid){
        throw new ApiError(404,"invalid password");
    }

     //if password match then generate access token and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    //optional step
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const option = {
        httpOnly: true,
        secure : true,
    }

    return res.status(200).cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200, //status code
             {     
                //data
                user : loggedInUser,
                accessToken,
                refreshToken,
             },
             //message
            "User logged in successfully"

        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined,
            }
        },
        {
            new : true,
        }
    )

    const option = {
        httpOnly: true,
        secure : true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully"
        )
    )
})

const refreshToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }

    // incoming refresh token ko decode karke hum user id nikalenge ,fir usse hum database m jo refresh token hai uss user k liye  usko compare karenge ki wo same hai apne incoming refresh token se ya nahi.
    // 
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken != user.refreshToken){
            throw new ApiError(401, "refresh token is expired or used");
        }
        //sab verify hone ke baad hum naye access token aur refresh token generate karenge , fir usse database m save karenge aur response m bhej denge
    
        const options = {
            httpOnly : true,
            secure : true,
        }
    
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
                "Access token refreshed successfully"
            ) 
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }      
    
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Current password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const { fullName , email } = req.body;

    if(!fullName || !email){
        throw new ApiError(400 , " Full name and email are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                fullName : fullName,   //fullName ki najagh naya wala full name save set kr dega
                email : email,

                //hum yaha fullName : fullName ,email : email ki jagah sirf fullName, email bhi likh sakte the ye apne aap set kr deta
            }
        },
        {
            new : true, //true krne se ye update krne k baad ye updated rsponse bhi return kr deta hai
        }
    ).select("-password ")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    )
})

const updateAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const oldAvatarUrl = user.avatar;

    const localFilePath = req.file?.path;

    if (!localFilePath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // ✅ STEP 1: Upload new avatar FIRST
    const uploadedAvatar = await uploadToCloudinary(localFilePath);

    if (!uploadedAvatar?.secure_url) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    // ✅ STEP 2: Delete old avatar (safe way)
    if (oldAvatarUrl) {
        try {
            await deleteFromCloudinary(oldAvatarUrl);
        } catch (error) {
            // Don't break API if delete fails
            console.log("Old avatar deletion failed:", error.message);
        }
    }

    // ✅ STEP 3: Save new avatar (STRING as per your model)
    user.avatar = uploadedAvatar.secure_url;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const oldCoverImageUrl = user.coverImage;

    const localFilePath = req.file?.path;

    if (!localFilePath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // ✅ STEP 1: Upload new cover image
    const uploadedImage = await uploadToCloudinary(localFilePath);

    if (!uploadedImage?.secure_url) {
        throw new ApiError(500, "Failed to upload cover image");
    }

    // ✅ STEP 2: Delete old cover image
    if (oldCoverImageUrl) {
        try {
            await deleteFromCloudinary(oldCoverImageUrl);
        } catch (error) {
            console.log("Old cover image deletion failed:", error.message);
        }
    }

    // ✅ STEP 3: Save new cover image URL
    user.coverImage = uploadedImage.secure_url;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated successfully")
    );
});

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
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
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                //subpipeline
                    pipeline : [
                        {
                            $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "ownerDetails",
                                pipeline : [{
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1,
                                    }
                                }]
                            },
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$ownerDetails"
                                }
                            }
                        }
                ]
            }
        }


    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0]?.watchHistory,
            "User watch history fetched successfully"
        )
    )
})


export {registerUser, loginUser, logoutUser, refreshToken,changeCurrentPassword , getCurrentUser, updateAccountDetails , updateAvatar , updateCoverImage, getUserChannelProfile, getWatchHistory};