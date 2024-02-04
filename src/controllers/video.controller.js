import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
export const publishVideo = asyncHandler(async (req, res) => {
  // get title,description from user
  // validate title and description
  // get the video file from user
  // get the path of the video
  // upload the video to cloudinary
  // save it temp file if error occuses
  // send the respone containing the video url,message,duration

  const { title, description } = req.body;
  //   console.log(title, description, "from the video controller");

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(401, "All Fields req");
  }

  const videoLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  const ownerId = req.user?._id;

  if (!videoLocalPath) {
    throw new ApiError(404, "video is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(404, "thumbnail is required");
  }

  const videoUrl = await uploadOnCloudinary(videoLocalPath);

  //   console.log(videoUrl?.duration, "from the the cloudinary");

  const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoUrl?.url) {
    throw new ApiError(500, "Error while uploading video");
  }
  if (!thumbnailUrl?.url) {
    throw new ApiError(500, "Error while uploading thumbnail");
  }
  //   console.log(videoUrl.url);
  //   console.log(thumbnailUrl.url);
  //   console.log(videoUrl?.duration);
  const video = await Video.create({
    videoFile: videoUrl.url,
    thumbnail: thumbnailUrl.url,
    title: title,
    description: description,
    duration: videoUrl.duration,
    owner: ownerId,
  });
  //   console.log(video, "from mongo");

  const uploadedVideo = await Video.findById(video._id).select("-description");
  if (!uploadedVideo) {
    throw new ApiError(
      500,
      "Something went wrong while setting   video url to db"
    );
  }
  res
    .status(200)
    .json(new ApiResponse(201, uploadedVideo, "Video Uploaded successfully"));
});
export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);

  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  //   console.log(video);
  res.status(200).json(new ApiResponse(201, video, "Video found "));
});

export const deleteVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const ownerId = req.user._id;
  //   console.log(ownerId.toString(), videoId);
  const video = await Video.findById(videoId);
  //   console.log(video);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //   console.log(video?.owner.toString());
  if (video?.owner.toString() !== ownerId?.toString()) {
    throw new ApiError(402, "Not authorized to delete");
  }

  const { thumbnail, videoFile } = await Video.findByIdAndDelete(videoId);
  //   console.log(thumbnail, videoFile);
  const deleteImageAssetIds = [];
  const videoImageAssetIds = [];
  const thumbnailId = thumbnail
    ?.toString()
    .split("/")
    .splice(-1)[0]
    .split(".")[0];
  //   console.log(thumbnailId, "id");
  deleteImageAssetIds.push(thumbnailId);
  await deleteOnCloudinary(deleteImageAssetIds, "images");
  const videoFileId = videoFile
    ?.toString()
    .split("/")
    .splice(-1)[0]
    .split(".")[0];
  videoImageAssetIds.push(videoFileId);
  await deleteOnCloudinary(videoImageAssetIds, "videos");

  res.status(200).json(new ApiResponse(201, video, "Video Deleted succefully"));
});
export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const ownerId = req.user?._id;
  //   console.log(ownerId.toString(), videoId);
  const video = await Video.findById(videoId);
  //   console.log(video);
  const { thumbnail, videoFile } = video;
  //   console.log(thumbnail, videoFile);
  const deleteImageAssetIds = [];
  const videoImageAssetIds = [];

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //   console.log(video?.owner.toString());
  if (video?.owner.toString() !== ownerId?.toString()) {
    throw new ApiError(402, "Not authorized to delete");
  }

  const videoLocalPath = req.files?.videoFile[0].path;
  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  }

  if (!videoLocalPath) {
    throw new ApiError(404, "video is required");
  }
  let thumbnailUrl;
  if (thumbnailLocalPath) {
    const thumbnailId = thumbnail
      ?.toString()
      .split("/")
      .splice(-1)[0]
      .split(".")[0];
    //   console.log(thumbnailId, "id");
    deleteImageAssetIds.push(thumbnailId);
    await deleteOnCloudinary(deleteImageAssetIds, "images");
    thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath);
  }
  const videoUrl = await uploadOnCloudinary(videoLocalPath);

  if (!videoUrl) {
    throw new ApiError(404, "video url is required");
  }

  const videoFileId = videoFile
    ?.toString()
    .split("/")
    .splice(-1)[0]
    .split(".")[0];
  videoImageAssetIds.push(videoFileId);
  await deleteOnCloudinary(videoImageAssetIds, "videos");
  const upadatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        videoFile: videoUrl.url,
        thumbnail: thumbnailUrl.url,
        duration: videoUrl.duration,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, upadatedVideo, "Video Updated sucessfully"));
});
