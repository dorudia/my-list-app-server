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

const scanNotifications = async () => {
  try {
    const now = new Date();
    console.log("⏱ NOW:", now);

    const notifications = await Notification.find({
      delivered: false,
      reminder: true, // ← filtrare extra-sigură
    });

    console.log("🔎 GASITE DIN DB:", notifications.length);

    for (const n of notifications) {
      console.log("➡ CHECK:", {
        date: n.date,
        diff: new Date(n.reminderDate) - Date.now(),
      });

      // ❗ Dacă reminderDate este în viitor → sari
      if (new Date(n.reminderDate) > now) {
        console.log("⏭ SKIP – încă nu a venit timpul");
        continue;
      } else {
        console.log("✔ OK – timpul a venit");
      }

      if (!Expo.isExpoPushToken(n.expoPushToken)) {
        console.log("❌ TOKEN INVALID");
        continue;
      }

      // 📨 TRIMITEM NOTIFICAREA
      const message = {
        to: n.expoPushToken,
        sound: "default",
        title: n.title || "Notificare",
        body: n.body || "Ai o notificare!",
      };

      await expo.sendPushNotificationsAsync([message]);
      await Notification.findByIdAndUpdate(n._id, { delivered: true });

      console.log("✔ TRIMIS:", n._id);
    }
  } catch (err) {
    console.log("Eroare la scanare:", err);
  }
};

(async () => {
  try {
    const token = await getAccessToken();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Serverul rulează pe port ${PORT}`);
      setInterval(scanNotifications, 30 * 1000);
    });
  } catch (err) {
    console.error("Eroare la inițializare server:", err);
    process.exit(1);
  }
})();
