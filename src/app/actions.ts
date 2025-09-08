
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
  
  const newWorkout = {
    _id: `w${Date.now()}`,
    userId: validatedData.userId,
    exercise: validatedData.exercise,
    reps: validatedData.reps,
    weight: validatedData.weight,
    time: validatedData.time,
    distance: validatedData.distance,
    createdAt: new Date(),
  };
  sampleWorkouts.unshift(newWorkout); 

  return { 
    success: true, 
    message: `${validatedData.exercise} has been added to your history.`,
    userId: validatedData.userId,
  };
}

export async function getPlayersForScouting(coachId: string) {
    const coachConversationPlayerIds = new Set(
        sampleConversations.filter(c => c.participantIds.includes(coachId))
            .flatMap(c => c.participantIds.filter(pId => pId !== coachId))
    );

    const players = sampleUsers
      .filter(u => u.role === 'player')
      .map(user => {
        const userWorkouts = sampleWorkouts
          .filter(w => w.userId === user.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);

        const performanceData = userWorkouts.map(data => {
          let record = `${data.exercise}:`;
          if (data.reps) record += ` ${data.reps} reps`;
          if (data.weight) record += ` at ${data.weight}kg`;
          if (data.distance) record += ` for ${data.distance}km`;
          if (data.time) record += ` in ${data.time}`;
          return record;
        }).join(', ');

        const age = getAge(user.dob);

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
        return player !== undefined;
      });


    return { success: true, players, recruitedPlayerIds };
}

export async function sendRecruitInvite(playerId: string, coachId: string) {
    const player = sampleUsers.find(u => u.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found.' };
    }

    const existingConversation = sampleConversations.find(c => c.participantIds.includes(playerId) && c.participantIds.includes(coachId));
    if (existingConversation) {
        return { success: false, message: `You are already connected with ${player.name}.` };
    }
    
    const existingInvite = sampleInvites.find(i => i.playerId === playerId && i.coachId === coachId && i.status === 'pending');
    if (existingInvite) {
        return { success: false, message: `${player.name} already has a pending invite.` };
    }

    const newInvite = {
        _id: `inv${Date.now()}`,
        coachId,
        playerId,
        status: 'pending' as const,
        createdAt: new Date(),
    };
    sampleInvites.push(newInvite);
    
    const userIndex = sampleUsers.findIndex(u => u.id === playerId);
    if (userIndex !== -1) {
        sampleUsers[userIndex].status = 'pending_invite';
    }

    return { success: true, message: `Recruitment invite sent to ${player.name}!` };
}

export async function getPendingInvites(coachId: string) {
    const pending = sampleInvites
      .filter(invite => invite.coachId === coachId && invite.status === 'pending')
      .map(invite => {
        const player = sampleUsers.find(u => u.id === invite.playerId);
        return {
          inviteId: invite._id,
          playerId: invite.playerId,
          playerName: player?.name || 'Unknown Player',
          playerAvatar: `https://picsum.photos/seed/${invite.playerId}/100/100`,
          sentAt: invite.createdAt,
        };
      })
      .sort((a,b) => b.sentAt.getTime() - a.sentAt.getTime());

    return { success: true, invites: pending };
}


export async function getPendingInvitesForPlayer(playerId: string) {
    const pending = sampleInvites
        .filter(invite => invite.playerId === playerId && invite.status === 'pending')
        .map(invite => {
            const coach = sampleUsers.find(u => u.id === invite.coachId);
            return {
                inviteId: invite._id,
                coachId: invite.coachId,
                coachName: coach?.name || 'Unknown Coach',
                coachAvatar: `https://picsum.photos/seed/${invite.coachId}/100/100`,
                sentAt: invite.createdAt,
            };
        })
        .sort((a,b) => b.sentAt.getTime() - a.sentAt.getTime());
    
    return { success: true, invites: pending };
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
    
    const inviteIndex = sampleInvites.findIndex(i => i._id === inviteId);
    if (inviteIndex === -1) {
        return { success: false, message: 'Invite not found.' };
    }
    
    const playerIndex = sampleUsers.findIndex(u => u.id === playerId);

    if (playerIndex === -1) {
        return { success: false, message: 'Player not found.' };
    }

    sampleInvites.splice(inviteIndex, 1);
    sampleUsers[playerIndex].status = response === 'accepted' ? 'recruited' : 'active';
    
    let conversationId: string | null = null;
    if (response === 'accepted') {
        const newConversation = {
            _id: `conv_${Date.now()}`,
            participantIds: [coachId, playerId],
            messages: [],
            createdAt: new Date(),
        };
        sampleConversations.push(newConversation);
        conversationId = newConversation._id;
    }
    
    return { success: true, message: `Invite ${response}.`, conversationId };
}


// CHAT ACTIONS

export interface Conversation {
    id: string;
    participants: { id: string; name: string; }[];
    lastMessage: { text: string; sentAt: Date } | null;
}

export async function getConversations(userId: string): Promise<{success: boolean, conversations: Conversation[]}> {
    const userConversations = sampleConversations.filter(c => c.participantIds.includes(userId));

    const conversations: Conversation[] = userConversations.map(convo => {
        const lastMessage = convo.messages?.length > 0 ? convo.messages[convo.messages.length - 1] : null;
        return {
            id: convo._id,
            participants: convo.participantIds.map(pId => {
                const user = sampleUsers.find(u => u.id === pId);
                return { id: pId, name: user?.name || "Unknown" };
            }),
            lastMessage: lastMessage ? {
                text: lastMessage.text,
                sentAt: lastMessage.createdAt
            } : null
        }
    }).sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime();
    });

    return { success: true, conversations };
}


export async function getMessages(conversationId: string) {
    const conversation = sampleConversations.find(c => c._id === conversationId);
    if (!conversation) {
        return { success: false, messages: [] };
    }
    const messages = conversation.messages?.map(msg => ({
        ...msg,
        id: msg._id,
    })) || [];

    return { success: true, messages };
}

const sendMessageSchema = z.object({
    conversationId: z.string(),
    senderId: z.string(),
    text: z.string().min(1),
});

export async function sendMessage(values: z.infer<typeof sendMessageSchema>) {
    const validatedData = sendMessageSchema.parse(values);
    const conversation = sampleConversations.find(c => c._id === validatedData.conversationId);
    if (!conversation) {
        return { success: false, message: 'Conversation not found' };
    }

    const message = {
        _id: `m${Date.now()}`,
        senderId: validatedData.senderId,
        text: validatedData.text,
        createdAt: new Date(),
    };
    conversation.messages.push(message);

    return { success: true, message: message };
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
    const userIndex = sampleUsers.findIndex(u => u.id === validatedData.userId);

    if (userIndex === -1) {
        return { success: false, message: "User not found." };
    }

    const updatedUser = {
        ...sampleUsers[userIndex],
        name: validatedData.name,
        email: validatedData.email,
        dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
        experience: validatedData.experience,
        goals: validatedData.goals,
    };
    
    sampleUsers[userIndex] = updatedUser;

    return { success: true, message: "Profile updated successfully!" };
}

export async function getWorkoutHistory(userId: string) {
    const workouts = sampleWorkouts
        .filter(w => w.userId === userId)
        .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { success: true, workouts };
}
