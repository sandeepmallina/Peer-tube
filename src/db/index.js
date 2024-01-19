import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      "Mongoose connection is established DB HOST",
      connectionInstance.connection.host
    );
  } catch (err) {
    console.log("Error connecting to MongoDB IN db: " + err.message);
    process.exit(1);
  }
};
export default connectDB;
