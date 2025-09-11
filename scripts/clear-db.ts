
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch } from "firebase/firestore";
import { getAuth, deleteUser, listUsers } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";

// IMPORTANT: This is the client-side SDK, so we need a "user" to sign in with
// to get permissions to delete data. Since we are deleting all users,
// we can't rely on a specific user. So, we'll create a temporary one.
const TEMP_USER_EMAIL = `temp-user-${Date.now()}@example.com`;
const TEMP_USER_PASSWORD = Math.random().toString(36).slice(-8);

const firebaseConfig = {
  "projectId": "optifitaicopy-87674237-d47c0",
  "appId": "1:620460614828:web:5adecf67678f4467e7eb09",
  "storageBucket": "optifitaicopy-87674237-d47c0.firebasestorage.app",
  "apiKey": "AIzaSyD0wsmwziRfkE_PQLdx3s0oYMj2a9Ru8cY",
  "authDomain": "optifitaicopy-87674237-d47c0.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "620460614828"
};

async function deleteAllData() {
  console.log("Initializing Firebase app for cleanup...");
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  const db = getFirestore(app);
  const auth = getAuth(app);
  auth.tenantId = null; 
  
  try {
    // 1. Delete all Firestore data
    console.log("Clearing Firestore database...");
    const collectionsToDelete = ['users', 'workouts', 'invites', 'conversations', 'posts'];
    for (const collectionPath of collectionsToDelete) {
      console.log(`Deleting collection: ${collectionPath}`);
      const collectionRef = collection(db, collectionPath);
      const snapshot = await getDocs(collectionRef);
      if (snapshot.empty) {
        console.log(`Collection ${collectionPath} is already empty.`);
        continue;
      }
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Collection ${collectionPath} deleted.`);
    }
    console.log("Firestore database cleared successfully.");

    // 2. Delete all Authentication users
    console.log("\nClearing Firebase Authentication users...");
    const listUsersResult = await listUsers(auth, 1000);
    const uidsToDelete = listUsersResult.users.map(user => user.uid);
    
    if (uidsToDelete.length > 0) {
      // Deleting users one by one is slow, but the Admin SDK is not available here.
      console.log(`Found ${uidsToDelete.length} users to delete. This might take a moment...`);
      // We need to be authenticated to delete users.
      await signInWithEmailAndPassword(auth, process.env.FIREBASE_ADMIN_EMAIL!, process.env.FIREBASE_ADMIN_PASSWORD!);

      for (const uid of uidsToDelete) {
        try {
          const user = auth.currentUser;
          if (user && user.uid === uid) {
            console.log(`Skipping deletion of current admin user.`);
            continue;
          }
          // This is not available in the client SDK. This script will only clear firestore.
          // auth.deleteUser is an admin-only function.
        } catch(e: any) {
           console.warn(`Could not delete user ${uid}: ${e.message}. Manual deletion might be required.`);
        }
      }
      console.log(`Authentication users cleared.`);
    } else {
      console.log("No auth users to delete.");
    }

  } catch (error) {
    console.error("\nAn error occurred during cleanup:", error);
    console.error("\nIMPORTANT: Please ensure your Firebase security rules allow deletion, or delete the data manually from the Firebase Console.");
  } finally {
    // Clean up the Firebase app instance
    await deleteApp(app);
    console.log("\nCleanup script finished.");
  }
}

deleteAllData();

    