
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts, sampleConversations, sampleInvites } from '@/lib/sample-data';

const getAge = (dob?: Date) => {
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
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
  const validatedData = logWorkoutSchema.parse(values);
  
  try {
    const newWorkout = {
        userId: validatedData.userId,
        exercise: validatedData.exercise,
        reps: validatedData.reps,
        weight: validatedData.weight,
        time: validatedData.time,
        distance: validatedData.distance,
        createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'workouts'), newWorkout);
    
    return { 
      success: true, 
      message: `${validatedData.exercise} has been added to your history.`,
      userId: validatedData.userId,
    };
  } catch (error) {
    console.error("Error logging workout: ", error);
    return { success: false, message: 'Failed to log workout.' };
  }
}

export async function getPlayersForScouting(coachId: string) {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const conversationsSnapshot = await getDocs(query(collection(db, 'conversations'), where('participantIds', 'array-contains', coachId)));
    const coachConversationPlayerIds = new Set(
        conversationsSnapshot.docs.flatMap(doc => doc.data().participantIds.filter((pId: string) => pId !== coachId))
    );

    const workoutsSnapshot = await getDocs(collection(db, 'workouts'));
    const allWorkouts = workoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const players = allUsers
      .filter(u => u.role === 'player')
      .map(user => {
        const userWorkouts = allWorkouts
          .filter(w => w.userId === user.id)
          .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
          .slice(0, 5);

        const performanceData = userWorkouts.map(data => {
          let record = `${data.exercise}:`;
          if (data.reps) record += ` ${data.reps} reps`;
          if (data.weight) record += ` at ${data.weight}kg`;
          if (data.distance) record += ` for ${data.distance}km`;
          if (data.time) record += ` in ${data.time}`;
          return record;
        }).join(', ');

        const age = getAge(user.dob?.toDate());

        return {
          id: user.id,
          name: user.name || `Player ${user.id.substring(0, 4)}`,
          performanceData: performanceData || "No workouts logged yet.",
          userProfile: `Age: ${age || 'N/A'}, Experience: ${user.experience || 'N/A'}, Goals: ${user.goals || 'N/A'}`,
          status: user.status
        };
      });

    const recruitedPlayerIds = Array.from(coachConversationPlayerIds).filter(playerId => {
        const player = players.find(p => p.id === playerId);
        return player && player.status !== 'active';
    });


    return { success: true, players, recruitedPlayerIds };
  } catch (error) {
    console.error("Error fetching players: ", error);
    return { success: false, players: [], recruitedPlayerIds: [] };
  }
}

