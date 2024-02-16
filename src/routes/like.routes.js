import { Router } from "express";
import {
  getAllLikes,
  likeComment,
  likeTweet,
  likeVideo,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/like/v/:videoId").post(verifyJWT, likeVideo);
router.route("/like/c/:commentId").post(verifyJWT, likeComment);
router.route("/like/t/:tweetId").post(verifyJWT, likeTweet);
router.route("/like/v/get").get(verifyJWT, getAllLikes);

export default router;
