import express from "express";
import {
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  deleteTodos,
} from "../controllers/todosController.js";

const router = express.Router();

router.get("/:userId/:listName", getTodos);
router.post("/:userId/:listName", addTodo);
router.patch("/:userId/:listName/:id", updateTodo);
router.delete("/:userId/:listName/:id", deleteTodo);
router.delete("/:userId/:listName", deleteTodos);

export default router;
