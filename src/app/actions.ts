
'use server';

import { z } from 'zod';
import { sampleUsers, sampleWorkouts, sampleConversations } from '@/lib/sample-data';


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

export async function getPlayersForScouting() {
  try {
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
        };
      });

    return { success: true, players };
  } catch (error) {
    console.error("Error fetching players: ", error);
    return { success: false, players: [] };
  }
}

export async function sendRecruitInvite(playerId: string, playerName: string) {
    // In a real app, this would trigger a notification or email.
    // For now, we'll just log it to the console.
    console.log(`Recruitment invite sent to player: ${playerName} (ID: ${playerId})`);
    
    // You might want to update the player's status in your database here
    
    return { success: true, message: `Recruitment invite sent to ${playerName}!` };
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
