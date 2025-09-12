
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "optifitaicopy-87674237-d47c0",
  "appId": "1:620460614828:web:5adecf67678f4467e7eb09",
  "storageBucket": "optifitaicopy-87674237-d47c0.firebasestorage.app",
  "apiKey": "AIzaSyD0wsmwziRfkE_PQLdx3s0oYMj2a9Ru8cY",
  "authDomain": "optifitaicopy-87674237-d47c0.firebaseapp.com",
  "messagingSenderId": "620460614828"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
