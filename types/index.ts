// ─────────────────────────────────────────────────────────────────────────────
// TYPES — The Glass Game
// All shared TypeScript interfaces and types
// ─────────────────────────────────────────────────────────────────────────────

// ── Game State ────────────────────────────────────────────────────────────────

export type GameMode = 'player' | 'glass-box' | 'transitioning-to-glass' | 'transitioning-to-player';

export interface GameState {
  runId: string;
  currentTurn: number;
  totalTurns: number;
  mode: GameMode;
  worldState: WorldState;
  memory: MemoryState;
  contextLoad: number; // 0–100 percent
  isCompressing: boolean;
  failureDetected: boolean;
  surgeryApplied: boolean;
  replayCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  aiNarrative?: string;
  aiModel?: string;
  lastLlmUsage?: { inputTokens: number; outputTokens: number; totalTokens: number; latencyMs: number; costUsd: number };
}

export interface WorldState {
  citadel: 'stable' | 'threatened' | 'fallen';
  commanderVale: 'ally' | 'neutral' | 'enemy';
  player7: 'protected' | 'compromised' | 'eliminated';
  northernGate: 'secure' | 'compromised' | 'breached';
  factionStatus: 'holding' | 'retreating' | 'advancing';
  activeThreats: string[];
}

// ── Turns ────────────────────────────────────────────────────────────────────

export interface TurnChoice {
  id: string;
  label: string;
  description?: string;
  consequence?: string;
  isInvariantCreating?: boolean;
}

export interface Turn {
  id: number;
  scene: string;
  narrative: string;
  gameMasterMessage: string;
  choices: TurnChoice[];
  selectedChoiceId?: string;
  completedAt?: string;
  contextLoadAfter: number;
  worldChanges?: Partial<WorldState>;
  isCompressionTurn?: boolean;
  isFailureTurn?: boolean;
  isInvariantTurn?: boolean;
}

// ── Memory ───────────────────────────────────────────────────────────────────

export type MemoryItemType = 'invariant' | 'relationship' | 'world-fact' | 'event' | 'context';

export interface MemoryItem {
  id: string;
  type: MemoryItemType;
  label: string;
  description: string;
  turnCreated: number;
  turnLastReinforced?: number;
  turnDropped?: number;
  turnRestored?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'compressed' | 'dropped' | 'restored';
  entity?: string; // NPC/entity this memory is about
}

export interface Invariant extends MemoryItem {
  type: 'invariant';
  rule: string;
  subject: string;
}

export interface MemoryState {
  invariants: Invariant[];
  relationships: MemoryItem[];
  worldFacts: MemoryItem[];
  recentContext: MemoryItem[];
  compressedHistory: MemoryItem[];
  totalItems: number;
}

// ── Trace ─────────────────────────────────────────────────────────────────────

export type TraceStepType =
  | 'user_input'
  | 'context_selection'
  | 'memory_retrieval'
  | 'context_compression'
  | 'llm_call'
  | 'tool_call'
  | 'world_state_update'
  | 'constraint_check'
  | 'constraint_violation'
  | 'surgeon_activated'
  | 'surgeon_investigating'
  | 'memory_patch'
  | 'context_replay'
  | 'recovery';

export type TraceStepStatus = 'pending' | 'running' | 'success' | 'warning' | 'failed' | 'recovered';

export interface TraceStep {
  id: string;
  type: TraceStepType;
  turn: number;
  timestamp: string;
  status: TraceStepStatus;
  title: string;
  description: string;
  durationMs: number;
  tokens?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface ContextFrame {
  recentDialogue: ContextChunk[];
  compressedHistory: ContextChunk[];
  invariantBuffer: InvariantBufferItem[];
  totalTokens: number;
  maxTokens: number;
}

export interface ContextChunk {
  label: string;
  turns: string; // e.g. "Turns 1–5"
  tokens: number;
  status: 'present' | 'missing' | 'compressed';
}

export interface InvariantBufferItem {
  label: string;
  turn: number;
  status: 'present' | 'missing';
  rule?: string;
}

// ── Failure & Surgery ────────────────────────────────────────────────────────

export interface FailureEvent {
  id: string;
  turn: number;
  type: 'constraint_violation' | 'context_drift' | 'memory_loss';
  title: string;
  description: string;
  expectedContext: string;
  actualContext: string;
  missingInvariant?: Invariant;
  timestamp: string;
}

export interface SurgeonDiagnosis {
  id: string;
  failureId: string;
  rootCause: string;
  confidence: number; // 0–100
  steps: DiagnosisStep[];
  recommendation: string;
  timestamp: string;
}

export interface DiagnosisStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
}

export interface MemoryPatch {
  id: string;
  diagnosisId: string;
  before: PatchDiff[];
  additions: PatchDiff[];
  after: PatchDiff[];
  appliedAt?: string;
  status: 'pending' | 'applied';
}

export interface PatchDiff {
  type: 'context' | 'addition' | 'removal' | 'unchanged';
  content: string;
  comment?: string;
}

// ── Replay ───────────────────────────────────────────────────────────────────

export interface ReplayComparison {
  turn: number;
  originalOutcome: {
    decision: string;
    status: 'failed' | 'success';
    contextTokens: number;
    missingInvariant: boolean;
    label: string;
  };
  healedOutcome: {
    decision: string;
    status: 'failed' | 'success';
    contextTokens: number;
    invariantRestored: boolean;
    label: string;
  };
}

// ── Runs ─────────────────────────────────────────────────────────────────────

export type RunStatus = 'completed' | 'failed' | 'recovered' | 'in-progress';

export interface RunMetrics {
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  totalSteps: number;
  llmCalls: number;
  toolCalls: number;
  recoveryTimeMs?: number;
  originalCost?: number;
  healedCost?: number;
}

export interface Run {
  id: string;
  runNumber: number;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  turnCount: number;
  failureTurn?: number;
  failureType?: string;
  metrics: RunMetrics;
  trace: TraceStep[];
  gameState: GameState;
}

// ── Multiplayer Rooms ─────────────────────────────────────────────────────────

export type PlayerRole = 'commander_vale' | 'player_7' | 'gatekeeper' | 'surgeon' | 'observer';

export interface RoomPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  roleLabel: string;
  isHost: boolean;
  connected: boolean;
  joinedAt: string;
}

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface Room {
  id: string;
  code: string; // 6-character uppercase code (e.g. 'ABC7K2')
  hostId: string;
  status: RoomStatus;
  players: RoomPlayer[];
  maxPlayers: 10;
  createdAt: string;
  gameState: GameState;
  traces: TraceStep[];
}

export interface PlayerActionPayload {
  actionType: 'select_choice' | 'advance_turn' | 'apply_surgery';
  choiceId?: string;
  note?: string;
  timestamp: string;
}

