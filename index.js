// index.js
import dotenv from "dotenv";
dotenv.config(); // pe Render, variabilele vin din Environment → Environment Variables
import express from "express";
import { Expo } from "expo-server-sdk";
import { getAccessToken } from "./fcm-token.js";
import fetch from "node-fetch"; // poți înlocui cu globalThis.fetch pe Node 20+

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const expo = new Expo();
const FIREBASE_BASE = process.env.FIREBASE_BASE + "/liste";

/**
 * Funcție pentru scanare notificări
 */
const scanNotifications = async () => {
  try {
    const res = await fetch(`${FIREBASE_BASE}.json`);
    const data = await res.json();

    if (!data) return;

    const userKeys = Object.keys(data).filter((key) =>
      key.startsWith("notifications-user_")
    );

    for (const key of userKeys) {
      const notificationsObj = data[key];
      const userId = key.replace("notifications-user_", "");

      const notifications = Object.values(notificationsObj).filter(
        (n) => n && !n.delivered
      );

      for (const n of notifications) {
        const now = Date.now();
        const notifDate = new Date(n.date).getTime();

        if (notifDate <= now && now - notifDate < 60 * 1000) {
          if (!Expo.isExpoPushToken(n.expoPushTokenKey)) continue;

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
            await expo.sendPushNotificationsAsync([message]);
            await fetch(`${FIREBASE_BASE}/${key}/${n.notificationId}.json`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ delivered: true }),
            });
          } catch (err) {
            console.log("Eroare notificare:", err);
          }
        }
      }
    }
  } catch (err) {
    console.log("Eroare la scanare:", err);
  }
};

/**
 * Pornire server și token FCM
 */
(async () => {
  try {
    const token = await getAccessToken(); // folosit dacă ai nevoie în request-uri

    app.listen(PORT, () => {
      console.log(`Serverul rulează pe port ${PORT}`);
      setInterval(scanNotifications, 30 * 1000);
    });
  } catch (err) {
    console.error("Eroare la inițializare server:", err);
    process.exit(1);
  }
})();
