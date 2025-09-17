
'use server';
import { db } from '@/lib/firebase';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc, orderBy, runTransaction, documentId, getDocsFromCache, limit, setDoc, arrayUnion } from 'firebase/firestore';

import { z } from 'zod';
import { generateTeamName } from '@/ai/flows/generate-team-name';

// Helper to convert Firestore Timestamp to a serializable format
const formatTimestamp = (timestamp: any): Date | null => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        const d = timestamp.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) {
            return d;
        }
    }
    return null;
}

const signUpSchema = z.object({
  userId: z.string(),
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  role: z.enum(['player', 'coach']),
});

export async function signUpWithEmailAndPassword(values: z.infer<typeof signUpSchema>) {
    try {
        const validatedData = signUpSchema.parse(values);
        
        await setDoc(doc(db, "users", validatedData.userId), {
            id: validatedData.userId,
            name: validatedData.name,
            email: validatedData.email,
            role: validatedData.role,
            status: 'active',
            createdAt: serverTimestamp(),
        });
        
        return { success: true, userId: validatedData.userId, role: validatedData.role };
    } catch (error: any) {
        console.error("Error creating user profile:", error);
        // If profile creation fails, delete the auth user to prevent orphaned accounts
        try {
            await getAdminAuth().deleteUser(values.userId);
        } catch (deleteError) {
            console.error("Failed to clean up orphaned auth user:", deleteError);
        }
        return { success: false, message: 'Failed to create user profile in database.' };
    }
}


const signInSchema = z.object({
  userId: z.string(),
});


export async function signInWithEmailAndPasswordAction(values: z.infer<typeof signInSchema>) {
    try {
        const validatedData = signInSchema.parse(values);
        const userRef = doc(db, "users", validatedData.userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
           return { success: false, message: 'User profile not found. Please sign up.' };
        }

        const userRole = userDoc.data()?.role || 'player'; 

        return { success: true, userId: validatedData.userId, role: userRole };
    } catch (error: any)
     {
        console.error("Error signing in:", error);
        return { success: false, message: 'Failed to retrieve user profile.' };
    }
}


const googleSignInSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['player', 'coach']).optional(), // Role is optional now
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
            // If user does not exist, create them. Use the provided role, or default to player.
            const role = validatedData.role || 'player';
            await setDoc(userRef, {
                id: validatedData.userId,
                name: validatedData.name,
                email: validatedData.email,
                role: role,
                status: 'active',
                createdAt: serverTimestamp(),
            });
            return { success: true, userId: validatedData.userId, role: role };
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
            dob: formatTimestamp(userData.dob),
            createdAt: formatTimestamp(userData.createdAt),
        };

        return { success: true, user: JSON.parse(JSON.stringify(user)) };
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
                dob: formatTimestamp(data.dob),
                createdAt: formatTimestamp(data.createdAt),
            };
        });
        return { success: true, users: JSON.parse(JSON.stringify(users)) };
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
    dob: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    goals: z.string().optional().nullable(),
});


export async function updateUserProfile(values: z.infer<typeof updateUserProfileSchema>) {
    try {
        const validatedData = updateUserProfileSchema.parse(values);
        const { userId, ...profileData } = validatedData;
        const userRef = doc(db, 'users', userId);
        
        const updateData: any = {
            name: profileData.name,
            dob: profileData.dob ? new Date(profileData.dob) : null,
            experience: profileData.experience ?? null,
            goals: profileData.goals ?? null,
        };
        
        await updateDoc(userRef, updateData);
        return { success: true, message: "Profile updated!" };
    } catch (error) {
        console.error("Error updating profile: ", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: `Invalid data provided: ${error.message}` };
        }
        return { success: false, message: "Failed to update profile." };
    }
}

export async function getWorkoutHistory(userId: string, recordLimit?: number) {
    try {
        const workoutsCollection = collection(db, 'workouts');
        
        let q = query(workoutsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
        
        if (recordLimit) {
            q = query(q, limit(recordLimit));
        }
        
        const querySnapshot = await getDocs(q);

        const workouts = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    _id: doc.id,
                    createdAt: formatTimestamp(data.createdAt), 
                };
            });
        
        return { success: true, workouts: JSON.parse(JSON.stringify(workouts)) };
    } catch (error: any) {
        console.error(`Error fetching workout history for user ${userId}:`, error);
        return { success: false, workouts: [], message: "Failed to fetch workout history." };
    }
}

export async function getAllPlayers() {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where("role", "==", "player"), where("status", "==", "active"));
        const querySnapshot = await getDocs(q);
        const players = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                dob: formatTimestamp(data.dob),
                createdAt: formatTimestamp(data.createdAt),
            };
        });

        const playersWithWorkouts = await Promise.all(players.map(async (player: any) => {
            const workoutHistory = await getWorkoutHistory(player.id);
            let performanceData = 'No workouts logged.';
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

        return { success: true, players: JSON.parse(JSON.stringify(playersWithWorkouts)) };
    } catch (error) {
        console.error("Error getting all players:", error);
        return { success: false, players: [] };
    }
}

export async function findPlayerByEmail(email: string) {
    try {
        if (!email) {
            return { success: false, player: null, message: 'Email is required.' };
        }
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where("email", "==", email), where("role", "==", "player"), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, player: null, message: 'No player found with that email.' };
        }

        const playerDoc = querySnapshot.docs[0];
        const data = playerDoc.data();
        const player = {
            id: playerDoc.id,
            ...data,
            dob: formatTimestamp(data.dob),
            createdAt: formatTimestamp(data.createdAt),
        };
        
        return { success: true, player: JSON.parse(JSON.stringify(player)) };
    } catch (error) {
        console.error("Error finding player by email:", error);
        return { success: false, player: null, message: 'An error occurred while searching for the player.' };
    }
}

