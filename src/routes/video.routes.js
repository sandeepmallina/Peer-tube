import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideoById,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router.route("/v/get/:videoId").get(verifyJWT, getVideoById);

router.route("/v/delete/:videoId").post(verifyJWT, deleteVideoById);
router.route("/v/update/:videoId").patch(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateVideo
);

router.route("/v/search").get(getAllVideos);

router.route("/v/publish/:videoId").patch(verifyJWT, togglePublishStatus);
export default router;
