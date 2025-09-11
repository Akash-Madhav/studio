
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc, orderBy, runTransaction, documentId, getDocsFromCache, limit } from 'firebase/firestore';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts } from '@/lib/sample-data';

// Helper to convert Firestore Timestamp to YYYY-MM-DD string
const formatDate = (timestamp: any): string | null => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        const d = timestamp.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    }
    return null;
}

export async function seedDatabase() {
    try {
        const usersCollection = collection(db, 'users');
        const workoutsCollection = collection(db, 'workouts');

        const existingUsersSnapshot = await getDocs(usersCollection);
        if (!existingUsersSnapshot.empty) {
            const users = existingUsersSnapshot.docs.map(d => {
                const data = d.data();
                return {
                    ...data,
                    id: d.id,
                    dob: formatDate(data.dob),
                }
            });
            return { success: true, message: "Database has already been seeded.", users: users };
        }

        const batch = writeBatch(db);

        const usersToSeed = sampleUsers.map(user => ({
            ...user,
            dob: user.dob ? new Date(user.dob) : null,
            coachId: user.status === 'recruited' ? 'coach1' : (user.status === 'pending_invite' ? 'coach2' : null)
        }));

        usersToSeed.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batch.set(userRef, user);
        });

        const workoutsToSeed = sampleWorkouts.map(workout => ({
            ...workout,
            createdAt: new Date(workout.createdAt)
        }));

        workoutsToSeed.forEach(workout => {
            const workoutRef = doc(collection(db, 'workouts')); // Auto-generate ID
            batch.set(workoutRef, workout);
        });

        await batch.commit();
        
        const seededUsers = usersToSeed.map(u => ({
            ...u,
            id: u.id,
            dob: u.dob ? u.dob.toISOString().split('T')[0] : null
        }));
        
        return { success: true, message: "Database seeded successfully!", users: seededUsers };
    } catch (error: any) {
        console.error("Error seeding database: ", error);
        return { success: false, message: "Failed to seed database. Check Firestore rules and API status.", users: [] };
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
                dob: formatDate(data.dob),
            };
        });
        return { success: true, users };
    } catch (error: any) {
        console.error("Error fetching users for login: ", error);
        return { success: false, users: [], message: "Could not fetch users." };
    }
}


export async function getUser(userId: string) {
    if (!userId) {
        return { success: false, user: null, message: "User ID is required." };
    }
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, user: null, message: "User not found." };
        }

        const userData = userSnap.data();
        const user = {
            ...userData,
            id: userSnap.id,
            dob: formatDate(userData.dob),
        };

        return { success: true, user };
    } catch (error: any) {
        console.error(`Error fetching user ${userId}:`, error);
        return { success: false, user: null, message: "Failed to fetch user data." };
    }
}

export async function getUsersByIds(userIds: string[]) {
    if (!userIds || userIds.length === 0) {
        return { success: true, users: {} };
    }
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where(documentId(), 'in', userIds));
        const snapshot = await getDocs(q);

        const users: { [key: string]: any } = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            users[doc.id] = {
                ...data,
                id: doc.id,
                dob: formatDate(data.dob),
            };
        });
        return { success: true, users };
    } catch (error) {
        console.error("Error fetching users by IDs:", error);
        return { success: false, users: {}, message: 'Failed to fetch user data.' };
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
    } catch (error) {
        console.error("Error logging workout: ", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid data provided." };
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
    } catch (error) {
        console.error("Error updating profile: ", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid data provided." };
        }
        return { success: false, message: "Failed to update profile." };
    }
}

export async function getWorkoutHistory(userId: string, recordLimit?: number) {
    try {
        const workoutsCollection = collection(db, 'workouts');
        
        let q;
        if (recordLimit) {
            q = query(workoutsCollection, where("userId", "==", userId), limit(recordLimit));
        } else {
            q = query(workoutsCollection, where("userId", "==", userId));
        }
        
        const querySnapshot = await getDocs(q);

        const workouts = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    _id: doc.id,
                    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(), 
                };
            });

        // Sort in memory to avoid index requirement
        workouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return { success: true, workouts };
    } catch (error: any) {
        console.error(`Error fetching workout history for user ${userId}:`, error);
        return { success: false, workouts: [], message: "Failed to fetch workout history." };
    }
}

export async function getAllPlayers() {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where("role", "==", "player"));
        const querySnapshot = await getDocs(q);
        const players = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                dob: formatDate(data.dob) 
            };
        });

        const playersWithWorkouts = await Promise.all(players.map(async (player: any) => {
            const workoutHistory = await getWorkoutHistory(player.id, 3);
            let performanceData = 'No recent workouts.';
            if (workoutHistory.success && workoutHistory.workouts.length > 0) {
                performanceData = workoutHistory.workouts
                    .map(w => {
                        const parts = [w.exercise];
                        if (w.reps) parts.push(`${w.reps} reps`);
                        if (w.weight) parts.push(`@ ${w.weight}kg`);
                        if (w.distance) parts.push(`${w.distance}km`);
                        if (w.time) parts.push(`in ${w.time}`);
                        return parts.join(' ');
                    }).join('; ');
            }
            const profileParts = [];
            if (player.experience) profileParts.push(player.experience);
            if (player.goals) profileParts.push(player.goals);
            const userProfile = profileParts.length > 0 ? profileParts.join(', ') : 'No profile information available.';

            return { ...player, performanceData, userProfile };
        }));

        return { success: true, players: playersWithWorkouts };
    } catch (error) {
        console.error("Error getting all players:", error);
        return { success: false, players: [] };
    }
}

