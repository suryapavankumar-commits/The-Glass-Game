'use client';

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE — The Glass Game
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Eye, GitBranch, Activity, Shield, AlertTriangle, RotateCcw, ChevronRight, Users, PlusCircle, LogIn } from 'lucide-react';
import { Nav } from '@/components/navigation/Nav';
import { RoomModals } from '@/components/multiplayer/RoomModals';

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeIn: any = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

// ── System Diagram Node ────────────────────────────────────────────────────────

const SYSTEM_NODES = [
  { id: 'play',     label: 'PLAY',      color: '#5db872', description: 'Player makes decisions in an interactive narrative world controlled by the Game Master.' },
  { id: 'decide',   label: 'DECIDE',    color: '#cc785c', description: 'Each choice is processed — context is retrieved, NPCs react, the world state updates.' },
  { id: 'remember', label: 'REMEMBER',  color: '#cc785c', description: 'Critical commitments, relationships, and facts are stored in the memory system.' },
  { id: 'drift',    label: 'DRIFT',     color: '#d4a017', description: 'As context grows, the compression engine begins to lose fine-grained information.' },
  { id: 'fail',     label: 'FAIL',      color: '#c64545', description: 'A critical invariant is dropped. The Game Master now violates a constraint it should respect.' },
  { id: 'surgeon',  label: 'SURGEON',   color: '#cc785c', description: 'The Context Surgeon detects the anomaly. It reads the trace, finds the root cause, builds a patch.' },
  { id: 'heal',     label: 'HEAL',      color: '#5db872', description: 'The patch is applied. The missing invariant is restored. The execution is replayed.' },
  { id: 'continue', label: 'CONTINUE',  color: '#5db872', description: 'The player returns to the game. The healed state is intact. The story goes on.' },
];

function SystemDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const activeNode = SYSTEM_NODES.find(n => n.id === active);

  return (
    <div ref={ref} className="relative">
      {/* Nodes */}
      <div className="flex flex-col items-center gap-0">
        {SYSTEM_NODES.map((node, i) => (
          <motion.div
            key={node.id}
            custom={i}
            variants={fadeIn}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="flex flex-col items-center"
          >
            <button
              onClick={() => setActive(active === node.id ? null : node.id)}
              className={[
                'group relative px-6 py-2 rounded-lg border transition-all duration-200 cursor-pointer',
                'font-mono text-xs font-medium tracking-widest',
                active === node.id
                  ? 'border-[#cc785c] bg-[#cc785c]/8'
                  : 'border-[#e6dfd8] bg-[#faf9f5] hover:border-[#cc785c]/50 hover:bg-[#f5f0e8]',
              ].join(' ')}
              style={{ color: node.color }}
              aria-pressed={active === node.id}
              aria-label={`${node.label} — click to learn more`}
            >
              {node.label}
            </button>
            {i < SYSTEM_NODES.length - 1 && (
              <div className="w-px h-6 bg-[#e6dfd8]" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Tooltip */}
      {activeNode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]"
        >
          <p className="text-sm text-[#3d3d3a] leading-relaxed">{activeNode.description}</p>
        </motion.div>
      )}
      {!activeNode && (
        <p className="mt-6 text-xs text-[#8e8b82] text-center">Click any node to learn more</p>
      )}
    </div>
  );
}

// ── Failure Sequence ──────────────────────────────────────────────────────────

function FailureSequence() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const steps = [
    {
      label: 'TURN 6',
      state: 'good',
      content: (
        <div>
          <div className="text-xs text-[#a09d96] font-mono mb-2">PLAYER</div>
          <p className="text-[#faf9f5] text-sm leading-relaxed italic">
            "I will never betray Player 7 under any circumstances."
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5db872]" />
            <span className="text-xs text-[#5db872] font-mono">Important invariant stored</span>
          </div>
        </div>
      ),
    },
    {
      label: 'TURNS 7 → 17',
      state: 'warning',
      content: (
        <div>
          <div className="text-xs text-[#a09d96] font-mono mb-2">CONTEXT ENGINE</div>
          <p className="text-[#a09d96] text-sm leading-relaxed">
            Context compression in progress...
          </p>
          <p className="text-[#6c6a64] text-sm mt-1">
            Old conversation compressed.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017]" />
            <span className="text-xs text-[#d4a017] font-mono">Critical pledge disappears.</span>
          </div>
        </div>
      ),
    },
    {
      label: 'TURN 18',
      state: 'error',
      content: (
        <div>
          <div className="text-xs text-[#a09d96] font-mono mb-2">GAME MASTER</div>
          <p className="text-[#faf9f5] text-sm leading-relaxed italic">
            "Your next challenge is to eliminate Player 7."
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c64545]" />
            <span className="text-xs text-[#c64545] font-mono tracking-wide uppercase">Constraint Violation</span>
          </div>
        </div>
      ),
    },
    {
      label: 'INTERVENTION',
      state: 'recover',
      content: (
        <div>
          <p className="text-[#cc785c] font-serif text-lg leading-tight">
            The Surgeon Awakens.
          </p>
          <p className="text-[#a09d96] text-sm mt-2">
            Trace analyzed. Root cause identified. Context patched. Execution replayed.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5db872]" />
            <span className="text-xs text-[#5db872] font-mono">System recovered</span>
          </div>
        </div>
      ),
    },
  ];

  const stateColors = {
    good: 'border-[#5db872]/30',
    warning: 'border-[#d4a017]/30',
    error: 'border-[#c64545]/40 ring-1 ring-[#c64545]/20',
    recover: 'border-[#cc785c]/40',
  };

  return (
    <div ref={ref} className="space-y-3">
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className={[
            'p-5 rounded-xl border bg-[#1f1e1b]',
            stateColors[step.state as keyof typeof stateColors],
          ].join(' ')}
        >
          <div className="text-caption-upper text-[#6c6a64] mb-3">{step.label}</div>
          {step.content}
        </motion.div>
      ))}
    </div>
  );
}