export async function sendRecruitInvite(playerId: string, coachId: string) {
    const playerRef = doc(db, 'users', playerId);
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) {
      return { success: false, message: 'Player not found.' };
    }
    const player = {id: playerDoc.id, ...playerDoc.data()};

    const existingConversationQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', playerId));
    const existingConversationSnapshot = await getDocs(existingConversationQuery);
    const existingConversation = existingConversationSnapshot.docs.find(doc => doc.data().participantIds.includes(coachId));

    if (existingConversation) {
        return { success: false, message: `You are already connected with ${player.name}.` };
    }

    const existingInviteQuery = query(collection(db, 'invites'), where('playerId', '==', playerId), where('coachId', '==', coachId), where('status', '==', 'pending'));
    const existingInviteSnapshot = await getDocs(existingInviteQuery);
    if (!existingInviteSnapshot.empty) {
        return { success: false, message: `${player.name} already has a pending invite.` };
    }

    const batch = writeBatch(db);
    
    const newInviteRef = doc(collection(db, 'invites'));
    batch.set(newInviteRef, {
        coachId,
        playerId,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    const userRef = doc(db, 'users', playerId);
    batch.update(userRef, { status: 'pending_invite' });
    
    await batch.commit();
    
    return { success: true, message: `Recruitment invite sent to ${player.name}!` };
}

export async function getPendingInvites(coachId: string) {
  try {
    const invitesQuery = query(collection(db, 'invites'), where('coachId', '==', coachId), where('status', '==', 'pending'));
    const invitesSnapshot = await getDocs(invitesQuery);

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pending = invitesSnapshot.docs.map(inviteDoc => {
        const invite = {id: inviteDoc.id, ...inviteDoc.data()};
        const player = users.find(u => u.id === invite.playerId);
        return {
          inviteId: invite.id,
          playerId: invite.playerId,
          playerName: player?.name || 'Unknown Player',
          playerAvatar: `https://picsum.photos/seed/${invite.playerId}/100/100`,
          sentAt: invite.createdAt.toDate(),
        };
      })
      .sort((a,b) => b.sentAt.getTime() - a.sentAt.getTime());

    return { success: true, invites: pending };
  } catch (error) {
    console.error("Error fetching pending invites:", error);
    return { success: false, invites: [] };
  }
}


export async function getPendingInvitesForPlayer(playerId: string) {
    try {
      const invitesQuery = query(collection(db, 'invites'), where('playerId', '==', playerId), where('status', '==', 'pending'));
      const invitesSnapshot = await getDocs(invitesQuery);

      if (invitesSnapshot.empty) {
        return { success: true, invites: [] };
      }
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const pending = invitesSnapshot.docs.map(docSnap => {
          const invite = {id: docSnap.id, ...docSnap.data()};
          const coach = users.find(u => u.id === invite.coachId);
          return {
            inviteId: invite.id,
            coachId: invite.coachId,
            coachName: coach?.name || 'Unknown Coach',
            coachAvatar: `https://picsum.photos/seed/${invite.coachId}/100/100`,
            sentAt: invite.createdAt.toDate(),
          };
        })
        .sort((a,b) => b.sentAt.getTime() - a.sentAt.getTime());
  
      return { success: true, invites: pending };
    } catch (error) {
      console.error("Error fetching player invites:", error);
      return { success: false, invites: [] };
    }
}
  
const respondToInviteSchema = z.object({
    inviteId: z.string(),
    response: z.enum(['accepted', 'declined']),
    playerId: z.string(),
    coachId: z.string(),
});

export async function respondToInvite(values: z.infer<typeof respondToInviteSchema>) {
    const validatedData = respondToInviteSchema.parse(values);
    const { inviteId, response, playerId, coachId } = validatedData;

    try {
        const inviteRef = doc(db, 'invites', inviteId);
        const playerRef = doc(db, 'users', playerId);

        const batch = writeBatch(db);
        
        batch.update(playerRef, { status: response === 'accepted' ? 'recruited' : 'active' });
        batch.delete(inviteRef);
        
        await batch.commit();
        
        let conversationId: string | null = null;
        if (response === 'accepted') {
            const newConversation = await addDoc(collection(db, 'conversations'), {
                participantIds: [coachId, playerId],
                messages: [],
                createdAt: serverTimestamp(),
            });
            conversationId = newConversation.id;
        }
        
        return { success: true, message: `Invite ${response}.`, conversationId };
    } catch (error) {
        console.error("Error responding to invite:", error);
        return { success: false, message: 'An error occurred while responding to the invite.', conversationId: null };
    }
}


// CHAT ACTIONS

export interface Conversation {
    id: string;
    participants: { id: string; name: string; }[];
    lastMessage: { text: string; sentAt: Date } | null;
}

export async function getConversations(userId: string): Promise<{success: boolean, conversations: Conversation[]}> {
    try {
        const conversationsQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', userId));
        const conversationsSnapshot = await getDocs(conversationsQuery);
        
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

        const conversations: Conversation[] = conversationsSnapshot.docs.map(convoDoc => {
            const convoData = convoDoc.data();
            const lastMessage = convoData.messages?.length > 0 ? convoData.messages[convoData.messages.length - 1] : null;
            return {
                id: convoDoc.id,
                participants: convoData.participantIds.map((pId: string) => {
                    const user = allUsers.find(u => u.id === pId);
                    return { id: pId, name: user?.name || "Unknown" };
                }),
                lastMessage: lastMessage ? {
                    text: lastMessage.text,
                    sentAt: lastMessage.createdAt.toDate()
                } : null
            }
        }).sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime();
        });

        return { success: true, conversations };

    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, conversations: [] };
    }
}


export async function getMessages(conversationId: string) {
    try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);

        if (!conversationSnap.exists()) {
            return { success: false, messages: [] };
        }
        
        const conversation = conversationSnap.data();
        const messages = conversation.messages?.map((msg: any) => ({
            id: msg._id, // This might need to be generated if not present
            senderId: msg.senderId,
            text: msg.text,
            createdAt: msg.createdAt.toDate(),
        })) || [];

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
       const conversationRef = doc(db, 'conversations', validatedData.conversationId);
       const conversationSnap = await getDoc(conversationRef);

       if (!conversationSnap.exists()) {
           return { success: false, message: 'Conversation not found' };
       }
       
       const conversation = conversationSnap.data();

       const message = {
            _id: `m${Date.now()}`, // Simple ID generation
            senderId: validatedData.senderId,
            text: validatedData.text,
            createdAt: serverTimestamp(),
        };

        await updateDoc(conversationRef, { 
            messages: [...(conversation.messages || []), message] 
        });

        const sentMessage = { ...message, createdAt: new Date() };

        return { success: true, message: sentMessage };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false };
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
    const validatedData = updateUserProfileSchema.parse(values);
    try {
        const userRef = doc(db, 'users', validatedData.userId);

        const updateData: any = {
            name: validatedData.name,
            email: validatedData.email,
            experience: validatedData.experience,
            goals: validatedData.goals,
        };

        if (validatedData.dob) {
            updateData.dob = new Date(validatedData.dob);
        } else if (validatedData.dob === null) {
            updateData.dob = null;
        }


        await updateDoc(userRef, updateData);

        return { success: true, message: "Profile updated successfully!" };

    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

    