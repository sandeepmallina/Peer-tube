import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/aysncHandler.js";
export const createPlaylist = asyncHandler(async (req, res) => {
  /**
   * * get name and description from user for playlists
   * * get the Owner id from req.user
   * * create a new document inside playlists collection
   * * check if the playlist document created successfully
   * * send the response of successful creation
   */
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(409, "Name  and description must be provided");
  }
  const ownerId = req.user?._id;
  const playlist = await Playlist.create({
    name: name,
    description: description,
    videos: [],
    owner: ownerId,
  });
  if (!playlist) {
    throw new ApiError(504, "Error while creating playlist");
  }
  res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const ownerId = req.user?._id;
  const isVideoExist = await Video.findById(videoId);
  if (!isVideoExist) {
    throw new ApiError("404", "Video dont exist");
  }
  console.log(ownerId, playlistId, videoId);
  const playlistUpdated = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: ownerId,
    },
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );
  if (!playlistUpdated) {
    throw new ApiError(409, " playlist does not exist ");
  }
  res
    .status(200)
    .json(new ApiResponse(201, playlistUpdated, "Videos updated successfully"));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  /**
   * * get the playlistid and videoid from the user
   * * use findOneandDlete to match the playlistid and videoid in video array
   * * return the updated playlist
   */

  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(409, "PlaylistId and VideoId required");
  }

  /**
   * * pull is used to delete the element from the array inside the document
   * * in checks for element existence in arra
   */
  const updatedPlaylist = await Playlist.updateOne(
    { _id: playlistId, videos: { $in: [videoId] } },
    {
      $pull: {
        videos: videoId,
      },
    }
  );
  if (updatedPlaylist.matchedCount === 0) {
    throw new ApiError(409, "VideoId not found");
  }

  res
    .status(200)
    .json(new ApiResponse(201, updatedPlaylist, "Video deleted successfully"));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const ownerId = req.user?._id;
  // console.log(playlistId, ownerId);
  const deletePlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: ownerId,
  });

  if (!deletePlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(202, deletePlaylist, "Playlist deleted successfully")
    );
});
export const updatePlaylist = asyncHandler(async (req, res) => {
  /**
   * * get name and description from user for playlists
   * * get the Owner id from req.user
   * * create a new document inside playlists collection
   * * check if the playlist document created successfully
   * * send the response of successful creation
   */
  const { playlistId } = req.params;
  /**
   * * form data wont work with patch function
   */
  // console.log(req.body);
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(409, "playlist id  must be provided");
  }
  if (!name || !description) {
    throw new ApiError(409, "Name  and description must be provided");
  }
  const ownerId = req.user?._id;
  const updatedplaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: ownerId,
    },
    {
      $set: {
        name: name,
        description: description,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedplaylist) {
    throw new ApiError(504, "Error while updating playlist");
  }
  res
    .status(200)
    .json(
      new ApiResponse(201, updatedplaylist, "Playlist Updated successfully")
    );
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(401, "User must be specified");
  }
  /**
   * * find return list of documents that match the filter
   * * findOne returns only one document that matches the filter
   */
  const playlists = await Playlist.find({ owner: userId });

  if (!playlists) {
    throw new ApiError(404, "User Playlist not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        201,
        playlists,
        "All Playlists of user fecthed successfully "
      )
    );
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(401, "User must be specified");
  }
  const playlists = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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

  if (!playlists) {
    throw new ApiError(404, "playlist not found");
  }
  res.status(200).json(new ApiResponse(200, playlists, "Playlist  Found"));
});
