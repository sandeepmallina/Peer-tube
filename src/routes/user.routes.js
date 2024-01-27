import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
// Her register user is
//  a controller used to define which function should be executed when a particular route is hit
router.route("/register").post(
  // here upload  is a middleware so it so it is exported from the malter so malter is used to upload files
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

export default router;
