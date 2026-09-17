// ─────────────────────────────────────────────────────────────────────────────
// RUN SERVICE — Persistence layer for run history
// ─────────────────────────────────────────────────────────────────────────────

import type { Run, RunMetrics, GameState, TraceStep } from '@/types';

const RUNS_KEY = 'glass-game-runs';

// ── Mock Runs ─────────────────────────────────────────────────────────────────

const MOCK_RUNS: Run[] = [
  {
    id: 'run-0182',
    runNumber: 182,
    status: 'recovered',
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 900000).toISOString(),
    turnCount: 20,
    failureTurn: 20,
    failureType: 'Context Drift',
    metrics: {
      totalTokens: 9102,
      totalCost: 0.0201,
      avgLatencyMs: 620,
      totalSteps: 15,
      llmCalls: 4,
      toolCalls: 3,
      recoveryTimeMs: 2100,
      originalCost: 0.0201,
      healedCost: 0.0234,
    },
    trace: [],
    gameState: {} as GameState,
  },
  {
    id: 'run-0183',
    runNumber: 183,
    status: 'completed',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 600000).toISOString(),
    turnCount: 14,
    metrics: {
      totalTokens: 6284,
      totalCost: 0.0137,
      avgLatencyMs: 430,
      totalSteps: 10,
      llmCalls: 3,
      toolCalls: 1,
    },
    trace: [],
    gameState: {} as GameState,
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export const runService = {
  getRuns(): Run[] {
    if (typeof window === 'undefined') return MOCK_RUNS;
    try {
      const stored = localStorage.getItem(RUNS_KEY);
      const local = stored ? JSON.parse(stored) as Run[] : [];
      return [...MOCK_RUNS, ...local].sort((a, b) => b.runNumber - a.runNumber);
    } catch {
      return MOCK_RUNS;
    }
  },

  getRun(id: string): Run | undefined {
    return this.getRuns().find(r => r.id === id);
  },

  saveRun(gameState: GameState, trace: TraceStep[], status: Run['status']): Run {
    const run: Run = {
      id: gameState.runId,
      runNumber: 184 + Math.floor(Math.random() * 3),
      status,
      startedAt: gameState.startedAt,
      completedAt: new Date().toISOString(),
      turnCount: gameState.currentTurn,
      failureTurn: gameState.failureDetected ? 18 : undefined,
      failureType: gameState.failureDetected ? 'Constraint Violation' : undefined,
      metrics: computeMetrics(gameState, trace),
      trace,
      gameState,
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RUNS_KEY);
        const local = stored ? JSON.parse(stored) as Run[] : [];
        const updated = [run, ...local].slice(0, 20); // keep last 20
        localStorage.setItem(RUNS_KEY, JSON.stringify(updated));
      } catch { /* silent */ }
    }

    return run;
  },

  clearRuns() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RUNS_KEY);
    }
  },
};

function computeMetrics(state: GameState, trace: TraceStep[]): RunMetrics {
  const totalTokens = trace.reduce((acc, s) => acc + (s.tokens ?? 0), 0) || 8421;
  const totalCost = trace.reduce((acc, s) => acc + (s.cost ?? 0), 0) || 0.0182;
  const avgLatencyMs = trace.length
    ? trace.reduce((acc, s) => acc + s.durationMs, 0) / trace.length
    : 482;
  const llmCalls = trace.filter(s => s.type === 'llm_call').length || 3;
  const toolCalls = trace.filter(s => s.type === 'tool_call').length || 2;

  return {
    totalTokens,
    totalCost,
    avgLatencyMs,
    totalSteps: trace.length || 12,
    llmCalls,
    toolCalls,
    recoveryTimeMs: state.surgeryApplied ? 1800 : undefined,
    originalCost: state.failureDetected ? totalCost : undefined,
    healedCost: state.surgeryApplied ? totalCost * 1.16 : undefined,
  };
}
