import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    todoId: { type: String },
    listName: { type: String },
    title: { type: String, required: true },
    body: { type: String },
    read: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    date: { type: Date },
    expoPushToken: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
