import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getAlltweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/t/create-tweet").post(verifyJWT, createTweet);

router.route("/t/update/:tweetId").patch(verifyJWT, updateTweet);

router.route("/t/get-tweet").get(getAlltweets);

router.route("/t/delete/:tweetId").post(verifyJWT, deleteTweet);

export default router;
