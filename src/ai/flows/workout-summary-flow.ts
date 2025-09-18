
'use server';
/**
 * @fileOverview A Genkit flow to generate a summary of workout accomplishments.
 * - generateWorkoutSummary - A function that takes a workout history string and returns a summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WorkoutHistoryInputSchema = z.string().describe("A formatted string of the user's entire workout history, with each entry on a new line.");
const WorkoutSummaryOutputSchema = z.string().describe("A motivational and insightful summary of the user's workout accomplishments, highlighting progress, personal bests, and consistency.");

export async function generateWorkoutSummary(workoutHistory: string): Promise<string> {
  return workoutSummaryFlow(workoutHistory);
}

const prompt = ai.definePrompt({
  name: 'workoutSummaryPrompt',
  input: { schema: WorkoutHistoryInputSchema },
  output: { schema: WorkoutSummaryOutputSchema },
  prompt: `You are a highly motivational fitness coach. Your task is to analyze a user's entire workout history and write an inspiring summary of their accomplishments.

Focus on:
-   **Progress Over Time:** Identify trends, like increases in weight lifted or distance covered.
-   **Personal Bests:** Point out their most impressive lifts or fastest times.
-   **Consistency and Dedication:** Acknowledge their commitment based on the frequency of their workouts.
-   **Variety:** Comment on the range of exercises they perform.

The tone should be positive, encouraging, and celebratory. Frame their hard work as a story of achievement.

**Workout History:**
{{{input}}}

Generate a single, detailed paragraph summarizing their journey and accomplishments.`,
});

const workoutSummaryFlow = ai.defineFlow(
  {
    name: 'workoutSummaryFlow',
    inputSchema: WorkoutHistoryInputSchema,
    outputSchema: WorkoutSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
