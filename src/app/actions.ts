
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, limit, updateDoc, doc, getDoc, Timestamp, orderBy } from 'firebase/firestore';
import { faker } from '@faker-js/faker';


const logWorkoutSchema = z.object({
  exercise: z.string().min(2, "Exercise name is required."),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  time: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
  userId: z.string().optional(), 
});

async function getOrCreateUser(userId?: string) {
  const usersCollection = collection(db, 'users');
  
  if (userId) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.id;
    }
  }

  const newUser = {
    name: faker.person.fullName(),
    age: Math.floor(Math.random() * (40 - 18 + 1)) + 18,
    experience: 'Intermediate',
    goals: 'Improve overall fitness',
    createdAt: new Date(),
  };
  const userDocRef = await addDoc(usersCollection, newUser);
  return userDocRef.id;
}


export async function logWorkout(values: z.infer<typeof logWorkoutSchema>) {
  const validatedData = logWorkoutSchema.parse(values);
  
  try {
    const userId = await getOrCreateUser(validatedData.userId);

    const workoutData = {
      ...validatedData,
      userId: userId,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "workouts"), workoutData);
    
    return { 
      success: true, 
      message: `${validatedData.exercise} has been added to your history.`,
      userId: userId,
    };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, message: "Failed to log workout." };
  }
}

export async function getPlayersForScouting() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const players = [];

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      const userId = userDoc.id;

      const workoutsQuery = query(collection(db, "workouts"), where("userId", "==", userId));
      const workoutsSnapshot = await getDocs(workoutsQuery);
      
      const performanceData = workoutsSnapshot.docs.map(doc => {
        const data = doc.data();
        let record = `${data.exercise}:`;
        if (data.reps) record += ` ${data.reps} reps`;
        if (data.weight) record += ` at ${data.weight}kg`;
        if (data.distance) record += ` for ${data.distance}km`;
        if (data.time) record += ` in ${data.time}`;
        return record;
      }).join(', ');

      players.push({
        id: userId,
        name: user.name || `Player ${userId.substring(0, 4)}`,
        performanceData: performanceData || "No workouts logged yet.",
        userProfile: `Age: ${user.age || 'N/A'}, Experience: ${user.experience || 'N/A'}, Goals: ${user.goals || 'N/A'}`,
      });
    }

    return { success: true, players };
  } catch (error) {
    console.error("Error fetching players: ", error);
    return { success: false, players: [] };
  }
}

// CHAT ACTIONS

export interface Conversation {
    id: string;
    participants: { id: string; name: string; }[];
    lastMessage: { text: string; sentAt: Date } | null;
}

export async function getConversations(userId: string) {
    try {
        const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', userId));
        const querySnapshot = await getDocs(q);
        const conversations: Conversation[] = [];

        for (const docSnap of querySnapshot.docs) {
            const convoData = docSnap.data();
            const participantIds = convoData.participantIds.filter((id: string) => id !== userId);
            
            const participantsInfo: { id: string; name: string }[] = [];
            for(const pId of participantIds) {
                // In a real app, this might be a single query for all participants
                const userDoc = await getDoc(doc(db, 'users', pId));
                if(userDoc.exists()){
                    participantsInfo.push({ id: pId, name: userDoc.data().name || 'Unknown User' });
                }
            }
             // Add current user as well to have full context
            const currentUserDoc = await getDoc(doc(db, 'users', userId));
            if(currentUserDoc.exists()){
                participantsInfo.push({ id: userId, name: currentUserDoc.data().name || 'Me' });
            }


            conversations.push({
                id: docSnap.id,
                participants: participantsInfo,
                lastMessage: convoData.lastMessage ? {
                    text: convoData.lastMessage.text,
                    sentAt: convoData.lastMessage.sentAt.toDate(),
                } : null,
            });
        }

        return { success: true, conversations };

    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, conversations: [] };
    }
}


export async function getMessages(conversationId: string) {
    try {
        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { success: true, messages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, messages: [] };
    }
}

const sendMessageSchema = z.object({
    conversationId: z.string(),
    senderId: z.string(),
    text: z.string().min(1),
});

export async function sendMessage(values: z.infer<typeof sendMessageSchema>) {
    const validatedData = sendMessageSchema.parse(values);
    try {
        const message = {
            senderId: validatedData.senderId,
            text: validatedData.text,
            createdAt: Timestamp.now(),
        };

        const messageRef = await addDoc(collection(db, 'conversations', validatedData.conversationId, 'messages'), message);
        
        await updateDoc(doc(db, 'conversations', validatedData.conversationId), {
            lastMessage: {
                text: validatedData.text,
                sentAt: message.createdAt,
            }
        });

        return { success: true, message: {id: messageRef.id, ...message} };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false };
    }
}

