import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";

export const createTweet = asyncHandler(async (req, res) => {
  const { _id } = req?.user;
  const { tweetheader, tweetContent } = req.body;

  if (!tweetContent) {
    throw new ApiError(402, "Tweet content missing");
  }

  const tweetCreated = await Tweet.create({
    owner: _id,
    content: `${tweetheader} + ${tweetContent}`,
  });

  res
    .status(200)
    .json(new ApiResponse(201, tweetCreated, "Tweet created successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { _id } = req?.user;
  const { tweetId } = req.params;
  const { tweetheader, tweetContent } = req.body;

  /**
   * ! Tweet.findByIdAndDelete` takes the ID of the tweet as its parameter and directly searches for
   * ! the tweet with that specific ID and deletes it.
   *
   * ! Tweet.findOneAndDelete` takes a query object as its parameter and returns the first document that matches the query criteria.
   * ! It searches for a tweet based on the specified query and deletes it.
   */
  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: _id },
    { content: `${tweetheader} + ${tweetContent}`, isEdited: true },
    { new: true }
  );

  // console.log(_id.toString());
  // console.log(isEdited, owner.toString());
  if (!updatedTweet) {
    throw new ApiError(404, "In valid request owner mismatch");
  }
  res
    .status(201)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

export const getAlltweets = asyncHandler(async (req, res) => {
  /**
   *  ! check the sort function by created at
   */
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = 1,
    userId,
  } = req.query;
  const matchQuery = userId
    ? { owner: new mongoose.Types.ObjectId(userId) }
    : {};
  const options = {
    page: page,
    limit: limit,
    sort: {
      // sort by createdAt or updatedAt
      [sortBy]: sortType, //-1 for  sort by createdAt descending

      // 1 for sort by createdAt ascending
    },
  };

  const tweetsAggregate = Tweet.aggregate([
    {
      $match: matchQuery,
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
  ]);
  const tweets = await Tweet.aggregatePaginate(tweetsAggregate, options);
  res
    .status(200)
    .json(new ApiResponse(200, tweets?.docs, "Tweets fetched succesfully"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { _id } = req?.user;
  const { tweetId } = req.params;

  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: _id,
  });

  if (!deletedTweet) {
    throw new ApiError(404, "Invalid request or owner mismatch");
  }

  res
    .status(201)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});
