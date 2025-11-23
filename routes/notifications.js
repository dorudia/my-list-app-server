import express from "express";
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationsController.js";

const router = express.Router();

// rute
router.get("/:userId", getNotifications);
router.post("/:userId", createNotification);
router.patch("/:userId/:id", updateNotification);
router.delete("/:userId/:id", deleteNotification);
router.delete("/:userId", deleteAllNotifications);

export default router;
