import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload }    from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public routes (NO verifyJWT) ─────────────────────────
router.route("/register").post(
    upload.fields([
        { name: "avatar",     maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
)
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshToken)

// ── Protected routes (verifyJWT on each one) ─────────────
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-profile").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/update-cover").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
router.route("/channel/:username").get(verifyJWTOptional, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)

export default router