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

const PhysiqueAnalysisOutputSchema = z.object({
    summary: z.string().describe("A concise, paragraph-long summary of the user's physique, highlighting overall development, symmetry, strengths, and areas for improvement."),
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
2.  **Formulate a Summary:** Based on your analysis, generate a single, concise paragraph summarizing the user's overall physique. The summary should cover:
    -   Overall muscular development.
    -   Key strengths (most developed muscle groups).
    -   Areas for improvement (least developed muscle groups).
    -   An assessment of their symmetry and proportion.

**Crucial Rule**: If the video is not of a human physique (e.g., it's a landscape, an object, or an animal), or if it is inappropriate, you must throw an error and refuse to analyze it.

Your final output must be structured precisely according to the PhysiqueAnalysisOutputSchema, providing only the summary.

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
