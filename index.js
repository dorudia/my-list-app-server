import dotenv from "dotenv";
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});
import express from "express";
import fetch from "node-fetch";
import { Expo } from "expo-server-sdk";
import { getAccessToken } from "./fcm-token.js";
import fs from "fs";

const token = await getAccessToken();

const app = express();
app.use(express.json());

const PORT = 3000;

// Inițializare Expo SDK
const expo = new Expo();

// 🔹 URL-ul bazei tale Firebase
const FIREBASE_BASE =
  "https://react-native-expenses-co-44802-default-rtdb.europe-west1.firebasedatabase.app/liste";

// 🔹 Funcție pentru scanare notificări

const scanNotifications = async () => {
  try {
    console.log("🔍 Pornesc scanarea notificărilor...");

    // 1️⃣ Preluăm toate notificările din Firebase
    const res = await fetch(`${FIREBASE_BASE}.json`);
    const data = await res.json();

    if (!data) {
      console.log("⚠️ Nicio notificare găsită.");
      return;
    }

    // 2️⃣ Găsim doar nodurile pentru notificări
    const userKeys = Object.keys(data).filter((key) =>
      key.startsWith("notifications-user_")
    );

    console.log("ℹ️ Users found:", userKeys);

    for (const key of userKeys) {
      const notificationsObj = data[key];
      const userId = key.replace("notifications-user_", "");

      // Convertim în array și filtrăm doar cele nelivrate
      const notifications = Object.values(notificationsObj).filter(
        (n) => n && !n.delivered
      );

      console.log(
        `ℹ️ User ${userId} are ${notifications.length} notificări nelivrate`
      );

      for (const n of notifications) {
        const now = Date.now();
        const notifDate = new Date(n.date).getTime();

        // trimite notificarea doar dacă data a trecut și e recentă (< 1 minut)
        if (notifDate <= now && now - notifDate < 60 * 1000) {
          if (!Expo.isExpoPushToken(n.expoPushTokenKey)) {
            console.log(
              `❌ Invalid Expo Push Token pentru user ${userId}:`,
              n.expoPushTokenKey
            );
            continue;
          }

          const message = {
            to: n.expoPushTokenKey,
            sound: "default",
            title: "Notificare",
            body: n.body || n.title || "Ai o notificare!",
            data: {
              todoId: n.todoId || null,
              listName: n.listName || null,
              title: n.title || null,
            },
          };

          try {
            const ticketChunk = await expo.sendPushNotificationsAsync([
              message,
            ]);
            console.log("✅ Notification sent for:", n.title, ticketChunk);

            // 🔹 marchează notificarea ca livrată
            await fetch(`${FIREBASE_BASE}/${key}/${n.notificationId}.json`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ delivered: true }),
            });
          } catch (err) {
            console.log("❌ Eroare la trimiterea notificării:", err);
          }
        }
      }
    }
  } catch (err) {
    console.log("❌ Eroare la scanare:", err);
  }
};

// 🔹 Pornim serverul
app.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${PORT}`);

  // SetInterval pentru scanare la fiecare 30s
  setInterval(scanNotifications, 30 * 1000);
});
