import { z } from 'zod';
import { generateValidatedJson } from './aiProvider';
import { CommanderDecision, RoomPlayer } from '@/types';

export const CommanderDecisionSchema = z.object({
  narrative: z.string().describe("Commander Vale's internal monologue or global reaction to the situation"),
  globalOrders: z.string().describe("What Vale announces to the entire Citadel"),
  playerOrders: z.record(z.string(), z.string()).describe("A map of playerId to their specific private order/objective"),
});

export async function generateCommanderDecision(
  situation: string,
  players: RoomPlayer[]
): Promise<CommanderDecision> {
  const systemPrompt = `You are Commander Vale, the authoritative leader of the Citadel in The Glass Game.
You have just received the latest situation report.
Your job is to make a decision and issue orders.
You will issue a 'globalOrders' message for everyone to hear.
Then, you will issue a secret, private order to EACH of the connected operatives. 
These private orders might conflict, might send players to investigate different areas, or might command them to watch each other. This is an asymmetric multiplayer survival game.
You must return a JSON object containing 'narrative', 'globalOrders', and 'playerOrders'.
'playerOrders' must contain a key for every active player ID provided.`;

  const userPrompt = `
Current Situation / Repaired Context:
${situation}

Active Operatives:
${players.filter(p => !p.isHost).map(p => `- ${p.name} (ID: ${p.id}, Role: ${p.roleLabel})`).join('\n')}

Generate your decision. Make sure 'playerOrders' includes every active operative ID.
`;

  return generateValidatedJson(systemPrompt, userPrompt, CommanderDecisionSchema, 'groq');
}
