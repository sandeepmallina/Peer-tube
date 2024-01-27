import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();
// Her register user is
//  a controller used to define which function should be executed when a particular route is hit
router.route("/register").post(registerUser);

export default router;
