'use server';
/**
 * @fileOverview An AI flow to analyze a user's physique from a video.
 *
 * - analyzePhysique - A function that takes a video data URI and returns a detailed physique analysis.
 * - PhysiqueAnalysisInput - The input type for the analyzePhysique function.
 * - PhysiqueAnalysisOutput - The return type for the analyzePhysique function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const PhysiqueAnalysisInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a user's physique, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PhysiqueAnalysisInput = z.infer<typeof PhysiqueAnalysisInputSchema>;

const MuscleGroupRatingSchema = z.object({
    rating: z.number().min(1).max(10).describe("A rating from 1-10 on the development of the muscle group."),
    comment: z.string().describe("A brief comment on the muscle group's development, strengths, or weaknesses."),
});

const PhysiqueAnalysisOutputSchema = z.object({
    muscleGroups: z.object({
        chest: MuscleGroupRatingSchema,
        back: MuscleGroupRatingSchema,
        shoulders: MuscleGroupRatingSchema,
        biceps: MuscleGroupRatingSchema,
        triceps: MuscleGroupRatingSchema,
        quads: MuscleGroupRatingSchema,
        hamstrings: MuscleGroupRatingSchema,
        calves: MuscleGroupRatingSchema,
        abs: MuscleGroupRatingSchema,
    }).describe("Detailed ratings for individual muscle groups."),
    symmetry: z.object({
        rating: z.number().min(1).max(10).describe("A rating from 1-10 on the overall symmetry and proportion."),
        comment: z.string().describe("Comments on overall balance, proportion, and symmetry between muscle groups."),
    }).describe("Analysis of overall physique symmetry."),
    recommendations: z.array(z.string()).describe("A list of 3-5 specific, actionable recommendations for improving the physique, such as exercises to focus on or areas that need more attention."),
});
export type PhysiqueAnalysisOutput = z.infer<typeof PhysiqueAnalysisOutputSchema>;

export async function analyzePhysique(input: PhysiqueAnalysisInput): Promise<PhysiqueAnalysisOutput> {
  return physiqueAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'physiqueAnalysisPrompt',
  input: {schema: PhysiqueAnalysisInputSchema},
  output: {schema: PhysiqueAnalysisOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  config: {
    temperature: 0.2,
  },
  prompt: `You are an expert bodybuilding judge and fitness coach. Your task is to analyze the user's physique from the provided video. The user will likely pose to show different muscle groups.

**Analysis Protocol:**
1.  **Examine the Video:** Carefully analyze the entire video of the user's physique. Pay attention to different angles and poses.
2.  **Rate Muscle Groups:** For each major muscle group (Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Calves, Abs), provide a rating from 1 (underdeveloped) to 10 (exceptionally developed). Also, provide a brief, constructive comment on each group based on what you can see in the video.
3.  **Assess Symmetry:** Evaluate the overall balance and proportion of the physique. Rate the symmetry from 1 (very unbalanced) to 10 (perfectly symmetrical) and provide comments.
4.  **Provide Recommendations:** Based on your analysis, provide a list of 3-5 specific and actionable recommendations for improvement. These should target the weakest areas and suggest exercises or training principles.

**Crucial Rule**: If the video is not of a human physique (e.g., it's a landscape, an object, or an animal), or if it is inappropriate, you must throw an error and refuse to analyze it.

Your final output must be structured precisely according to the PhysiqueAnalysisOutputSchema.

Video to analyze:
{{media url=videoDataUri}}
  `,
});

const physiqueAnalysisFlow = ai.defineFlow(
  {
    name: 'physiqueAnalysisFlow',
    inputSchema: PhysiqueAnalysisInputSchema,
    outputSchema: PhysiqueAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
