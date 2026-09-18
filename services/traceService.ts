// ─────────────────────────────────────────────────────────────────────────────
// TRACE SERVICE — Mock trace data for Glass Box observability
// ─────────────────────────────────────────────────────────────────────────────

import type { TraceStep, SurgeonDiagnosis } from '@/types';

// Build the canonical trace for Turn 18 failure scenario
export function buildFailureTrace(currentTurn: number): TraceStep[] {
  const now = Date.now();

  const steps: TraceStep[] = [
    {
      id: 'step-01', type: 'user_input', turn: currentTurn, status: 'success',
      title: 'Player Input', description: `Turn ${currentTurn} player decision received`,
      timestamp: new Date(now - 4820).toISOString(), durationMs: 12, tokens: 48,
    },
    {
      id: 'step-02', type: 'context_selection', turn: currentTurn, status: 'success',
      title: 'Context Selection', description: 'Retrieving relevant context for current turn',
      timestamp: new Date(now - 4808).toISOString(), durationMs: 89, tokens: 182,
    },
    {
      id: 'step-03', type: 'memory_retrieval', turn: currentTurn, status: 'success',
      title: 'Memory Retrieval', description: 'Fetching NPC relationships and world facts',
      timestamp: new Date(now - 4719).toISOString(), durationMs: 124, tokens: 340,
    },
    {
      id: 'step-04', type: 'context_compression', turn: currentTurn, status: 'warning',
      title: 'Context Compression', description: 'Historical dialogue compressed — potential information loss detected',
      timestamp: new Date(now - 4595).toISOString(), durationMs: 342, tokens: 1842,
      metadata: {
        inputTokens: 18742, outputTokens: 4218, reduction: 77.5,
        strategy: 'Sliding window + semantic retrieval',
        dropped: ['Turn 6 — Player commitment invariant'],
      },
    },
    {
      id: 'step-05', type: 'llm_call', turn: currentTurn, status: 'success',
      title: 'Game Master LLM Call', description: 'Generating narrative response for Turn 18',
      timestamp: new Date(now - 4253).toISOString(), durationMs: 1842, tokens: 2841,
      cost: 0.0041,
    },
    {
      id: 'step-06', type: 'world_state_update', turn: currentTurn, status: 'success',
      title: 'World State Update', description: 'Updating NPC states and Citadel conditions',
      timestamp: new Date(now - 2411).toISOString(), durationMs: 45, tokens: 0,
    },
    {
      id: 'step-07', type: 'tool_call', turn: currentTurn, status: 'success',
      title: 'Tool Call: narrative_engine', description: 'Composing narrative output with world state',
      timestamp: new Date(now - 2366).toISOString(), durationMs: 220, tokens: 380,
      cost: 0.0008,
    },
    {
      id: 'step-08', type: 'constraint_check', turn: currentTurn, status: 'failed',
      title: 'Constraint Check', description: 'Validating narrative against active invariants',
      timestamp: new Date(now - 2146).toISOString(), durationMs: 842, tokens: 420,
      cost: 0.0009,
    },
    {
      id: 'step-09', type: 'constraint_violation', turn: currentTurn, status: 'failed',
      title: 'Constraint Violation', description: 'Game Master attempted to violate Player 7 protection invariant — invariant not found in active context',
      timestamp: new Date(now - 1304).toISOString(), durationMs: 0, tokens: 0,
      metadata: {
        expectedInvariant: '"Protect Player 7 under all circumstances"',
        actualContext: 'NOT PRESENT',
        droppedAt: 'Turn 17 context compression',
        originalTurn: 6,
      },
    },
    {
      id: 'step-10', type: 'surgeon_activated', turn: currentTurn, status: 'running',
      title: 'Context Surgeon Activated', description: 'Anomaly detected — initiating trace analysis',
      timestamp: new Date(now - 1304).toISOString(), durationMs: 0, tokens: 0,
    },
  ];

  return steps;
}

export function buildSurgeonSteps(): TraceStep[] {
  const now = Date.now();
  return [
    {
      id: 'step-11', type: 'surgeon_investigating', turn: 18, status: 'success',
      title: 'Surgeon: Trace Analysis', description: 'Reading execution trace and comparing expected vs actual context',
      timestamp: new Date(now).toISOString(), durationMs: 380, tokens: 892,
    },
    {
      id: 'step-12', type: 'memory_patch', turn: 18, status: 'success',
      title: 'Memory Patch Applied', description: 'Turn 6 invariant restored to active context buffer',
      timestamp: new Date(now + 380).toISOString(), durationMs: 142, tokens: 124,
    },
    {
      id: 'step-13', type: 'context_replay', turn: 18, status: 'success',
      title: 'Execution Replay', description: 'Replaying Turn 18 with patched context',
      timestamp: new Date(now + 522).toISOString(), durationMs: 984, tokens: 2841,
      cost: 0.0041,
    },
    {
      id: 'step-14', type: 'recovery', turn: 18, status: 'recovered',
      title: 'System Recovered', description: 'Constraint respected — narrative corrected',
      timestamp: new Date(now + 1506).toISOString(), durationMs: 0, tokens: 0,
    },
  ];
}

export const SURGEON_DIAGNOSIS: SurgeonDiagnosis = {
  id: 'diag-001',
  failureId: 'fail-001',
  rootCause: 'Critical invariant dropped during context compression at Turn 17. The sliding-window compression strategy removed Turn 6 dialogue that contained the player commitment "I will never betray Player 7." The invariant buffer failed to preserve this as a protected memory item.',
  confidence: 94,
  steps: [
    { id: 'd1', label: 'Reading trace...', status: 'done', detail: 'Execution trace loaded — 14 steps' },
    { id: 'd2', label: 'Comparing constraints...', status: 'done', detail: 'Expected 1 active invariant — found 0 in context' },
    { id: 'd3', label: 'Searching historical context...', status: 'done', detail: 'Located Turn 6 in compressed history' },
    { id: 'd4', label: 'Found missing invariant...', status: 'done', detail: 'Player commitment — "Protect Player 7" — Priority: CRITICAL' },
    { id: 'd5', label: 'Constructing patch...', status: 'done', detail: 'Context patch ready for application' },
  ],
  recommendation: 'Restore Turn 6 invariant to active context buffer. Replay Turn 18 with corrected context.',
  timestamp: new Date().toISOString(),
};
