
'use server';
/**
 * @fileOverview A Genkit flow to generate a creative team name.
 * - generateTeamName - A function that takes a coach's name and returns a team name.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TeamNameInputSchema = z.string().describe("The name of the coach.");
const TeamNameOutputSchema = z.string().describe("A creative and fun team name based on the coach's name.");

export async function generateTeamName(coachName: string): Promise<string> {
  return teamNameFlow(coachName);
}

const prompt = ai.definePrompt({
  name: 'teamNamePrompt',
  input: { schema: TeamNameInputSchema },
  output: { schema: TeamNameOutputSchema },
  prompt: `You are a creative assistant tasked with coming up with a fun, alliterative, or punny team name for a sports team. The team is led by a coach named {{{input}}}.

  Generate a single, catchy team name. For example, if the coach's name is "Davis", you could suggest "Davis's Dynamos" or "The Davis Destroyers".

  Coach's Name: {{{input}}}
  
  Provide only the team name in your response.`,
});

const teamNameFlow = ai.defineFlow(
  {
    name: 'teamNameFlow',
    inputSchema: TeamNameInputSchema,
    outputSchema: TeamNameOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
