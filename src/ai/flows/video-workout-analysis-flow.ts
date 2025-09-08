
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
  prompt: `You are a world-class fitness coach and kinesiologist with expertise in biomechanics. Your task is to perform a highly accurate analysis of a workout video.

  **Primary Objective: Achieve at least 85% accuracy in rep counting.**

  **Analysis Protocol:**

  1.  **Identify the Exercise:** First, identify the primary exercise being performed (e.g., "Bench Press", "Squat", "Deadlift", "Bicep Curl").

  2.  **Define Full Range of Motion (ROM):** For the identified exercise, mentally establish the start and end points of a perfect repetition.
      -   **Concentric Phase:** The muscle-shortening phase (e.g., pushing the bar up in a bench press).
      -   **Eccentric Phase:** The muscle-lengthening phase (e.g., lowering the bar to the chest).
      A repetition is only valid if it includes a complete concentric and eccentric phase.

  3.  **Repetition Counting - Strict Scrutiny:** Analyze the video frame-by-frame. Count only the successful repetitions that meet the following strict criteria:
      -   The rep must go through the full, established range of motion.
      -   Do NOT count partial reps (e.g., half-squats, not touching chest on bench press).
      -   Do NOT count reps with significant form breakdown or cheating.
      -   Be precise and conservative. If a rep is ambiguous or poorly executed, do not count it.

  4.  **Quantify Other Metrics:**
      -   If weights are visible (plates on a barbell, dumbbells), estimate the total weight in kilograms.
      -   If the exercise is timed (like a plank or run), estimate the duration.
      -   If the exercise involves distance (like running), estimate the distance in kilometers.

  Fill in only the relevant fields for the identified exercise.

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
