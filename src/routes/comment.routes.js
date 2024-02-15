import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/c/get/:videoId").get(getVideoComments);

router.route("/c/add/:videoId").post(verifyJWT, addComment);

router.route("/c/edit/:commentId").patch(verifyJWT, updateComment);

router.route("/c/delete/:commentId").post(verifyJWT, deleteComment);

export default router;
