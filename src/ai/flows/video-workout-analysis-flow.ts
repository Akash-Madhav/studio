
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
  prompt: `You are a world-class fitness coach and kinesiologist. Your task is to perform a highly accurate analysis of a workout video.

  **Primary Objective: Achieve high accuracy in rep counting.**

  **Analysis Protocol:**

  1.  **Identify the Exercise:** First, identify the primary exercise being performed (e.g., "Bench Press", "Squat", "Deadlift", "Bicep Curl").

  2.  **Define Full Range of Motion (ROM):** For the identified exercise, mentally establish the start and end points of a perfect repetition. A repetition is only valid if it includes a complete motion (e.g., bar to chest and back up for bench press).

  3.  **Repetition Counting - Strict Scrutiny:** Count only the successful repetitions that meet the following strict criteria:
      -   The rep must go through the full, established range of motion.
      -   Do NOT count partial reps.
      -   Be precise and conservative. If a rep is ambiguous or poorly executed, do not count it.

  4.  **Quantify Other Metrics:**
      -   If weights are visible (plates on a barbell, dumbbells), estimate the total weight in kilograms.
      -   If the exercise is timed (like a plank or run), estimate the duration.
      -   If the exercise involves distance (like running), estimate the distance in kilometers.

  5.  **Assess Accuracy:**
      -   After counting, provide an accuracy score (0-100) for your analysis.
      -   Justify the score. Mention factors that may have impacted accuracy, such as camera angle, lighting, video clarity, or if the user performed partial reps that were not counted.

  Fill in all the relevant fields for the identified exercise, including the accuracy assessment.

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

    