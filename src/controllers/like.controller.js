import { Like } from "../models/like.model.js";
import asyncHandler from "../utils/aysncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
export const likeVideo = asyncHandler(async (req, res) => {
  /**
   * * get the video id from user
   * * check for matched document with same video id and user id
   * * if not present create .if present delete the document from the collection
   * * the send the 201 response
   */
  const { videoId } = req.params;
  const { _id } = req.user?._id;
  let isLiked = "";
  let liked;
  if (!videoId || !_id) {
    throw new ApiError(404, "Video ,you must login to like");
  }

  const isAlreadyLiked = await Like.findOne({ video: videoId, likedBy: _id });

  if (!isAlreadyLiked) {
    liked = await Like.create({ video: videoId, likedBy: _id });
    isLiked = "liked";
  } else {
    liked = await Like.findOneAndDelete({ video: videoId, likedBy: _id });
    isLiked = "disliked";
  }
  res.status(200).json(new ApiResponse(201, liked, `${isLiked} video `));
});

export const likeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id } = req.user?._id;
  let isLiked = "";
  let liked;
  if (!commentId || !_id) {
    throw new ApiError(404, "commentId ,you must login to like");
  }

  const isAlreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: _id,
  });

  if (!isAlreadyLiked) {
    liked = await Like.create({ comment: commentId, likedBy: _id });
    isLiked = "liked";
  } else {
    liked = await Like.findOneAndDelete({ comment: commentId, likedBy: _id });
    isLiked = "disliked";
  }
  res.status(200).json(new ApiResponse(201, liked, `${isLiked} comment `));
});

export const likeTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { _id } = req.user?._id;
  let isLiked = "";
  let liked;
  if (!tweetId || !_id) {
    throw new ApiError(404, "tweetId ,you must login to like");
  }

  const isAlreadyLiked = await Like.findOne({ tweet: tweetId, likedBy: _id });

  if (!isAlreadyLiked) {
    liked = await Like.create({ tweet: tweetId, likedBy: _id });
    isLiked = "liked";
  } else {
    liked = await Like.findOneAndDelete({ tweet: tweetId, likedBy: _id });
    isLiked = "disliked";
  }
  res.status(200).json(new ApiResponse(201, liked, `${isLiked} tweet `));
});

export const getAllLikes = asyncHandler(async (req, res) => {
  const userid = req.user?._id;
  const { page = 1, limit = 10, sortBy = -1 } = req?.query;
  if (!userid) {
    throw new ApiError(404, "Please login ");
  }
  /**
   * * how nested look up works
   * * here we we are doing first lookup on video collection using video collections
   * *  then we are doing nested lookup for owner in video field in user collection
   * * then we are adding field to video object as owner
   * * Then we add field to video object by list up the  data from the video array
   */
  const likeAggregate = Like.aggregate([
    {
      $match: {
        video: { $exists: true },
        likedBy: new mongoose.Types.ObjectId(userid),
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
              updatedAt: 0,
              createdAt: 0,
              _id: 1,
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
              owner: {
                $arrayElemAt: ["$owner", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $arrayElemAt: ["$video", 0],
        },
      },
    },
  ]);
  const options = {
    page: page,
    limit: limit,
    sort: {
      // sort by createdAt or updatedAt
      createdAt: sortBy,

      // 1 for sort by createdAt ascending
    },
  };
  const likes = await Like.aggregatePaginate(likeAggregate, options);

  res
    .status(200)
    .json(new ApiResponse(202, likes?.docs, "Succesfully fetched all videos "));
});
