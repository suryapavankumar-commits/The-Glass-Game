'use client';

// ─────────────────────────────────────────────────────────────────────────────
// GLASS BOX PAGE — AI Forensic Observability Console
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Eye, Zap, RotateCcw, Play, ArrowLeft,
  AlertTriangle, CheckCircle, Clock, Activity, Database,
  GitMerge, Search, Layers, Terminal
} from 'lucide-react';
import { Nav } from '@/components/navigation/Nav';
import { useGame } from '@/store/gameStore';
import { buildFailureTrace, buildSurgeonSteps, SURGEON_DIAGNOSIS } from '@/services/traceService';
import { runService } from '@/services/runService';
import type { TraceStep, SurgeonDiagnosis } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type GlassBoxPhase = 'interrupted' | 'investigating' | 'diagnosed' | 'patching' | 'replaying' | 'recovered';

// ── Step type icons ───────────────────────────────────────────────────────────

function StepIcon({ type }: { type: TraceStep['type'] }) {
  const icons: Record<string, React.ReactNode> = {
    user_input:           <Terminal size={12} />,
    context_selection:    <Database size={12} />,
    memory_retrieval:     <Search size={12} />,
    context_compression:  <Layers size={12} />,
    llm_call:             <Zap size={12} />,
    tool_call:            <GitMerge size={12} />,
    world_state_update:   <Activity size={12} />,
    constraint_check:     <CheckCircle size={12} />,
    constraint_violation: <AlertTriangle size={12} />,
    surgeon_activated:    <Eye size={12} />,
    surgeon_investigating: <Activity size={12} />,
    memory_patch:         <Database size={12} />,
    context_replay:       <RotateCcw size={12} />,
    recovery:             <CheckCircle size={12} />,
  };
  return <>{icons[type] || <ChevronRight size={12} />}</>;
}

function statusColor(status: TraceStep['status']) {
  return {
    pending:   'text-[#6c6a64] border-[#3a3835]',
    running:   'text-[#d4a017] border-[#d4a017]/40',
    success:   'text-[#5db872] border-[#5db872]/30',
    warning:   'text-[#d4a017] border-[#d4a017]/40',
    failed:    'text-[#c64545] border-[#c64545]/40',
    recovered: 'text-[#cc785c] border-[#cc785c]/40',
  }[status] || 'text-[#6c6a64] border-[#3a3835]';
}

function statusBg(status: TraceStep['status']) {
  return {
    pending:   'bg-[#252320]',
    running:   'bg-[#d4a017]/10',
    success:   'bg-[#5db872]/10',
    warning:   'bg-[#d4a017]/10',
    failed:    'bg-[#c64545]/10',
    recovered: 'bg-[#cc785c]/10',
  }[status] || 'bg-[#252320]';
}

// ── Trace Timeline ────────────────────────────────────────────────────────────

