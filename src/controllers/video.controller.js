import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = 1,
    userId,
  } = req.query;
  // console.log(
  //   page,
  //   limit,
  //   query,
  //   sortType,
  //   sortBy,
  //   userId,
  //   "from the video controller"
  // );
  //TODO: get all videos based on query, sort, pagination

  const pipeline = [];

  const matchStage = {
    $match: {
      $or: [],
    },
  };
  if (!query && !userId) {
    throw new ApiError(401, "EIther Userid or query is required");
  }
  if (query) {
    matchStage.$match.$or.push({ title: { $regex: query, $options: "i" } });
  }
  if (userId) {
    matchStage.$match.$or.push({ owner: new mongoose.Types.ObjectId(userId) });
  }
  pipeline.push(matchStage);

  /**
   * !  dont resolve this when using pagination
   * * Building Dynamic Pipelines: Aggregation pipelines can be complex and may need to be dynamically constructed 
   *  *based on user input, application logic, or other factors.

Conditional Operations: As in your case, you might want to conditionally include certain stages or expressions in the aggregation pipeline based on the state of your application or user input.
   */

  //const videosAggregate = Video.aggregate([
  //   {
  //     $match: {
  //       $or: [
  //         { title: { $regex: query, $options: "i" } },
  //         {
  //           owner: {
  //             $eq: new mongoose.Types.ObjectId(userId),
  //           },
  //         },
  //       ],
  //     },
  //   },
  // ]);

  const videosAggregate = Video.aggregate(pipeline);
  if (!videosAggregate) {
    throw new ApiError(404, "No video found");
  }
  // console.log(videosAggregate);
  const options = {
    page: page,
    limit: limit,
    sort: {
      // sort by createdAt or updatedAt
      [sortBy]: sortType, //-1 for  sort by createdAt descending

      // 1 for sort by createdAt ascending
    },
  };
  // console.log(options.sort);

  const result = await Video.aggregatePaginate(videosAggregate, options);
  // console.log(result, "fromt he results");
  // console.log(result.totalDocs, "fromt he results");
  const videos = result?.docs;
  res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched succesfully"));
});

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
  const { _id } = req?.user;
  // console.log(videoId);
  const { views } = await Video.findOne(new mongoose.Types.ObjectId(videoId));

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      views: views + 1,
    },
    { new: true }
  );
  //   console.log(video);
  if (_id && video) {
    /**
     * *Update at most one document that matches the filter criteria. If multiple documents match the filter criteria, only the
     * *first matching document will be updated.
     */
    await User.updateOne(
      { _id: _id },
      {
        /**
         * *$push is used to append elements to the array
         * * addToSet is used avoid duplicate entries to the array
         */

        $addToSet: { watchHistory: videoId },
      }
    );
  }

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

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  // console.log(video.owner);
  const ownerId = req.user?._id;
  if (video?.owner.toString() !== ownerId?.toString()) {
    throw new ApiError(402, "Not authorized to delete");
  }

  const videoPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    { isPublished: !video.isPublished },
    { new: true }
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        201,
        videoPublishStatus,
        "Video status updated successfully"
      )
    );
});
