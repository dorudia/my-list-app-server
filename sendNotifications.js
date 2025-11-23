import fetch from "node-fetch";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export const sendScheduledNotifications = async () => {
  try {
    // 1. Ia toate notificările din Firebase
    const res = await fetch(
      "https://react-native-expenses-co-44802-default-rtdb.europe-west1.firebasedatabase.app/liste.json"
    );
    const data = await res.json();

    if (!data) return console.log("⚠️ Nicio notificare găsită");

    // 2. Filtrează doar intrările notifications-user_xxx
    const users = Object.keys(data).filter((key) =>
      key.startsWith("notifications-user_")
    );
    console.log("ℹ️ Users found:", users);

    for (const userKey of users) {
      const notifications = Object.values(data[userKey]).filter(
        (n) => !n.delivered && n.expoPushTokenKey
      );

      console.log(
        `ℹ️ User ${userKey} has ${notifications.length} undelivered notifications`
      );

      const messages = notifications.map((n) => ({
        to: n.expoPushTokenKey,
        sound: "default",
        title: n.title,
        body: n.title,
        data: { id: n.id, listName: n.listName },
      }));

      if (messages.length === 0) continue;

      // 3. Trimite notificările prin Expo
      const tickets = await expo.sendPushNotificationsAsync(messages);
      console.log(
        `✅ Notification sent for: ${notifications.map((n) => n.title)}`,
        tickets
      );

      // 4. Marchează notificările ca delivered în Firebase
      for (const n of notifications) {
        await fetch(
          `https://react-native-expenses-co-44802-default-rtdb.europe-west1.firebasedatabase.app/liste/${userKey}/${n.id}.json`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ delivered: true }),
          }
        );
      }
    }
  } catch (err) {
    console.error("❌ Eroare la scanarea notificărilor:", err);
  }
};
