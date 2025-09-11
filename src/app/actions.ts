
'use server';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc, orderBy, runTransaction, documentId, getDocsFromCache, limit, setDoc, arrayUnion } from 'firebase/firestore';

import { z } from 'zod';
import { generateTeamName } from '@/ai/flows/generate-team-name';

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

const signUpSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['player', 'coach']),
});

export async function signUpWithEmailAndPassword(values: z.infer<typeof signUpSchema>) {
    try {
        const validatedData = signUpSchema.parse(values);
        const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            name: validatedData.name,
            email: validatedData.email,
            role: validatedData.role,
            status: 'active',
            createdAt: serverTimestamp(),
        });
        
        return { success: true, userId: user.uid, role: validatedData.role };
    } catch (error: any) {
        console.error("Error signing up:", error);
        let message = 'Failed to sign up.';
        if (error.code === 'auth/email-already-in-use') {
            message = 'This email is already in use.';
        }
        return { success: false, message };
    }
}

const signInSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});


export async function signInWithEmailAndPasswordAction(values: z.infer<typeof signInSchema>) {
    try {
        const validatedData = signInSchema.parse(values);
        const userCredential = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
             return { success: false, message: 'User profile not found.' };
        }
        const userRole = userDoc.data()?.role || 'player';

        return { success: true, userId: user.uid, role: userRole };
    } catch (error: any) {
        console.error("Error signing in:", error);
        let message = 'Failed to sign in. Please check your credentials.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            message = 'Invalid email or password.';
        }
        return { success: false, message };
    }
}


const googleSignInSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['player', 'coach']),
});

export async function signInWithGoogle(values: z.infer<typeof googleSignInSchema>) {
    try {
        const validatedData = googleSignInSchema.parse(values);
        const userRef = doc(db, "users", validatedData.userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userRole = userDoc.data()?.role || 'player';
            return { success: true, userId: validatedData.userId, role: userRole };
        } else {
            await setDoc(userRef, {
                id: validatedData.userId,
                name: validatedData.name,
                email: validatedData.email,
                role: validatedData.role,
                status: 'active',
                createdAt: serverTimestamp(),
            });
            return { success: true, userId: validatedData.userId, role: validatedData.role };
        }
    } catch (error) {
        console.error("Error during Google sign-in process:", error);
        return { success: false, message: "An error occurred during Google sign-in." };
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
        return { success: true, message: "Profile updated!" };
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
            q = query(workoutsCollection, where("userId", "==", userId));
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
        
        const limitedWorkouts = recordLimit ? workouts.slice(0, recordLimit) : workouts;
        
        return { success: true, workouts: limitedWorkouts };
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
                    type: 'direct',
                });
                conversationId = newConvoRef.id;

                transaction.update(inviteRef, { status: 'accepted' });
                transaction.update(playerRef, { status: 'recruited', coachId: coachId });

                // Check for existing group chat or create a new one
                const coachRef = doc(db, 'users', coachId);
                const coachDoc = await transaction.get(coachRef);
                const coachData = coachDoc.data();
                if (!coachData) throw new Error('Coach not found');

                const teamQuery = query(collection(db, 'users'), where('coachId', '==', coachId), where('status', '==', 'recruited'));
                const teamSnapshot = await getDocs(teamQuery);
                const teamSize = teamSnapshot.docs.length + 1; // +1 for the newly recruited player

                if (teamSize >= 2) {
                    const groupChatQuery = query(collection(db, 'conversations'), where('coachId', '==', coachId), where('type', '==', 'group'));
                    const groupChatSnapshot = await getDocs(groupChatQuery);

                    if (groupChatSnapshot.empty) {
                        // Create a new group chat
                        const teamName = await generateTeamName(coachData.name);
                        const groupChatRef = doc(collection(db, 'conversations'));
                        transaction.set(groupChatRef, {
                            coachId: coachId,
                            name: teamName,
                            participantIds: [coachId, playerId, ...teamSnapshot.docs.map(d => d.id)],
                            createdAt: serverTimestamp(),
                            type: 'group',
                        });
                    } else {
                        // Add player to existing group chat
                        const groupChatDoc = groupChatSnapshot.docs[0];
                        transaction.update(groupChatDoc.ref, {
                            participantIds: arrayUnion(playerId)
                        });
                    }
                }
            });
        } else {
            await runTransaction(db, async (transaction) => {
                const inviteRef = doc(db, 'invites', inviteId);
                const playerRef = doc(db, 'users', playerId);
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
    name?: string; // For group chats
    type: 'direct' | 'group';
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
                // .filter((id: string) => id !== userId) // Keep all for group context
                .map((id: string) => ({ id, name: usersMap[id]?.name || 'Unknown' }));

            const messagesCol = collection(db, 'conversations', d.id, 'messages');
            const lastMsgQuery = query(messagesCol, orderBy('createdAt', 'desc'), where('text', '!=', null), limit(1));
            const lastMsgSnapshot = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnapshot.docs[0] ? {
                text: lastMsgSnapshot.docs[0].data().text,
                sentAt: formatDate(lastMsgSnapshot.docs[0].data().createdAt) || new Date().toISOString(),
            } : undefined;

            return {
                id: d.id,
                participants,
                lastMessage,
                name: data.name,
                type: data.type || 'direct',
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

const createPostSchema = z.object({
  authorId: z.string(),
  authorName: z.string(),
  content: z.string().min(1, "Post content cannot be empty."),
});

export async function createPost(values: z.infer<typeof createPostSchema>) {
    try {
        const validatedData = createPostSchema.parse(values);
        const postsCollection = collection(db, 'posts');
        await addDoc(postsCollection, {
            ...validatedData,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: "Post created successfully!" };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid post data." };
        }
        return { success: false, message: "Failed to create post." };
    }
}

const addCommentSchema = z.object({
  postId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  content: z.string().min(1, "Comment cannot be empty."),
});

export async function addComment(values: z.infer<typeof addCommentSchema>) {
    try {
        const validatedData = addCommentSchema.parse(values);
        const commentsCollection = collection(db, 'posts', validatedData.postId, 'comments');
        await addDoc(commentsCollection, {
            authorId: validatedData.authorId,
            authorName: validatedData.authorName,
            content: validatedData.content,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: "Comment added!" };
    } catch (error) {
         if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid comment data." };
        }
        return { success: false, message: "Failed to add comment." };
    }
}
