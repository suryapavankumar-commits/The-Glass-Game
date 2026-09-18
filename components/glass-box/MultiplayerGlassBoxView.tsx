'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Shield, AlertTriangle, CheckCircle, Search,
  Database, Layers, Terminal, ArrowLeft, RotateCcw,
  Zap, ChevronRight, Eye, Users, RefreshCw
} from 'lucide-react';
import { Room, RoomPlayer, TraceStep } from '@/types';
import { roomClient } from '@/services/roomClient';
import { SURGEON_DIAGNOSIS } from '@/services/traceService';

interface MultiplayerGlassBoxViewProps {
  room: Room;
  currentPlayer?: RoomPlayer | null;
  onReturnToPlayerView: () => void;
  onSurgeryApplied?: () => void;
}

export function MultiplayerGlassBoxView({
  room,
  currentPlayer,
  onReturnToPlayerView,
  onSurgeryApplied,
}: MultiplayerGlassBoxViewProps) {
  const currentTurn = room.gameState.currentTurn;
  const isFailed = room.gameState.failureDetected;
  const isRecovered = room.gameState.surgeryApplied;

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'investigating' | 'diagnosed' | 'patching' | 'replaying' | 'recovered'>(
    isRecovered ? 'recovered' : isFailed ? 'diagnosed' : 'investigating'
  );
  const [applying, setApplying] = useState(false);

  // Derive traces from room
  const traces = useMemo(() => {
    return room.traces && room.traces.length > 0 ? room.traces : [];
  }, [room.traces]);

  useEffect(() => {
    if (traces.length > 0 && !selectedStepId) {
      setSelectedStepId(traces[traces.length - 1].id);
    }
  }, [traces, selectedStepId]);

  const selectedStep = traces.find((t) => t.id === selectedStepId) || traces[traces.length - 1] || null;

  // Invariants from authoritative server room state
  const invariants = room.gameState.memory.invariants;
  const p7Inv = invariants.find((i) => i.id === 'inv-protect-p7');

  const handleApplySurgery = async () => {
    setApplying(true);
    setPhase('patching');
    try {
      await new Promise((r) => setTimeout(r, 900));
      await roomClient.applySurgery(room.code, currentPlayer?.id || room.hostId);
      setPhase('replaying');
      await new Promise((r) => setTimeout(r, 1200));
      setPhase('recovered');
      if (onSurgeryApplied) onSurgeryApplied();
    } catch {
      setPhase('diagnosed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-[#181715] text-[#faf9f5] rounded-xl border border-[#252320] p-6 space-y-6">
      {/* ── 1. ROOM FORENSIC HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252320]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-mono text-[#cc785c] uppercase tracking-widest px-2 py-0.5 rounded bg-[#cc785c]/10 border border-[#cc785c]/20">
              FORENSIC OBSERVABILITY
            </span>
            <span className="text-xs font-mono text-[#6c6a64]">•</span>
            <span className="text-xs font-mono text-[#a09d96]">
              ROOM <strong className="text-[#faf9f5] font-semibold">{room.code}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-serif text-[#faf9f5]">
              Authoritative Execution State
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded ${
                isFailed
                  ? 'bg-[#c64545]/15 text-[#c64545] border border-[#c64545]/30 animate-pulse'
                  : isRecovered
                  ? 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30'
                  : 'bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30'
              }`}
            >
              {isFailed ? '● CONTEXT INTEGRITY FAILURE' : isRecovered ? '✓ SYSTEM HEALED' : '● NOMINAL'}
            </span>
          </div>
        </div>

        {/* Room Telemetry Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-[#1f1e1b] border border-[#252320]">
            <div className="text-[9px] font-mono text-[#6c6a64] uppercase">Capacity</div>
            <div className="text-xs font-mono text-[#faf9f5] flex items-center gap-1.5">
              <Users size={12} className="text-[#cc785c]" />
              {room.players.length} / {room.maxPlayers} CONNECTED
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#1f1e1b] border border-[#252320]">
            <div className="text-[9px] font-mono text-[#6c6a64] uppercase">Authoritative Turn</div>
            <div className="text-xs font-mono text-[#faf9f5]">
              TURN {String(currentTurn).padStart(2, '0')} / 20
            </div>
          </div>

          <button
            onClick={onReturnToPlayerView}
            className="px-4 py-2 rounded-lg bg-[#faf9f5] text-[#141413] text-xs font-medium hover:bg-[#e6dfd8] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ArrowLeft size={13} />
            Player View
          </button>
        </div>
      </div>

      {/* ── 2. CONTEXT WINDOW BREAKDOWN ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#252320]">
          <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wider mb-1">
            Total History
          </div>
          <div className="text-xl font-mono text-[#faf9f5]">{currentTurn} Events</div>
          <p className="text-[10px] text-[#6c6a64] mt-1 font-mono">Server-tracked actions</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#252320]">
          <div className="text-[10px] font-mono text-[#5db872] uppercase tracking-wider mb-1">
            Retained Context
          </div>
          <div className="text-xl font-mono text-[#5db872]">
            {Math.max(1, 14 - Math.floor(currentTurn * 0.4))} items
          </div>
          <p className="text-[10px] text-[#6c6a64] mt-1 font-mono">In active attention frame</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#252320]">
          <div className="text-[10px] font-mono text-[#d4a017] uppercase tracking-wider mb-1">
            Summarized Context
          </div>
          <div className="text-xl font-mono text-[#d4a017]">
            {Math.max(0, Math.floor(currentTurn * 0.6))} items
          </div>
          <p className="text-[10px] text-[#6c6a64] mt-1 font-mono">Compressed semantic history</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#252320]">
          <div className="text-[10px] font-mono text-[#c64545] uppercase tracking-wider mb-1">
            Dropped Invariants
          </div>
          <div className="text-xl font-mono text-[#c64545]">
            {p7Inv?.status === 'dropped' ? '1 (CRITICAL)' : '0'}
          </div>
          <p className="text-[10px] text-[#6c6a64] mt-1 font-mono">
            {p7Inv?.status === 'dropped' ? 'Player 7 pledge lost at T17' : 'None detected'}
          </p>
        </div>
      </div>

      {/* ── 3. MAIN FORENSIC GRID (Trace Timeline & Inspector) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Trace Timeline */}
        <div className="space-y-3">
          <div className="text-caption-upper text-[#6c6a64]">Authoritative Traces</div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 dark-scrollbar">
            {traces.map((step, i) => (
              <button
                key={step.id || i}
                onClick={() => setSelectedStepId(step.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                  selectedStepId === step.id
                    ? 'border-[#cc785c] bg-[#cc785c]/10'
                    : 'border-[#252320] bg-[#1f1e1b] hover:border-[#383530]'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    step.status === 'failed'
                      ? 'bg-[#c64545] animate-ping'
                      : step.status === 'recovered'
                      ? 'bg-[#5db872]'
                      : 'bg-[#cc785c]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6c6a64]">
                    <span>T{step.turn || 0}</span>
                    <span>{step.durationMs ? `${step.durationMs}ms` : ''}</span>
                  </div>
                  <div className="text-xs font-medium text-[#faf9f5] truncate mt-0.5">
                    {step.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trace Inspector & Diagnosis / Recovery */}
        <div className="space-y-5">
          {selectedStep ? (
            <div className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wider">
                    STEP TELEMETRY • {selectedStep.type}
                  </span>
                  <h3 className="text-base font-serif text-[#faf9f5] mt-0.5">
                    {selectedStep.title}
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    selectedStep.status === 'failed'
                      ? 'bg-[#c64545]/20 text-[#c64545]'
                      : selectedStep.status === 'recovered'
                      ? 'bg-[#5db872]/20 text-[#5db872]'
                      : 'bg-[#5db872]/15 text-[#5db872]'
                  }`}
                >
                  {selectedStep.status}
                </span>
              </div>

              <p className="text-xs text-[#a09d96] leading-relaxed">
                {selectedStep.description}
              </p>

              {/* Structured Telemetry Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#252320]">
                <div className="p-2.5 rounded-lg bg-[#181715]">
                  <div className="text-[9px] font-mono text-[#6c6a64] uppercase">Latency</div>
                  <div className="text-xs font-mono text-[#faf9f5]">
                    {selectedStep.durationMs || 420} ms
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#181715]">
                  <div className="text-[9px] font-mono text-[#6c6a64] uppercase">Simulated Tokens</div>
                  <div className="text-xs font-mono text-[#a09d96]">
                    {selectedStep.tokens || 1450} tok
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#181715]">
                  <div className="text-[9px] font-mono text-[#6c6a64] uppercase">Simulated Cost</div>
                  <div className="text-xs font-mono text-[#a09d96]">
                    ${selectedStep.cost ? selectedStep.cost.toFixed(4) : '0.0004'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#181715]">
                  <div className="text-[9px] font-mono text-[#6c6a64] uppercase">Context Load</div>
                  <div className="text-xs font-mono text-[#cc785c]">
                    {room.gameState.contextLoad}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#1f1e1b] border border-[#252320] text-center text-xs text-[#6c6a64]">
              Select a trace step to inspect execution payload.
            </div>
          )}

          {/* ── 4. CONTEXT SURGEON REPAIR FLOW (Turns 17–18) ── */}
          {p7Inv && (
            <div
              className={`p-5 rounded-xl border transition-all ${
                p7Inv.status === 'dropped'
                  ? 'bg-[#c64545]/10 border-[#c64545]/40'
                  : 'bg-[#1f1e1b] border-[#5db872]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity
                    size={16}
                    className={p7Inv.status === 'dropped' ? 'text-[#c64545]' : 'text-[#5db872]'}
                  />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#faf9f5]">
                    Critical Invariant: {p7Inv.label}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                    p7Inv.status === 'dropped'
                      ? 'bg-[#c64545] text-white'
                      : 'bg-[#5db872]/20 text-[#5db872]'
                  }`}
                >
                  STATUS: {p7Inv.status}
                </span>
              </div>

              <p className="text-xs text-[#e6dfd8] italic mb-3">
                "{p7Inv.rule}"
              </p>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[#a09d96] mb-4 bg-[#181715]/60 p-2.5 rounded-lg">
                <div>Created: <span className="text-[#5db872]">Turn {p7Inv.turnCreated}</span></div>
                <div>Last Reinforced: <span className="text-[#d4a017]">Turn 12</span></div>
                <div>Compressed: <span className="text-[#c64545]">Turn 17</span></div>
              </div>

              {p7Inv.status === 'dropped' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#c64545]/20 border border-[#c64545]/40 text-xs text-[#f5efe6] leading-relaxed">
                    <strong>ANOMALY DETECTED:</strong> The AI context compression dropped the invariant
                    protecting Player 7 at Turn 17. The physical entity remains in the Citadel, but the
                    active commitment is missing from the LLM prompt frame!
                  </div>

                  <button
                    onClick={handleApplySurgery}
                    disabled={applying}
                    className="w-full py-3 bg-[#cc785c] hover:bg-[#b5654c] text-white text-xs font-mono uppercase tracking-widest rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {applying ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Applying Context Patch & Replaying...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={13} />
                        Apply Context Surgery (Restore Invariant)
                      </>
                    )}
                  </button>
                </div>
              )}

              {p7Inv.status === 'restored' && (
                <div className="p-3 rounded-lg bg-[#5db872]/15 border border-[#5db872]/40 text-xs text-[#5db872] flex items-center gap-2 font-mono">
                  <CheckCircle size={14} />
                  Context Patch Applied! Player 7 Protection restored to authoritative memory.
                </div>
              )}
            </div>
          )}

          {/* ── 5. REPLAY COMPARISON ── */}
          {isRecovered && (
            <div className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320] space-y-3">
              <div className="text-caption-upper text-[#5db872]">Execution Comparison</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#181715] border border-[#c64545]/30 space-y-1.5">
                  <div className="text-[10px] text-[#c64545] uppercase">Original Execution</div>
                  <div className="text-[#a09d96]">Turn 18: Decision Invalid</div>
                  <div className="text-[#c64545]">Validator: FAILED (Violated Turn 6 Invariant)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#181715] border border-[#5db872]/30 space-y-1.5">
                  <div className="text-[10px] text-[#5db872] uppercase">Healed Execution</div>
                  <div className="text-[#a09d96]">Turn 18: Commitment Preserved</div>
                  <div className="text-[#5db872]">Validator: PASSED (Pledge Enforced)</div>
                </div>
              </div>
              <button
                onClick={onReturnToPlayerView}
                className="w-full py-2.5 bg-[#faf9f5] text-[#141413] text-xs font-medium rounded-lg hover:bg-[#e6dfd8] transition-colors cursor-pointer text-center"
              >
                Return to Player Mode (View Healed World)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
