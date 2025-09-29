
'use server';
/**
 * @fileOverview An AI flow to analyze a workout video and extract performance data.
 *
 * - analyzeWorkoutVideo - A function that takes a video data URI and returns recognized workout data.
 * - VideoAnalysisInput - The input type for the analyzeWorkoutVideo function.
 * - VideoAnalysisOutput - The return type for the analyzeWorkoutVideo function.
 */

import {workoutAI} from '@/ai/genkit';
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

const prompt = workoutAI.definePrompt({
  name: 'videoWorkoutAnalysisPrompt',
  input: {schema: VideoAnalysisInputSchema},
  output: {schema: VideoAnalysisOutputSchema},
  model: googleAI.model('gemini-2.5-flash'),
  config: {
    temperature: 0,
  },
  prompt: `You are an expert kinesiologist and fitness coach. Your primary task is to analyze a workout video with the highest degree of accuracy possible.

Analyze the video to determine the exercise and performance metrics. Your rep count must be extremely precise.

**Repetition Counting Protocol:**
1.  **Identify Phases:** For each repetition, you must identify two distinct phases:
    -   **Eccentric Phase:** The "negative" or lowering part of the movement, where the muscle lengthens under tension.
    -   **Concentric Phase:** The "positive" or lifting part of the movement, where the muscle shortens to produce force.
2.  **Full Range of Motion (ROM) Criteria:** A single, valid repetition consists of one complete eccentric phase immediately followed by one complete concentric phase, returning the body or weight to the starting position.
3.  **Strictly No Partial Reps:** Do NOT count any movement that does not complete the full range of motion for both phases. If the user stops short, adjusts, or fails a rep, it does not count.
4.  **Quantify Metrics:** Based on your analysis, provide the exercise name, the final count of *valid* reps, and estimate other metrics like weight (in kg) if possible.
5.  **Assess Accuracy:** Provide an accuracy score (0-100) for your analysis and a brief justification, mentioning any factors like camera angle, video clarity, or movement quality that influenced your confidence.

Fill in all relevant fields in the specified output format based on your analysis.

Video to analyze:
{{media url=videoDataUri}}
  `,
});

const videoWorkoutAnalysisFlow = workoutAI.defineFlow(
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
