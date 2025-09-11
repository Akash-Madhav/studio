
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
const apps = getApps();
if (!apps.length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve(true);
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        // For subcollections, we need to delete them recursively
        if (['conversations', 'posts'].includes(doc.ref.parent.id)) {
             deleteSubcollections(doc.ref);
        }
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid hitting stack size limits
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

async function deleteSubcollections(docRef: FirebaseFirestore.DocumentReference) {
    const subcollections = await docRef.listCollections();
    for (const subcollection of subcollections) {
        await deleteCollection(`${docRef.path}/${subcollection.id}`, 50);
    }
}

async function main() {
    console.log("Clearing Firestore database...");

    const collections = ['users', 'workouts', 'invites', 'conversations', 'posts'];
    for (const collectionPath of collections) {
        console.log(`Deleting collection: ${collectionPath}`);
        await deleteCollection(collectionPath, 50);
    }

    console.log("Firestore database cleared.");
    
    console.log("Clearing Firebase Authentication users...");
    const listUsersResult = await auth.listUsers(1000);
    const uidsToDelete = listUsersResult.users.map(user => user.uid);
    if (uidsToDelete.length > 0) {
        await auth.deleteUsers(uidsToDelete);
        console.log(`Successfully deleted ${uidsToDelete.length} users.`);
    } else {
        console.log("No auth users to delete.");
    }
    
    console.log("All data cleared successfully.");
}

main().catch(console.error);
