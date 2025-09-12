
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
  keyAttributesForSport: z.array(z.string()).describe('A list of the key physical attributes and skills the AI identified as crucial for the specified sport.'),
  recommendations: z.array(
    z.object({
      playerId: z.string().describe('The ID of the recommended player.'),
      playerName: z.string().describe('The name of the recommended player.'),
      suitabilityScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how suitable the player is for the sport.'),
      analysis: z.string().describe('A brief analysis of the player\'s strengths and weaknesses for the sport, based on the key attributes.'),
      report: z.string().describe('A detailed report on why the player is a good fit, linking their specific workouts to the demands of the sport, and identifying potential areas for development.'),
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
  prompt: `You are an expert sports scout with deep knowledge of athletic performance. Your task is to analyze potential athletes for a {{{sport}}} team based on their workout history and profile.

**Analysis Protocol:**

**Step 1: Define Key Attributes for the Sport**
First, identify and list the most crucial physical attributes and skills required to excel in **{{{sport}}}**. For example, for Basketball, this might include 'Explosive Power', 'Agility', 'Vertical Leap', and 'Cardiovascular Endurance'.

**Step 2: Evaluate Each Player Against Key Attributes**
Analyze the following list of players. For each player, meticulously evaluate how their logged performance data and profile information translate to the key attributes you defined for **{{{sport}}}**. Be specific.
-   If scouting for Football (American), a high squat and bench press weight in their performance data directly indicates 'Raw Strength'.
-   If scouting for Marathon Running, consistent long-distance runs or long cardio sessions indicate 'High Endurance'.
-   If scouting for Volleyball, exercises like box jumps or plyometrics suggest 'Explosive Vertical Power'.

**Crucial Rule**: If a player's performance data or user profile is insufficient for a meaningful analysis (e.g., "No recent workouts" or "No profile information available"), you MUST assign a **suitability score of 0**. Your analysis and report should state that an assessment is not possible due to a lack of data. Do not speculate.

**Step 3: Generate Recommendations**
Based on your deep analysis, provide a suitability score (0-100) and a detailed report for only the **top 3** most suitable players.
-   **Suitability Score**: A quantitative measure of their fit.
-   **Analysis**: A brief summary of their strengths and weaknesses against the key attributes.
-   **Report**: Explain *why* their specific training regimen makes them a good candidate. Connect the dots between their workouts (e.g., "His 140kg deadlift...") and the demands of the sport (e.g., "...provides the foundational strength needed for a defensive lineman."). Also mention their potential for development.

**Player Data:**
{{#each playersData}}
-   **Player ID**: {{this.id}}
    -   **Name**: {{this.name}}
    -   **Profile**: {{this.userProfile}}
    -   **Performance Data**: {{this.performanceData}}
{{/each}}

Your final output must be structured according to the PlayerScoutingOutputSchema. Begin by listing the key attributes you identified for {{{sport}}}.`,
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
