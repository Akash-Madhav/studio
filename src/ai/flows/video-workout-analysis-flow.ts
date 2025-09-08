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

const VideoAnalysisInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a workout, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VideoAnalysisInput = z.infer<typeof VideoAnalysisInputSchema>;

const VideoAnalysisOutputSchema = z.object({
    exercise: z.string().describe("The name of the exercise performed in the video."),
    reps: z.number().int().optional().describe("The number of repetitions completed."),
    weight: z.number().optional().describe("The weight used for the exercise, in kilograms."),
    time: z.string().optional().describe("The duration of the exercise, if relevant (e.g., for a plank)."),
    distance: z.number().optional().describe("The distance covered, if relevant (e.g., for running)."),
});
export type VideoAnalysisOutput = z.infer<typeof VideoAnalysisOutputSchema>;

export async function analyzeWorkoutVideo(input: VideoAnalysisInput): Promise<VideoAnalysisOutput> {
  return videoWorkoutAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'videoWorkoutAnalysisPrompt',
  input: {schema: VideoAnalysisInputSchema},
  output: {schema: VideoAnalysisOutputSchema},
  config: {
    temperature: 0,
  },
  prompt: `You are a world-class fitness coach and kinesiology expert.
  Analyze the provided workout video to identify the exercise being performed and quantify the performance.

  Your tasks are:
  1.  Identify the primary exercise (e.g., "Bench Press", "Squat", "Deadlift", "Running").
  2.  Count the number of successful repetitions (reps). A rep is a full, complete range of motion.
  3.  If weights are visible (e.g., plates on a barbell, dumbbells), estimate the total weight in kilograms.
  4.  If the exercise is timed (like a plank or run), estimate the duration.
  5.  If the exercise involves distance (like running), estimate the distance in kilometers.

  Fill in only the relevant fields for the identified exercise. For example, a "Bench Press" will have reps and weight, but not time or distance. A "Plank" will have time but not reps.

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