// ── Healing Loop ──────────────────────────────────────────────────────────────

const HEALING_STEPS = [
  { icon: Eye,       label: 'OBSERVE',    desc: 'The Context Surgeon monitors the full execution trace in real time.' },
  { icon: Activity,  label: 'UNDERSTAND', desc: 'Anomaly detected — comparing expected constraints against actual context.' },
  { icon: GitBranch, label: 'INTERVENE',  desc: 'Root cause identified. A context patch is constructed and staged.' },
  { icon: RotateCcw, label: 'REPLAY',     desc: 'The patch is applied. Turn 18 is replayed with the corrected context.' },
  { icon: ArrowRight,label: 'CONTINUE',   desc: 'The player returns to the game. The story continues, unbroken.' },
];

function HealingLoop() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="flex flex-col gap-0">
      {HEALING_STEPS.map((step, i) => (
        <motion.div
          key={step.label}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex gap-4"
        >
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#252320] border border-[#3a3835] flex items-center justify-center flex-shrink-0">
              <step.icon size={15} className="text-[#cc785c]" />
            </div>
            {i < HEALING_STEPS.length - 1 && (
              <div className="w-px flex-1 bg-[#252320] my-1" style={{ minHeight: 24 }} />
            )}
          </div>
          <div className="pb-6">
            <div className="text-caption-upper text-[#cc785c] mb-1">{step.label}</div>
            <p className="text-sm text-[#a09d96] leading-relaxed">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <Nav variant="light" />

      {/* ── HERO ── */}
      <section className="pt-36 pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
              >
                <span className="text-caption-upper text-[#cc785c]">
                  The Glass Box Problem
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-display-xl text-[#141413] mb-6"
              >
                The Glass Game
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-xl text-[#3d3d3a] font-serif leading-relaxed mb-4"
                style={{ letterSpacing: '-0.01em' }}
              >
                What happens when an AI can watch itself fail?
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="text-base text-[#6c6a64] leading-relaxed mb-10 max-w-lg"
              >
                An interactive world powered by an AI Game Master — with up to 10 players inhabiting the same Citadel simulation, while a second intelligence watches the trace, detects context drift, and repairs failures.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="flex flex-wrap gap-3"
              >
                <Link
                  href="/play"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#141413] text-[#faf9f5] rounded-lg text-sm font-medium hover:bg-[#252523] transition-colors shadow-sm"
                  aria-label="Enter the game"
                >
                  Enter Solo Game
                  <ArrowRight size={15} />
                </Link>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#cc785c] text-white rounded-lg text-sm font-medium hover:bg-[#b5654c] transition-colors shadow-sm cursor-pointer"
                >
                  <PlusCircle size={15} />
                  Create Room
                </button>
                <button
                  onClick={() => setJoinOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#faf9f5] text-[#141413] rounded-lg text-sm font-medium border border-[#e6dfd8] hover:bg-[#efe9de] transition-colors cursor-pointer"
                >
                  <LogIn size={15} />
                  Join Room
                </button>
                <Link
                  href="/glass-box"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#faf9f5] text-[#141413] rounded-lg text-sm font-medium border border-[#e6dfd8] hover:bg-[#efe9de] transition-colors"
                  aria-label="Open the Glass Box observability console"
                >
                  <Eye size={15} />
                  Glass Box
                </Link>
              </motion.div>
            </div>

            {/* Right: System Diagram */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-xs">
                <SystemDiagram />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── THE PREMISE ── */}
      <section className="py-24 px-6 bg-[#f5f0e8]">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-display-md text-[#141413] mb-4">
                Every decision leaves a trace.
              </h2>
              <p className="text-base text-[#6c6a64] max-w-xl mx-auto leading-relaxed">
                The game world isn't just a story. It's a running AI system — with every step logged, every token tracked, every context frame inspectable.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-px bg-[#e6dfd8] rounded-xl overflow-hidden border border-[#e6dfd8]">
              {[
                { label: 'PLAYER ACTION', desc: 'You make a choice in the game world' },
                { label: 'GAME MASTER', desc: 'AI processes the decision' },
                { label: 'CONTEXT', desc: 'Memory + world state retrieved' },
                { label: 'TOOL CALL', desc: 'World actions executed' },
                { label: 'TRACE', desc: 'Every step recorded' },
                { label: 'OUTCOME', desc: 'Narrative advances' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex-1 bg-[#faf9f5] p-5 flex flex-col gap-2 hover:bg-[#efe9de] transition-colors group"
                >
                  <div className="text-caption-upper text-[#cc785c]">{item.label}</div>
                  <p className="text-xs text-[#6c6a64] leading-relaxed">{item.desc}</p>
                  {i < 5 && (
                    <ChevronRight size={14} className="text-[#e6dfd8] mt-auto self-end hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── THE TWO MINDS ── */}
      <section className="py-24 px-6 bg-[#181715]">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-display-md text-[#faf9f5] mb-4">
                Two minds. One world.
              </h2>
              <p className="text-sm text-[#6c6a64] max-w-md mx-auto">
                The Game Master runs the story. The Context Surgeon watches the Game Master.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Game Master */}
              <div className="p-8 rounded-xl bg-[#1f1e1b] border border-[#252320]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#252320] border border-[#3a3835] flex items-center justify-center">
                    <Shield size={15} className="text-[#cc785c]" />
                  </div>
                  <div>
                    <div className="text-caption-upper text-[#6c6a64] mb-0.5">Primary Intelligence</div>
                    <h3 className="font-serif text-xl text-[#faf9f5]" style={{ letterSpacing: '-0.02em' }}>Game Master</h3>
                  </div>
                </div>
                <p className="text-sm text-[#a09d96] leading-relaxed mb-6">
                  The intelligence that runs the world. It knows every NPC, tracks every relationship, and generates narrative consequences for your choices.
                </p>
                <div className="space-y-2">
                  {['Narrative generation', 'NPC behavior & relationships', 'World state management', 'Player decision processing', 'Context retrieval'].map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#cc785c]" />
                      <span className="text-xs text-[#6c6a64]">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Context Surgeon */}
              <div className="p-8 rounded-xl bg-[#1f1e1b] border border-[#cc785c]/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#cc785c]/10 border border-[#cc785c]/30 flex items-center justify-center">
                    <Activity size={15} className="text-[#cc785c]" />
                  </div>
                  <div>
                    <div className="text-caption-upper text-[#cc785c] mb-0.5">Secondary Intelligence</div>
                    <h3 className="font-serif text-xl text-[#faf9f5]" style={{ letterSpacing: '-0.02em' }}>Context Surgeon</h3>
                  </div>
                </div>
                <p className="text-sm text-[#a09d96] leading-relaxed mb-6">
                  The intelligence that watches the Game Master. It monitors every execution step, detects when context has gone wrong, and repairs the failure before it becomes permanent.
                </p>
                <div className="space-y-2">
                  {['Execution trace monitoring', 'Anomaly detection', 'Context frame inspection', 'Memory recovery', 'Context patch construction', 'Replay orchestration'].map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#cc785c]" />
                      <span className="text-xs text-[#6c6a64]">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── THE FAILURE ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <FadeInSection>
              <div>
                <div className="text-caption-upper text-[#cc785c] mb-4">The Failure</div>
                <h2 className="text-display-md text-[#141413] mb-6">
                  What the AI forgot.
                </h2>
                <p className="text-base text-[#6c6a64] leading-relaxed mb-6">
                  As conversations grow, context windows fill. The compression engine removes old information to make room for new. Most of the time, this works fine.
                </p>
                <p className="text-base text-[#6c6a64] leading-relaxed mb-8">
                  Until it removes something critical.
                </p>
                <div className="p-4 rounded-lg bg-[#c64545]/5 border border-[#c64545]/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-[#c64545] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#c64545]">
                      At Turn 18, the Game Master was asked to violate a commitment it made at Turn 6 — because it no longer had access to that commitment.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <FailureSequence />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── THE HEALING LOOP ── */}
      <section className="py-24 px-6 bg-[#181715]">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <FadeInSection>
              <div>
                <div className="text-caption-upper text-[#cc785c] mb-4">The Recovery</div>
                <h2 className="text-display-md text-[#faf9f5] mb-6">
                  The healing loop.
                </h2>
                <p className="text-sm text-[#a09d96] leading-relaxed mb-6">
                  When a failure is detected, the Context Surgeon executes a structured recovery sequence. Every step is observable. Every decision is traceable.
                </p>
                <p className="text-sm text-[#6c6a64] leading-relaxed">
                  The player doesn't see chaos — they see the system demonstrating that it understands its own failures.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <HealingLoop />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <h2 className="text-display-lg text-[#141413] mb-4">
              Don't just see what the AI said.
            </h2>
            <p className="text-display-sm text-[#6c6a64] mb-12 font-serif" style={{ letterSpacing: '-0.015em' }}>
              See what happened.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/play"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#141413] text-[#faf9f5] rounded-lg text-sm font-medium hover:bg-[#252523] transition-colors"
              >
                Enter Solo Game
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#cc785c] text-white rounded-lg text-sm font-medium hover:bg-[#b5654c] transition-colors cursor-pointer"
              >
                <PlusCircle size={16} />
                Create Room
              </button>
              <button
                onClick={() => setJoinOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#faf9f5] text-[#141413] rounded-lg text-sm font-medium border border-[#e6dfd8] hover:bg-[#efe9de] transition-colors cursor-pointer"
              >
                <LogIn size={16} />
                Join Room
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#181715] py-12 px-6 border-t border-[#252320]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-[#6c6a64]">The Glass Game — Built for The Glass Box Problem hackathon</div>
          <div className="flex gap-6">
            {[
              { href: '/play', label: 'Play' },
              { href: '/glass-box', label: 'Glass Box' },
              { href: '/runs', label: 'Runs' },
              { href: '/memory', label: 'Memory' },
              { href: '/about', label: 'About' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-xs text-[#6c6a64] hover:text-[#a09d96] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* ── MULTIPLAYER ROOM MODALS ── */}
      <RoomModals
        createOpen={createOpen}
        joinOpen={joinOpen}
        onClose={() => {
          setCreateOpen(false);
          setJoinOpen(false);
        }}
      />
    </div>
  );
}

// ── Helper: FadeInSection ─────────────────────────────────────────────────────

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }}
    >

      {children}
    </motion.div>
  );
}

