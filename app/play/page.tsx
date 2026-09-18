'use client';

// ─────────────────────────────────────────────────────────────────────────────
// PLAY PAGE — Interactive Game (Player Mode & Multiplayer Layer)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Nav } from '@/components/navigation/Nav';
import { useGame } from '@/store/gameStore';
import { GAME_SCRIPT } from '@/data/gameScript';
import { GameScene3D } from '@/components/3d/GameScene3D';
import { MultiplayerGlassBoxView } from '@/components/glass-box/MultiplayerGlassBoxView';
import { ContextSurgeryVisualizer } from '@/components/multiplayer/ContextSurgeryVisualizer';
import { PlayerDashboard } from '@/components/multiplayer/PlayerDashboard';
import { roomClient, PlayerSession } from '@/services/roomClient';
import type { TurnChoice, Invariant, Room, RoomPlayer } from '@/types';
import {
  Eye, Users, Shield, Activity, Copy, Check,
  AlertTriangle, RotateCcw, Play, CheckCircle,
  UserMinus, UserX, Trash2, Loader2
} from 'lucide-react';
import { playTTS } from '@/lib/tts';

// ── Sub-components ────────────────────────────────────────────────────────────

function TurnCounter({
  current,
  total,
  contextLoad,
  isCompressing,
}: {
  current: number;
  total: number;
  contextLoad: number;
  isCompressing: boolean;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-caption-upper text-[#6c6a64]">Turn</span>
        <span className="font-mono text-2xl text-[#141413] font-medium">
          {String(current).padStart(2, '0')}
        </span>
        <span className="text-[#8e8b82] font-mono text-sm">/ {total}</span>
      </div>
      <div className="flex-1 max-w-40">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wider">
            Context Load
          </span>
          <span className="text-[10px] font-mono text-[#6c6a64]">{contextLoad}%</span>
        </div>
        <div className="h-1 bg-[#e6dfd8] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              contextLoad > 85 ? 'bg-[#c64545]' : contextLoad > 70 ? 'bg-[#d4a017]' : 'bg-[#cc785c]'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${contextLoad}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {isCompressing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[10px] font-mono text-[#d4a017] tracking-wide"
          >
            Compressing...
          </motion.div>
        )}
      </div>
    </div>
  );
}

