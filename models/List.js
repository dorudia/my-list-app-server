import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("List", listSchema);
