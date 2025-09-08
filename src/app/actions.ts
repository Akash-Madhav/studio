
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, limit, updateDoc, doc, getDoc } from 'firebase/firestore';
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

  // To keep it simple, we'll create a new user if no ID is provided or if the ID doesn't exist.
  // In a real app, you'd have a more robust user management system.
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