export async function sendRecruitInvite(playerId: string, coachId: string) {
    try {
        const inviteRef = collection(db, 'invites');
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
        if (response === 'accepted') {
            const batch = writeBatch(db);
            const inviteRef = doc(db, 'invites', inviteId);
            const playerRef = doc(db, 'users', playerId);
            
            // Update player and invite status
            batch.update(playerRef, { status: 'recruited', coachId: coachId });
            batch.update(inviteRef, { status: 'accepted' });

            // Create a new direct conversation
            const newConvoRef = doc(collection(db, 'conversations'));
            batch.set(newConvoRef, {
                participantIds: [playerId, coachId],
                createdAt: serverTimestamp(),
                type: 'direct',
            });
            
            // Handle group chat logic
            const teamQuery = query(collection(db, 'users'), where('coachId', '==', coachId), where('status', '==', 'recruited'));
            const teamSnapshot = await getDocs(teamQuery);
            const teamMembers = teamSnapshot.docs.map(d => d.id);

            const groupChatQuery = query(collection(db, 'conversations'), where('coachId', '==', coachId), where('type', '==', 'group'));
            const groupChatSnapshot = await getDocs(groupChatQuery);
            
            if (groupChatSnapshot.empty) {
                // Create new group chat if there's at least one other team member
                if (teamMembers.length > 0) {
                    const coachSnap = await getDoc(doc(db, 'users', coachId));
                    const coachData = coachSnap.data();
                    let teamName = coachData?.name ? await generateTeamName(coachData.name) : 'The Team';
                    
                    const groupChatRef = doc(collection(db, 'conversations'));
                    batch.set(groupChatRef, {
                        coachId: coachId,
                        name: teamName,
                        participantIds: [...teamMembers, coachId, playerId],
                        createdAt: serverTimestamp(),
                        type: 'group',
                    });
                }
            } else {
                // Add player to existing group chat
                const groupChatDoc = groupChatSnapshot.docs[0];
                batch.update(groupChatDoc.ref, {
                    participantIds: arrayUnion(playerId)
                });
            }

            await batch.commit();
            return { success: true, conversationId: newConvoRef.id };

        } else { // 'declined'
            const batch = writeBatch(db);
            const inviteRef = doc(db, 'invites', inviteId);
            const playerRef = doc(db, 'users', playerId);
            batch.update(playerRef, { status: 'active', coachId: null });
            batch.update(inviteRef, { status: 'declined' });
            await batch.commit();
            return { success: true, conversationId: null };
        }

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
                .map((id: string) => ({ id, name: usersMap[id]?.name || 'Unknown' }));

            const messagesCol = collection(db, 'conversations', d.id, 'messages');
            const lastMsgQuery = query(messagesCol, orderBy('createdAt', 'desc'), limit(1));
            const lastMsgSnapshot = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnapshot.docs[0] ? {
                text: lastMsgSnapshot.docs[0].data().text,
                sentAt: formatTimestamp(lastMsgSnapshot.docs[0].data().createdAt)?.toISOString() || new Date().toISOString(),
            } : undefined;

            return {
                id: d.id,
                participants,
                lastMessage,
                name: data.name,
                type: data.type || 'direct',
            };
        }));
        return { success: true, conversations: JSON.parse(JSON.stringify(conversations)) };
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
            createdAt: formatTimestamp(doc.data().createdAt)?.toISOString() || new Date().toISOString(),
        }));
        return { success: true, messages: JSON.parse(JSON.stringify(messages)) };
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
            createdAt: formatTimestamp(newMessageData?.createdAt)?.toISOString() || new Date().toISOString(),
        }
        return { success: true, message: JSON.parse(JSON.stringify(newMessage)) };
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

export async function logPhysiqueAnalysis(userId: string, summary: string) {
    try {
        if (!userId) {
            throw new Error("User ID is required.");
        }
        const analysesCollection = collection(db, 'users', userId, 'physique_analyses');
        await addDoc(analysesCollection, {
            summary,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: "Physique analysis logged successfully!" };
    } catch (error) {
        console.error("Error logging physique analysis:", error);
        return { success: false, message: "Failed to log physique analysis." };
    }
}

export async function getPhysiqueHistory(userId: string) {
    try {
        const analysesCollection = collection(db, 'users', userId, 'physique_analyses');
        const q = query(analysesCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const analyses = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: formatTimestamp(data.createdAt),
            };
        });

        return { success: true, analyses: JSON.parse(JSON.stringify(analyses)) };
    } catch (error: any) {
        console.error(`Error fetching physique history for user ${userId}:`, error);
        return { success: false, analyses: [], message: "Failed to fetch physique history." };
    }
}
