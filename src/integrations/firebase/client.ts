import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuOhHJJp1Y9T75aXTdDzMhLLjlH8Qj4qw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "brokersfirebase.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "brokersfirebase",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "brokersfirebase.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "53442260755",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:53442260755:web:828b4a3b0b86152c29b4e6",
};

// Singleton principal para el frontend
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Instancia secundaria de Auth para registrar agentes/usuarios desde el panel
 * administrativo sin desloguear al administrador actual (útil para el plan gratuito Spark).
 */
export function getSecondaryAdminAuth() {
  const secondaryAppName = "secondaryAdminApp";
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  const secondaryApp = existingApp || initializeApp(firebaseConfig, secondaryAppName);
  return getAuth(secondaryApp);
}
