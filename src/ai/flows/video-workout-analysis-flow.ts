
'use server';
/**
 * @fileOverview An AI flow to analyze a workout video and extract performance data.
 *
 * - analyzeWorkoutVideo - A function that takes a video data URI and returns recognized workout data.
 * - VideoAnalysisInput - The input type for the analyzeWorkoutVideo function.
 * - VideoAnalysisOutput - The return type for the analyzeWorkoutVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const VideoAnalysisInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a workout, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type VideoAnalysisInput = z.infer<typeof VideoAnalysisInputSchema>;

const VideoAnalysisOutputSchema = z.object({
    exercise: z.string().describe("The name of the exercise performed in the video."),
    reps: z.number().int().optional().describe("The number of repetitions completed."),
    weight: z.number().optional().describe("The weight used for the exercise, in kilograms."),
    time: z.string().optional().describe("The duration of the exercise, if relevant (e.g., for a plank)."),
    distance: z.number().optional().describe("The distance covered, if relevant (e.g., for running)."),
    accuracy: z.object({
        score: z.number().int().min(0).max(100).describe("An accuracy score from 0-100 for the rep count analysis."),
        justification: z.string().describe("A brief justification for the accuracy score, noting any challenges like camera angle, lighting, or partial reps."),
    }).describe("An assessment of the analysis accuracy.")
});
export type VideoAnalysisOutput = z.infer<typeof VideoAnalysisOutputSchema>;

export async function analyzeWorkoutVideo(input: VideoAnalysisInput): Promise<VideoAnalysisOutput> {
  return videoWorkoutAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'videoWorkoutAnalysisPrompt',
  input: {schema: VideoAnalysisInputSchema},
  output: {schema: VideoAnalysisOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  config: {
    temperature: 0,
  },
  prompt: `You are a world-class kinesiologist and elite fitness coach. Your task is to perform a highly accurate analysis of a workout video with a primary objective of achieving over 85% accuracy in rep counting.

  **Analysis Protocol - Repetition Counting with Strict Scrutiny:**

  1.  **Identify the Exercise:** First, precisely identify the primary exercise being performed (e.g., "Barbell Bench Press", "Dumbbell Bicep Curl", "Bodyweight Squat").

  2.  **Deconstruct the Repetition:** For the identified exercise, you must break down a single valid repetition into its two biomechanical phases:
      *   **Eccentric Phase:** The "lowering" or "negative" portion of the movement where the muscle lengthens under tension (e.g., lowering the bar to the chest in a bench press).
      *   **Concentric Phase:** The "lifting" or "positive" portion of the movement where the muscle shortens to produce force (e.g., pressing the bar up from the chest).

  3.  **Define Full Range of Motion (ROM):** Analyze the video on a near frame-by-frame basis to establish the start and end points for both the eccentric and concentric phases.
      *   A rep is only counted if it completes a **full eccentric phase** immediately followed by a **full concentric phase**.
      *   **Crucially, do NOT count partial reps.** If the user fails to complete the full range of motion for either phase (e.g., not going low enough on a squat, or not fully extending on a bicep curl), that rep is invalid and must be discarded.

  4.  **Count Valid Reps:** Meticulously count only the repetitions that meet the strict criteria defined above. Be conservative; if a rep is ambiguous, poorly executed, or does not meet the full ROM standard, it does not count.

  5.  **Quantify Other Metrics:**
      *   If weights are visible (plates on a barbell, dumbbells), estimate the total weight in kilograms.
      *   If the exercise is timed (like a plank), estimate the duration.
      *   If it involves distance (like running), estimate the distance.

  6.  **Assess Accuracy:**
      *   Provide an accuracy score (0-100) for your rep count analysis.
      *   Justify this score by mentioning factors like camera angle, video clarity, lighting, or if the user performed partial reps that you correctly identified and did not count.

  Fill in all relevant fields in the specified output format based on your strict analysis.

  Video to analyze:
  {{media url=videoDataUri}}
  `,
});

const videoWorkoutAnalysisFlow = ai.defineFlow(
  {
    name: 'videoWorkoutAnalysisFlow',
    inputSchema: VideoAnalysisInputSchema,
    outputSchema: VideoAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
