'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting sports based on user performance data and preferences.
 *
 * @fileOverview
 * - `suggestSports`: An async function that takes user data and returns a list of suggested sports.
 * - `SportSuggestionInput`: The input type for the suggestSports function, including performance metrics and user preferences.
 * - `SportSuggestionOutput`: The output type for the suggestSports function, providing a list of suggested sports with reasons.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SportSuggestionInputSchema = z.object({
  performanceData: z
    .string()
    .describe('A summary of the user performance data, including exercises and metrics.'),
  userPreferences: z
    .string()
    .describe('A description of the user preferences, including preferred activities and goals.'),
});
export type SportSuggestionInput = z.infer<typeof SportSuggestionInputSchema>;

const SportSuggestionOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      sport: z.string().describe('The name of the suggested sport.'),
      reason: z.string().describe('The reason why this sport is suggested.'),
    })
  ).describe('A list of suggested sports with reasons.'),
});
export type SportSuggestionOutput = z.infer<typeof SportSuggestionOutputSchema>;

export async function suggestSports(input: SportSuggestionInput): Promise<SportSuggestionOutput> {
  return suggestSportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sportSuggestionPrompt',
  input: {schema: SportSuggestionInputSchema},
  output: {schema: SportSuggestionOutputSchema},
  prompt: `You are an expert fitness advisor. Based on the user's performance data and preferences, suggest a list of sports that the user might be suited for.

User Performance Data: {{{performanceData}}}
User Preferences: {{{userPreferences}}}

Provide a list of suggested sports with reasons why each sport is suitable for the user.`,
});

const suggestSportsFlow = ai.defineFlow(
  {
    name: 'suggestSportsFlow',
    inputSchema: SportSuggestionInputSchema,
    outputSchema: SportSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
