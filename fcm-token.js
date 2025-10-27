// import dotenv from "dotenv";
// dotenv.config();

// import admin from "firebase-admin";

// if (!process.env.FCM_SERVICE_ACCOUNT_JSON) {
//   throw new Error("Lipsește variabila FCM_SERVICE_ACCOUNT_JSON în .env");
// }

// // Parse și corect private_key
// const serviceAccountRaw = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
// const serviceAccount = {
//   ...serviceAccountRaw,
//   private_key: serviceAccountRaw.private_key.replace(/\\n/g, "\n"),
// };

// // Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// export const getAccessToken = async () => {
//   const token = await admin.credential.cert(serviceAccount).getAccessToken();
//   return token.access_token;
// };

import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

const FCM_SERVICE_ACCOUNT_JSON = process.env.FCM_SERVICE_ACCOUNT_JSON;

if (!FCM_SERVICE_ACCOUNT_JSON) {
  throw new Error("Lipsește variabila FCM_SERVICE_ACCOUNT_JSON");
}

const serviceAccount = JSON.parse(FCM_SERVICE_ACCOUNT_JSON);

// Dacă private_key are \\n, înlocuim cu newline real
if (serviceAccount.private_key.includes("\\n")) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const getAccessToken = async () => {
  const accessToken = await admin.credential
    .cert(serviceAccount)
    .getAccessToken();
  return accessToken.token;
};
