import asyncHandler from "../utils/aysncHandler.js";
export const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});