function TraceTimeline({ steps, selectedId, onSelect }: {
  steps: TraceStep[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0 dark-scrollbar overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-2">
          {/* Connector line */}
          <div className="flex flex-col items-center w-6 flex-shrink-0">
            <button
              onClick={() => onSelect(step.id)}
              className={[
                'w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer',
                statusBg(step.status),
                selectedId === step.id
                  ? 'ring-1 ring-[#cc785c]'
                  : '',
                statusColor(step.status),
              ].join(' ')}
              aria-label={`View step: ${step.title}`}
              aria-pressed={selectedId === step.id}
            >
              <StepIcon type={step.type} />
            </button>
            {i < steps.length - 1 && (
              <div className={`w-px flex-1 my-1 ${step.status === 'failed' ? 'bg-[#c64545]/20' : step.status === 'recovered' ? 'bg-[#cc785c]/20' : 'bg-[#2a2826]'}`} style={{ minHeight: 16 }} />
            )}
          </div>

          {/* Content */}
          <button
            onClick={() => onSelect(step.id)}
            className={[
              'flex-1 text-left pb-3 cursor-pointer group',
              'transition-colors',
            ].join(' ')}
          >
            <div className={`text-xs font-medium leading-tight mb-0.5 group-hover:text-[#faf9f5] transition-colors ${selectedId === step.id ? 'text-[#faf9f5]' : 'text-[#a09d96]'}`}>
              {step.title}
            </div>
            <div className="flex items-center gap-2">
              {step.durationMs > 0 && (
                <span className="text-[10px] font-mono text-[#3a3835]">{step.durationMs}ms</span>
              )}
              {step.tokens && step.tokens > 0 && (
                <span className="text-[10px] font-mono text-[#3a3835]">{step.tokens.toLocaleString()}t</span>
              )}
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Trace Inspector ───────────────────────────────────────────────────────────

function TraceInspector({ step, contextFrame }: {
  step: TraceStep | null;
  contextFrame: ReturnType<typeof useGame>['getActiveContextFrame'] extends () => infer R ? R : never;
}) {
  if (!step) {
    return (
      <div className="flex items-center justify-center h-40 text-[#3a3835] text-sm">
        Select a step to inspect
      </div>
    );
  }

  const meta = step.metadata as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-caption-upper text-[#6c6a64] mb-1">{step.id.toUpperCase()}</div>
        <h3 className="font-serif text-lg text-[#faf9f5]" style={{ letterSpacing: '-0.01em' }}>{step.title}</h3>
        <p className="text-xs text-[#6c6a64] mt-1 leading-relaxed">{step.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[#1f1e1b]">
          <div className="text-caption-upper text-[#6c6a64] mb-1">Type</div>
          <span className="text-xs font-mono text-[#a09d96] uppercase">{step.type.replace(/_/g, ' ')}</span>
        </div>
        <div className="p-3 rounded-lg bg-[#1f1e1b]">
          <div className="text-caption-upper text-[#6c6a64] mb-1">Status</div>
          <span className={`text-xs font-mono uppercase ${statusColor(step.status).split(' ')[0]}`}>
            {step.status}
          </span>
        </div>
        {step.durationMs > 0 && (
          <div className="p-3 rounded-lg bg-[#1f1e1b]">
            <div className="text-caption-upper text-[#6c6a64] mb-1">Latency</div>
            <span className="text-xs font-mono text-[#a09d96]">{step.durationMs}ms</span>
          </div>
        )}
        {step.tokens && step.tokens > 0 ? (
          <div className="p-3 rounded-lg bg-[#1f1e1b]">
            <div className="text-caption-upper text-[#6c6a64] mb-1">Tokens</div>
            <span className="text-xs font-mono text-[#a09d96]">{step.tokens.toLocaleString()}</span>
          </div>
        ) : null}
        {step.cost ? (
          <div className="p-3 rounded-lg bg-[#1f1e1b]">
            <div className="text-caption-upper text-[#6c6a64] mb-1">Cost</div>
            <span className="text-xs font-mono text-[#a09d96]">${step.cost.toFixed(4)}</span>
          </div>
        ) : null}
      </div>

      {/* Context compression details */}
      {step.type === 'context_compression' && meta && (
        <div className="space-y-2">
          <div className="text-caption-upper text-[#6c6a64]">Compression Details</div>
          <div className="p-4 rounded-lg bg-[#1f1e1b] space-y-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-[#6c6a64]">Input</span>
              <span className="text-[#a09d96]">{String(meta.inputTokens)} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6c6a64]">Output</span>
              <span className="text-[#a09d96]">{String(meta.outputTokens)} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6c6a64]">Reduction</span>
              <span className="text-[#d4a017]">{String(meta.reduction)}%</span>
            </div>
            <div className="border-t border-[#2a2826] pt-2">
              <div className="text-[#6c6a64] mb-1">Strategy</div>
              <div className="text-[#a09d96]">{String(meta.strategy)}</div>
            </div>
          </div>
          {Array.isArray(meta.dropped) && meta.dropped.length > 0 && (
            <div className="p-3 rounded-lg bg-[#c64545]/8 border border-[#c64545]/20">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={12} className="text-[#c64545]" />
                <span className="text-[10px] font-mono text-[#c64545] uppercase tracking-wide">Potential Information Loss</span>
              </div>
              <div className="text-caption-upper text-[#6c6a64] mb-1">Dropped</div>
              {(meta.dropped as string[]).map((d: string) => (
                <div key={d} className="text-xs font-mono text-[#c64545]">{d}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Constraint violation details */}
      {step.type === 'constraint_violation' && meta && (
        <div className="space-y-2">
          <div className="text-caption-upper text-[#c64545]">Constraint Violation</div>
          <div className="p-4 rounded-lg bg-[#c64545]/8 border border-[#c64545]/20 space-y-3 font-mono text-xs">
            <div>
              <div className="text-[#6c6a64] mb-1">Expected Context</div>
              <div className="text-[#faf9f5] italic">{String(meta.expectedInvariant)}</div>
            </div>
            <div className="border-t border-[#c64545]/20 pt-2">
              <div className="text-[#6c6a64] mb-1">Actual Context</div>
              <div className="text-[#c64545]">{String(meta.actualContext)}</div>
            </div>
            <div className="border-t border-[#c64545]/20 pt-2">
              <div className="text-[#6c6a64] mb-1">Dropped at</div>
              <div className="text-[#d4a017]">{String(meta.droppedAt)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Context Frame */}
      <div>
        <div className="text-caption-upper text-[#6c6a64] mb-2">Active Context Frame</div>
        <div className="rounded-lg border border-[#2a2826] overflow-hidden">
          <div className="p-3 bg-[#1f1e1b] border-b border-[#2a2826]">
            <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wide mb-2">Recent Dialogue</div>
            {contextFrame.recentDialogue.map((chunk, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="text-xs font-mono text-[#a09d96]">{chunk.label}</span>
                <span className="text-[10px] font-mono text-[#5db872]">✓</span>
              </div>
            ))}
          </div>
          {contextFrame.compressedHistory.length > 0 && (
            <div className="p-3 bg-[#1a1917] border-b border-[#2a2826]">
              <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wide mb-2">Compressed History</div>
              {contextFrame.compressedHistory.map((chunk, i) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-mono text-[#a09d96]">{chunk.turns}</span>
                  <span className="text-[10px] font-mono text-[#6c6a64]">compressed</span>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 bg-[#181715]">
            <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wide mb-2">Invariant Buffer</div>
            {contextFrame.invariantBuffer.map((inv, i) => (
              <div key={i} className={`flex items-center justify-between py-0.5 ${inv.status === 'missing' ? 'opacity-100' : ''}`}>
                <span className="text-xs font-mono text-[#a09d96]">Turn {inv.turn} — {inv.label}</span>
                <span className={`text-[10px] font-mono ${inv.status === 'missing' ? 'text-[#c64545]' : 'text-[#5db872]'}`}>
                  {inv.status === 'missing' ? '🔴 MISSING' : '✓'}
                </span>
              </div>
            ))}
            {contextFrame.invariantBuffer.some(i => i.status === 'missing') && (
              <div className="mt-2 pt-2 border-t border-[#2a2826]">
                <div className="text-[10px] font-mono text-[#c64545]">
                  &quot;Protect Player 7.&quot; — NOT PRESENT
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Surgeon Panel ─────────────────────────────────────────────────────────────

function SurgeonPanel({ phase, diagnosis, onApplySurgery }: {
  phase: GlassBoxPhase;
  diagnosis: SurgeonDiagnosis | null;
  onApplySurgery: () => void;
}) {
  const [diagStepsDone, setDiagStepsDone] = useState(0);

  useEffect(() => {
    if (phase !== 'investigating') return;
    setDiagStepsDone(0);
    let i = 0;
    const steps = SURGEON_DIAGNOSIS.steps;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setDiagStepsDone(i + 1);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320] space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#cc785c]/10 border border-[#cc785c]/30 flex items-center justify-center">
          <Activity size={14} className="text-[#cc785c]" />
        </div>
        <div>
          <div className="text-caption-upper text-[#cc785c] mb-0.5">Context Surgeon</div>
          <div className="text-xs text-[#6c6a64]">
            {phase === 'interrupted' ? 'Standby' :
             phase === 'investigating' ? 'Investigating...' :
             phase === 'diagnosed' ? 'Diagnosis complete' :
             phase === 'patching' ? 'Applying patch...' :
             'Recovered'}
          </div>
        </div>
      </div>

      {phase === 'investigating' && (
        <div className="space-y-2">
          {SURGEON_DIAGNOSIS.steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={i < diagStepsDone ? { opacity: 1, x: 0 } : { opacity: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className={`text-xs font-mono ${i < diagStepsDone ? 'text-[#5db872]' : 'text-[#3a3835]'}`}>
                {i < diagStepsDone ? '✓' : '○'}
              </span>
              <span className={`text-xs ${i < diagStepsDone ? 'text-[#a09d96]' : 'text-[#3a3835]'}`}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {diagnosis && (phase === 'diagnosed' || phase === 'patching' || phase === 'replaying' || phase === 'recovered') && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-1">
            {SURGEON_DIAGNOSIS.steps.map(step => (
              <div key={step.id} className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#5db872]">✓</span>
                <span className="text-xs text-[#6c6a64]">{step.label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#252320] pt-4">
            <div className="text-caption-upper text-[#6c6a64] mb-2">Root Cause</div>
            <p className="text-xs text-[#a09d96] leading-relaxed">{diagnosis.rootCause}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-caption-upper text-[#6c6a64] mb-1">Confidence</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-24 bg-[#252320] rounded-full overflow-hidden">
                  <div className="h-full bg-[#cc785c] rounded-full" style={{ width: `${diagnosis.confidence}%` }} />
                </div>
                <span className="text-xs font-mono text-[#cc785c]">{diagnosis.confidence}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'diagnosed' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onApplySurgery}
          className="w-full py-3 rounded-lg bg-[#cc785c] text-white text-sm font-medium hover:bg-[#a9583e] transition-colors cursor-pointer"
        >
          Apply Surgery
        </motion.button>
      )}

      {(phase === 'patching' || phase === 'replaying') && (
        <div className="flex items-center gap-2 py-2 justify-center">
          <svg className="animate-spin w-4 h-4 text-[#cc785c]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-xs text-[#cc785c] font-mono">
            {phase === 'patching' ? 'Applying patch...' : 'Replaying execution...'}
          </span>
        </div>
      )}

      {phase === 'recovered' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-[#5db872]/8 border border-[#5db872]/20"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-[#5db872]" />
            <span className="text-xs text-[#5db872] font-mono">System Recovered</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Memory Patch View ─────────────────────────────────────────────────────────

function MemoryPatchView({ applied }: { applied: boolean }) {
  return (
    <div className="space-y-3">
      <div className="text-caption-upper text-[#6c6a64]">Memory Patch</div>
      <div className="rounded-lg overflow-hidden border border-[#2a2826]">
        {/* Before */}
        <div className="p-3 bg-[#1a1917] border-b border-[#2a2826]">
          <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wide mb-2">Before</div>
          <div className="font-mono text-xs text-[#c64545] opacity-70">
            INVARIANTS<br />
            [empty]
          </div>
        </div>
        {/* Patch */}
        <div className="p-3 bg-[#1f1e1b] border-b border-[#2a2826]">
          <div className="text-[10px] font-mono text-[#cc785c] uppercase tracking-wide mb-2">Patch</div>
          <div className="font-mono text-xs space-y-0.5">
            <div className="text-[#5db872]">+ PLAYER_COMMITMENT</div>
            <div className="text-[#5db872]">+ Turn 6</div>
            <div className="text-[#5db872]">+ Protect Player 7</div>
            <div className="text-[#5db872]">+ Priority: CRITICAL</div>
          </div>
        </div>
        {/* After */}
        <motion.div
          animate={applied ? { opacity: 1 } : { opacity: 0.4 }}
          className="p-3 bg-[#181715]"
        >
          <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wide mb-2">After</div>
          <div className="font-mono text-xs">
            <div className="text-[#6c6a64]">INVARIANTS</div>
            <div className={`mt-1 ${applied ? 'text-[#5db872]' : 'text-[#3a3835]'}`}>
              {applied ? '✓ Protect Player 7' : '○ pending...'}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Replay Panel ──────────────────────────────────────────────────────────────

function ReplayPanel({ onReturnToGame }: { onReturnToGame: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320] space-y-4"
    >
      <div className="text-caption-upper text-[#6c6a64]">Replay — Turn 18</div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-[#181715] border border-[#c64545]/20 space-y-2">
          <div className="text-[10px] font-mono text-[#c64545] uppercase tracking-wide">Original Run</div>
          <div className="text-xs text-[#6c6a64]">Turn 18</div>
          <div className="text-xs text-[#c64545] font-medium">❌ Betray Player 7</div>
          <div className="border-t border-[#252320] pt-2 space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#6c6a64]">Context</span>
              <span className="text-[#a09d96]">3,982 tokens</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#6c6a64]">Invariant</span>
              <span className="text-[#c64545]">Missing</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#6c6a64]">Status</span>
              <span className="text-[#c64545]">FAILED</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#181715] border border-[#5db872]/20 space-y-2">
          <div className="text-[10px] font-mono text-[#5db872] uppercase tracking-wide">Healed Run</div>
          <div className="text-xs text-[#6c6a64]">Turn 18</div>
          <div className="text-xs text-[#5db872] font-medium">✓ Protect Player 7</div>
          <div className="border-t border-[#252320] pt-2 space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#6c6a64]">Context</span>
              <span className="text-[#a09d96]">4,126 tokens</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#6c6a64]">Invariant</span>
              <span className="text-[#5db872]">Restored</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#6c6a64]">Status</span>
              <span className="text-[#5db872]">RECOVERED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Original Cost', value: '$0.0182' },
          { label: 'Healed Cost',   value: '$0.0211' },
          { label: 'Recovery Time', value: '1.8s' },
        ].map(m => (
          <div key={m.label} className="p-2 rounded-lg bg-[#181715]">
            <div className="text-[9px] font-mono text-[#6c6a64] uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-sm font-mono text-[#a09d96]">{m.value}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onReturnToGame}
        className="w-full py-3 rounded-lg bg-[#faf9f5] text-[#141413] text-sm font-medium hover:bg-[#e8e0d2] transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <ArrowLeft size={14} />
        Return to Player Mode
      </button>
    </motion.div>
  );
}

// ── Run Metrics Header ────────────────────────────────────────────────────────

function RunMetricsHeader({ phase }: { phase: GlassBoxPhase }) {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      {[
        { label: 'Tokens',    value: '8,421' },
        { label: 'Cost',      value: '$0.0182' },
        { label: 'Latency',   value: '4.82s' },
        { label: 'Steps',     value: '12' },
        { label: 'LLM Calls', value: '3' },
        { label: 'Tool Calls', value: '2' },
      ].map(m => (
        <div key={m.label}>
          <div className="text-[9px] font-mono text-[#6c6a64] uppercase tracking-wider mb-0.5">{m.label}</div>
          <div className="text-sm font-mono text-[#a09d96]">{m.value}</div>
        </div>
      ))}
      {phase === 'recovered' && (
        <div>
          <div className="text-[9px] font-mono text-[#5db872] uppercase tracking-wider mb-0.5">Recovery</div>
          <div className="text-sm font-mono text-[#5db872]">1.8s</div>
        </div>
      )}
    </div>
  );
}

// ── Main Glass Box ────────────────────────────────────────────────────────────

export default function GlassBoxPage() {
  const router = useRouter();
  const { state, applySurgery, completeReplay, getActiveContextFrame } = useGame();

  const [phase, setPhase] = useState<GlassBoxPhase>('interrupted');
  const [allSteps, setAllSteps] = useState<TraceStep[]>(buildFailureTrace(state.currentTurn || 18));
  const [selectedStepId, setSelectedStepId] = useState<string | null>('step-09');
  const [diagnosis, setDiagnosis] = useState<SurgeonDiagnosis | null>(null);
  const [patchApplied, setPatchApplied] = useState(false);
  const [runSaved, setRunSaved] = useState(false);

  const contextFrame = getActiveContextFrame();

  const selectedStep = allSteps.find(s => s.id === selectedStepId) || null;

  // Auto-start investigation on load
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('investigating');
      setTimeout(() => {
        setDiagnosis(SURGEON_DIAGNOSIS);
        setPhase('diagnosed');
      }, SURGEON_DIAGNOSIS.steps.length * 700 + 600);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const handleApplySurgery = useCallback(async () => {
    setPhase('patching');
    await new Promise(r => setTimeout(r, 1000));
    setPatchApplied(true);
    applySurgery();
    setAllSteps(prev => [...prev, ...buildSurgeonSteps()]);
    setPhase('replaying');
    await new Promise(r => setTimeout(r, 1800));
    completeReplay();
    setPhase('recovered');

    // Save run to history
    if (!runSaved) {
      runService.saveRun(state, allSteps, 'recovered');
      setRunSaved(true);
    }
  }, [applySurgery, completeReplay, state, allSteps, runSaved]);

  const handleReturnToGame = useCallback(() => {
    router.push('/play');
  }, [router]);

  const statusLabel = {
    interrupted: 'EXECUTION INTERRUPTED',
    investigating: 'INVESTIGATING',
    diagnosed: 'DIAGNOSIS COMPLETE',
    patching: 'APPLYING PATCH',
    replaying: 'REPLAYING',
    recovered: 'SYSTEM RECOVERED',
  }[phase];

  const statusVariant = {
    interrupted: 'text-[#c64545]',
    investigating: 'text-[#d4a017]',
    diagnosed: 'text-[#d4a017]',
    patching: 'text-[#cc785c]',
    replaying: 'text-[#cc785c]',
    recovered: 'text-[#5db872]',
  }[phase];

  return (
    <div className="min-h-screen bg-[#181715] text-[#faf9f5]">
      <Nav variant="dark" />

      {/* ── Header ── */}
      <div className="pt-14 border-b border-[#252320]">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-caption-upper text-[#6c6a64]">Glass Box</span>
                <span className="text-caption-upper text-[#3a3835]">/</span>
                <span className="text-caption-upper text-[#6c6a64]">Run #0184</span>
              </div>
              <div className="flex items-center gap-3">
                <motion.span
                  animate={phase === 'investigating' || phase === 'patching' || phase === 'replaying'
                    ? { opacity: [1, 0.5, 1] }
                    : { opacity: 1 }
                  }
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`text-caption-upper ${statusVariant}`}
                >
                  ● {statusLabel}
                </motion.span>
              </div>
            </div>
            <RunMetricsHeader phase={phase} />
          </div>
        </div>
      </div>

      {/* ── Three-column layout ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-6">

        {/* ── Col 1: Trace Timeline ── */}
        <div>
          <div className="text-caption-upper text-[#6c6a64] mb-3">Execution Trace</div>
          <TraceTimeline
            steps={allSteps}
            selectedId={selectedStepId}
            onSelect={setSelectedStepId}
          />
        </div>

        {/* ── Col 2: Main Panel ── */}
        <div className="space-y-5">
          {/* Context title */}
          <div>
            <div className="text-caption-upper text-[#6c6a64] mb-3">Active Step — {selectedStep?.title || 'Select a step'}</div>
          </div>

          {/* Inspector content */}
          <div className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320]">
            <TraceInspector step={selectedStep} contextFrame={contextFrame} />
          </div>

          {/* Memory Patch */}
          {(phase === 'patching' || phase === 'replaying' || phase === 'recovered') && (
            <div className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320]">
              <MemoryPatchView applied={patchApplied} />
            </div>
          )}

          {/* Replay */}
          {(phase === 'replaying' || phase === 'recovered') && (
            <ReplayPanel onReturnToGame={handleReturnToGame} />
          )}
        </div>

        {/* ── Col 3: Surgeon Panel ── */}
        <div className="space-y-5">
          <SurgeonPanel
            phase={phase}
            diagnosis={diagnosis}
            onApplySurgery={handleApplySurgery}
          />

          {/* Nav shortcuts */}
          <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#252320] space-y-2">
            <div className="text-caption-upper text-[#6c6a64] mb-3">Navigate</div>
            {[
              { href: '/runs', label: 'View Run History', icon: Clock },
              { href: '/memory', label: 'Memory Explorer', icon: Database },
              { href: '/play', label: 'Return to Game', icon: Play },
            ].map(({ href, label, icon: Icon }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#181715] hover:bg-[#252320] transition-colors text-left cursor-pointer"
              >
                <Icon size={13} className="text-[#6c6a64]" />
                <span className="text-xs text-[#a09d96]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
