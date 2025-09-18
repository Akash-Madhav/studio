
'use server';
/**
 * @fileOverview A Genkit flow to generate a summary of workout accomplishments and physique status.
 * - generateWorkoutSummary - A function that takes workout history and physique data and returns a summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const WorkoutSummaryInputSchema = z.object({
    workoutHistory: z.string().describe("A formatted string of the user's entire workout history, with each entry on a new line."),
    physiqueAnalysis: z.string().optional().describe("The user's most recent physique analysis, including a summary and rating."),
});
export type WorkoutSummaryInput = z.infer<typeof WorkoutSummaryInputSchema>;

const WorkoutSummaryOutputSchema = z.string().describe("A motivational and insightful summary of the user's workout accomplishments and physique, highlighting progress, personal bests, and consistency.");

export async function generateWorkoutSummary(input: WorkoutSummaryInput): Promise<string> {
  return workoutSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutSummaryPrompt',
  input: { schema: WorkoutSummaryInputSchema },
  output: { schema: WorkoutSummaryOutputSchema },
  prompt: `You are a highly motivational fitness coach. Your task is to analyze a user's entire workout history and their latest physique analysis to write an inspiring summary of their accomplishments and current status.

**Analysis Protocol:**
1.  **Synthesize Data:** Read both the Workout History and the Physique Analysis.
2.  **Connect Work to Results:** Create a narrative that connects the hard work in their training log to the physical results described in the physique analysis. For example, if they lift heavy and their physique analysis mentions good muscle development, highlight that connection.
3.  **Celebrate Accomplishments:** Focus on:
    -   **Progress Over Time:** Identify trends in their workouts (e.g., increasing weights).
    -   **Personal Bests:** Point out their most impressive lifts or times.
    -   **Consistency:** Acknowledge their dedication.
    -   **Physique Strengths:** Mention the positive aspects from their physique analysis.
4.  **Motivate for the Future:** Conclude with an encouraging statement that looks forward, perhaps suggesting they can improve on areas mentioned in the physique analysis.

The tone should be positive, encouraging, and celebratory. Frame their journey as a story of achievement.

**Workout History:**
{{{workoutHistory}}}

**Most Recent Physique Analysis:**
{{#if physiqueAnalysis}}
{{{physiqueAnalysis}}}
{{else}}
No physique analysis available. Focus the summary on the workout history.
{{/if}}

Generate a single, detailed paragraph summarizing their journey and accomplishments based on all available data.`,
});

const workoutSummaryFlow = ai.defineFlow(
  {
    name: 'workoutSummaryFlow',
    inputSchema: WorkoutSummaryInputSchema,
    outputSchema: WorkoutSummaryOutputSchema,
  },
  async (input) => {
    // This check ensures we don't call the AI with empty data, which can cause it to return null.
    if (!input.workoutHistory || input.workoutHistory.trim() === "") {
        return "No workout history available to summarize. Please log some workouts first!";
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
