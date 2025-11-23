import { Notification } from "../models/Notifications.js";

// GET all notifications for a user
export const getNotifications = async (req, res) => {
  const { userId } = req.params;
  console.log("from get notif:", userId);

  try {
    const notifications = await Notification.find({ userId }).sort({
      date: -1,
    });
    // dacă nu există, trimite totuși array gol
    res.json(notifications || []);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST create new notification
export const createNotification = async (req, res) => {
  const { userId, todoId, listName, title, body, date, expoPushToken } =
    req.body;
  try {
    const notification = await Notification.create({
      userId,
      todoId,
      listName,
      title,
      body,
      date,
      expoPushToken,
    });
    res.status(201).json(notification);
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH update a notification
export const updateNotification = async (req, res) => {
  const { userId, id } = req.params;
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE single notification
export const deleteNotification = async (req, res) => {
  const { userId, id } = req.params;
  try {
    await Notification.findOneAndDelete({ _id: id, userId });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE all notifications for user
export const deleteAllNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    await Notification.deleteMany({ userId });
    res.json({ message: "All deleted" });
  } catch (err) {
    console.error("Error deleting notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
};
