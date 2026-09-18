import { z } from 'zod';
import { generateValidatedJson } from './aiProvider';
import { CanonicalFact } from '@/types';

export const SemanticRiskSchema = z.object({
  isSuspicious: z.boolean().describe("True if any claim is suspicious, unverified, introduces a conspiracy, or contradicts canonical facts"),
  reasoning: z.string().describe("Brief explanation of why the claims are suspicious or safe"),
});

export type SemanticRiskOutput = z.infer<typeof SemanticRiskSchema>;

export async function checkSemanticRisk(claims: string[], canonicalFacts: CanonicalFact[]): Promise<SemanticRiskOutput> {
  if (claims.length === 0) {
    return { isSuspicious: false, reasoning: "No claims to evaluate." };
  }

  const systemPrompt = `You are a fast semantic risk classifier. 
You will be given a list of narrative claims and a list of established canonical facts.
Your job is to determine if ANY of the claims are suspicious.
A claim is suspicious if it:
1. Contradicts a canonical fact.
2. Introduces a conspiracy, betrayal, or secret communication.
3. Makes a highly risky narrative leap that lacks evidence.

If it is suspicious, return isSuspicious: true. Otherwise, false.`;

  const userPrompt = `
Canonical Facts:
${canonicalFacts.map(f => `- [Turn ${f.establishedInTurn}] ${f.fact}`).join('\n')}

Narrative Claims to evaluate:
${claims.map(c => `- ${c}`).join('\n')}
`;

  // We can use groq for fast classification
  return generateValidatedJson(systemPrompt, userPrompt, SemanticRiskSchema, 'groq');
}
