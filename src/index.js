import connectDB from "./db/index.js";

connectDB();

//
// const app = express();
// import express from "express";
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR: Couldn't connect to Mongo", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log("App is listening on port " + process.env.PORT);
//     });
//   } catch (err) {
//     console.error("Error While connecting to DB", err);
//   }
// })();
