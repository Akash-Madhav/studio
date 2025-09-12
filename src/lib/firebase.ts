import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Hardcoded configuration to ensure correctness
const firebaseConfig = {
  apiKey: "AIzaSyD0wsmwziRfkE_PQLdx3s0oYMj2a9Ru8cY",
  authDomain: "optifitaicopy-87674237-d47c0.firebaseapp.com",
  projectId: "optifitaicopy-87674237-d47c0",
  storageBucket: "optifitaicopy-87674237-d47c0.appspot.com",
  messagingSenderId: "620460614828",
  appId: "1:620460614828:web:5adecf67678f4467e7eb09",
};

// Log the config object to the browser console for debugging
console.log("Initializing Firebase with config:", firebaseConfig);

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
