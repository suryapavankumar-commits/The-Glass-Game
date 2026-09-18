import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function generateValidatedJson<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  modelPreference: 'groq' | 'gemini' = 'groq'
): Promise<T> {
  let firstError: any = null;

  if (modelPreference === 'groq' && groq) {
    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile', // Defaulting to an available Groq model
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from Groq');
      
      const parsed = JSON.parse(content);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn('[AI] Groq failed, falling back to Gemini...', err);
      firstError = err;
    }
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const content = result.response.text();
      const parsed = JSON.parse(content);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err) {
      console.error('[AI] Gemini failed:', err);
      throw firstError || err;
    }
  }

  throw new Error('No AI providers configured or both failed.');
}
