
'use server';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts, sampleConversations, sampleInvites } from '@/lib/sample-data';


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
  
  // This is a mock function, in a real app you'd save to a database.
  console.log("Logged workout:", validatedData);

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
  sampleWorkouts.push(newWorkout);
  
  return { 
    success: true, 
    message: `${validatedData.exercise} has been added to your history.`,
    userId: validatedData.userId,
  };
}

export async function getPlayersForScouting(coachId: string) {
  try {
    const coachConversationPlayerIds = new Set(
      sampleConversations
        .filter(c => c.participantIds.includes(coachId))
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

        return {
          id: user.id,
          name: user.name || `Player ${user.id.substring(0, 4)}`,
          performanceData: performanceData || "No workouts logged yet.",
          userProfile: `Age: ${user.age || 'N/A'}, Experience: ${user.experience || 'N/A'}, Goals: ${user.goals || 'N/A'}`,
          status: user.status
        };
      });

    // A player is "recruited" if they have a conversation AND are not available for scouting.
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
    // In a real app, this would trigger a notification or email.
    const player = sampleUsers.find(u => u.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found.' };
    }

    const existingConversation = sampleConversations.find(c => c.participantIds.includes(playerId) && c.participantIds.includes(coachId));
    if (existingConversation) {
        return { success: false, message: `You are already connected with ${player.name}.` };
    }

    const existingInvite = sampleInvites.find(inv => inv.playerId === playerId && inv.coachId === coachId && inv.status === 'pending');
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
    
    // You might want to update the player's status in your database here
    const user = sampleUsers.find(u => u.id === playerId);
    if(user) {
        user.status = 'pending_invite';
    }
    
    return { success: true, message: `Recruitment invite sent to ${player.name}!` };
}

export async function getPendingInvites(coachId: string) {
  try {
    const pending = sampleInvites
      .filter(inv => inv.coachId === coachId && inv.status === 'pending')
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
  } catch (error) {
    console.error("Error fetching pending invites:", error);
    return { success: false, invites: [] };
  }
}


export async function getPendingInvitesForPlayer(playerId: string) {
    try {
      const pending = sampleInvites
        .filter(inv => inv.playerId === playerId && inv.status === 'pending')
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
    try {
        const invite = sampleInvites.find(inv => inv._id === validatedData.inviteId);
        if (!invite) {
            return { success: false, message: 'Invite not found.' };
        }
        
        invite.status = validatedData.response;

        const player = sampleUsers.find(u => u.id === validatedData.playerId);
        if (player) {
            player.status = validatedData.response === 'accepted' ? 'recruited' : 'active';
        }

        if (validatedData.response === 'accepted') {
            const newConversation = {
                _id: `${validatedData.coachId}_${validatedData.playerId}`,
                participantIds: [validatedData.coachId, validatedData.playerId],
                messages: [
                    { 
                        _id: `m${Date.now()}`, 
                        senderId: validatedData.playerId, 
                        text: 'I\'ve accepted your invitation! Looking forward to working with you.', 
                        createdAt: new Date() 
                    },
                ]
            };
            sampleConversations.push(newConversation);
        }

        return { success: true, message: `Invite ${validatedData.response}.` };
    } catch (error) {
        console.error("Error responding to invite:", error);
        return { success: false, message: 'An error occurred.' };
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
        const userConversations = sampleConversations.filter(c => c.participantIds.includes(userId));
        
        const conversations: Conversation[] = userConversations.map(convo => {
            const lastMessage = convo.messages.length > 0 ? convo.messages[convo.messages.length - 1] : null;
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
        });

        return { success: true, conversations };

    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, conversations: [] };
    }
}


export async function getMessages(conversationId: string) {
    try {
        const conversation = sampleConversations.find(c => c._id === conversationId);
        if (!conversation) {
            return { success: false, messages: [] };
        }
        
        const messages = conversation.messages.map(msg => ({
            id: msg._id,
            senderId: msg.senderId,
            text: msg.text,
            createdAt: msg.createdAt,
        }));

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

        return { success: true, message: { ...message, id: message._id } };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false };
    }
}


const updateUserProfileSchema = z.object({
    userId: z.string(),
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Invalid email address."),
    age: z.coerce.number().int().min(16, "Must be at least 16.").optional(),
    experience: z.string().optional(),
    goals: z.string().optional(),
});


export async function updateUserProfile(values: z.infer<typeof updateUserProfileSchema>) {
    const validatedData = updateUserProfileSchema.parse(values);
    try {
        const userIndex = sampleUsers.findIndex(u => u.id === validatedData.userId);
        if (userIndex === -1) {
            return { success: false, message: "User not found." };
        }

        sampleUsers[userIndex] = {
            ...sampleUsers[userIndex],
            name: validatedData.name,
            email: validatedData.email,
            age: validatedData.age,
            experience: validatedData.experience,
            goals: validatedData.goals,
        };

        return { success: true, message: "Profile updated successfully!" };

    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
