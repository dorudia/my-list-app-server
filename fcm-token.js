// src/fcm-token.js
import { google } from "googleapis";

// 🔹 Obține JSON-ul contului de serviciu din variabila de mediu
if (!process.env.FCM_SERVICE_ACCOUNT_JSON) {
  throw new Error(
    "❌ Lipseste variabila FCM_SERVICE_ACCOUNT_JSON în .env.production"
  );
}

const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

/**
 * Generează token-ul de acces FCM
 */
export async function getAccessToken() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const accessToken = await auth.getAccessToken();
    if (!accessToken || !accessToken.token) {
      throw new Error("❌ Nu s-a putut obține access token-ul FCM");
    }

    return accessToken.token;
  } catch (err) {
    console.error("❌ Eroare la generarea token-ului FCM:", err);
    throw err;
  }
}
