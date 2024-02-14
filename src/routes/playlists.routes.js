import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/pl/create").post(verifyJWT, createPlaylist);
router
  .route("/pl/add-video/:playlistId/:videoId")
  .patch(verifyJWT, addVideoToPlaylist);

router
  .route("/pl/delete-video/:playlistId/:videoId")
  .patch(verifyJWT, removeVideoFromPlaylist);

router.route("/pl/delete/:playlistId").post(verifyJWT, deletePlaylist);

router.route("/pl/update/:playlistId").patch(verifyJWT, updatePlaylist);

router.route("/pl/get-playlist/:playlistId").get(getPlaylistById);
router.route("/pl/get-user-playlist/:userId").get(getUserPlaylists);

export default router;
