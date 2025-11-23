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

// debug-scanNotifications.js (înlocuiește temporar funcția ta)
import chunk from "lodash/chunk"; // optional, sau implementezi manual

const scanNotifications = async () => {
  const now = new Date();
  console.log("⏱ NOW:", now.toISOString());

  try {
    // 1) Găsim toate notificările nelivrate
    // query Mongo pare să funcționeze în instanța ta, dar păstrăm și fallback JS-filter
    const allUndelivered = await Notification.find({ delivered: false }).lean();
    console.log("ℹ all undelivered count:", allUndelivered.length);

    // 2) Filtrăm doar cele care sunt <= now (siguranță dacă unele date sunt string)
    const ready = allUndelivered.filter((n) => {
      if (!n.date) return false;
      return new Date(n.date).getTime() <= now.getTime();
    });

    console.log("🔎 ready to send:", ready.length);

    if (!ready.length) return;

    // 3) Construim mesajele valide (și verificăm token-urile)
    const messages = ready
      .map((n) => {
        if (!n.expoPushToken || !Expo.isExpoPushToken(n.expoPushToken)) {
          console.log("❌ Invalid or missing token:", n._id);
          return null;
        }
        return {
          to: n.expoPushToken,
          sound: "default",
          title: n.title || "Notificare",
          body: n.body || "Ai o notificare!",
          data: {
            todoId: n.todoId || null,
            listName: n.listName || null,
            notifId: n._id,
          },
        };
      })
      .filter(Boolean);

    if (!messages.length) {
      console.log("⚠ No valid messages (tokens invalid/missing).");
      return;
    }

    // 4) Trimitem în batchuri de max 100 (limită Expo)
    const batches = chunk(messages, 100);
    for (const batch of batches) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(batch);
        console.log("📨 sent batch, receipts length:", receipts.length);

        // receipts is an array of receipts in same order as batch. We can mark delivered optimistically.
        // For simplicity: mark all corresponding notifications delivered.
        // If you want stricter handling, inspect each receipt for status/error.
        const idsToMark = batch.map((m) => m.data?.notifId).filter(Boolean);
        await Notification.updateMany(
          { _id: { $in: idsToMark } },
          { $set: { delivered: true } }
        );
        console.log("✅ Marked delivered for:", idsToMark);
      } catch (err) {
        console.error("❌ Error sending batch:", err);
        // fallback: try to send messages one-by-one to find failures (optional)
        for (const single of batch) {
          try {
            await expo.sendPushNotificationsAsync([single]);
            if (single.data?.notifId) {
              await Notification.findByIdAndUpdate(single.data.notifId, {
                delivered: true,
              });
              console.log("📤 Sent single & marked:", single.data.notifId);
            }
          } catch (err2) {
            console.error(
              "❌ Single send failed for",
              single.data?.notifId,
              err2
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("Eroare la scanare:", err);
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
