'use server';
/**
 * @fileOverview An AI-driven insights flow for fitness performance data.
 *
 * - getFitnessInsights - A function that processes fitness data and returns insights.
 * - FitnessInsightsInput - The input type for the getFitnessInsights function.
 * - FitnessInsightsOutput - The return type for the getFitnessInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FitnessInsightsInputSchema = z.object({
  exerciseType: z.string().describe('The type of exercise performed (e.g., running, weightlifting).'),
  metrics: z.record(z.string(), z.number()).describe('A record of performance metrics for the exercise. Keys represent the metric name and values represent the value recorded.'),
  userProfile: z.string().optional().describe('Optional information about the user profile, fitness goals, or any relevant context.'),
});
export type FitnessInsightsInput = z.infer<typeof FitnessInsightsInputSchema>;

const FitnessInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the user performance data.'),
  strengths: z.string().describe('Identified strengths based on the performance data.'),
  weaknesses: z.string().describe('Identified weaknesses or areas for improvement based on the performance data.'),
  recommendations: z.string().describe('Personalized recommendations for improving performance.'),
});
export type FitnessInsightsOutput = z.infer<typeof FitnessInsightsOutputSchema>;

export async function getFitnessInsights(input: FitnessInsightsInput): Promise<FitnessInsightsOutput> {
  return fitnessInsightsFlow(input);
}

const fitnessInsightsPrompt = ai.definePrompt({
  name: 'fitnessInsightsPrompt',
  input: {schema: FitnessInsightsInputSchema},
  output: {schema: FitnessInsightsOutputSchema},
  prompt: `You are a fitness expert analyzing user performance data to provide insights and recommendations.

  Analyze the following performance data for the exercise type: {{{exerciseType}}}.
  Metrics:
  {{#each (keys metrics)}}
    - {{this}}: {{lookup ../metrics this}}
  {{/each}}

  {{#if userProfile}}
  Consider the following user profile information: {{{userProfile}}}
  {{/if}}

  Provide a summary of the user's performance, highlight their strengths and weaknesses, and offer personalized recommendations for improvement.
  Make sure to be as specific as possible, referencing the specific metrics provided.

  Follow the FitnessInsightsOutputSchema to generate the output in a structured format.
  `,
});

const fitnessInsightsFlow = ai.defineFlow(
  {
    name: 'fitnessInsightsFlow',
    inputSchema: FitnessInsightsInputSchema,
    outputSchema: FitnessInsightsOutputSchema,
  },
  async input => {
    const {output} = await fitnessInsightsPrompt(input);
    return output!;
  }
);
