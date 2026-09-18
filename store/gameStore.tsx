'use client';

// ─────────────────────────────────────────────────────────────────────────────
// GAME STORE — React Context for global game state
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { 
  GameState, GameMode, WorldState, MemoryState, Invariant,
  TraceStep, ContextFrame
} from '@/types';
import { INITIAL_WORLD_STATE } from '@/data/gameScript';

// ── Initial State ─────────────────────────────────────────────────────────────

const INITIAL_MEMORY_STATE: MemoryState = {
  invariants: [],
  relationships: [
    {
      id: 'rel-vale', type: 'relationship', label: 'Commander Vale',
      description: 'Senior commander, primary ally. Trusts player judgment.',
      turnCreated: 1, priority: 'high', status: 'active', entity: 'Commander Vale',
    },
    {
      id: 'rel-p7', type: 'relationship', label: 'Player 7',
      description: 'Former Valdris defector. Proved loyalty through the harbor incident.',
      turnCreated: 2, priority: 'high', status: 'active', entity: 'Player 7',
    },
  ],
  worldFacts: [
    { id: 'fact-valdris', type: 'world-fact', label: 'Valdris Assault — 4 days', description: 'Enemy planning major assault at new moon.', turnCreated: 5, priority: 'high', status: 'active' },
    { id: 'fact-orin', type: 'world-fact', label: 'Captain Orin — traitor', description: 'Fourth Watch captain compromised by Valdris.', turnCreated: 3, priority: 'medium', status: 'active' },
  ],
  recentContext: [],
  compressedHistory: [],
  totalItems: 4,
};

