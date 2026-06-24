import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client safely on the server side
// The Gemini API key remains server-side only
const apiKey = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
