
'use server';
/**
 * @fileOverview A Genkit flow to generate a workout summary.
 * - generateWorkoutSummary - A function that takes workout history and physique analysis and returns a summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutSummaryInputSchema = z.object({
  workoutHistory: z
    .string()
    .describe('A string containing the recent workout history of the user.'),
  physiqueAnalysis: z
    .string()
    .optional()
    .describe('The most recent physique analysis summary for the user.'),
});
export type WorkoutSummaryInput = z.infer<typeof WorkoutSummaryInputSchema>;

const WorkoutSummaryOutputSchema = z.object({
    summary: z.string().describe("A motivational and insightful summary of the user's workout accomplishments and physique, highlighting progress, personal bests, and consistency. If the workout history is empty or nonsensical, this should be 'No workout history available to summarize. Log some workouts to get started!'")
});
export type WorkoutSummaryOutput = z.infer<typeof WorkoutSummaryOutputSchema>;


export async function generateWorkoutSummary(
  input: WorkoutSummaryInput
): Promise<WorkoutSummaryOutput> {
  // Pre-emptive check to prevent calling the AI with no data.
  if (!input.workoutHistory || input.workoutHistory.trim() === '' || input.workoutHistory.includes("No workouts logged")) {
    return { summary: "No workout history available to summarize. Log some workouts to get started!" };
  }
  return workoutSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutSummaryPrompt',
  input: {schema: WorkoutSummaryInputSchema},
  output: {schema: WorkoutSummaryOutputSchema},
  prompt: `You are a motivating fitness coach. Your task is to provide a concise, insightful, and encouraging summary of a user's recent progress based on their provided data.

**Analysis Protocol:**
1.  **Review Workout History:** Analyze the provided workout logs. Look for trends, improvements in weight or reps, consistency, and variety.
2.  **Incorporate Physique Analysis:** If a physique analysis is provided, connect it to the workout data. For example, if they've been lifting heavy and their physique summary notes improved muscularity, highlight that connection.
3.  **Synthesize and Motivate:** Combine your findings into a single, paragraph-long summary. Start with a positive affirmation, mention specific achievements, and end with an encouraging statement for their next steps.

**Crucial Rule:** If the workout history is empty, contains "No workouts logged yet," or is otherwise nonsensical, you MUST set the summary to the exact phrase: "No workout history available to summarize. Log some workouts to get started!" Do not try to invent a summary.

**User Data:**
- Workout History: {{{workoutHistory}}}
- Latest Physique Analysis: {{{physiqueAnalysis}}}
`,
});

const workoutSummaryFlow = ai.defineFlow(
  {
    name: 'workoutSummaryFlow',
    inputSchema: WorkoutSummaryInputSchema,
    outputSchema: WorkoutSummaryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    // Final fail-safe to prevent null from ever being returned.
    return output || { summary: "Could not generate a summary at this time. Please try again later."};
  }
);
