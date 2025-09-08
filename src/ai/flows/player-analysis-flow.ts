'use server';
/**
 * @fileOverview An AI-driven analysis flow for individual player performance for a coach.
 *
 * - getPlayerAnalysis - A function that processes a player's data and returns a coach-focused analysis.
 * - PlayerAnalysisInput - The input type for the getPlayerAnalysis function.
 * - PlayerAnalysisOutput - The return type for the getPlayerAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlayerAnalysisInputSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  userProfile: z.string().describe("A description of the player's profile, including age, experience, and goals."),
  performanceData: z.string().describe("A summary of the player's recent performance data, including exercises and metrics."),
});
export type PlayerAnalysisInput = z.infer<typeof PlayerAnalysisInputSchema>;

const PlayerAnalysisOutputSchema = z.object({
    summary: z.string().describe("A brief, overall summary of the player's current fitness level and recent activity."),
    strengths: z.string().describe("A bulleted or short list of the player's key athletic strengths observed from their data."),
    areasForImprovement: z.string().describe("A bulleted or short list of areas where the player could focus on developing further."),
});
export type PlayerAnalysisOutput = z.infer<typeof PlayerAnalysisOutputSchema>;


export async function getPlayerAnalysis(input: PlayerAnalysisInput): Promise<PlayerAnalysisOutput> {
  return playerAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playerAnalysisPrompt',
  input: {schema: PlayerAnalysisInputSchema},
  output: {schema: PlayerAnalysisOutputSchema},
  prompt: `You are an expert athletic coach providing a quick, insightful analysis of a player for another coach.
  
  Player Name: {{{playerName}}}
  Player Profile: {{{userProfile}}}
  Recent Performance Data: {{{performanceData}}}

  Based on the data provided, generate a concise and sophisticated analysis.
  - The summary should be a brief, high-level overview.
  - The strengths should highlight their most impressive athletic qualities.
  - The areas for improvement should identify the most impactful things they could work on.
  
  Keep the analysis professional, insightful, and straight to the point.
  `,
});

const playerAnalysisFlow = ai.defineFlow(
  {
    name: 'playerAnalysisFlow',
    inputSchema: PlayerAnalysisInputSchema,
    outputSchema: PlayerAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
