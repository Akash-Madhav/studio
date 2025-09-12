
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
    name: z.string().describe('The name of the player.'),
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
  prompt: `You are an expert sports scout specializing in {{{sport}}}. Your task is to analyze potential athletes based on their workout history and profile to find the best fits for a team.

  A coach is looking for players for the sport: {{{sport}}}.

  Analyze the following list of players. For each player, evaluate how their logged performance data (e.g., strength training, cardio, specific exercises) translates to the physical demands and key skills required for {{{sport}}}.
  
  - For strength-based sports like Football or Powerlifting, look for high weight numbers in exercises like squats and deadlifts.
  - For endurance sports like Soccer or long-distance running, look for long workout durations or high distances.
  - For sports requiring explosive power like Basketball or Volleyball, consider exercises that build vertical jump and agility.

  Based on this deep analysis, provide a suitability score (0-100), a brief analysis of their strengths and weaknesses, and a detailed report explaining *why* their specific training regimen makes them a good or poor candidate for {{{sport}}}.

  Players:
  {{#each playersData}}
  - Player ID: {{this.id}}
    - Name: {{this.name}}
    - Profile: {{this.userProfile}}
    - Performance Data: {{this.performanceData}}
  {{/each}}

  Recommend the top 3 most suitable players. Your response should be based on the provided data and tailored to the demands of the sport of {{{sport}}}.`,
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
