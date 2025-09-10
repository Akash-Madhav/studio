
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc, orderBy, runTransaction, documentId, getDocsFromCache } from 'firebase/firestore';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts } from '@/lib/sample-data';


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
                    dob: data.dob ? data.dob.toDate().toISOString().split('T')[0] : null
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
                dob: data.dob ? data.dob.toDate().toISOString().split('T')[0] : null
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
            dob: userData.dob ? userData.dob.toDate().toISOString().split('T')[0] : null,
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
                dob: data.dob ? data.dob.toDate().toISOString().split('T')[0] : null,
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
    } catch (error) {
        console.error("Error creating post: ", error);
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

export async function getPendingInvitesForCoach(coachId: string) {
    try {
        const invitesCol = collection(db, 'invites');
        const q = query(invitesCol, where('coachId', '==', coachId), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        
        const playerIds = snapshot.docs.map(doc => doc.data().playerId);
        const usersRes = await getUsersByIds(playerIds);

        if (!usersRes.success) {
            return { success: false, invites: [] };
        }

        const invites = snapshot.docs.map(d => {
            const data = d.data();
            const player = usersRes.users[data.playerId];
            return {
                inviteId: d.id,
                playerId: data.playerId,
                playerName: player?.name || 'Unknown',
                playerAvatar: `https://picsum.photos/seed/${data.playerId}/50/50`,
                sentAt: data.sentAt ? data.sentAt.toDate().toISOString() : new Date().toISOString(), 
            };
        });

        return { success: true, invites };
    } catch (error) {
        console.error("Error fetching pending invites:", error);
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
    } catch (error) {
        console.error("Error fetching recruited players:", error);
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
            await updateDoc(doc(db, 'invites', inviteId), { status: 'declined' });
            await updateDoc(doc(db, 'users', playerId), { status: 'active', coachId: null });
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
                sentAt: lastMsgSnapshot.docs[0].data().createdAt ? lastMsgSnapshot.docs[0].data().createdAt.toDate().toISOString() : new Date().toISOString(),
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
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
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
            createdAt: newMessageData?.createdAt ? newMessageData.createdAt.toDate().toISOString() : new Date().toISOString(),
        }
        return { success: true, message: newMessage };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, message: 'Failed to send message.' };
    }
}


export async function getGroupMessages(role: 'player' | 'coach') {
    try {
        const groupChatCol = collection(db, 'groupChats');
        const q = query(groupChatCol, where('role', '==', role), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        const senderIds = new Set<string>();
        snapshot.docs.forEach(doc => senderIds.add(doc.data().senderId));
        const usersRes = await getUsersByIds(Array.from(senderIds));
        if (!usersRes.success) {
            return { success: false, messages: [] };
        }
        const usersMap = usersRes.users;

        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            const sender = usersMap[data.senderId];
            return {
                _id: doc.id,
                ...data,
                authorName: sender?.name || 'Unknown',
                authorAvatar: `https://picsum.photos/seed/${data.senderId}/50/50`,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            };
        });
        return { success: true, messages };
    } catch (error) {
        console.error("Error fetching group messages:", error);
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
            createdAt: data?.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };

        return { success: true, message };
    } catch (error) {
        console.error("Error sending group message:", error);
        return { success: false, message: 'Failed to send group message.' };
    }
}
