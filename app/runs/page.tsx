'use client';

// ─────────────────────────────────────────────────────────────────────────────
// RUNS PAGE — Run History Explorer
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Nav } from '@/components/navigation/Nav';
import { runService } from '@/services/runService';
import type { Run } from '@/types';

type Filter = 'all' | 'completed' | 'failed' | 'recovered';

const statusConfig = {
  completed: { label: 'Completed', color: 'text-[#5db872]', dot: 'bg-[#5db872]' },
  failed:    { label: 'Failed',    color: 'text-[#c64545]', dot: 'bg-[#c64545]' },
  recovered: { label: 'Recovered', color: 'text-[#cc785c]', dot: 'bg-[#cc785c]' },
  'in-progress': { label: 'In Progress', color: 'text-[#d4a017]', dot: 'bg-[#d4a017]' },
};

function RunCard({ run, index }: { run: Run; index: number }) {
  const cfg = statusConfig[run.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        href={`/runs/${run.id}`}
        className="block p-5 rounded-xl border border-[#e6dfd8] bg-[#faf9f5] hover:bg-[#f5f0e8] hover:border-[#cc785c]/30 transition-all duration-200 group"
        aria-label={`View run ${run.runNumber} details`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-sm font-medium text-[#141413]">
                  RUN #{String(run.runNumber).padStart(4, '0')}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wide ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="text-xs text-[#8e8b82]">
                {run.failureTurn ? `Turn ${run.failureTurn} · ${run.failureType}` : `${run.turnCount} turns completed`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wide mb-0.5">Tokens</div>
              <div className="text-sm font-mono text-[#3d3d3a]">{run.metrics.totalTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wide mb-0.5">Cost</div>
              <div className="text-sm font-mono text-[#3d3d3a]">${run.metrics.totalCost.toFixed(4)}</div>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wide mb-0.5">Latency</div>
              <div className="text-sm font-mono text-[#3d3d3a]">{Math.round(run.metrics.avgLatencyMs)}ms</div>
            </div>
            <div className="text-[#cc785c] opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</div>
          </div>
        </div>

        {run.status === 'recovered' && run.metrics.recoveryTimeMs && (
          <div className="mt-3 pt-3 border-t border-[#e6dfd8] flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#cc785c]" />
            <span className="text-[10px] font-mono text-[#cc785c]">
              Context surgery applied · {(run.metrics.recoveryTimeMs / 1000).toFixed(1)}s recovery
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    setRuns(runService.getRuns());
  }, []);

  const filtered = filter === 'all' ? runs : runs.filter(r => r.status === filter);

  const counts = {
    all: runs.length,
    completed: runs.filter(r => r.status === 'completed').length,
    failed: runs.filter(r => r.status === 'failed').length,
    recovered: runs.filter(r => r.status === 'recovered').length,
  };

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <Nav variant="light" />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="text-caption-upper text-[#cc785c] mb-3">Observability</div>
            <h1 className="text-display-md text-[#141413] mb-2">Runs</h1>
            <p className="text-sm text-[#6c6a64]">Every game session — every failure, recovery, and completion.</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Total Runs',   value: runs.length },
              { label: 'Recovered',    value: counts.recovered, color: 'text-[#cc785c]' },
              { label: 'Completed',    value: counts.completed, color: 'text-[#5db872]' },
              { label: 'Failed',       value: counts.failed, color: 'text-[#c64545]' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl border border-[#e6dfd8] bg-[#faf9f5]">
                <div className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wide mb-1">{s.label}</div>
                <div className={`text-2xl font-mono font-medium ${s.color || 'text-[#141413]'}`}>{s.value}</div>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[#efe9de] w-fit">
            {(['all', 'recovered', 'completed', 'failed'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize cursor-pointer',
                  filter === f
                    ? 'bg-[#faf9f5] text-[#141413]'
                    : 'text-[#6c6a64] hover:text-[#141413]',
                ].join(' ')}
              >
                {f} {f !== 'all' && `(${counts[f]})`}
              </button>
            ))}
          </div>

          {/* Run list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-[#8e8b82] text-sm">
                No runs yet. Play the game to generate runs.
              </div>
            ) : (
              filtered.map((run, i) => (
                <RunCard key={run.id} run={run} index={i} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
