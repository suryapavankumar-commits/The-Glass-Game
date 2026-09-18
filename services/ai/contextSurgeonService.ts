import { z } from 'zod';
import { generateValidatedJson } from './aiProvider';
import { CanonicalFact, ContextSurgery } from '@/types';

export const ContextSurgeonSchema = z.object({
  isValid: z.boolean().describe("False if there is a contradiction or unsupported conspiracy, True if perfectly aligned with facts"),
  contradictionDetails: z.string().optional().describe("Explanation of the contradiction or unsupported claim (only if isValid is false)"),
  repairedContext: z.string().optional().describe("The corrected narrative, changing the claim to an 'unverified rumor' or rejecting it (only if isValid is false)"),
});

export async function performContextSurgery(
  situation: string,
  claims: string[],
  canonicalFacts: CanonicalFact[]
): Promise<ContextSurgery> {
  const systemPrompt = `You are the Context Surgeon for The Glass Game.
Your job is to protect Canonical Memory from Game Master hallucinations.
You will be provided the Game Master's situation and claims, and the Canonical Facts from Firebase.

If the claims contradict the facts OR introduce unsupported conspiracies between characters without prior factual basis, you must flag isValid: false.
You must then output 'contradictionDetails' explaining the issue.
Crucially, you must output 'repairedContext', which is the Game Master's situation rewritten to frame the hallucination as an unverified rumor, allegation, or uncertainty, preserving the established facts. NEVER silently rewrite established history.
If everything aligns perfectly with facts, output isValid: true.`;

  const userPrompt = `
Canonical Facts:
${canonicalFacts.length > 0 ? canonicalFacts.map(f => `- [Turn ${f.establishedInTurn}] ${f.fact}`).join('\n') : 'No canonical facts established yet.'}

Game Master Situation:
${situation}

Game Master Claims:
${claims.map(c => `- ${c}`).join('\n')}
`;

  return generateValidatedJson(systemPrompt, userPrompt, ContextSurgeonSchema, 'groq');
}
