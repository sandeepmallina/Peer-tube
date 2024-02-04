import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      // throw new Error("File not found: " + localFilePath);
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file is uploaded successfully
    // console.log(response);
    console.log("File uploaded successfully in ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    //remove the locally saved temporary file as the upload is failed

    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteOnCloudinary = async (assetIds, type) => {
  const deleteAssetIds = [...assetIds];
  // const response = await cloudinary.uploader.destroy(
  //   assetId,
  //   function (result) {
  //     return result;
  //   }
  // );
  // console.log("File deleted successfully : ", response);
  // return response;
  type === "images"
    ? cloudinary.api
        .delete_resources(deleteAssetIds, {
          type: "upload",
          resource_type: "image",
        })
        .then(console.log)
    : cloudinary.api
        .delete_resources(deleteAssetIds, {
          type: "upload",
          resource_type: "video",
        })
        .then(console.log);
};

export { uploadOnCloudinary, deleteOnCloudinary };
