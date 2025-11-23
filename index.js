import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Expo } from "expo-server-sdk";
import { getAccessToken } from "./fcm-token.js";
import fetch from "node-fetch"; // sau globalThis.fetch pe Node 20+
import mongoose from "mongoose";
import listRoutes from "./routes/listRoutes.js";
import todosRoutes from "./routes/todos.js";
import notificationsRouter from "./routes/notifications.js";
// sus, cu celelalte importuri
import { Notification } from "./models/Notifications.js";
import chunk from "lodash/chunk.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FIREBASE_BASE = process.env.FIREBASE_BASE + "/liste";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error("❌ MONGO_URI nu este setat în .env");

// Conectare MongoDB Atlas
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectat cu succes!"))
  .catch((err) => console.error("❌ Eroare la conectarea cu MongoDB:", err));

const expo = new Expo();

// Rute
app.get("/", (req, res) => {
  console.log("GET / a fost apelat");
  res.send("Serverul merge! ✅");
});
app.use("/lists", listRoutes);
app.use("/todos", todosRoutes);
app.use("/notifications", notificationsRouter);

// debug-scanNotifications.js (înlocuiește temporar funcția ta)
export const scanNotifications = async () => {
  const now = new Date();
  console.log("⏱ NOW:", now.toISOString());

  try {
    // 1️⃣ Luăm toate notificările nedeliverate
    const undelivered = await Notification.find({ delivered: false }).lean();
    if (!undelivered.length) {
      console.log("ℹ️ No undelivered notifications");
      return;
    }

    // 2️⃣ Filtrăm doar cele care au data <= now
    const ready = undelivered.filter((n) => n.date && new Date(n.date) <= now);
    if (!ready.length) {
      console.log("ℹ️ No notifications ready to send");
      return;
    }

    // 3️⃣ Pregătim mesajele
    const messages = ready
      .map((n) => {
        if (!n.expoPushToken || !Expo.isExpoPushToken(n.expoPushToken)) {
          console.log("❌ Invalid token:", n._id);
          return null;
        }
        return {
          to: n.expoPushToken,
          sound: "default",
          title: n.title || "Notificare",
          body: n.body || "Ai o notificare!",
          data: { todoId: n.todoId, listName: n.listName, notifId: n._id },
        };
      })
      .filter(Boolean);

    // 4️⃣ Trimitem în batch-uri de max 100
    const batches = chunk(messages, 100);
    for (const batch of batches) {
      const receipts = await expo.sendPushNotificationsAsync(batch);
      console.log("📨 Sent batch, receipts:", receipts.length);

      // 5️⃣ Marcam ca livrate
      const ids = batch.map((m) => m.data.notifId);
      await Notification.updateMany(
        { _id: { $in: ids } },
        { $set: { delivered: true } }
      );
      console.log("✅ Marked delivered:", ids);
    }
  } catch (err) {
    console.error("❌ Error scanNotifications:", err);
  }
};

(async () => {
  try {
    const token = await getAccessToken();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Serverul rulează pe port ${PORT}`);
      setInterval(scanNotifications, 40 * 1000);
    });
  } catch (err) {
    console.error("Eroare la inițializare server:", err);
    process.exit(1);
  }
})();
