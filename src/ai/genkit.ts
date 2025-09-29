import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Default AI for general purpose tasks
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GENERAL_AI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

// Specialized AI for workout analysis
export const workoutAI = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.WORKOUT_AI_API_KEY,
    }),
  ],
});

// Specialized AI for player scouting
export const scoutAI = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.SCOUT_AI_API_KEY,
    }),
  ],
});

// Specialized AI for physique analysis
export const physiqueAI = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.PHYSIQUE_AI_API_KEY,
    }),
  ],
});
