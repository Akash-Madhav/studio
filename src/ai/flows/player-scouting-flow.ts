'use server';
/**
 * @fileOverview A player scouting AI agent for coaches.
 *
 * - getPlayerRecommendations - A function that handles the player scouting process.
 * - PlayerScoutingInput - The input type for the getPlayerRecommendations function.
 * - PlayerScoutingOutput - The return type for the getPlayerRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlayerScoutingInputSchema = z.object({
  sport: z.string().describe('The sport the coach is scouting for.'),
  playersData: z.array(z.object({
    id: z.string(),
    performanceData: z.string().describe("A summary of the player's performance data, including exercises and metrics."),
    userProfile: z.string().describe("A description of the player's profile, including age, experience, and goals."),
  })).describe('An array of player data to analyze.')
});
export type PlayerScoutingInput = z.infer<typeof PlayerScoutingInputSchema>;

const PlayerScoutingOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      playerId: z.string().describe('The ID of the recommended player.'),
      playerName: z.string().describe('The name of the recommended player.'),
      suitabilityScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how suitable the player is for the sport.'),
      analysis: z.string().describe('A brief analysis of the player\'s strengths and weaknesses for the sport.'),
      report: z.string().describe('A detailed report on why the player is a good fit and potential areas for development.'),
    })
  ).describe('A list of recommended players with analysis and reports.'),
});
export type PlayerScoutingOutput = z.infer<typeof PlayerScoutingOutputSchema>;


export async function getPlayerRecommendations(input: PlayerScoutingInput): Promise<PlayerScoutingOutput> {
  return playerScoutingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playerScoutingPrompt',
  input: {schema: PlayerScoutingInputSchema},
  output: {schema: PlayerScoutingOutputSchema},
  prompt: `You are an expert sports scout. A coach is looking for players for the sport: {{{sport}}}.

  Analyze the following list of players and their performance data. For each player, provide a suitability score (0-100), a brief analysis of their strengths and weaknesses for the specified sport, and a detailed report.

  Players:
  {{#each playersData}}
  - Player ID: {{this.id}}
    - Profile: {{this.userProfile}}
    - Performance Data: {{this.performanceData}}
  {{/each}}

  Recommend the top 3 most suitable players. Your response should be based on the provided data and tailored to the demands of the sport of {{{sport}}}.
  Provide a playerName for each player, you can just use "Player" and their ID.`,
});


const playerScoutingFlow = ai.defineFlow(
  {
    name: 'playerScoutingFlow',
    inputSchema: PlayerScoutingInputSchema,
    outputSchema: PlayerScoutingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
