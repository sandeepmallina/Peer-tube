import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatarImage,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// Her register user is
//  a controller used to define which function should be executed when a particular route is hit
router.route("/register").post(
  // here upload  is a middleware so it so it is exported from the malter so multer is used to upload files
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/currentuser").get(verifyJWT, getCurrentUser);

router.route("/updatepassword").post(verifyJWT, changeCurrentPassword);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/avatar-image")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatarImage);

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory);
export default router;
