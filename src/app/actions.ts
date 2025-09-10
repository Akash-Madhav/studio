
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc, orderBy, runTransaction, documentId } from 'firebase/firestore';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts } from '@/lib/sample-data';


export async function seedDatabase() {
    try {
        const usersCollection = collection(db, 'users');
        const workoutsCollection = collection(db, 'workouts');

        // Check if users already exist to prevent re-seeding
        const existingUsersSnapshot = await getDocs(usersCollection);
        if (!existingUsersSnapshot.empty) {
            const existingUsers = existingUsersSnapshot.docs.map(d => ({...d.data(), id: d.id, dob: d.data().dob ? d.data().dob.toDate() : null }));
            return { success: false, message: "Database has already been seeded.", users: existingUsers };
        }

        const batch = writeBatch(db);

        // Prepare users with Date objects
        const usersToSeed = sampleUsers.map(user => ({
            ...user,
            dob: user.dob ? new Date(user.dob) : null,
            coachId: user.status === 'recruited' ? 'coach1' : (user.status === 'pending_invite' ? 'coach2' : null)
        }));

        usersToSeed.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batch.set(userRef, user);
        });

        // Prepare workouts with Date objects
        const workoutsToSeed = sampleWorkouts.map(workout => ({
            ...workout,
            createdAt: new Date(workout.createdAt)
        }));

        workoutsToSeed.forEach(workout => {
            const workoutRef = doc(collection(db, 'workouts')); // Auto-generate ID
            batch.set(workoutRef, workout);
        });

        await batch.commit();
        
        // Return the newly created users to avoid a refetch
        const seededUsers = usersToSeed.map(u => ({...u, id: u.id}));
        
        return { success: true, message: "Database seeded successfully!", users: seededUsers };
    } catch (error: any) {
        console.error("Error seeding database: ", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Please check your security rules or ensure the Firestore API is enabled.", users: [] };
        }
        return { success: false, message: "Failed to seed database.", users: [] };
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
                dob: data.dob ? data.dob.toDate() : null
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
            dob: userData.dob ? userData.dob.toDate() : null,
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
        const q = query(workoutsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const workouts = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    _id: doc.id,
                    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(), 
                };
            })
        
        return { success: true, workouts };
    } catch (error: any) {
        console.error(`Error fetching workout history for user ${userId}:`, error);
        if (error.code === 'permission-denied') {
            return { success: false, workouts: [], message: "Firestore permission denied. Could not fetch workout history." };
        }
        return { success: false, workouts: [], message: "Failed to fetch workout history." };
    }
}

const createPostSchema = z.object({
    authorId: z.string(),
    role: z.enum(['player', 'coach']),
    content: z.string().min(1).max(280),
});

export async function createPost(values: z.infer<typeof createPostSchema>) {
    try {
        const validatedData = createPostSchema.parse(values);
        await addDoc(collection(db, 'posts'), {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error creating post: ", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Could not create post." };
        }
        return { success: false, message: "Failed to create post." };
    }
}

export async function getAllPlayers() {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where("role", "==", "player"));
        const querySnapshot = await getDocs(q);
        const players = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const playersWithWorkouts = await Promise.all(players.map(async (player: any) => {
            const workoutHistory = await getWorkoutHistory(player.id);
            let performanceData = 'No recent workouts.';
            if (workoutHistory.success && workoutHistory.workouts.length > 0) {
                performanceData = workoutHistory.workouts
                    .slice(0, 3) // get latest 3
                    .map(w => {
                        const parts = [w.exercise];
                        if (w.reps) parts.push(`${w.reps} reps`);
                        if (w.weight) parts.push(`@ ${w.weight}kg`);
                        if (w.distance) parts.push(`${w.distance}km`);
                        if (w.time) parts.push(`in ${w.time}`);
                        return parts.join(' ');
                    }).join('; ');
            }
            return { ...player, performanceData };
        }));

        return { success: true, players: playersWithWorkouts };
    } catch (error: any) {
        console.error("Error getting all players:", error);
        if (error.code === 'permission-denied') {
            return { success: false, players: [], message: "Firestore permission denied. Could not fetch players." };
        }
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

        // Update player status
        await updateDoc(doc(db, 'users', playerId), { status: 'pending_invite', coachId: coachId });

        return { success: true, message: 'Recruitment invite sent successfully!' };
    } catch (error: any) {
        console.error("Error sending invite:", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Could not send invite." };
        }
        return { success: false, message: 'Failed to send invite.' };
    }
}

export async function getPendingInvitesForCoach(coachId: string) {
    try {
        const invitesCol = collection(db, 'invites');
        const q = query(invitesCol, where('coachId', '==', coachId), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        const invites = await Promise.all(snapshot.docs.map(async (d) => {
            const data = d.data();
            const playerRes = await getUser(data.playerId);
            return {
                inviteId: d.id,
                playerId: data.playerId,
                playerName: playerRes.user?.name || 'Unknown',
                playerAvatar: `https://picsum.photos/seed/${data.playerId}/50/50`,
                sentAt: data.sentAt ? data.sentAt.toDate() : new Date(), 
            };
        }));
        return { success: true, invites };
    } catch (error: any) {
        console.error("Error fetching pending invites:", error);
        if (error.code === 'permission-denied') {
            return { success: false, invites: [], message: "Firestore permission denied. Could not fetch invites." };
        }
        return { success: false, invites: [] };
    }
}

export async function getRecruitedPlayers(coachId: string) {
    try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('coachId', '==', coachId), where('status', '==', 'recruited'));
        const snapshot = await getDocs(q);
        const players = await Promise.all(snapshot.docs.map(async (d) => {
            const player: any = d.data();
            const workoutHistory = await getWorkoutHistory(d.id);
            const performanceData = workoutHistory.workouts
                .slice(0, 3)
                .map(w => `${w.exercise}: ${w.reps || '-'} reps, ${w.weight || '-'} kg`)
                .join(' | ');
            const userProfile = (player.experience && player.goals) ? `${player.experience}, ${player.goals}` : 'N/A';
            return {
                id: d.id,
                name: player.name,
                userProfile: userProfile,
                performanceData: performanceData || 'No recent workouts logged.',
                status: player.status
            };
        }));
        return { success: true, players };
    } catch (error: any) {
        console.error("Error fetching recruited players:", error);
        if (error.code === 'permission-denied') {
            return { success: false, players: [], message: "Firestore permission denied. Could not fetch players." };
        }
        return { success: false, players: [] };
    }
}

