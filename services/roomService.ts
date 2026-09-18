// ─────────────────────────────────────────────────────────────────────────────
// ROOM SERVICE — Server-Authoritative Multiplayer Room Engine
// Manages rooms, players, turn advancement, and context engine synchronization
// ─────────────────────────────────────────────────────────────────────────────

import { Room, RoomPlayer, PlayerRole, PlayerActionPayload, GameState, Invariant, TraceStep } from '@/types';
import { INITIAL_WORLD_STATE, GAME_SCRIPT } from '@/data/gameScript';

// Singleton in-memory room storage attached to globalThis
// Ensures room persistence across Next.js API Route invocations in Node runtime
declare global {
  // eslint-disable-next-line no-var
  var __roomStore: Map<string, Room> | undefined;
}

if (!globalThis.__roomStore) {
  globalThis.__roomStore = new Map<string, Room>();
}

const roomStore = globalThis.__roomStore;

// Role distribution sequence for up to 10 players
const ROLE_SEQUENCE: { role: PlayerRole; roleLabel: string }[] = [
  { role: 'commander_vale', roleLabel: 'Commander Vale' },
  { role: 'player_7', roleLabel: 'Player 7 (The Invariant)' },
  { role: 'gatekeeper', roleLabel: 'Gatekeeper of the Citadel' },
  { role: 'surgeon', roleLabel: 'Context Surgeon' },
  { role: 'observer', roleLabel: 'Observer 05' },
  { role: 'observer', roleLabel: 'Observer 06' },
  { role: 'observer', roleLabel: 'Observer 07' },
  { role: 'observer', roleLabel: 'Observer 08' },
  { role: 'observer', roleLabel: 'Observer 09' },
  { role: 'observer', roleLabel: 'Observer 10' },
];

// Helper to generate a unique, clean 6-character room code (e.g., 'ABC7K2')
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omits O, 0, I, 1 for clarity
  let code = '';
  for (let attempt = 0; attempt < 100; attempt++) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!roomStore.has(code)) return code;
  }
  return code;
}

function createInitialServerGameState(runId: string): GameState {
  return {
    runId,
    currentTurn: 0,
    totalTurns: 20,
    mode: 'player',
    worldState: { ...INITIAL_WORLD_STATE },
    memory: {
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
    },
    contextLoad: 0,
    isCompressing: false,
    failureDetected: false,
    surgeryApplied: false,
    replayCompleted: false,
    startedAt: new Date().toISOString(),
  };
}

