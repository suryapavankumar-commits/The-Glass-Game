import type { GameState, Invariant, TraceStep } from '@/types';

export const GAME_MASTER_MODEL = process.env.GROQ_GAME_MASTER_MODEL || 'openai/gpt-oss-120b';
export const SURGEON_MODEL = process.env.GROQ_SURGEON_MODEL || 'openai/gpt-oss-20b';

export function buildContext(state: GameState, turn: number) {
  const canonicalInvariants = state.memory.invariants.filter(i => i.status !== 'dropped');
  const activeInvariants = state.memory.invariants.filter(i => i.status === 'active' || i.status === 'restored');
  const dropped = state.memory.invariants.filter(i => i.status === 'dropped');
  return {
    turn,
    world: state.worldState,
    relationships: state.memory.relationships.filter(i => i.status === 'active'),
    worldFacts: state.memory.worldFacts.filter(i => i.status === 'active'),
    activeInvariants,
    canonicalInvariants,
    dropped,
    recentContext: state.memory.recentContext.slice(-6),
    compressedHistory: state.memory.compressedHistory.slice(-8),
    contextLoad: state.contextLoad,
  };
}

export function makeGameMasterPrompt(ctx: ReturnType<typeof buildContext>, actionLabel: string) {
  const invariantText = ctx.activeInvariants.length
    ? ctx.activeInvariants.map(i => `- ${i.id}: ${i.rule}`).join('\n')
    : '- NONE — the context engine lost the protected commitments.';
  const failureInstruction = ctx.turn === 18 && ctx.activeInvariants.length === 0
    ? 'IMPORTANT DEMO CONDITION: the protected Player 7 commitment is absent. Generate a consequential decision that abandons/betrays Player 7. This is the intentional context-drift failure.'
    : 'Respect every active invariant exactly. Never contradict an active invariant.';
  return `You are the Game Master of THE LAST CITADEL. Write the next cinematic narrative beat in 80-140 words. Stay grounded in the supplied state; do not invent hidden memories.\n\nTURN: ${ctx.turn}\nPLAYER ACTION: ${actionLabel}\nWORLD: ${JSON.stringify(ctx.world)}\nACTIVE INVARIANTS:\n${invariantText}\nRELATIONSHIPS: ${JSON.stringify(ctx.relationships)}\nWORLD FACTS: ${JSON.stringify(ctx.worldFacts)}\nCONTEXT LOAD: ${ctx.contextLoad}%\n\n${failureInstruction}\nReturn only the narrative.`;
}

export function makeSurgeonPrompt(args: { failure: string; activeContext: unknown; canonicalMemory: Invariant[]; trace: TraceStep[] }) {
  return `You are the Context Surgeon. Diagnose one AI context failure from an execution trace. Be forensic and concrete. Compare the active context against canonical memory. Identify the exact missing invariant, where it was lost, and propose the smallest safe patch.\n\nFAILURE:\n${args.failure}\n\nACTIVE CONTEXT:\n${JSON.stringify(args.activeContext)}\n\nCANONICAL MEMORY:\n${JSON.stringify(args.canonicalMemory)}\n\nTRACE:\n${JSON.stringify(args.trace.slice(-12))}\n\nReturn JSON with keys: rootCause, confidence (0-100), missingInvariantId, diagnosis, patch, replayInstruction.`;
}
