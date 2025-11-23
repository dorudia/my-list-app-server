import express from "express";
import {
  createList,
  getUserLists,
  deleteList,
} from "../controllers/listController.js";

const router = express.Router();

// Creare listă
router.post("/", createList);

// Obține listele unui user
router.get("/:userId", getUserLists);

// Ștergere listă
router.delete("/:id", deleteList);

export default router;
