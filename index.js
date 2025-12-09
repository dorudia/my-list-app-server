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
import Todo from "./models/Todo.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { sendReminderEmail } from "./services/emailService.js";

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
  res.send(`Serverul my-list-app merge pe portul  ${PORT}! ✅`);
});
app.use("/lists", ClerkExpressRequireAuth(), listRoutes);
app.use("/todos", ClerkExpressRequireAuth(), todosRoutes);
app.use("/notifications", ClerkExpressRequireAuth(), notificationsRouter);

// debug-scanNotifications.js (înlocuiește temporar funcția ta)
export const scanNotifications = async () => {
  const now = new Date();
  console.log("⏱ NOW:", now.toISOString());

  try {
    // 1️⃣ Preluăm toate notificările nedeliverate
    const allUndelivered = await Notification.find({ delivered: false }).lean();
    console.log("ℹ all undelivered count:", allUndelivered.length);

    if (!allUndelivered.length) return;

    // 2️⃣ Filtrăm doar notificările unde todo-ul are reminderDate trecut
    const ready = [];
    for (const n of allUndelivered) {
      if (!n.todoId) continue; // skip notificările fără todo
      const todo = await Todo.findById(n.todoId).lean();
      if (!todo || !todo.reminderDate) continue;

      const reminderTime = new Date(todo.reminderDate);
      if (reminderTime.getTime() <= now.getTime()) {
        ready.push({ notif: n, todo });
      }
    }

    console.log("🔎 ready to send:", ready.length);
    if (!ready.length) return;

    // 3️⃣ Trimitem notificările
    for (const { notif, todo } of ready) {
      // Push notification
      if (notif.expoPushToken && Expo.isExpoPushToken(notif.expoPushToken)) {
        const message = {
          to: notif.expoPushToken,
          sound: "default",
          title: `Reminder for - ${notif.title}` || "Notificare",
          data: {
            todoId: todo._id,
            listName: todo.listName,
            notifId: notif._id,
          },
        };

        try {
          await expo.sendPushNotificationsAsync([message]);
          console.log("✅ Push notification sent:", notif._id);
        } catch (err) {
          console.error("❌ Error sending push notification:", notif._id, err);
        }
      }

      // 4️⃣ Marcare ca livrat (imediat după push) și update la todo
      try {
        await Notification.findByIdAndUpdate(notif._id, { delivered: true });
        // Update la todo: dezactivează reminder-ul și resetează reminderDate
        if (notif.todoId && notif.listName) {
          await Todo.findByIdAndUpdate(notif.todoId.toString(), {
            reminder: false,
            reminderDate: null,
          });
          console.log(
            `✅ Todo updated: reminder dezactivat pentru ${notif.todoId}`
          );
        }
      } catch (err) {
        console.error("❌ Error updating notification/todo:", notif._id, err);
      }

      // Email notification: trimite după push, nu blochează execuția
      // if (notif.userEmail) {
      //   void sendReminderEmail(
      //     notif.userEmail,
      //     `Reminder: ${notif.title}`,
      //     todo.text || notif.title,
      //     todo.reminderDate
      //   );
      //   // Logul va fi afișat din emailService.js
      // }
    }
  } catch (err) {
    console.error("❌ scanNotifications error:", err);
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