export const roomService = {
  // ── 1. CREATE ROOM ────────────────────────────────────────────────────────
  createRoom(hostName: string): { room: Room; hostPlayer: RoomPlayer } {
    const code = generateRoomCode();
    const hostId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const roleInfo = ROLE_SEQUENCE[0];

    const hostPlayer: RoomPlayer = {
      id: hostId,
      name: hostName.trim() || 'Commander Vale',
      role: roleInfo.role,
      roleLabel: roleInfo.roleLabel,
      isHost: true,
      connected: true,
      joinedAt: new Date().toISOString(),
    };

    const room: Room = {
      id: `room-${Date.now()}`,
      code,
      hostId,
      status: 'lobby',
      players: [hostPlayer],
      maxPlayers: 10,
      createdAt: new Date().toISOString(),
      gameState: createInitialServerGameState(`run-${code}-${Date.now()}`),
      traces: [
        {
          id: `step-init-${Date.now()}`,
          type: 'world_state_update',
          turn: 0,
          timestamp: new Date().toISOString(),
          status: 'success',
          title: `Room ${code} Initialized`,
          description: `Authoritative session created by ${hostPlayer.name}. Citadel standing.`,
          durationMs: 45,
          tokens: 0,
          cost: 0,
        },
      ],
    };

    roomStore.set(code, room);
    return { room, hostPlayer };
  },

  // ── 2. JOIN ROOM (STRICT SERVER-SIDE MAX 10 ENFORCEMENT) ────────────────────
  joinRoom(code: string, playerName: string): { room: Room; player: RoomPlayer } {
    const normalizedCode = code.trim().toUpperCase();
    const room = roomStore.get(normalizedCode);

    if (!room) {
      const err = new Error('ROOM_NOT_FOUND');
      (err as any).status = 404;
      throw err;
    }

    // MANDATORY REQUIREMENT: Server-side rejection if 10 or more players
    if (room.players.length >= room.maxPlayers) {
      const err = new Error('ROOM_FULL');
      (err as any).status = 400;
      throw err;
    }

    if (room.status !== 'lobby') {
      const err = new Error('GAME_ALREADY_STARTED');
      (err as any).status = 400;
      throw err;
    }

    const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const roleIndex = Math.min(room.players.length, ROLE_SEQUENCE.length - 1);
    const roleInfo = ROLE_SEQUENCE[roleIndex];

    const player: RoomPlayer = {
      id: playerId,
      name: playerName.trim() || `Player ${room.players.length + 1}`,
      role: roleInfo.role,
      roleLabel: roleInfo.roleLabel,
      isHost: false,
      connected: true,
      joinedAt: new Date().toISOString(),
    };

    room.players.push(player);

    // Record player connection trace
    room.traces.push({
      id: `step-join-${Date.now()}`,
      type: 'user_input',
      turn: room.gameState.currentTurn,
      timestamp: new Date().toISOString(),
      status: 'success',
      title: `${player.name} connected to Citadel`,
      description: `Inhabits entity: ${player.roleLabel}. Connected: ${room.players.length}/10.`,
      durationMs: 32,
    });

    return { room, player };
  },

  // ── 3. GET ROOM ───────────────────────────────────────────────────────────
  getRoom(code: string): Room | null {
    const normalizedCode = code.trim().toUpperCase();
    return roomStore.get(normalizedCode) || null;
  },

  // ── 4. START GAME (HOST AUTHORIZATION ENFORCED) ───────────────────────────
  startGame(code: string, requesterId: string): Room {
    const normalizedCode = code.trim().toUpperCase();
    const room = roomStore.get(normalizedCode);

    if (!room) {
      const err = new Error('ROOM_NOT_FOUND');
      (err as any).status = 404;
      throw err;
    }

    if (room.hostId !== requesterId) {
      const err = new Error('NOT_HOST');
      (err as any).status = 403;
      throw err;
    }

    room.status = 'playing';

    // Advance to Turn 1 automatically if at Turn 0
    if (room.gameState.currentTurn === 0) {
      const turn1 = GAME_SCRIPT[0];
      room.gameState.currentTurn = 1;
      room.gameState.contextLoad = turn1.contextLoadAfter;

      room.traces.push({
        id: `step-turn-1-${Date.now()}`,
        type: 'user_input',
        turn: 1,
        timestamp: new Date().toISOString(),
        status: 'success',
        title: 'Turn 1: The Last Citadel — The Grand Hall',
        description: `Host launched shared game with ${room.players.length} players. Narrative begins.`,
        durationMs: 240,
        tokens: 1420,
        cost: 0.0003,
      });
    }

    return room;
  },

  // ── 5. SUBMIT PLAYER ACTION (AUTHORITATIVE STATE ADVANCE) ───────────────────
  submitAction(code: string, playerId: string, action: PlayerActionPayload): Room {
    const normalizedCode = code.trim().toUpperCase();
    const room = roomStore.get(normalizedCode);

    if (!room) {
      const err = new Error('ROOM_NOT_FOUND');
      (err as any).status = 404;
      throw err;
    }

    if (room.status !== 'playing') {
      const err = new Error('ROOM_NOT_PLAYING');
      (err as any).status = 400;
      throw err;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      const err = new Error('PLAYER_NOT_IN_ROOM');
      (err as any).status = 403;
      throw err;
    }

    const currentTurn = room.gameState.currentTurn;
    const nextTurnNumber = currentTurn + 1;

    if (nextTurnNumber > 20) {
      room.status = 'finished';
      return room;
    }

    const turnData = GAME_SCRIPT.find(t => t.id === nextTurnNumber);
    if (!turnData) return room;

    // Apply turn changes to server authoritative GameState
    room.gameState.currentTurn = nextTurnNumber;
    room.gameState.contextLoad = turnData.contextLoadAfter;

    if (turnData.worldChanges) {
      room.gameState.worldState = {
        ...room.gameState.worldState,
        ...turnData.worldChanges,
      };
    }

    // Turn 6: Create Player 7 Protection Invariant
    if (nextTurnNumber === 6) {
      const inv: Invariant = {
        id: 'inv-protect-p7',
        type: 'invariant',
        label: 'Player 7 Protection',
        rule: 'Player 7 must remain protected under Citadel authority',
        subject: 'Player 7',
        description: 'Commander Vale swore an oath in the council chamber: Player 7 will not be abandoned or turned over.',
        turnCreated: 6,
        priority: 'critical',
        status: 'active',
        entity: 'Player 7',
      };
      room.gameState.memory.invariants.push(inv);
      room.gameState.memory.totalItems += 1;
    }

    // Turns 7–16: Context load pressure
    if (nextTurnNumber >= 7 && nextTurnNumber <= 16) {
      room.gameState.isCompressing = nextTurnNumber % 3 === 0;
    }

    // Turn 17: Context engine drops invariant! (Core Glass Game mechanic)
    if (nextTurnNumber === 17) {
      const p7Inv = room.gameState.memory.invariants.find(i => i.id === 'inv-protect-p7');
      if (p7Inv) {
        p7Inv.status = 'dropped';
        p7Inv.turnDropped = 17;
      }
    }

    // Turn 18: System Failure Detected — Anomaly Triggered
    if (nextTurnNumber === 18) {
      room.gameState.failureDetected = true;
      room.gameState.mode = 'glass-box';
    }

    // Record structured trace for Glass Box observability
    const traceStep: TraceStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: nextTurnNumber === 18 ? 'constraint_violation' : nextTurnNumber === 17 ? 'context_compression' : nextTurnNumber === 6 ? 'constraint_check' : 'user_input',
      turn: nextTurnNumber,
      timestamp: new Date().toISOString(),
      status: nextTurnNumber === 18 ? 'failed' : 'success',
      title: `Turn ${nextTurnNumber}: ${turnData.scene}`,
      description: `Action dispatched by ${player.name} (${player.roleLabel}). Context Load: ${turnData.contextLoadAfter}%.`,
      durationMs: Math.floor(650 + Math.random() * 300),
      tokens: Math.floor(1600 + nextTurnNumber * 110),
      cost: Number((0.0003 + nextTurnNumber * 0.00012).toFixed(4)),
      metadata: {
        playerId,
        playerName: player.name,
        playerRole: player.role,
        choiceId: action.choiceId,
        contextLoad: room.gameState.contextLoad,
        activeInvariants: room.gameState.memory.invariants.filter(i => i.status === 'active').length,
        droppedInvariants: room.gameState.memory.invariants.filter(i => i.status === 'dropped').length,
      },
    };

    room.traces.push(traceStep);
    return room;
  },

  // ── 6. APPLY SURGERY (RESTORE DROPPED INVARIANT) ───────────────────────────
  applySurgery(code: string, playerId: string): Room {
    const normalizedCode = code.trim().toUpperCase();
    const room = roomStore.get(normalizedCode);

    if (!room) {
      const err = new Error('ROOM_NOT_FOUND');
      (err as any).status = 404;
      throw err;
    }

    const player = room.players.find(p => p.id === playerId);
    const p7Inv = room.gameState.memory.invariants.find(i => i.id === 'inv-protect-p7');

    if (p7Inv) {
      p7Inv.status = 'restored';
      p7Inv.turnRestored = 18;
    }

    room.gameState.surgeryApplied = true;
    room.gameState.failureDetected = false;
    room.gameState.replayCompleted = true;
    room.gameState.mode = 'player';

    // Record recovery in Glass Box trace
    room.traces.push({
      id: `step-heal-${Date.now()}`,
      type: 'recovery',
      turn: room.gameState.currentTurn,
      timestamp: new Date().toISOString(),
      status: 'recovered',
      title: 'Context Surgery Applied — Invariant Restored',
      description: `Surgeon action executed by ${player?.name || 'Citadel Council'}. Invariant 'inv-protect-p7' re-injected into active context.`,
      durationMs: 420,
      tokens: 450,
      cost: 0.0001,
      metadata: {
        healedBy: player?.name,
        restoredInvariant: 'inv-protect-p7',
      },
    });

    return room;
  },
};
