'use client';

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT PAGE — How it Works — Interactive Architecture
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Nav } from '@/components/navigation/Nav';

const ARCH_NODES = [
  {
    id: 'player',
    label: 'PLAYER',
    x: 50, y: 5,
    description: 'The human participant. Makes decisions, advances the story, observes consequences.',
    detail: 'Every choice the player makes is sent to the Game Master as structured input — not just text, but a structured decision with context about what choices were available.',
    color: '#5db872',
  },
  {
    id: 'game-master',
    label: 'GAME MASTER',
    x: 50, y: 25,
    description: 'The primary AI agent. Runs the world, manages NPCs, generates narrative.',
    detail: 'An LLM agent with access to the game world state, NPC relationship graph, and contextual memory. It interprets player decisions and generates narrative, world updates, and consequences.',
    color: '#cc785c',
  },
  {
    id: 'context-engine',
    label: 'CONTEXT ENGINE',
    x: 50, y: 47,
    description: 'Manages what the Game Master knows. Retrieves, compresses, and prioritizes memory.',
    detail: 'The context engine decides what information the Game Master sees each turn. It retrieves relevant memories, compresses historical dialogue, and maintains an invariant buffer for critical facts.',
    color: '#d4a017',
  },
  {
    id: 'trace',
    label: 'TRACE',
    x: 50, y: 67,
    description: 'A complete record of every execution step — every LLM call, tool use, and decision.',
    detail: 'Every step of every turn is logged with full metadata: token counts, latency, costs, input/output content, tool calls. The trace is the foundation of observability.',
    color: '#cc785c',
  },
  {
    id: 'context-surgeon',
    label: 'CONTEXT SURGEON',
    x: 50, y: 82,
    description: 'The secondary AI system. Watches the trace, detects failures, orchestrates repair.',
    detail: 'The Context Surgeon continuously monitors the trace for anomalies. When a constraint violation is detected, it reads the full execution history, identifies the root cause, constructs a targeted context patch, and orchestrates the replay.',
    color: '#cc785c',
  },
  {
    id: 'patch',
    label: 'PATCH',
    x: 28, y: 95,
    description: 'A surgical correction to the context window — adding back what was lost.',
    detail: 'The patch is a precise modification to the Game Master\'s active context. It doesn\'t rewrite history — it restores missing information so the next execution has what it needs.',
    color: '#5db872',
  },
  {
    id: 'replay',
    label: 'REPLAY',
    x: 72, y: 95,
    description: 'Re-execution of the failed step with the patched context.',
    detail: 'The Surgeon replays the specific failed turn with the corrected context. The result is compared against the original — showing exactly what changed and why.',
    color: '#5db872',
  },
];

const CONNECTIONS = [
  { from: 'player', to: 'game-master', label: 'decision' },
  { from: 'game-master', to: 'context-engine', label: 'retrieval' },
  { from: 'context-engine', to: 'trace', label: 'logs' },
  { from: 'trace', to: 'context-surgeon', label: 'monitors' },
  { from: 'context-surgeon', to: 'patch', label: 'constructs' },
  { from: 'context-surgeon', to: 'replay', label: 'orchestrates' },
];

function ArchDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const activeNode = ARCH_NODES.find(n => n.id === active);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      {/* Node list */}
      <div className="space-y-2">
        {ARCH_NODES.map((node, i) => (
          <motion.button
            key={node.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => setActive(active === node.id ? null : node.id)}
            className={[
              'w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer group',
              active === node.id
                ? 'border-[#cc785c]/50 bg-[#cc785c]/5'
                : 'border-[#e6dfd8] bg-[#faf9f5] hover:border-[#cc785c]/30 hover:bg-[#f5f0e8]',
            ].join(' ')}
            aria-pressed={active === node.id}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
              <span className="font-mono text-xs font-medium text-[#141413] tracking-wide">{node.label}</span>
            </div>
            <p className="text-xs text-[#8e8b82] mt-1 ml-5 leading-relaxed">{node.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Detail panel */}
      <div className="sticky top-24">
        <AnimatePresence mode="wait">
          {activeNode ? (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-6 rounded-xl border border-[#e6dfd8] bg-[#faf9f5]"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeNode.color }} />
                <span className="font-mono text-xs font-medium text-[#141413] tracking-wide">{activeNode.label}</span>
              </div>
              <p className="text-sm text-[#3d3d3a] leading-relaxed">{activeNode.detail}</p>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 rounded-xl border border-dashed border-[#e6dfd8] flex items-center justify-center"
              style={{ minHeight: 160 }}
            >
              <p className="text-sm text-[#8e8b82] text-center">
                Click any component to learn how it works
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const PRINCIPLES = [
  {
    label: 'Complete Observability',
    desc: 'Every execution step is traced. Token counts, latency, cost, and content are logged for every LLM call and tool use.',
  },
  {
    label: 'Context as First-Class State',
    desc: 'The context window isn\'t just implementation detail — it\'s a first-class system component with its own lifecycle: creation, retrieval, compression, loss, recovery.',
  },
  {
    label: 'Failure as a Feature',
    desc: 'The system is designed to fail visibly, not silently. When context is lost, the trace shows exactly where, when, and why.',
  },
  {
    label: 'Surgical Repair',
    desc: 'Recovery doesn\'t restart the system. It identifies the precise missing information and restores only what\'s needed — a targeted patch, not a full reset.',
  },
  {
    label: 'Replayability',
    desc: 'Every execution can be replayed. This makes the comparison between "what the AI did" and "what the AI should have done" explicit and auditable.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <Nav variant="light" />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-caption-upper text-[#cc785c] mb-6">How it Works</div>
            <h1 className="text-display-lg text-[#141413] mb-6">
              The AI doesn&apos;t just produce a result.
            </h1>
            <p className="text-display-sm text-[#6c6a64] font-serif" style={{ letterSpacing: '-0.015em' }}>
              It leaves evidence behind.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-16 px-6 bg-[#f5f0e8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-caption-upper text-[#6c6a64] mb-6">System Architecture</div>
          <ArchDiagram />
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-caption-upper text-[#6c6a64] mb-10">Design Principles</div>
          <div className="space-y-0 divide-y divide-[#e6dfd8]">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="py-6 grid md:grid-cols-[200px_1fr] gap-4"
              >
                <div className="font-medium text-sm text-[#141413]">{p.label}</div>
                <p className="text-sm text-[#6c6a64] leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Glass Box Track */}
      <section className="py-16 px-6 bg-[#181715]">
        <div className="max-w-4xl mx-auto">
          <div className="text-caption-upper text-[#cc785c] mb-4">Hackathon Track</div>
          <h2 className="text-display-md text-[#faf9f5] mb-6">The Glass Box Problem</h2>
          <p className="text-sm text-[#a09d96] leading-relaxed max-w-2xl mb-8">
            This project was built for the Glass Box Problem track — which asks: can we build AI systems that are fully transparent about their internal state, failures, and reasoning? The Glass Game is our answer: a system where the AI&apos;s context failures are not just logged, but diagnosed, repaired, and demonstrated in real time.
          </p>
          <div className="flex gap-3">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#cc785c] text-white rounded-lg text-sm font-medium hover:bg-[#a9583e] transition-colors"
            >
              Enter the Game
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/glass-box"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#252320] text-[#faf9f5] rounded-lg text-sm font-medium hover:bg-[#2f2d2a] transition-colors border border-[#3a3835]"
            >
              Open Glass Box
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#181715] py-10 px-6 border-t border-[#252320]">
        <div className="max-w-4xl mx-auto text-center text-xs text-[#6c6a64]">
          The Glass Game — Built for The Glass Box Problem hackathon
        </div>
      </footer>
    </div>
  );
}
