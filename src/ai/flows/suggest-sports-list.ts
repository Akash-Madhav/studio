
'use server';
/**
 * @fileOverview A Genkit flow to generate a list of sports based on a query.
 * - suggestSportsList - A function that takes a partial sport name and returns a list of suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SportSuggestionInputSchema = z.string().describe("A partial or full name of a sport.");

const SportSuggestionOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested sport names that match the input query.'),
});
export type SportSuggestionOutput = z.infer<typeof SportSuggestionOutputSchema>;


export async function suggestSportsList(query: string): Promise<SportSuggestionOutput> {
  return sportSuggestionFlow(query);
}

const prompt = ai.definePrompt({
  name: 'sportSuggestionPrompt',
  input: { schema: SportSuggestionInputSchema },
  output: { schema: SportSuggestionOutputSchema },
  prompt: `You are a sports encyclopedia. Given the user's input, provide a list of up to 5 sports that match the query.

  User Input: {{{input}}}
  
  Provide only the list of sport names in your response.`,
});

const sportSuggestionFlow = ai.defineFlow(
  {
    name: 'sportSuggestionFlow',
    inputSchema: SportSuggestionInputSchema,
    outputSchema: SportSuggestionOutputSchema,
  },
  async (input) => {
    if (!input) {
      return { suggestions: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
