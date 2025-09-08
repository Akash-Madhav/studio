
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
  prompt: `You are an expert fitness coach. Your task is to analyze a workout video with high accuracy.

  1.  **Identify the Exercise:** First, identify the primary exercise being performed (e.g., "Bench Press", "Squat").
  2.  **Count Reps:** Meticulously count only the repetitions that complete a full range of motion. Do not count partial reps.
  3.  **Quantify Other Metrics:** If possible, estimate the weight used (in kg), the duration of the exercise, or the distance covered.
  4.  **Assess Accuracy:** Provide an accuracy score (0-100) for your analysis and briefly justify it, mentioning any factors like camera angle or video clarity.

  Fill in all relevant fields in the specified output format based on your analysis.

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
