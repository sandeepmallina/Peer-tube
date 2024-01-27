import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation — not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object — create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, username, email, password } = req.body;

  //   some takes an array and traverses every field every value and check the given condition if it satisfies it returns
  //   true .we can use map here but map returns an array
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //Heres the username or email already exists he will throw an error that username or already exists
  const userExists = await User.findOne({ $or: [{ username }, { email }] });
  if (userExists) {
    throw new ApiError(406, "Username or email already exists");
  }

  //   res.files here is provided by the middleware  multer

  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // console.log(coverImageLocalPath, "coverImage");

  //  when you're skipping a cover image the entire res.files is having only avatar
  //  also we have to explicitly cheque for every value
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required for upload");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    new ApiError(500, "Something went wrong while creating user");
  }
  res
    .status(200)
    .json(new ApiResponse(201, createdUser, "user successfully created"));
});
