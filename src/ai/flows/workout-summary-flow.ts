
'use server';
/**
 * @fileOverview A Genkit flow to generate a detailed summary of a player's workout history.
 * - generateWorkoutSummary - A function that takes a player's workout history and returns an insightful summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WorkoutSummaryInputSchema = z.string().describe("A formatted string containing the complete workout history of a player, with each workout on a new line.");

const WorkoutSummaryOutputSchema = z.string().describe("A detailed and encouraging summary of the player's workout accomplishments, highlighting progress, consistency, and key achievements.");

export async function generateWorkoutSummary(history: string): Promise<string> {
  return workoutSummaryFlow(history);
}

const prompt = ai.definePrompt({
  name: 'workoutSummaryPrompt',
  input: { schema: WorkoutSummaryInputSchema },
  output: { schema: WorkoutSummaryOutputSchema },
  prompt: `You are an expert fitness coach and motivational speaker. Your task is to analyze a player's entire workout history and provide a detailed, insightful, and encouraging summary of their accomplishments.

Analyze the following workout history logs:
{{{input}}}

Based on this data, generate a summary that includes:
-   An overall assessment of their consistency and dedication.
-   Identification of key areas of progress (e.g., increased weight in lifts, longer distances in cardio).
-   Mention of specific milestone achievements (e.g., "breaking the 100kg barrier on bench press").
-   An encouraging and motivational closing statement to inspire them to continue their fitness journey.

The tone should be positive, empowering, and specific. Reference the data provided to make your summary concrete and personal.`,
});

const workoutSummaryFlow = ai.defineFlow(
  {
    name: 'workoutSummaryFlow',
    inputSchema: WorkoutSummaryInputSchema,
    outputSchema: WorkoutSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
