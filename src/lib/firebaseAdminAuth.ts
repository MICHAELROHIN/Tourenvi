import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCh9nN8yktf1Igf6QB71w97amHwLP_v070",
  authDomain: "tourenvi-2fbd6.firebaseapp.com",
  projectId: "tourenvi-2fbd6",
  storageBucket: "tourenvi-2fbd6.firebasestorage.app",
  messagingSenderId: "813421473298",
  appId: "1:813421473298:web:821919c6dca8c08e0172cb",
  measurementId: "G-6ZEEJ6GR4T"
};

// Initialize secondary Firebase app specifically for independent Admin Authentication
const secondaryApp = getApps().find((app) => app.name === "AdminApp") || initializeApp(firebaseConfig, "AdminApp");

export const adminAuth = getAuth(secondaryApp);
export const adminDb = getFirestore(secondaryApp);

// Configure adminAuth to use tab-isolated session persistence
if (typeof window !== "undefined") {
  setPersistence(adminAuth, browserSessionPersistence).catch((error) => {
    console.error("Failed to set isolated session persistence for adminAuth:", error);
  });
}

