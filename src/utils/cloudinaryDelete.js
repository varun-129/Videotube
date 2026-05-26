import { v2 as cloudinary } from "cloudinary"

const extractPublicId = (url) => {
    try {
        const parts = url.split("/")
        const uploadIndex = parts.findIndex(p => p === "upload")
        if (uploadIndex === -1) return null
        const publicIdWithVersion = parts.slice(uploadIndex + 1).join("/")
        const withoutVersion = publicIdWithVersion.replace(/^v\d+\//, "")
        const publicId = withoutVersion.replace(/\.[^/.]+$/, "")
        return publicId
    } catch (error) {
        return null
    }
}

export const deleteFromCloudinary = async (url) => {
    if (!url) return null
    try {
        const publicId = extractPublicId(url)
        if (!publicId) return null
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch (error) {
        console.log("Cloudinary delete error:", error.message)
        return null
    }
}