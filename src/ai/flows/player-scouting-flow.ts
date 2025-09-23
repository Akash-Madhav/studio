
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
import { googleAI } from '@genkit-ai/googleai';

const PlayerScoutingInputSchema = z.object({
  sport: z.string().describe('The sport the coach is scouting for.'),
  playersData: z.array(z.object({
    id: z.string(),
    name: z.string().describe('The name of the player.'),
    performanceData: z.string().describe("A summary of the player's performance data, including exercises and metrics."),
    userProfile: z.string().describe("A description of the player's profile, including age, experience, and goals."),
    physiqueAnalysis: z.string().optional().describe("The most recent AI-powered physique analysis for the player, including a summary and rating."),
  })).describe('An array of player data to analyze.')
});
export type PlayerScoutingInput = z.infer<typeof PlayerScoutingInputSchema>;

const PlayerScoutingOutputSchema = z.object({
  keyAttributesForSport: z.array(z.string()).describe('A list of the key physical attributes and skills the AI identified as crucial for the specified sport.'),
  recommendations: z.array(
    z.object({
      playerId: z.string().describe('The ID of the recommended player.'),
      playerName: z.string().describe('The name of the recommended player.'),
      suitabilityScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how suitable the player is for the sport, based on their performance data.'),
      analysis: z.string().describe('A brief analysis of the player\'s strengths and weaknesses for the sport, based on the key attributes.'),
      physiqueAssessment: z.object({
          score: z.number().min(0).max(100).describe('A score from 0-100 indicating how suitable the player\'s physique is for the sport.'),
          analysis: z.string().describe('A brief analysis of how the player\'s physique fits the demands of the sport.'),
      }).describe("An assessment of the player's physique in the context of the sport."),
      report: z.string().describe('A detailed report on why the player is a good fit, linking their specific workouts and physique to the demands of the sport, and identifying potential areas for development.'),
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
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an expert sports scout with deep knowledge of athletic performance and sport-specific physiologies. Your task is to analyze potential athletes for a {{{sport}}} team based on their workout history, profile, and physique analysis.

**Analysis Protocol:**

**Step 1: Define Key Attributes for the Sport**
First, identify and list the most crucial physical attributes and skills required to excel in **{{{sport}}}**. For example, for Basketball, this might include 'Explosive Power', 'Agility', 'Vertical Leap', and 'Lean Frame'.

**Step 2: Evaluate Each Player Against Key Attributes**
Analyze the following list of players. For each player, meticulously evaluate their performance data, profile, and physique analysis against the key attributes you defined in Step 1.

**Scoring Rubric (Crucial):**
-   **Performance Analysis & Suitability Score**: Your \`suitabilityScore\` must be evidence-based. Evaluate how the player's logged workouts (e.g., high squat weights, fast sprint times, long-distance runs) directly translate to the key attributes. The score should reflect how many key attributes are clearly demonstrated in their training data. A player with a history of heavy lifting and plyometrics is a better fit for Football (Raw Strength, Explosive Power) than a player who only logs long-distance runs.
-   **Physique Analysis & Assessment Score**: Your \`physiqueAssessment.score\` must be sport-specific. A high bodybuilding score is irrelevant for a marathon runner. Assess their build (e.g., lean, muscular, tall) and determine its suitability for the sport's demands. A tall, lean build is advantageous in Basketball, while a dense, powerful build is better for a Football lineman. The score should reflect how closely their physique matches the ideal for an elite athlete in that sport.

**Crucial Rule**: If a player's performance data or physique analysis is clearly insufficient for a meaningful assessment (e.g., "No workout data available" or "No physique data loaded"), you MUST assign a **suitability score of 0**. Your analysis and report must explicitly state that an assessment is not possible due to a lack of data. Do not speculate.

**Step 3: Generate Recommendations**
Based on your deep analysis using the scoring rubric, provide a comprehensive report for only the **top 3** most suitable players.
-   **Suitability Score**: A quantitative measure of their fit based on performance data.
-   **Physique Assessment**: A specific score and analysis for their physique's suitability for the sport.
-   **Analysis**: A brief summary of their strengths and weaknesses.
-   **Report**: A detailed report explaining *why* their training and physique make them a good candidate. Synthesize your findings from the scoring rubric, connecting the dots between their workouts, their build, and the demands of the sport.

**Player Data:**
{{#each playersData}}
-   **Player ID**: {{this.id}}
    -   **Name**: {{this.name}}
    -   **Profile**: {{this.userProfile}}
    -   **Performance Data**: {{this.performanceData}}
    -   **Physique Analysis**: {{this.physiqueAnalysis}}
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
