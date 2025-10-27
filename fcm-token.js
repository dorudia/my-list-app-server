import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

if (!process.env.FCM_SERVICE_ACCOUNT_JSON) {
  throw new Error("Lipsește variabila FCM_SERVICE_ACCOUNT_JSON în .env");
}

// Parse și corect private_key
const serviceAccountRaw = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
const serviceAccount = {
  ...serviceAccountRaw,
  private_key: serviceAccountRaw.private_key.replace(/\\n/g, "\n"),
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const getAccessToken = async () => {
  const token = await admin.credential.cert(serviceAccount).getAccessToken();
  return token.access_token;
};
