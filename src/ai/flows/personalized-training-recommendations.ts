
'use server';
/**
 * @fileOverview Personalized training recommendations flow.
 *
 * This flow generates personalized training recommendations based on user fitness goals and tracked performance data.
 * It takes fitness goals and performance data as input and returns a summary and tailored suggestions.
 *
 * @file            src/ai/flows/personalized-training-recommendations.ts
 * @exports       generatePersonalizedRecommendations - Function to generate personalized training recommendations.
 * @exports       PersonalizedTrainingRecommendationsInput - Input type for the personalized training recommendations flow.
 * @exports       PersonalizedTrainingRecommendationsOutput - Output type for the personalized training recommendations flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedTrainingRecommendationsInputSchema = z.object({
  fitnessGoals: z
    .string()
    .describe('The user fitness goals, e.g., weight loss, muscle gain, endurance.'),
  performanceData: z
    .string()
    .describe(
      'The user performance data, including exercises, reps, weight, time, distance, etc.'
    ),
});
export type PersonalizedTrainingRecommendationsInput = z.infer<
  typeof PersonalizedTrainingRecommendationsInputSchema
>;

const PersonalizedTrainingRecommendationsOutputSchema = z.object({
  summary: z.string().describe('A summary of the user performance data.'),
  suggestions: z
    .string()
    .describe(
`Personalized training suggestions tailored to the user fitness goals.`
    ),
});
export type PersonalizedTrainingRecommendationsOutput = z.infer<
  typeof PersonalizedTrainingRecommendationsOutputSchema
>;

export async function generatePersonalizedRecommendations(
  input: PersonalizedTrainingRecommendationsInput
): Promise<PersonalizedTrainingRecommendationsOutput> {
  return personalizedTrainingRecommendationsFlow(input);
}

const personalizedTrainingRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedTrainingRecommendationsPrompt',
  input: {schema: PersonalizedTrainingRecommendationsInputSchema},
  output: {schema: PersonalizedTrainingRecommendationsOutputSchema},
  prompt: `You are a personal fitness trainer. Analyze the user's fitness goals and performance data to provide a summary and personalized training suggestions.

Fitness Goals: {{{fitnessGoals}}}
Performance Data: {{{performanceData}}}

Summary:
Suggestions: `,
});

const personalizedTrainingRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedTrainingRecommendationsFlow',
    inputSchema: PersonalizedTrainingRecommendationsInputSchema,
    outputSchema: PersonalizedTrainingRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await personalizedTrainingRecommendationsPrompt(input);
    return output!;
  }
);