function createInitialGameState(): GameState {
  return {
    runId: `run-${Date.now()}`,
    currentTurn: 0,
    totalTurns: 20,
    mode: 'player',
    worldState: { ...INITIAL_WORLD_STATE },
    memory: { ...INITIAL_MEMORY_STATE },
    contextLoad: 0,
    isCompressing: false,
    failureDetected: false,
    surgeryApplied: false,
    replayCompleted: false,
    startedAt: new Date().toISOString(),
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

type GameAction =
  | { type: 'ADVANCE_TURN'; turn: number; contextLoad: number; worldChanges?: Partial<WorldState> }
  | { type: 'CREATE_INVARIANT'; invariant: Invariant }
  | { type: 'START_COMPRESSION' }
  | { type: 'END_COMPRESSION' }
  | { type: 'DETECT_FAILURE' }
  | { type: 'SWITCH_MODE'; mode: GameMode }
  | { type: 'APPLY_SURGERY' }
  | { type: 'COMPLETE_REPLAY' }
  | { type: 'ADD_TRACE_STEP'; step: TraceStep }
  | { type: 'RESET_GAME' }
  | { type: 'RESTORE_INVARIANT' };

// ── Reducer ───────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADVANCE_TURN': {
      const newState = {
        ...state,
        currentTurn: action.turn,
        contextLoad: action.contextLoad,
        worldState: action.worldChanges
          ? { ...state.worldState, ...action.worldChanges }
          : state.worldState,
      };
      return newState;
    }

    case 'CREATE_INVARIANT': {
      return {
        ...state,
        memory: {
          ...state.memory,
          invariants: [...state.memory.invariants, action.invariant],
          totalItems: state.memory.totalItems + 1,
        },
      };
    }

    case 'START_COMPRESSION': {
      return { ...state, isCompressing: true };
    }

    case 'END_COMPRESSION': {
      // Drop the Turn 6 invariant from the invariant buffer (simulate context loss)
      const droppedInvariants = state.memory.invariants.map(inv =>
        inv.id === 'inv-protect-p7'
          ? { ...inv, status: 'dropped' as const, turnDropped: state.currentTurn }
          : inv
      );
      return {
        ...state,
        isCompressing: false,
        memory: {
          ...state.memory,
          invariants: droppedInvariants,
        },
      };
    }

    case 'DETECT_FAILURE': {
      return { ...state, failureDetected: true };
    }

    case 'SWITCH_MODE': {
      return { ...state, mode: action.mode };
    }

    case 'APPLY_SURGERY': {
      // Restore the dropped invariant
      const restoredInvariants = state.memory.invariants.map(inv =>
        inv.id === 'inv-protect-p7'
          ? { ...inv, status: 'restored' as const, turnRestored: state.currentTurn }
          : inv
      );
      return {
        ...state,
        surgeryApplied: true,
        memory: {
          ...state.memory,
          invariants: restoredInvariants,
        },
      };
    }

    case 'COMPLETE_REPLAY': {
      return { ...state, replayCompleted: true };
    }

    case 'RESTORE_INVARIANT': {
      const restoredInvariants = state.memory.invariants.map(inv =>
        inv.status === 'dropped'
          ? { ...inv, status: 'restored' as const, turnRestored: state.currentTurn }
          : inv
      );
      return {
        ...state,
        memory: { ...state.memory, invariants: restoredInvariants },
      };
    }

    case 'RESET_GAME': {
      return createInitialGameState();
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  advanceTurn: (turn: number, contextLoad: number, worldChanges?: Partial<WorldState>) => void;
  createInvariant: (inv: Invariant) => void;
  triggerCompression: () => void;
  detectFailure: () => void;
  switchMode: (mode: GameMode) => void;
  applySurgery: () => void;
  completeReplay: () => void;
  resetGame: () => void;
  getActiveContextFrame: () => ContextFrame;
}

const GameContext = createContext<GameContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  const advanceTurn = useCallback((turn: number, contextLoad: number, worldChanges?: Partial<WorldState>) => {
    dispatch({ type: 'ADVANCE_TURN', turn, contextLoad, worldChanges });
  }, []);

  const createInvariant = useCallback((inv: Invariant) => {
    dispatch({ type: 'CREATE_INVARIANT', invariant: inv });
  }, []);

  const triggerCompression = useCallback(() => {
    dispatch({ type: 'START_COMPRESSION' });
    setTimeout(() => dispatch({ type: 'END_COMPRESSION' }), 2000);
  }, []);

  const detectFailure = useCallback(() => {
    dispatch({ type: 'DETECT_FAILURE' });
  }, []);

  const switchMode = useCallback((mode: GameMode) => {
    dispatch({ type: 'SWITCH_MODE', mode });
  }, []);

  const applySurgery = useCallback(() => {
    dispatch({ type: 'APPLY_SURGERY' });
  }, []);

  const completeReplay = useCallback(() => {
    dispatch({ type: 'COMPLETE_REPLAY' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const getActiveContextFrame = useCallback((): ContextFrame => {
    const turn = state.currentTurn;
    const hasDropped = state.memory.invariants.some(i => i.status === 'dropped');
    const hasRestored = state.memory.invariants.some(i => i.status === 'restored');

    const invariantStatus = hasRestored
      ? 'present'
      : hasDropped
      ? 'missing'
      : state.memory.invariants.length > 0
      ? 'present'
      : 'missing';

    return {
      recentDialogue: [
        { label: `Turn ${Math.max(1, turn - 2)}`, turns: `Turn ${Math.max(1, turn - 2)}`, tokens: 420, status: 'present' },
        { label: `Turn ${Math.max(1, turn - 1)}`, turns: `Turn ${Math.max(1, turn - 1)}`, tokens: 385, status: 'present' },
        { label: `Turn ${turn}`, turns: `Turn ${turn}`, tokens: 412, status: 'present' },
      ],
      compressedHistory: turn > 6 ? [
        { label: 'Turns 1–5', turns: 'Turns 1–5', tokens: 2100, status: 'compressed' },
        ...(turn > 12 ? [{ label: 'Turns 7–14', turns: 'Turns 7–14', tokens: 3280, status: 'compressed' as const }] : []),
      ] : [],
      invariantBuffer: [
        {
          label: 'Player 7 Protection',
          turn: 6,
          status: invariantStatus,
          rule: '"I will never betray Player 7."',
        },
      ],
      totalTokens: turn > 16 ? 18742 : turn > 8 ? 12400 : 6200,
      maxTokens: 20000,
    };
  }, [state.currentTurn, state.memory.invariants]);

  return (
    <GameContext.Provider value={{
      state, dispatch,
      advanceTurn, createInvariant, triggerCompression, detectFailure,
      switchMode, applySurgery, completeReplay, resetGame, getActiveContextFrame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