export async function respondToInvite({ inviteId, response, playerId, coachId }: { inviteId: string, response: 'accepted' | 'declined', playerId: string, coachId: string }) {
    try {
        let conversationId: string | null = null;
        if (response === 'accepted') {
            await runTransaction(db, async (transaction) => {
                const inviteRef = doc(db, 'invites', inviteId);
                const playerRef = doc(db, 'users', playerId);

                // Create a new conversation for them
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
            // Declined
            await updateDoc(doc(db, 'invites', inviteId), { status: 'declined' });
            await updateDoc(doc(db, 'users', playerId), { status: 'active', coachId: null });
        }
        return { success: true, conversationId };
    } catch (error: any) {
        console.error("Error responding to invite:", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Could not respond to invite." };
        }
        return { success: false, message: 'Failed to respond to invite.' };
    }
}

export interface Conversation {
    id: string;
    participants: { id: string; name: string }[];
    lastMessage?: { text: string; sentAt: Date };
}

export async function getConversations(userId: string): Promise<{ success: boolean; conversations: Conversation[], message?: string }> {
    try {
        const convosCol = collection(db, 'conversations');
        const q = query(convosCol, where('participantIds', 'array-contains', userId));
        const snapshot = await getDocs(q);

        const conversations = await Promise.all(snapshot.docs.map(async (d) => {
            const data = d.data();
            const participantIds = data.participantIds.filter((id: string) => id !== userId);
            const participants = await Promise.all(participantIds.map(async (id: string) => {
                const userRes = await getUser(id);
                return { id, name: userRes.user?.name || 'Unknown' };
            }));

            // Get last message
            const messagesCol = collection(db, 'conversations', d.id, 'messages');
            const lastMsgQuery = query(messagesCol, orderBy('createdAt', 'desc'), where('text', '!=', null));
            const lastMsgSnapshot = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnapshot.docs[0] ? {
                text: lastMsgSnapshot.docs[0].data().text,
                sentAt: lastMsgSnapshot.docs[0].data().createdAt ? lastMsgSnapshot.docs[0].data().createdAt.toDate() : new Date(),
            } : undefined;

            return {
                id: d.id,
                participants,
                lastMessage
            };
        }));
        return { success: true, conversations };
    } catch (error: any) {
        console.error("Error getting conversations:", error);
        if (error.code === 'permission-denied') {
            return { success: false, conversations: [], message: "Firestore permission denied. Could not fetch conversations." };
        }
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
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
        }));
        return { success: true, messages };
    } catch (error: any) {
        console.error("Error getting messages:", error);
        if (error.code === 'permission-denied') {
            return { success: false, messages: [], message: "Firestore permission denied. Could not fetch messages." };
        }
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
            ...newMessageData,
            createdAt: newMessageData?.createdAt ? newMessageData.createdAt.toDate() : new Date(),
        }
        return { success: true, message: newMessage };
    } catch (error: any) {
        console.error("Error sending message:", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: 'Firestore permission denied. Could not send message.' };
        }
        return { success: false, message: 'Failed to send message.' };
    }
}


export async function getGroupMessages(role: 'player' | 'coach') {
    try {
        const groupChatCol = collection(db, 'groupChats');
        const q = query(groupChatCol, where('role', '==', role), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        const messages = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userRes = await getUser(data.senderId);
            return {
                _id: doc.id,
                ...data,
                authorName: userRes.user?.name || 'Unknown',
                authorAvatar: `https://picsum.photos/seed/${data.senderId}/50/50`,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            };
        }));
        return { success: true, messages };
    } catch (error: any) {
        console.error("Error fetching group messages:", error);
        if (error.code === 'permission-denied') {
            return { success: false, messages: [], message: "Firestore permission denied. Could not fetch messages." };
        }
        return { success: false, messages: [] };
    }
}

export async function sendGroupMessage({ senderId, role, text }: { senderId: string, role: 'player' | 'coach', text: string }) {
    try {
        const groupChatCol = collection(db, 'groupChats');
        const newMessageRef = await addDoc(groupChatCol, {
            senderId,
            role,
            text,
            createdAt: serverTimestamp(),
        });

        const newMessageSnap = await getDoc(newMessageRef);
        const data = newMessageSnap.data();
        const userRes = await getUser(data?.senderId);
        
        const message = {
             _id: newMessageSnap.id,
            ...data,
            authorName: userRes.user?.name || 'Unknown',
            authorAvatar: `https://picsum.photos/seed/${data?.senderId}/50/50`,
            createdAt: data?.createdAt ? data.createdAt.toDate() : new Date(),
        };

        return { success: true, message };
    } catch (error: any) {
        console.error("Error sending group message:", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "Firestore permission denied. Could not send message." };
        }
        return { success: false, message: 'Failed to send group message.' };
    }
}

    