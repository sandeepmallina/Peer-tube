import mongoose, { Schema } from "mongoose";
import { User } from "./user.model.js";
const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: User,
    },
    channel: {
      type: Schema.Types.ObjectId, //one who is subscriber is subscribing to
      ref: User,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
