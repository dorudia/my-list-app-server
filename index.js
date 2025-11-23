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
const scanNotifications = async () => {
  try {
    const now = new Date();
    console.log("⏱ NOW:", now.toISOString());

    // 0) quick counts to ensure we're pe aceeași colecție
    const totalCount = await Notification.countDocuments();
    const undeliveredCount = await Notification.countDocuments({
      delivered: false,
    });
    console.log("ℹ️ total docs:", totalCount, "undelivered:", undeliveredCount);

    // 1) fetch a few raw docs to inspect shapes (no filters)
    const sample = await Notification.find().limit(10).lean();
    console.log("🔬 sample docs (limit 10):");
    sample.forEach((d, i) =>
      console.log(i, {
        id: d._id.toString ? d._id.toString() : d._id,
        delivered: d.delivered,
        date_raw: d.date,
        date_type: typeof d.date,
        date_parsed: d.date ? new Date(d.date).toISOString() : null,
      })
    );

    // 2) Try the strict query you used originally (date <= now)
    const q1 = await Notification.find({
      delivered: false,
      date: { $lte: now },
    }).lean();
    console.log("🔎 Query {delivered:false, date:{$lte:now}} =>", q1.length);

    // 3) If q1 is zero, fetch all undelivered and inspect their date fields
    const allUndel = await Notification.find({ delivered: false }).lean();
    console.log("🧾 all undelivered length:", allUndel.length);
    allUndel.forEach((d, i) =>
      console.log(i, {
        id: d._id.toString ? d._id.toString() : d._id,
        date_raw: d.date,
        date_type: typeof d.date,
        date_parsed_ms: d.date ? new Date(d.date).getTime() : null,
        shouldSend: d.date ? new Date(d.date).getTime() <= Date.now() : false,
      })
    );

    // 4) Build ready array by JS filter (works even if date is string)
    const ready = allUndel.filter((d) => {
      if (!d.date) return false;
      return new Date(d.date).getTime() <= Date.now();
    });
    console.log("✅ ready by JS-filter (date <= now):", ready.length);

    // 5) (optional) show tokens of ready items
    ready.forEach((d) => {
      console.log(
        "-> READY id:",
        d._id,
        "token:",
        d.expoPushToken,
        "date:",
        d.date
      );
    });

    // If you want to actually send, uncomment this block (use carefully)
    /*
    for (const n of ready) {
      if (!Expo.isExpoPushToken(n.expoPushToken)) {
        console.log("❌ invalid token for", n._id);
        continue;
      }
      const message = {
        to: n.expoPushToken,
        sound: "default",
        title: n.title || "Notificare",
        body: n.body || "Ai o notificare!",
        data: { todoId: n.todoId || null, listName: n.listName || null },
      };
      await expo.sendPushNotificationsAsync([message]);
      await Notification.findByIdAndUpdate(n._id, { delivered: true });
      console.log("📤 sent:", n._id);
    }
    */
  } catch (err) {
    console.error("Eroare la scanare debug:", err);
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
