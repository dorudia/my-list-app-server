// // index.js
// import dotenv from "dotenv";
// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });
// import express from "express";
// import { Expo } from "expo-server-sdk";
// import { getAccessToken } from "./fcm-token.js";
// import fetch from "node-fetch"; // dacă Node >=18, poți folosi globalThis.fetch

// const app = express();
// app.use(express.json());

// const PORT = process.env.PORT || 3000;

// // Inițializare Expo SDK
// const expo = new Expo();

// // 🔹 URL-ul bazei tale Firebase din .env
// const FIREBASE_BASE = process.env.FIREBASE_BASE + "/liste";

// /**
//  * Funcție pentru scanare notificări
//  */
// const scanNotifications = async () => {
//   try {
//     console.log("🔍 Pornesc scanarea notificărilor...");

//     const res = await fetch(`${FIREBASE_BASE}.json`);
//     const data = await res.json();

//     if (!data) {
//       console.log("⚠️ Nicio notificare găsită.");
//       return;
//     }

//     const userKeys = Object.keys(data).filter((key) =>
//       key.startsWith("notifications-user_")
//     );

//     console.log("ℹ️ Users found:", userKeys);

//     for (const key of userKeys) {
//       const notificationsObj = data[key];
//       const userId = key.replace("notifications-user_", "");

//       const notifications = Object.values(notificationsObj).filter(
//         (n) => n && !n.delivered
//       );

//       console.log(
//         `ℹ️ User ${userId} are ${notifications.length} notificări nelivrate`
//       );

//       for (const n of notifications) {
//         const now = Date.now();
//         const notifDate = new Date(n.date).getTime();

//         if (notifDate <= now && now - notifDate < 60 * 1000) {
//           if (!Expo.isExpoPushToken(n.expoPushTokenKey)) {
//             console.log(
//               `❌ Invalid Expo Push Token pentru user ${userId}:`,
//               n.expoPushTokenKey
//             );
//             continue;
//           }

//           const message = {
//             to: n.expoPushTokenKey,
//             sound: "default",
//             title: "Notificare",
//             body: n.body || n.title || "Ai o notificare!",
//             data: {
//               todoId: n.todoId || null,
//               listName: n.listName || null,
//               title: n.title || null,
//             },
//           };

//           try {
//             const ticketChunk = await expo.sendPushNotificationsAsync([
//               message,
//             ]);
//             console.log("✅ Notification sent for:", n.title, ticketChunk);

//             await fetch(`${FIREBASE_BASE}/${key}/${n.notificationId}.json`, {
//               method: "PATCH",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ delivered: true }),
//             });
//           } catch (err) {
//             console.log("❌ Eroare la trimiterea notificării:", err);
//           }
//         }
//       }
//     }
//   } catch (err) {
//     console.log("❌ Eroare la scanare:", err);
//   }
// };

// // 🔹 Pornire server într-o funcție async
// (async () => {
//   try {
//     const token = await getAccessToken(); // token FCM, folosit dacă ai nevoie în alte request-uri

//     app.listen(PORT, () => {
//       console.log(`✅ Serverul rulează pe port ${PORT}`);
//       // Scanare notificări la fiecare 30 secunde
//       setInterval(scanNotifications, 30 * 1000);
//     });
//   } catch (err) {
//     console.error("❌ Eroare la inițializare server:", err);
//     process.exit(1);
//   }
// })();

// index.js
// index.js
import dotenv from "dotenv";
dotenv.config(); // pe Render, variabilele vin din Environment → Environment Variables
import express from "express";
import { Expo } from "expo-server-sdk";
import { getAccessToken } from "./fcm-token.js";
import fetch from "node-fetch"; // sau folosești globalThis.fetch pe Node 20+

const app = express();
app.use(express.json());

// PORT din Render sau fallback 3000
const PORT = process.env.PORT || 3000;

// Inițializare Expo SDK
const expo = new Expo();

// URL-ul bazei tale Firebase din variabilă de mediu
const FIREBASE_BASE = process.env.FIREBASE_BASE + "/liste";

/**
 * Funcție pentru scanare notificări
 */
const scanNotifications = async () => {
  try {
    console.log("🔍 Pornesc scanarea notificărilor...");

    const res = await fetch(`${FIREBASE_BASE}.json`);
    const data = await res.json();

    if (!data) {
      console.log("⚠️ Nicio notificare găsită.");
      return;
    }

    const userKeys = Object.keys(data).filter((key) =>
      key.startsWith("notifications-user_")
    );

    console.log("ℹ️ Users found:", userKeys);

    for (const key of userKeys) {
      const notificationsObj = data[key];
      const userId = key.replace("notifications-user_", "");

      const notifications = Object.values(notificationsObj).filter(
        (n) => n && !n.delivered
      );

      console.log(
        `ℹ️ User ${userId} are ${notifications.length} notificări nelivrate`
      );

      for (const n of notifications) {
        const now = Date.now();
        const notifDate = new Date(n.date).getTime();

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

// Pornire server într-o funcție async
(async () => {
  try {
    const token = await getAccessToken(); // token FCM, folosit dacă ai nevoie în alte request-uri

    app.listen(PORT, () => {
      console.log(`✅ Serverul rulează pe port ${PORT}`);
      // Scanare notificări la fiecare 30 secunde
      setInterval(scanNotifications, 30 * 1000);
    });
  } catch (err) {
    console.error("❌ Eroare la inițializare server:", err);
    process.exit(1);
  }
})();
