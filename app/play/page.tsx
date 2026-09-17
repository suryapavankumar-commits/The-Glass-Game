'use client';

// ─────────────────────────────────────────────────────────────────────────────
// PLAY PAGE — Interactive Game (Player Mode)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Nav } from '@/components/navigation/Nav';
import { useGame } from '@/store/gameStore';
import { GAME_SCRIPT } from '@/data/gameScript';
import type { TurnChoice, Invariant } from '@/types';

// ── Sub-components ────────────────────────────────────────────────────────────

function TurnCounter({ current, total, contextLoad, isCompressing }: {
  current: number; total: number; contextLoad: number; isCompressing: boolean;
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
          <span className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wider">Context Load</span>
          <span className="text-[10px] font-mono text-[#6c6a64]">{contextLoad}%</span>
        </div>
        <div className="h-1 bg-[#e6dfd8] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${contextLoad > 85 ? 'bg-[#c64545]' : contextLoad > 70 ? 'bg-[#d4a017]' : 'bg-[#cc785c]'}`}
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

function WorldStatePanel({ worldState, memoryState }: {
  worldState: ReturnType<typeof useGame>['state']['worldState'];
  memoryState: ReturnType<typeof useGame>['state']['memory'];
}) {
  const stateColors = {
    stable:      'text-[#5db872]',
    threatened:  'text-[#d4a017]',
    fallen:      'text-[#c64545]',
    ally:        'text-[#5db872]',
    neutral:     'text-[#d4a017]',
    enemy:       'text-[#c64545]',
    protected:   'text-[#5db872]',
    compromised: 'text-[#d4a017]',
    eliminated:  'text-[#c64545]',
    secure:      'text-[#5db872]',
    breached:    'text-[#c64545]',
    holding:     'text-[#5db872]',
    retreating:  'text-[#d4a017]',
    advancing:   'text-[#5db872]',
  };

  const items = [
    { label: 'Citadel',         value: worldState.citadel },
    { label: 'Commander Vale',  value: worldState.commanderVale },
    { label: 'Player 7',        value: worldState.player7 },
    { label: 'Northern Gate',   value: worldState.northernGate },
  ];

  const activeInvariants = memoryState.invariants.filter(i => i.status === 'active' || i.status === 'restored');

  return (
    <div className="space-y-6">
      <div>
        <div className="text-caption-upper text-[#6c6a64] mb-3">World State</div>
        <div className="space-y-2">
          {items.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">{label}</span>
              <span className={`text-xs font-medium font-mono uppercase ${stateColors[value as keyof typeof stateColors] || 'text-[#6c6a64]'}`}>
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
            <span className="text-xs font-mono text-[#141413]">{memoryState.relationships.filter(r => r.status === 'active').length}</span>
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
          {activeInvariants.map(inv => (
            <div key={inv.id} className="p-3 rounded-lg bg-[#5db872]/8 border border-[#5db872]/20">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5db872]" />
                <span className="text-[10px] font-mono text-[#5db872] uppercase tracking-wide">Invariant</span>
              </div>
              <p className="text-xs text-[#3d3d3a] italic leading-relaxed">{inv.rule}</p>
            </div>
          ))}
        </div>
      )}

      {memoryState.invariants.some(i => i.status === 'dropped') && (
        <div className="border-t border-[#e6dfd8] pt-5">
          <div className="p-3 rounded-lg bg-[#d4a017]/8 border border-[#d4a017]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017]" />
              <span className="text-[10px] font-mono text-[#d4a017] uppercase tracking-wide">Context warning</span>
            </div>
            <p className="text-xs text-[#6c6a64]">1 commitment compressed from memory</p>
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
      style={{ background: 'rgba(198, 69, 69, 0.04)' }}
    >
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[#c64545] text-white text-center shadow-2xl"
        >
          <div className="text-caption-upper mb-1 opacity-80">Constraint Violation</div>
          <p className="text-sm font-medium">Game Master attempted to violate Player 7 protection invariant</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Main Game Component ───────────────────────────────────────────────────────

function GamePlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const { state, advanceTurn, createInvariant, triggerCompression, detectFailure, switchMode } = useGame();

  const [showInvariantToast, setShowInvariantToast] = useState(false);
  const [showViolationFlash, setShowViolationFlash] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStarted, setGameStarted] = useState(state.currentTurn > 0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const narrativeRef = useRef<HTMLDivElement>(null);

  const currentTurnData = GAME_SCRIPT[state.currentTurn] || GAME_SCRIPT[0];
  const nextTurnData = GAME_SCRIPT[state.currentTurn + 1];

  // Typewriter effect for narrative
  const typeText = useCallback((text: string) => {
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const speed = isDemoMode ? 8 : 15;
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
    if (gameStarted && currentTurnData) {
      typeText(currentTurnData.gameMasterMessage);
    }
  }, [state.currentTurn, gameStarted]); // eslint-disable-line

  // Demo auto-advance
  useEffect(() => {
    if (!isDemoMode || !gameStarted) return;
    if (state.currentTurn >= 18) return;

    const delay = state.currentTurn < 5 ? 3500 : 4000;
    const timer = setTimeout(() => {
      if (!isProcessing && !showViolationFlash) {
        handleChoice(currentTurnData?.choices[0]?.id || '');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [isDemoMode, state.currentTurn, gameStarted, isProcessing, showViolationFlash]); // eslint-disable-line

  const handleChoice = useCallback(async (choiceId: string) => {
    if (isProcessing || isTyping) return;
    const turn = GAME_SCRIPT[state.currentTurn];
    if (!turn) return;

    const choice = turn.choices.find(c => c.id === choiceId);
    if (!choice) return;

    setSelectedChoice(choiceId);
    setIsProcessing(true);

    await new Promise(r => setTimeout(r, 600));

    // Advance turn
    const nextTurn = state.currentTurn + 1;
    const nextTurnScript = GAME_SCRIPT[nextTurn];
    if (!nextTurnScript) {
      setIsProcessing(false);
      return;
    }

    advanceTurn(nextTurn, nextTurnScript.contextLoadAfter, nextTurnScript.worldChanges);

    // Turn 6 — create invariant
    if (state.currentTurn === 5 && choice.isInvariantCreating) {
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

    // Compression turns (16, 17)
    if (state.currentTurn === 15 || state.currentTurn === 16) {
      triggerCompression();
    }

    // Turn 18 — failure
    if (state.currentTurn === 17) {
      detectFailure();
      await new Promise(r => setTimeout(r, 800));
      setShowViolationFlash(true);
      await new Promise(r => setTimeout(r, 1800));
      setShowViolationFlash(false);
      switchMode('transitioning-to-glass');
      await new Promise(r => setTimeout(r, 400));
      router.push('/glass-box');
      return;
    }

    setSelectedChoice(null);
    setIsProcessing(false);
  }, [isProcessing, isTyping, state.currentTurn, advanceTurn, createInvariant, triggerCompression, detectFailure, switchMode, router]);

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-6">
        <Nav variant="light" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg text-center"
        >
          <div className="text-caption-upper text-[#cc785c] mb-4">The Last Citadel</div>
          <h1 className="text-display-md text-[#141413] mb-6">
            The Glass Game
          </h1>
          <p className="text-base text-[#6c6a64] leading-relaxed mb-10">
            You are an operative in a besieged citadel. Your decisions will shape the world — and reveal the limits of the intelligence that runs it.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                advanceTurn(1, GAME_SCRIPT[1].contextLoadAfter);
                setGameStarted(true);
              }}
              className="px-8 py-3.5 bg-[#141413] text-[#faf9f5] rounded-lg text-sm font-medium hover:bg-[#252523] transition-colors cursor-pointer"
            >
              Begin
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
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Nav variant="light" />

      <AnimatePresence>
        {showInvariantToast && (
          <InvariantCreatedToast onDismiss={() => setShowInvariantToast(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViolationFlash && <ConstraintViolationFlash />}
      </AnimatePresence>

      {/* ── Header strip ── */}
      <div className="pt-14 border-b border-[#e6dfd8] bg-[#faf9f5]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <TurnCounter
            current={state.currentTurn}
            total={state.totalTurns}
            contextLoad={state.contextLoad}
            isCompressing={state.isCompressing}
          />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5db872] animate-pulse-dot" />
            <span className="text-xs font-mono text-[#6c6a64] uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid lg:grid-cols-3 gap-6">

        {/* ── Left: Scene + Narrative ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentTurn}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {/* Scene label */}
              <div className="text-caption-upper text-[#cc785c] mb-4">{currentTurnData.scene}</div>

              {/* Narrative */}
              <div
                ref={narrativeRef}
                className="p-6 rounded-xl bg-[#faf9f5] border border-[#e6dfd8] min-h-32 mb-4"
              >
                <p className="narrative-text text-[#3d3d3a] leading-relaxed whitespace-pre-line">
                  {currentTurnData.narrative}
                </p>
              </div>

              {/* Game Master speech */}
              <div className="p-6 rounded-xl bg-[#141413] border border-[#252320]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-pulse-dot" />
                  <span className="text-caption-upper text-[#cc785c]">Game Master</span>
                </div>
                <p className="text-[#e8e0d2] text-sm leading-relaxed font-serif italic" style={{ fontSize: '15px' }}>
                  {isTyping ? displayedText : currentTurnData.gameMasterMessage}
                  {isTyping && <span className="inline-block w-0.5 h-4 bg-[#cc785c] ml-0.5 animate-pulse" />}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Choices ── */}
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
                    <p className={`text-sm font-medium ${choice.isInvariantCreating ? 'text-[#5db872]' : 'text-[#141413]'}`}>
                      {choice.label}
                    </p>
                    {choice.description && (
                      <p className="text-xs text-[#8e8b82] mt-0.5">{choice.description}</p>
                    )}
                  </div>
                  {selectedChoice === choice.id && isProcessing && (
                    <svg className="animate-spin w-4 h-4 text-[#cc785c] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Right: World State ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 p-5 rounded-xl bg-[#faf9f5] border border-[#e6dfd8]">
            <WorldStatePanel worldState={state.worldState} memoryState={state.memory} />
          </div>
        </div>
      </div>
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
