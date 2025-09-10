
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "optifitaicopy-87674237-d47c0",
  "appId": "1:620460614828:web:5adecf67678f4467e7eb09",
  "storageBucket": "optifitaicopy-87674237-d47c0.firebasestorage.app",
  "apiKey": "AIzaSyD0wsmwziRfkE_PQLdx3s0oYMj2a9Ru8cY",
  "authDomain": "optifitaicopy-87674237-d47c0.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "620460614828"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export { db };
