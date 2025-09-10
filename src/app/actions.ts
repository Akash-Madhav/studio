
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts } from '@/lib/sample-data';


export async function seedDatabase() {
    try {
        const usersCollection = collection(db, 'users');
        const workoutsCollection = collection(db, 'workouts');

        // Check if users already exist to prevent re-seeding
        const existingUsers = await getDocs(usersCollection);
        if (!existingUsers.empty) {
            return { success: false, message: "Database has already been seeded." };
        }

        const batch = writeBatch(db);

        // Add users
        sampleUsers.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batch.set(userRef, { ...user, dob: user.dob ? new Date(user.dob) : null });
        });

        // Add workouts
        sampleWorkouts.forEach(workout => {
            const workoutRef = doc(collection(db, 'workouts')); // Auto-generate ID
            batch.set(workoutRef, { ...workout, createdAt: new Date(workout.createdAt) });
        });
        
        await batch.commit();
        
        return { success: true, message: "Database seeded successfully!" };
    } catch (error: any) {
        console.error("Error seeding database: ", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Please check your security rules or ensure the Firestore API is enabled." };
        }
        return { success: false, message: "Failed to seed database." };
    }
}

export async function getUsersForLogin() {
    try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        if (userSnapshot.empty) {
            return { success: true, users: [] };
        }
        const users = userSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                dob: data.dob?.toDate() // Convert Firestore Timestamp to Date
            };
        });
        return { success: true, users };
    } catch (error: any) {
        console.error("Error fetching users for login: ", error);
        if (error.code === 'permission-denied') {
            return { success: false, users: [], message: "Firestore permission denied. Please enable the Firestore API in your Google Cloud project." };
        }
        return { success: false, users: [], message: "Could not fetch users." };
    }
}


export async function getUser(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, user: null, message: "User not found." };
        }

        const userData = userSnap.data();
        // Convert Firestore Timestamp to Date object
        const user = {
            ...userData,
            id: userSnap.id,
            dob: userData.dob?.toDate(),
        };

        return { success: true, user };
    } catch (error: any) {
        console.error(`Error fetching user ${userId}:`, error);
         if (error.code === 'permission-denied') {
            return { success: false, user: null, message: "Firestore permission denied. Please enable the Firestore API in your Google Cloud project and check your security rules." };
        }
        return { success: false, user: null, message: "Failed to fetch user data." };
    }
}

const logWorkoutSchema = z.object({
  exercise: z.string().min(2, "Exercise name is required."),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  time: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
  userId: z.string(), 
});


export async function logWorkout(values: z.infer<typeof logWorkoutSchema>) {
    try {
        const validatedData = logWorkoutSchema.parse(values);
        const workoutsCollection = collection(db, 'workouts');
        await addDoc(workoutsCollection, {
            ...validatedData,
            createdAt: serverTimestamp(),
        });

        return { 
            success: true, 
            message: `${validatedData.exercise} has been added to your history.`,
            userId: validatedData.userId,
        };
    } catch (error: any) {
        console.error("Error logging workout: ", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid data provided." };
        }
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Could not log workout." };
        }
        return { success: false, message: "Failed to log workout." };
    }
}


const updateUserProfileSchema = z.object({
    userId: z.string(),
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Invalid email address."),
    dob: z.string().optional().nullable(),
    experience: z.string().optional(),
    goals: z.string().optional(),
});


export async function updateUserProfile(values: z.infer<typeof updateUserProfileSchema>) {
    try {
        const validatedData = updateUserProfileSchema.parse(values);
        const userRef = doc(db, 'users', validatedData.userId);
        await updateDoc(userRef, {
            name: validatedData.name,
            email: validatedData.email,
            dob: validatedData.dob ? new Date(validatedData.dob) : null,
            experience: validatedData.experience,
            goals: validatedData.goals,
        });
        return { success: true, message: "Profile updated successfully!" };
    } catch (error: any) {
        console.error("Error updating profile: ", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid data provided." };
        }
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Could not update profile." };
        }
        return { success: false, message: "Failed to update profile." };
    }
}

export async function getWorkoutHistory(userId: string) {
    try {
        const workoutsCollection = collection(db, 'workouts');
        const q = query(workoutsCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        const workouts = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    _id: doc.id,
                    createdAt: data.createdAt.toDate(), // Convert Firestore Timestamp to Date
                };
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return { success: true, workouts };
    } catch (error: any) {
        console.error(`Error fetching workout history for user ${userId}:`, error);
        if (error.code === 'permission-denied') {
            return { success: false, workouts: [], message: "Firestore permission denied. Could not fetch workout history." };
        }
        return { success: false, workouts: [], message: "Failed to fetch workout history." };
    }
}
