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
