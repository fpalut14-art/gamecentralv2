import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyB1e7tJcRkAt2meIqdi9KKuGoulHvD95yg",

  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "gamecentral-3ee9d.firebaseapp.com",

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "gamecentral-3ee9d",

  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "gamecentral-3ee9d.firebasestorage.app",

  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "571294835092",

  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:571294835092:web:36fc557fd6bf26ad462f81",
};

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;