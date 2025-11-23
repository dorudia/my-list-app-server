// models/Todo.js
import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    listName: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    reminder: { type: Boolean, default: false },
    reminderDate: { type: Date, default: null },
  },
  { timestamps: true } // adaugă createdAt și updatedAt automat
);

const Todo = mongoose.model("Todo", todoSchema);

export default Todo;
