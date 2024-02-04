import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
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

  // console.log(req.files);

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
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required for upload");
  }
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

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
    throw new ApiError(500, "Something went wrong while creating user");
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

  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
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
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        // this removes the field from the document
        refreshToken: 1,
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

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invaid password");
  }
  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Succesfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched successfully"));
});
export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All account details are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Updated successfully"));
});

export const updateUserAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const { avatar: avatarImageUrl } = req.user;

  const avatarImageId = avatarImageUrl.split("/").splice(-1)[0].split(".")[0];
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required for update");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Avatar file is required for updation");
  }
  await deleteOnCloudinary(avatarImageId);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  const { coverImage: coverImageUrl } = req.user;

  const coverImageId = coverImageUrl.split("/").splice(-1)[0].split(".")[0];

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  await deleteOnCloudinary(coverImageId);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "User name inValid ");
  }

  // User.find(username)
  /**
   * * Here when the user hit the channel via url so we get the channel name from the parms
   * * then we check  that channel name in the mongo db database .Then we  find the username get _id of that channel
   * *
   * *
   */
  const channel = await User.aggregate([
    {
      /**
       * * Here we are using a match stage to find the channel name in the database
       * * $match - Finds the user document matching the provided username.
       */
      $match: { username: username?.toLowerCase() },
    },
    {
      /**
       * * Here we are using lookup to connect with subscription schema
       * * and user schema based on the id and the channel id here channel is a user
       * * The lookup adds this to the user model
       */
      /**
       * * The first $lookup takes the user._id field and searches for it in the 'channel' field of the subscriptions collection.
       * * So it is looking for documents in subscriptions where the channel field matches the _id of the user document from $match.
       */

      $lookup: {
        /**
         * * Here lookup traverses every document in the subscriptions Collection
         */
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    /**
     * *The second $lookup again takes the user._id field but now searches for it in the 'subscriber' field of subscriptions.
     * * So it looks for documents where the subscriber field matches the user _id.
     *
     *
     */
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribeTo",
      },
    },
    {
      /**
       * * Here we are adding some fields to the user model
       */
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribersToCount: {
          $size: "$subscribeTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        channelsSubscribersToCount: 1,
        subscribersCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  /**
   * * Here aggregate function returns array channel
   */
  if (!channel.length) {
    throw new ApiError(404, "Channel does not exist");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        /**
         * * Here we are using new mongoose.Types.ObjectId(req.user._id) because as we are using mongoose
         * * the mongoose automatically converts the id into
         * * the object id as the objectid(Biubwiebdui....) is stored in the
         * * Mongodb so while using aggregations the code itself
         * * goes without the Mongooose wrapper so we need
         * * to unwrap that and get the objectid(Biubwiebdui....)
         */
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // this nested pipline to get the owner details
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $arrayElemAt: ["$owner", 0],
              },
            },
          },
        ],
      },
    },
  ]);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History failed Successfully"
      )
    );
});