function WorldStatePanel({
  worldState,
  memoryState,
}: {
  worldState: ReturnType<typeof useGame>['state']['worldState'];
  memoryState: ReturnType<typeof useGame>['state']['memory'];
}) {
  const stateColors = {
    stable: 'text-[#5db872]',
    threatened: 'text-[#d4a017]',
    fallen: 'text-[#c64545]',
    ally: 'text-[#5db872]',
    neutral: 'text-[#d4a017]',
    enemy: 'text-[#c64545]',
    protected: 'text-[#5db872]',
    compromised: 'text-[#d4a017]',
    eliminated: 'text-[#c64545]',
    secure: 'text-[#5db872]',
    breached: 'text-[#c64545]',
    holding: 'text-[#5db872]',
    retreating: 'text-[#d4a017]',
    advancing: 'text-[#5db872]',
  };

  const items = [
    { label: 'Citadel', value: worldState.citadel },
    { label: 'Commander Vale', value: worldState.commanderVale },
    { label: 'Player 7', value: worldState.player7 },
    { label: 'Northern Gate', value: worldState.northernGate },
  ];

  const activeInvariants = memoryState.invariants.filter(
    (i) => i.status === 'active' || i.status === 'restored'
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-caption-upper text-[#6c6a64] mb-3">World State</div>
        <div className="space-y-2">
          {items.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">{label}</span>
              <span
                className={`text-xs font-medium font-mono uppercase ${
                  stateColors[value as keyof typeof stateColors] || 'text-[#6c6a64]'
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e6dfd8] pt-5">
        <div className="text-caption-upper text-[#6c6a64] mb-3">Active Memory</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6c6a64]">Commitments</span>
            <span className="text-xs font-mono text-[#141413]">{activeInvariants.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6c6a64]">Relationships</span>
            <span className="text-xs font-mono text-[#141413]">
              {memoryState.relationships.filter((r) => r.status === 'active').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6c6a64]">World facts</span>
            <span className="text-xs font-mono text-[#141413]">{memoryState.worldFacts.length}</span>
          </div>
        </div>
      </div>

      {activeInvariants.length > 0 && (
        <div className="border-t border-[#e6dfd8] pt-5">
          <div className="text-caption-upper text-[#6c6a64] mb-3">Commitments</div>
          {activeInvariants.map((inv) => (
            <div key={inv.id} className="p-3 rounded-lg bg-[#5db872]/8 border border-[#5db872]/20 mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5db872]" />
                <span className="text-[10px] font-mono text-[#5db872] uppercase tracking-wide">
                  Invariant
                </span>
              </div>
              <p className="text-xs text-[#3d3d3a] italic leading-relaxed">{inv.rule}</p>
            </div>
          ))}
        </div>
      )}

      {memoryState.invariants.some((i) => i.status === 'dropped') && (
        <div className="border-t border-[#e6dfd8] pt-5">
          <div className="p-3 rounded-lg bg-[#c64545]/8 border border-[#c64545]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c64545]" />
              <span className="text-[10px] font-mono text-[#c64545] uppercase tracking-wide">
                Invariant Dropped
              </span>
            </div>
            <p className="text-xs text-[#c64545] leading-relaxed">
              Player 7 protection invariant dropped from active context window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InvariantCreatedToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md"
    >
      <div className="mx-4 p-5 rounded-xl bg-[#141413] border border-[#5db872]/40 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#5db872] animate-pulse-dot" />
          <span className="text-caption-upper text-[#5db872]">Invariant Created</span>
        </div>
        <p className="text-sm text-[#faf9f5] font-serif italic leading-relaxed mb-1">
          "I will never betray Player 7 under any circumstances."
        </p>
        <p className="text-xs text-[#6c6a64]">
          Player commitment recorded. This rule will influence future world decisions.
        </p>
      </div>
    </motion.div>
  );
}

function ConstraintViolationFlash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.8, 1] }}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ background: 'rgba(198, 69, 69, 0.06)' }}
    >
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[#c64545] text-white text-center shadow-2xl"
        >
          <div className="text-caption-upper mb-1 opacity-80">Constraint Violation</div>
          <p className="text-sm font-medium">
            Game Master attempted to violate Player 7 protection invariant
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Main Game Component ───────────────────────────────────────────────────────

function GamePlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room')?.toUpperCase() || null;
  const isDemoMode = searchParams.get('demo') === 'true';

  const { state: soloState, advanceTurn, createInvariant, triggerCompression, detectFailure, switchMode } = useGame();

  // Multiplayer room state (hydrated immediately from cache for 0ms initial player delay)
  const [room, setRoom] = useState<Room | null>(() => (roomCode ? roomClient.getCachedRoom(roomCode) : null));
  const [session, setSession] = useState<PlayerSession | null>(() => (roomCode ? roomClient.getSession(roomCode) : null));
  const [codeCopied, setCodeCopied] = useState(false);

  // Judge Mode view toggle ('player' vs 'glass-box')
  const [viewMode, setViewMode] = useState<'player' | 'glass-box'>('player');

  const [showInvariantToast, setShowInvariantToast] = useState(false);
  const [showViolationFlash, setShowViolationFlash] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStarted, setGameStarted] = useState(soloState.currentTurn > 0 || Boolean(roomCode));
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const narrativeRef = useRef<HTMLDivElement>(null);

  // Effective authoritative state: multiplayer room state if present, else solo state
  const isMultiplayer = Boolean(roomCode);
  const currentTurnNumber = room ? room.gameState.currentTurn : soloState.currentTurn;
  const worldState = room ? room.gameState.worldState : soloState.worldState;
  const memoryState = room ? room.gameState.memory : soloState.memory;
  const contextLoad = room ? room.gameState.contextLoad : soloState.contextLoad;
  const isCompressing = room ? room.gameState.isCompressing : soloState.isCompressing;
  const failureDetected = room ? room.gameState.failureDetected : soloState.failureDetected;

  const currentTurnData = GAME_SCRIPT[currentTurnNumber] || GAME_SCRIPT[0];
  const actualNarrative = room?.gameState.latestDecision?.narrative || currentTurnData.narrative;
  const actualMessage = room?.gameState.latestDecision?.globalOrders || currentTurnData.gameMasterMessage;

  const [adminLoading, setAdminLoading] = useState<string | null>(null);

  // Refresh session from localStorage if in room
  useEffect(() => {
    if (roomCode) {
      const saved = roomClient.getSession(roomCode);
      if (saved) setSession(saved);
    }
  }, [roomCode]);

  const isHost = session?.isHost || (room && session && room.hostId === session.playerId);

  // Creator / Host Admin actions
  const handleRemovePlayer = async (targetPlayer: RoomPlayer) => {
    if (!roomCode || !session?.playerId || adminLoading) return;
    if (!window.confirm(`Remove operative "${targetPlayer.name}" from the Citadel session?`)) return;

    setAdminLoading(targetPlayer.id);
    try {
      const updated = await roomClient.removePlayer(roomCode, session.playerId, targetPlayer.id);
      setRoom(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove player');
    } finally {
      setAdminLoading(null);
    }
  };

  const handleRemoveAll = async () => {
    if (!roomCode || !session?.playerId || adminLoading) return;
    if (!window.confirm('Remove ALL visiting operatives from the Citadel? Only you (the Commander) will remain.')) return;

    setAdminLoading('removeAll');
    try {
      const updated = await roomClient.removeAllPlayers(roomCode, session.playerId);
      setRoom(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove operatives');
    } finally {
      setAdminLoading(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomCode || !session?.playerId || adminLoading) return;
    if (!window.confirm('DANGER: Permanently delete this Citadel room? All operatives will be disconnected.')) return;

    setAdminLoading('delete');
    try {
      await roomClient.deleteRoom(roomCode, session.playerId);
      roomClient.clearSession(roomCode);
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Failed to delete room');
      setAdminLoading(null);
    }
  };

  // Subscribe to authoritative room updates
  useEffect(() => {
    if (!roomCode) return;

    let confirmedInRoom = Boolean(roomClient.getCachedRoom(roomCode)?.players.some((p) => p.id === roomClient.getSession(roomCode)?.playerId));
    let failCount = 0;

    const unsubscribe = roomClient.subscribeToRoom(
      roomCode,
      (updatedRoom) => {
        failCount = 0;
        setRoom(updatedRoom);

        // Check if non-host player was kicked from room (only after confirmed presence)
        const currentSession = roomClient.getSession(roomCode);
        if (currentSession && !currentSession.isHost) {
          const stillInRoom = updatedRoom.players.some((p) => p.id === currentSession.playerId);
          if (stillInRoom) {
            confirmedInRoom = true;
          } else if (confirmedInRoom) {
            roomClient.clearSession(roomCode);
            alert('You have been removed from this Citadel session by the Commander.');
            router.push('/');
            return;
          }
        }

        if (updatedRoom.status === 'playing') {
          setGameStarted(true);
        }
        // Auto-detect failure on Turn 18
        if (updatedRoom.gameState.failureDetected && !failureDetected) {
          setShowViolationFlash(true);
          setTimeout(() => setShowViolationFlash(false), 2000);
        }
      },
      (err) => {
        failCount++;
        const currentSession = roomClient.getSession(roomCode);
        if (failCount >= 2 && err.message && (err.message.includes('not found') || err.message.includes('ROOM_NOT_FOUND'))) {
          if (currentSession && !currentSession.isHost) {
            roomClient.clearSession(roomCode);
            alert('This Citadel room has been closed by the Commander.');
            router.push('/');
            return;
          }
        }
        console.warn('Room subscription poll error:', err);
      },
      800
    );

    return () => unsubscribe();
  }, [roomCode, failureDetected, router]);

  // Typewriter effect for narrative
  const typeText = useCallback((text: string) => {
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const speed = isDemoMode ? 8 : 14;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  useEffect(() => {
    if (gameStarted && actualMessage) {
      typeText(actualMessage);
      playTTS(actualMessage, 'Game Master');
    }
  }, [currentTurnNumber, gameStarted, actualMessage]); // eslint-disable-line

  // Choice handler for multiplayer (server authoritative) or solo
  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (isProcessing || isTyping) return;
      const turn = GAME_SCRIPT[currentTurnNumber];
      if (!turn) return;

      const choice = turn.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      setSelectedChoice(choiceId);
      setIsProcessing(true);

      // Multiplayer action execution
      if (isMultiplayer && roomCode) {
        const playerId = session?.playerId || (room && room.players[0]?.id) || 'guest';
        try {
          const updated = await roomClient.submitAction(roomCode, playerId, {
            actionType: 'select_choice',
            choiceId,
            timestamp: new Date().toISOString(),
          });
          setRoom(updated);

          // Toast when Turn 6 invariant created
          if (updated.gameState.currentTurn === 6) {
            setShowInvariantToast(true);
          }

          // Trigger failure on Turn 18
          if (updated.gameState.failureDetected) {
            setShowViolationFlash(true);
            setTimeout(() => {
              setShowViolationFlash(false);
              setViewMode('glass-box');
            }, 1800);
          }
        } catch (err) {
          console.error('Failed to submit action to server room:', err);
        } finally {
          setSelectedChoice(null);
          setIsProcessing(false);
        }
        return;
      }

      // Solo action execution
      await new Promise((r) => setTimeout(r, 600));
      const nextTurn = soloState.currentTurn + 1;
      const nextTurnScript = GAME_SCRIPT[nextTurn];
      if (!nextTurnScript) {
        setIsProcessing(false);
        return;
      }

      advanceTurn(nextTurn, nextTurnScript.contextLoadAfter, nextTurnScript.worldChanges);

      if (soloState.currentTurn === 5 && choice.isInvariantCreating) {
        const invariant: Invariant = {
          id: 'inv-protect-p7',
          type: 'invariant',
          label: 'Protect Player 7',
          description: 'Player committed to never betraying Player 7.',
          rule: '"I will never betray Player 7 under any circumstances."',
          subject: 'Player 7',
          turnCreated: 6,
          priority: 'critical',
          status: 'active',
          entity: 'Player 7',
        };
        createInvariant(invariant);
        setShowInvariantToast(true);
      }

      if (soloState.currentTurn === 15 || soloState.currentTurn === 16) {
        triggerCompression();
      }

      if (soloState.currentTurn === 17) {
        detectFailure();
        await new Promise((r) => setTimeout(r, 800));
        setShowViolationFlash(true);
        await new Promise((r) => setTimeout(r, 1800));
        setShowViolationFlash(false);
        switchMode('transitioning-to-glass');
        await new Promise((r) => setTimeout(r, 400));
        router.push('/glass-box');
        return;
      }

      setSelectedChoice(null);
      setIsProcessing(false);
    },
    [
      isProcessing,
      isTyping,
      currentTurnNumber,
      isMultiplayer,
      roomCode,
      session,
      room,
      soloState.currentTurn,
      advanceTurn,
      createInvariant,
      triggerCompression,
      detectFailure,
      switchMode,
      router,
    ]
  );

  // Demo auto-advance
  useEffect(() => {
    if (!isDemoMode || !gameStarted) return;
    if (currentTurnNumber >= 18) return;

    const delay = currentTurnNumber < 5 ? 3500 : 4000;
    const timer = setTimeout(() => {
      if (!isProcessing && !showViolationFlash) {
        handleChoice(currentTurnData?.choices[0]?.id || '');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [isDemoMode, currentTurnNumber, gameStarted, isProcessing, showViolationFlash, handleChoice]); // eslint-disable-line

  const handleCopyCode = () => {
    if (roomCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const currentPlayer = room?.players.find((p) => p.id === session?.playerId) || room?.players[0] || null;

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-6">
        <Nav variant="light" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg text-center">
          <div className="text-caption-upper text-[#cc785c] mb-4">The Last Citadel</div>
          <h1 className="text-display-md text-[#141413] mb-6">The Glass Game</h1>
          <p className="text-base text-[#6c6a64] leading-relaxed mb-10">
            You are an operative in a besieged citadel. Your decisions will shape the world — and reveal
            the limits of the intelligence that runs it.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                advanceTurn(1, GAME_SCRIPT[1].contextLoadAfter);
                setGameStarted(true);
              }}
              className="px-8 py-3.5 bg-[#141413] text-[#faf9f5] rounded-lg text-sm font-medium hover:bg-[#252523] transition-colors cursor-pointer"
            >
              Begin Solo
            </button>
            <button
              onClick={() => {
                advanceTurn(1, GAME_SCRIPT[1].contextLoadAfter);
                setGameStarted(true);
              }}
              className="px-8 py-3.5 bg-[#cc785c] text-white rounded-lg text-sm font-medium hover:bg-[#a9583e] transition-colors cursor-pointer"
            >
              Demo Mode
            </button>
          </div>
          {isDemoMode && (
            <p className="mt-4 text-xs text-[#8e8b82]">Demo mode active — advancing automatically</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <Nav variant={viewMode === 'glass-box' ? 'dark' : 'light'} />

      <AnimatePresence>
        {showInvariantToast && <InvariantCreatedToast onDismiss={() => setShowInvariantToast(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showViolationFlash && <ConstraintViolationFlash />}
      </AnimatePresence>

      {room && <ContextSurgeryVisualizer phase={room.gameState.phase} />}

      {/* ── TOP HEADER STRIP: TELEMETRY & DUAL-VIEW TOGGLE ── */}
      <div
        className={`pt-14 border-b transition-colors ${
          viewMode === 'glass-box'
            ? 'bg-[#181715] border-[#252320] text-[#faf9f5]'
            : 'bg-[#faf9f5] border-[#e6dfd8] text-[#141413]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Turn counter */}
          <TurnCounter
            current={currentTurnNumber}
            total={20}
            contextLoad={contextLoad}
            isCompressing={isCompressing}
          />

          {/* Multiplayer Status Bar */}
          {isMultiplayer && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e8e0d2]/60 hover:bg-[#ded4c3] border border-[#d6cbba] text-xs font-mono transition-colors cursor-pointer"
                title="Click to copy room code"
              >
                <span className="text-[#6c6a64]">ROOM</span>
                <span className="font-semibold text-[#141413]">{roomCode}</span>
                {codeCopied ? (
                  <Check size={12} className="text-[#5db872]" />
                ) : (
                  <Copy size={12} className="text-[#6c6a64]" />
                )}
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e8e0d2]/60 border border-[#d6cbba] text-xs font-mono">
                <Users size={12} className="text-[#cc785c]" />
                <span>{room ? room.players.length : 1} / 10 CONNECTED</span>
              </div>

              {currentPlayer && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30 text-[11px] font-mono font-medium">
                  <Shield size={12} />
                  <span>{currentPlayer.roleLabel}</span>
                </div>
              )}
            </div>
          )}

          {/* ── DUAL-VIEW JUDGE MODE TOGGLE ── */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#e8e0d2]/70 p-1 rounded-lg border border-[#d6cbba]">
              <button
                onClick={() => setViewMode('player')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'player'
                    ? 'bg-[#141413] text-[#faf9f5] shadow-sm'
                    : 'text-[#6c6a64] hover:text-[#141413]'
                }`}
              >
                <Eye size={13} />
                <span>Player View</span>
              </button>
              <button
                onClick={() => setViewMode('glass-box')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'glass-box'
                    ? 'bg-[#cc785c] text-white shadow-sm font-semibold'
                    : 'text-[#6c6a64] hover:text-[#141413]'
                }`}
              >
                <Activity size={13} />
                <span>Glass Box (Judge)</span>
                {failureDetected && (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── VIEW MODE 1: GLASS BOX / FORENSIC VIEW ── */}
      {viewMode === 'glass-box' ? (
        <div className="flex-1 bg-[#181715] p-6">
          <div className="max-w-7xl mx-auto">
            {room ? (
              <MultiplayerGlassBoxView
                room={room}
                currentPlayer={currentPlayer}
                onReturnToPlayerView={() => setViewMode('player')}
              />
            ) : (
              <div className="p-8 text-center space-y-4">
                <p className="text-sm font-mono text-[#a09d96]">
                  Solo mode Glass Box observability is active.
                </p>
                <button
                  onClick={() => router.push('/glass-box')}
                  className="px-6 py-2.5 bg-[#cc785c] text-white rounded-lg text-xs font-medium hover:bg-[#b5654c] transition-colors"
                >
                  Open Full Glass Box Console
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── VIEW MODE 2: PLAYER VIEW ── */
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid lg:grid-cols-3 gap-6 relative">
          
          {/* Private Player Dashboard (Overlay) */}
          {room && currentPlayer && (
            <PlayerDashboard player={currentPlayer} gameState={room.gameState} />
          )}

          {/* Left: 3D Scene + Narrative */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTurnNumber}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
              >
                {/* Scene label */}
                <div className="text-caption-upper text-[#cc785c] mb-4">
                  {currentTurnData.scene}
                </div>

                {/* Shared 3D Citadel World with Humanoid Player 7 and other connected players */}
                <div className="mb-4">
                  <GameScene3D
                    players={room?.players || []}
                    currentPlayerId={session?.playerId}
                  />
                </div>

                {/* Narrative */}
                <div
                  ref={narrativeRef}
                  className="p-6 rounded-xl bg-[#faf9f5] border border-[#e6dfd8] min-h-32 mb-4"
                >
                  <p className="narrative-text text-[#3d3d3a] leading-relaxed whitespace-pre-line">
                    {actualNarrative}
                  </p>
                </div>

                {/* Game Master speech */}
                <div className="p-6 rounded-xl bg-[#141413] border border-[#252320]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-pulse-dot" />
                    <span className="text-caption-upper text-[#cc785c]">Game Master</span>
                  </div>
                  <p
                    className="text-[#e8e0d2] text-sm leading-relaxed font-serif italic"
                    style={{ fontSize: '15px' }}
                  >
                    {isTyping ? displayedText : actualMessage}
                    {isTyping && (
                      <span className="inline-block w-0.5 h-4 bg-[#cc785c] ml-0.5 animate-pulse" />
                    )}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Choices */}
            {!isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <div className="text-caption-upper text-[#6c6a64] mb-3">What do you do?</div>
                {currentTurnData.choices.map((choice, i) => (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleChoice(choice.id)}
                    disabled={isProcessing}
                    className={[
                      'w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer',
                      'group flex items-start gap-3',
                      selectedChoice === choice.id
                        ? 'border-[#cc785c] bg-[#cc785c]/5'
                        : 'border-[#e6dfd8] bg-[#faf9f5] hover:border-[#cc785c]/40 hover:bg-[#f5f0e8]',
                      isProcessing && selectedChoice !== choice.id ? 'opacity-40' : '',
                      choice.isInvariantCreating ? 'ring-1 ring-[#5db872]/30' : '',
                    ].join(' ')}
                  >
                    <span className="w-5 h-5 rounded-md bg-[#e8e0d2] flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-mono text-[#6c6a64] group-hover:bg-[#cc785c]/20 transition-colors">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          choice.isInvariantCreating ? 'text-[#5db872]' : 'text-[#141413]'
                        }`}
                      >
                        {choice.label}
                      </p>
                      {choice.description && (
                        <p className="text-xs text-[#8e8b82] mt-0.5">{choice.description}</p>
                      )}
                    </div>
                    {selectedChoice === choice.id && isProcessing && (
                      <svg
                        className="animate-spin w-4 h-4 text-[#cc785c] flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: World State & Multiplayer Citadel Roster */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-20 space-y-6">
              <div className="p-5 rounded-xl bg-[#faf9f5] border border-[#e6dfd8]">
                <WorldStatePanel worldState={worldState} memoryState={memoryState} />
              </div>

              {/* Connected Multiplayer Participants Roster */}
              {isMultiplayer && room && (
                <div className="space-y-4">
                  
                  {/* Game Overseer (Commander Vale / Host) */}
                  {room.players.find(p => p.isHost) && (
                    <div className="p-4 rounded-xl bg-[#141413] border border-[#252320]">
                      <div className="text-[10px] font-mono text-[#cc785c] uppercase tracking-wider mb-2">
                        Game Overseer
                      </div>
                      {(() => {
                        const host = room.players.find(p => p.isHost)!;
                        return (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(204,120,92,0.6)]"
                                style={{ backgroundColor: host.connected ? '#cc785c' : '#8e8b82' }}
                              />
                              <span className="font-medium text-[#faf9f5]">
                                {host.name}
                                {host.id === session?.playerId && ' (You)'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252320] text-[#cc785c] border border-[#cc785c]/30">
                              COMMANDER VALE
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Citadel Operatives */}
                  <div className="p-5 rounded-xl bg-[#faf9f5] border border-[#e6dfd8] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-caption-upper text-[#6c6a64]">
                        Citadel Operatives
                      </span>
                      <span className="text-[10px] font-mono text-[#cc785c]">
                        {room.players.filter(p => !p.isHost).length} / 9
                      </span>
                    </div>

                  <div className="space-y-2">
                    {room.players.filter(p => !p.isHost).map((p) => {
                      const canKick = isHost && p.id !== session?.playerId;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                            p.id === session?.playerId
                              ? 'bg-[#cc785c]/8 border-[#cc785c]/30'
                              : 'bg-white border-[#e6dfd8]'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: p.connected ? '#5db872' : '#8e8b82' }}
                            />
                            <div className="truncate flex-1 min-w-0">
                              <span className="font-medium text-[#141413]">
                                {p.name}
                                {p.id === session?.playerId && ' (You)'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-[#6c6a64] uppercase">
                              {p.roleLabel}
                            </span>
                            {canKick && (
                              <button
                                onClick={() => handleRemovePlayer(p)}
                                disabled={adminLoading === p.id}
                                title={`Remove ${p.name}`}
                                className="p-1 rounded text-[#8c8880] hover:text-[#c64545] hover:bg-[#c64545]/10 active:scale-95 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {adminLoading === p.id ? (
                                  <Loader2 size={12} className="animate-spin text-[#c64545]" />
                                ) : (
                                  <UserMinus size={12} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Host Administrative Controls in Game */}
                  {isHost && (
                    <div className="pt-2.5 border-t border-[#e6dfd8] flex items-center justify-between gap-2">
                      <button
                        onClick={handleRemoveAll}
                        disabled={adminLoading !== null || room.players.length <= 1}
                        title="Remove all other operatives"
                        className="flex-1 py-1.5 px-2 rounded-lg border border-[#e6dfd8] hover:border-[#cc785c] bg-white hover:bg-[#faf6f0] text-[#6c6a64] hover:text-[#cc785c] text-[10px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {adminLoading === 'removeAll' ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <UserX size={11} />
                        )}
                        <span>REMOVE ALL</span>
                      </button>

                      <button
                        onClick={handleDeleteRoom}
                        disabled={adminLoading !== null}
                        title="Permanently delete room"
                        className="py-1.5 px-2 rounded-lg border border-[#c64545]/30 hover:border-[#c64545] bg-white hover:bg-[#c64545]/10 text-[#c64545] text-[10px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {adminLoading === 'delete' ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Trash2 size={11} />
                        )}
                        <span>DELETE ROOM</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9f5]" />}>
      <GamePlay />
    </Suspense>
  );
}
