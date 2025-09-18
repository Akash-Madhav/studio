
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

const WorkoutSummaryOutputSchema = z
  .string()
  .describe(
    "A motivational and insightful summary of the user's workout accomplishments and physique, highlighting progress, personal bests, and consistency."
  );
export type WorkoutSummaryInput = z.infer<typeof WorkoutSummaryInputSchema>;

export async function generateWorkoutSummary(
  input: WorkoutSummaryInput
): Promise<string> {
  return workoutSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutSummaryPrompt',
  input: {schema: WorkoutSummaryInputSchema},
  output: {schema: WorkoutSummaryOutputSchema},
  prompt: `You are a motivating fitness coach. Your task is to provide a concise, insightful, and encouraging summary of a user's recent progress based on their workout logs and, if available, their latest physique analysis.

**Analysis Protocol:**
1.  **Review Workout History:** Analyze the provided workout logs. Look for trends, improvements in weight or reps, consistency, and variety.
2.  **Incorporate Physique Analysis:** If a physique analysis is provided, connect it to the workout data. For example, if they've been lifting heavy and their physique summary notes improved muscularity, highlight that connection.
3.  **Synthesize and Motivate:** Combine your findings into a single, paragraph-long summary. Start with a positive affirmation, mention specific achievements, and end with an encouraging statement for their next steps.

**Crucial Rule:** If the workout history is empty, contains "No workouts logged yet," or is otherwise nonsensical, you MUST return the exact phrase: "No workout history available to summarize. Log some workouts to get started!" Do not try to invent a summary.

**User Data:**
-   **Workout History:** {{{workoutHistory}}}
-   **Latest Physique Analysis:** {{#if physiqueAnalysis}} {{{physiqueAnalysis}}} {{else}} Not available {{/if}}
`,
});

const workoutSummaryFlow = ai.defineFlow(
  {
    name: 'workoutSummaryFlow',
    inputSchema: WorkoutSummaryInputSchema,
    outputSchema: WorkoutSummaryOutputSchema,
  },
  async input => {
    // Pre-emptive check to prevent calling the AI with no data. This is the first line of defense.
    if (!input.workoutHistory || input.workoutHistory.trim() === '' || input.workoutHistory.includes("No workouts logged")) {
      return "No workout history available to summarize. Log some workouts to get started!";
    }
    
    const { output } = await prompt(input);

    // This is the definitive fail-safe. If the model returns null for any reason,
    // we return a valid string to prevent the schema validation error.
    return output || "Could not generate a summary at this time. Please try again later.";
  }
);
