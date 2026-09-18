'use client';

// ─────────────────────────────────────────────────────────────────────────────
// RUN DETAIL PAGE — Replayable execution trace
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { Nav } from '@/components/navigation/Nav';
import { runService } from '@/services/runService';
import { buildFailureTrace, buildSurgeonSteps } from '@/services/traceService';
import type { Run, TraceStep } from '@/types';

const ALL_STEPS = [...buildFailureTrace(18), ...buildSurgeonSteps()];

const statusColor = (s: TraceStep['status']) => ({
  success:   'text-[#5db872]',
  failed:    'text-[#c64545]',
  warning:   'text-[#d4a017]',
  recovered: 'text-[#cc785c]',
  running:   'text-[#d4a017]',
  pending:   'text-[#6c6a64]',
}[s] || 'text-[#6c6a64]');

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [steps] = useState<TraceStep[]>(ALL_STEPS);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const found = runService.getRun(id);
    if (found) {
      // eslint-disable-next-line
      setRun(found);
    } else {
      // Generate a mock run for display
      setRun({
        id,
        runNumber: 184,
        status: 'recovered',
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        completedAt: new Date().toISOString(),
        turnCount: 18,
        failureTurn: 18,
        failureType: 'Constraint Violation',
        metrics: {
          totalTokens: 8421,
          totalCost: 0.0182,
          avgLatencyMs: 482,
          totalSteps: 14,
          llmCalls: 3,
          toolCalls: 2,
          recoveryTimeMs: 1800,
          originalCost: 0.0182,
          healedCost: 0.0211,
        },
        trace: steps,
        gameState: {} as never,
      });
    }
  }, [id, steps]);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, steps.length]);

  if (!run) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <div className="text-[#8e8b82] text-sm font-mono">Loading run...</div>
      </div>
    );
  }

  const currentStep = steps[activeStep];

  return (
    <div className="min-h-screen bg-[#181715] text-[#faf9f5]">
      <Nav variant="dark" />

      <div className="pt-20 pb-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back */}
          <button
            onClick={() => router.push('/runs')}
            className="flex items-center gap-1.5 text-xs text-[#6c6a64] hover:text-[#a09d96] mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            All Runs
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-2xl text-[#faf9f5]">RUN #{String(run.runNumber).padStart(4, '0')}</span>
              <span className={`text-caption-upper ${run.status === 'recovered' ? 'text-[#cc785c]' : run.status === 'completed' ? 'text-[#5db872]' : 'text-[#c64545]'}`}>
                {run.status}
              </span>
            </div>
            <div className="text-xs text-[#6c6a64]">
              {run.failureTurn ? `Failure at Turn ${run.failureTurn} · ${run.failureType}` : `${run.turnCount} turns`}
              {' · '}{new Date(run.startedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {[
              { label: 'Tokens',    value: run.metrics.totalTokens.toLocaleString() },
              { label: 'Cost',      value: `$${run.metrics.totalCost.toFixed(4)}` },
              { label: 'Latency',   value: `${Math.round(run.metrics.avgLatencyMs)}ms` },
              { label: 'Steps',     value: run.metrics.totalSteps },
              { label: 'LLM Calls', value: run.metrics.llmCalls },
              { label: 'Recovery',  value: run.metrics.recoveryTimeMs ? `${(run.metrics.recoveryTimeMs / 1000).toFixed(1)}s` : '—' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-lg bg-[#1f1e1b] border border-[#252320]">
                <div className="text-[9px] font-mono text-[#6c6a64] uppercase tracking-wider mb-1">{m.label}</div>
                <div className="text-sm font-mono text-[#a09d96]">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Timeline + Inspector */}
          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            {/* Timeline */}
            <div className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320]">
              <div className="text-caption-upper text-[#6c6a64] mb-4">Execution Timeline</div>
              <div className="relative">
                {/* Progress bar */}
                <div className="h-1 bg-[#252320] rounded-full mb-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#cc785c] rounded-full"
                    animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Steps */}
                <div className="flex gap-1 flex-wrap">
                  {steps.map((step, i) => (
                    <button
                      key={step.id}
                      onClick={() => { setActiveStep(i); setIsPlaying(false); }}
                      className={[
                        'w-8 h-8 rounded-lg border text-[10px] font-mono transition-all cursor-pointer',
                        i === activeStep
                          ? 'border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] scale-110'
                          : i < activeStep
                          ? `border-transparent bg-[#252320] ${statusColor(step.status)}`
                          : 'border-[#2a2826] bg-transparent text-[#3a3835]',
                      ].join(' ')}
                      aria-label={`Jump to step ${i + 1}: ${step.title}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#252320]">
                <button onClick={() => { setActiveStep(0); setIsPlaying(false); }} className="p-2 rounded-lg bg-[#252320] hover:bg-[#2f2d2a] transition-colors cursor-pointer" aria-label="Go to start">
                  <SkipBack size={14} className="text-[#a09d96]" />
                </button>
                <button onClick={() => setActiveStep(Math.max(0, activeStep - 1))} className="p-2 rounded-lg bg-[#252320] hover:bg-[#2f2d2a] transition-colors cursor-pointer" aria-label="Previous step">
                  <ChevronLeft size={14} className="text-[#a09d96]" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium transition-colors cursor-pointer"
                  aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  {isPlaying ? 'Pause' : 'Replay'}
                </button>
                <button onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))} className="p-2 rounded-lg bg-[#252320] hover:bg-[#2f2d2a] transition-colors cursor-pointer" aria-label="Next step">
                  <ChevronRight size={14} className="text-[#a09d96]" />
                </button>
                <button onClick={() => { setActiveStep(steps.length - 1); setIsPlaying(false); }} className="p-2 rounded-lg bg-[#252320] hover:bg-[#2f2d2a] transition-colors cursor-pointer" aria-label="Go to end">
                  <SkipForward size={14} className="text-[#a09d96]" />
                </button>

                {/* Speed */}
                <div className="ml-auto flex gap-1">
                  {[0.5, 1, 2].map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${speed === s ? 'bg-[#cc785c]/20 text-[#cc785c]' : 'text-[#6c6a64] hover:text-[#a09d96]'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Step Inspector */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-5 rounded-xl bg-[#1f1e1b] border border-[#252320]"
              >
                <div className="text-caption-upper text-[#6c6a64] mb-3">
                  Step {activeStep + 1} of {steps.length}
                </div>
                <h3 className="font-serif text-lg text-[#faf9f5] mb-1" style={{ letterSpacing: '-0.01em' }}>
                  {currentStep.title}
                </h3>
                <p className="text-xs text-[#6c6a64] leading-relaxed mb-4">
                  {currentStep.description}
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Type',    value: currentStep.type.replace(/_/g, ' ') },
                    { label: 'Status',  value: currentStep.status },
                    { label: 'Latency', value: currentStep.durationMs > 0 ? `${currentStep.durationMs}ms` : '—' },
                    { label: 'Tokens',  value: currentStep.tokens ? currentStep.tokens.toLocaleString() : '—' },
                    { label: 'Cost',    value: currentStep.cost ? `$${currentStep.cost.toFixed(4)}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wide">{label}</span>
                      <span className={`text-xs font-mono ${label === 'Status' ? statusColor(currentStep.status) : 'text-[#a09d96]'}`}>
                        {typeof value === 'string' ? value.toUpperCase() : value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
