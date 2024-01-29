import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    // When you’re adding a refresh token to the user model, you’re updating the user’s information in the database.
    // This is typically done using a method like user.save().
    // However, when you call user.save(), it triggers the validation checks defined in your user model.
    // These checks might include things like password complexity, email format, etc.
    //Here we know what we are adding so there is no need of validation so we are adding validate before save :false
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, `${error} : Please try again`);
  }
};
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
export const loginUser = asyncHandler(async (req, res) => {
  //Todo
  // req.body -> data
  //username or emial
  // find the user
  //password check
  // access and refresh token
  // send the cookie
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "username or emial required");
  }
  //  $or is mongodb operators
  const userExist = await User.findOne({ $or: [{ username }, { email }] });
  if (!userExist) {
    throw new ApiError(404, "user not found");
  }
  // here we can access the password menthods(isPassword correct) by userExist not User(mongoose object) .
  // we use use userExist to acces those tokenks
  const isPasswordValid = await userExist.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Password is incorrect");
  }

  const { refreshToken, accessToken } = await getAccessTokenAndRefreshToken(
    userExist._id
  );

  const loggedInUser = await User.findOne(userExist._id).select(
    "-password -refreshToken"
  );
  const options = {
    // Here we are using http only because the cookies can modify from the front end also
    //  but we are using only server to modify the cookies
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    // Here we are using http only because the cookies can modify from the front end also
    //  but we are using only server to modify the cookies
    httpOnly: true,
    secure: true,
  };
  return res
    .clearCookie("AccessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user has been loggedOut"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);
    return res
      .status(200)
      .cookie("AccessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
