import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/pl/create").post(verifyJWT, createPlaylist);
router
  .route("/pl/update/:playlistId/:videoId")
  .patch(verifyJWT, addVideoToPlaylist);
export default router;