export async function sendRecruitInvite(playerId: string, coachId: string) {
    try {
        const inviteRef = collection(db, 'invites');
        // Check if an invite already exists
        const q = query(inviteRef, where('playerId', '==', playerId), where('coachId', '==', coachId), where('status', '==', 'pending'));
        const existingInvites = await getDocs(q);
        if (!existingInvites.empty) {
            return { success: false, message: 'Invite already sent.' };
        }

        await addDoc(inviteRef, {
            playerId,
            coachId,
            status: 'pending',
            sentAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'users', playerId), { status: 'pending_invite', coachId: coachId });

        return { success: true, message: 'Recruitment invite sent successfully!' };
    } catch (error) {
        console.error("Error sending invite:", error);
        return { success: false, message: 'Failed to send invite.' };
    }
}

export async function respondToInvite({ inviteId, response, playerId, coachId }: { inviteId: string, response: 'accepted' | 'declined', playerId: string, coachId: string }) {
    try {
        let conversationId: string | null = null;
        if (response === 'accepted') {
            await runTransaction(db, async (transaction) => {
                const inviteRef = doc(db, 'invites', inviteId);
                const playerRef = doc(db, 'users', playerId);

                const newConvoRef = doc(collection(db, 'conversations'));
                transaction.set(newConvoRef, {
                    participantIds: [playerId, coachId],
                    createdAt: serverTimestamp(),
                });
                conversationId = newConvoRef.id;

                transaction.update(inviteRef, { status: 'accepted' });
                transaction.update(playerRef, { status: 'recruited', coachId: coachId });
            });
        } else {
            await runTransaction(db, async (transaction) => {
                const inviteRef = doc(db, 'invites', inviteId);
                const playerRef = doc(db, 'users', playerId);

                // Use a transaction to ensure both updates succeed or fail together.
                transaction.update(inviteRef, { status: 'declined' });
                transaction.update(playerRef, { status: 'active', coachId: null });
            });
        }
        return { success: true, conversationId };
    } catch (error) {
        console.error("Error responding to invite:", error);
        return { success: false, message: 'Failed to respond to invite.' };
    }
}

export interface Conversation {
    id: string;
    participants: { id: string; name: string }[];
    lastMessage?: { text: string; sentAt: string };
}

export async function getConversations(userId: string): Promise<{ success: boolean; conversations: Conversation[], message?: string }> {
    try {
        const convosCol = collection(db, 'conversations');
        const q = query(convosCol, where('participantIds', 'array-contains', userId));
        const snapshot = await getDocs(q);

        const participantIds = new Set<string>();
        snapshot.docs.forEach(d => {
            d.data().participantIds.forEach((id: string) => {
                if (id !== userId) participantIds.add(id);
            });
        });

        const usersRes = await getUsersByIds(Array.from(participantIds));
        if (!usersRes.success) {
            return { success: false, conversations: [], message: 'Failed to fetch user data for conversations.' };
        }
        const usersMap = usersRes.users;

        const conversations = await Promise.all(snapshot.docs.map(async (d) => {
            const data = d.data();
            const participants = data.participantIds
                .filter((id: string) => id !== userId)
                .map((id: string) => ({ id, name: usersMap[id]?.name || 'Unknown' }));

            const messagesCol = collection(db, 'conversations', d.id, 'messages');
            const lastMsgQuery = query(messagesCol, orderBy('createdAt', 'desc'), where('text', '!=', null));
            const lastMsgSnapshot = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnapshot.docs[0] ? {
                text: lastMsgSnapshot.docs[0].data().text,
                sentAt: formatDate(lastMsgSnapshot.docs[0].data().createdAt) || new Date().toISOString(),
            } : undefined;

            return {
                id: d.id,
                participants,
                lastMessage
            };
        }));
        return { success: true, conversations };
    } catch (error) {
        console.error("Error getting conversations:", error);
        return { success: false, conversations: [], message: 'Failed to fetch conversations.' };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const messagesCol = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesCol, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data(),
            createdAt: formatDate(doc.data().createdAt) || new Date().toISOString(),
        }));
        return { success: true, messages };
    } catch (error) {
        console.error("Error getting messages:", error);
        return { success: false, messages: [], message: 'Failed to fetch messages.' };
    }
}


export async function sendMessage({ conversationId, senderId, text }: { conversationId: string, senderId: string, text: string }) {
    try {
        const messagesCol = collection(db, 'conversations', conversationId, 'messages');
        const newMessageRef = await addDoc(messagesCol, {
            senderId,
            text,
            createdAt: serverTimestamp()
        });
        const newMessageSnap = await getDoc(newMessageRef);
        const newMessageData = newMessageSnap.data();
        const newMessage = {
            _id: newMessageSnap.id,
            senderId: newMessageData?.senderId,
            text: newMessageData?.text,
            createdAt: formatDate(newMessageData?.createdAt) || new Date().toISOString(),
        }
        return { success: true, message: newMessage };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, message: 'Failed to send message.' };
    }
}
