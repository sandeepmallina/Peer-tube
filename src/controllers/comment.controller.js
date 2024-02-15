import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";

export const getVideoComments = asyncHandler(async (req, res) => {
  /**
   * * get the video id from the params
   * * aggrgate and find the match with videoId
   * * lookup for video id from the videos collections
   * * then lookup the owner from user collection
   */
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              avatar: 1,
              username: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              title: 1,
              videoFile: 1,
              owner: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: { $arrayElemAt: ["$video", 0] },
      },
    },
  ]);
  const options = {
    page: page,
    limit: limit,
  };
  const comments = await Comment.aggregatePaginate(commentsAggregate, options);
  res
    .status(200)
    .json(
      new ApiResponse(203, comments?.docs, "Comments Fetched successfully")
    );
});

export const addComment = asyncHandler(async (req, res) => {
  /**
   * * get the videoId and comment content from the req
   * * then create document in comment collection
   * * get the owner id from the req.user
   */
  const { videoId } = req.params;
  const ownerId = req.user?._id;
  const { content } = req.body;
  //   console.log(videoId);
  const isVideoExist = await Video.findOne({ _id: videoId });
  if (!isVideoExist) {
    throw new ApiError(404, "Video not found");
  }
  if (!videoId || !content) {
    throw new ApiError(404, "Video not found and content required");
  }
  if (!ownerId) {
    throw new ApiError(409, "Please login to comment");
  }
  const createdcomment = await Comment.create({
    content: content,
    video: videoId,
    owner: ownerId,
  });

  res
    .status(200)
    .json(new ApiResponse(201, createdcomment, "Comment created successfully"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const { _id } = req?.user;
  if (!commentId) {
    throw new ApiError(404, "comment Id required");
  }
  //   console.log(`Comment ${commentId} and ${_id}`);
  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: _id },
    {
      content: content,
      isEdited: true,
    },
    {
      new: true,
    }
  );
  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }
  res
    .status(200)
    .json(new ApiResponse(201, updatedComment, "Comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const ownerId = req.user?._id;
  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: ownerId,
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or your not authorized ");
  }
  res
    .status(200)
    .json(new ApiResponse(201, deletedComment, "Comment deleted successfully"));
});
