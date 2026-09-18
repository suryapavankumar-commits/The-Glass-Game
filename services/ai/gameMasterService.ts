import { z } from 'zod';
import { generateValidatedJson } from './aiProvider';
import { GameState } from '@/types';

export const GameMasterSchema = z.object({
  situation: z.string().describe("A vivid, cinematic description of the current situation at the Citadel"),
  claims: z.array(z.string()).describe("Specific claims or assertions about characters, threats, or locations that the narrative is establishing as truth"),
});

export type GameMasterOutput = z.infer<typeof GameMasterSchema>;

export async function generateGameMasterSituation(gameState: GameState): Promise<GameMasterOutput> {
  const isEarly = gameState.currentTurn <= 5;
  const isMid = gameState.currentTurn > 5 && gameState.currentTurn <= 10;
  const isLate = gameState.currentTurn > 10;

  let behavior = "You are reliable and coherent. Describe realistic events.";
  if (isMid) behavior = "You are suspicious and paranoid. Introduce unverified rumors and tensions between characters.";
  if (isLate) behavior = "Your narrative is fracturing. You must hallucinate conspiracies, contradict known facts, or describe impossible events.";

  const systemPrompt = `You are the Game Master for The Glass Game, a tense psychological survival multiplayer game set in a besieged Citadel.
Your role is to narrate the current situation and introduce events.
${behavior}

You must return a JSON object with 'situation' and 'claims'.
Claims should be declarative sentences (e.g., 'Player 4 left their post', 'The northern gate has fallen', 'Player 7 and Player 2 are secretly communicating').
`;

  const userPrompt = `
Current Turn: ${gameState.currentTurn} / 20.
Current world state: ${JSON.stringify(gameState.worldState)}

Generate the situation and claims.
`;

  return generateValidatedJson(systemPrompt, userPrompt, GameMasterSchema, 'groq');
}
