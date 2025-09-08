
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { sampleUsers, sampleWorkouts, sampleConversations } from '../src/lib/sample-data';

// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id", // Make sure this is correct
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName: string) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    console.log(`Clearing collection: ${collectionName}`);
    await batch.commit();
    console.log(`Collection ${collectionName} cleared.`);
}


async function seedDatabase() {
    try {
        console.log('Starting database seed process...');

        // Clear existing data
        await clearCollection('users');
        await clearCollection('workouts');
        await clearCollection('conversations');

        const batch = writeBatch(db);

        // Seed Users
        console.log('Seeding users...');
        sampleUsers.forEach(user => {
            const { role, ...userData } = user;
            const docRef = doc(db, 'users', user.id);
            batch.set(docRef, { ...userData, createdAt: new Date() });
        });

        // Seed Workouts
        console.log('Seeding workouts...');
        sampleWorkouts.forEach(workout => {
            const docRef = doc(db, 'workouts', workout._id);
            batch.set(docRef, workout);
        });

        // Seed Conversations and Messages
        console.log('Seeding conversations...');
        for (const convo of sampleConversations) {
            const convoRef = doc(db, 'conversations', convo._id);
            batch.set(convoRef, { participantIds: convo.participantIds });

            let lastMessage = null;
            for (const msg of convo.messages) {
                const msgRef = doc(collection(db, 'conversations', convo._id, 'messages'), msg._id);
                batch.set(msgRef, msg);
                lastMessage = { text: msg.text, sentAt: msg.createdAt };
            }
             if (lastMessage) {
                batch.update(convoRef, { lastMessage });
            }
        }

        await batch.commit();
        console.log('Database seeded successfully!');
        process.exit(0);

    } catch (e) {
        console.error('Error seeding database:', e);
        process.exit(1);
    }
}

seedDatabase();
