import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

/**
 * @module firebase/app
 * @description Firebase app bootstrap and shared Auth/Realtime Database instances.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

/**
 * Shared Firebase Authentication instance.
 * @type {import("firebase/auth").Auth}
 */
export const auth = getAuth(app);

/**
 * Shared Firebase Realtime Database instance.
 * @type {import("firebase/database").Database}
 */
export const database = getDatabase(app);
