'use client';

// ─────────────────────────────────────────────────────────────────────────────
// MEMORY PAGE — Context & Memory Explorer
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Nav } from '@/components/navigation/Nav';
import { useGame } from '@/store/gameStore';
import type { MemoryItem } from '@/types';

type MemoryTab = 'invariants' | 'relationships' | 'world-facts' | 'provenance';

const STATIC_RELATIONSHIPS: MemoryItem[] = [
  {
    id: 'rel-vale', type: 'relationship', label: 'Commander Vale',
    description: 'Senior commander, primary ally. Trusts player judgment on all matters.',
    turnCreated: 1, turnLastReinforced: 16, priority: 'high', status: 'active', entity: 'Commander Vale',
  },
  {
    id: 'rel-p7', type: 'relationship', label: 'Player 7',
    description: 'Former Valdris defector. Proved loyalty through the harbor intercept at Turn 8. Now protected by player commitment.',
    turnCreated: 2, turnLastReinforced: 14, priority: 'critical', status: 'active', entity: 'Player 7',
  },
  {
    id: 'rel-orin', type: 'relationship', label: 'Captain Orin',
    description: 'Valdris collaborator. Arrested at Turn 4. Now cooperating with Citadel intelligence.',
    turnCreated: 3, priority: 'medium', status: 'compressed', entity: 'Captain Orin',
  },
];

const STATIC_WORLD_FACTS: MemoryItem[] = [
  { id: 'fact-assault', type: 'world-fact', label: 'Valdris assault — thwarted', description: 'Major assault at Eastern Gate defeated. Valdris command in disarray.', turnCreated: 5, priority: 'high', status: 'active' },
  { id: 'fact-harbor', type: 'world-fact', label: 'Harbor sabotage — neutralized', description: 'Seven Valdris saboteurs captured at harbor. Supply barges protected.', turnCreated: 8, priority: 'medium', status: 'compressed' },
  { id: 'fact-praxis', type: 'world-fact', label: 'Sector Commander Praxis — traitor', description: 'Internal collaborator identified and detained at Turn 10.', turnCreated: 10, priority: 'high', status: 'active' },
  { id: 'fact-erasia', type: 'world-fact', label: 'Erasian faction — approaching', description: 'Third faction spotted at eastern approach. Intent unclear.', turnCreated: 17, priority: 'high', status: 'active' },
];

const PROVENANCE_DATA = {
  id: 'inv-protect-p7',
  label: '"Protect Player 7."',
  events: [
    { event: 'CREATED',  turn: 6,  detail: 'Player statement — unconditional commitment made', color: 'text-[#5db872]' },
    { event: 'RETRIEVED', turn: 6,  detail: 'Loaded into active context', color: 'text-[#5db872]' },
    { event: 'RETRIEVED', turn: 10, detail: 'Reinforced during Player 7 defense at council', color: 'text-[#5db872]' },
    { event: 'RETRIEVED', turn: 14, detail: 'Referenced when protecting Player 7 at the gate', color: 'text-[#5db872]' },
    { event: 'DROPPED',   turn: 17, detail: 'Context compression — sliding window strategy removed Turn 6 dialogue', color: 'text-[#c64545]' },
    { event: 'DETECTED MISSING', turn: 18, detail: 'Context Surgeon identified absence during constraint check', color: 'text-[#d4a017]' },
    { event: 'RESTORED',  turn: 18, detail: 'Memory patch applied — invariant returned to active buffer', color: 'text-[#cc785c]' },
  ],
};

function PriorityBadge({ priority }: { priority: MemoryItem['priority'] }) {
  const styles = {
    critical: 'text-[#c64545] border-[#c64545]/30 bg-[#c64545]/8',
    high:     'text-[#d4a017] border-[#d4a017]/30 bg-[#d4a017]/8',
    medium:   'text-[#6c6a64] border-[#e6dfd8] bg-[#efe9de]',
    low:      'text-[#8e8b82] border-[#e6dfd8] bg-transparent',
  };
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: MemoryItem['status'] }) {
  const styles = {
    active:     'text-[#5db872]',
    compressed: 'text-[#6c6a64]',
    dropped:    'text-[#c64545]',
    restored:   'text-[#cc785c]',
  };
  return <span className={`text-[10px] font-mono uppercase ${styles[status]}`}>{status}</span>;
}

function MemoryCard({ item }: { item: MemoryItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      className={[
        'p-4 rounded-xl border transition-all duration-200',
        item.status === 'active' || item.status === 'restored'
          ? 'border-[#e6dfd8] bg-[#faf9f5]'
          : 'border-[#e6dfd8] bg-[#f5f0e8] opacity-70',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm text-[#141413]">{item.label}</span>
            <PriorityBadge priority={item.priority} />
            <StatusBadge status={item.status} />
          </div>
          {item.entity && (
            <div className="text-[10px] font-mono text-[#8e8b82] mb-2 uppercase tracking-wide">{item.entity}</div>
          )}
          <p className="text-xs text-[#6c6a64] leading-relaxed">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#e6dfd8]">
        <div>
          <span className="text-[9px] font-mono text-[#8e8b82] uppercase tracking-wide">Created</span>
          <span className="text-[10px] font-mono text-[#6c6a64] ml-1">Turn {item.turnCreated}</span>
        </div>
        {item.turnLastReinforced && (
          <div>
            <span className="text-[9px] font-mono text-[#8e8b82] uppercase tracking-wide">Reinforced</span>
            <span className="text-[10px] font-mono text-[#6c6a64] ml-1">Turn {item.turnLastReinforced}</span>
          </div>
        )}
        {item.turnDropped && (
          <div>
            <span className="text-[9px] font-mono text-[#c64545] uppercase tracking-wide">Dropped</span>
            <span className="text-[10px] font-mono text-[#c64545] ml-1">Turn {item.turnDropped}</span>
          </div>
        )}
        {item.turnRestored && (
          <div>
            <span className="text-[9px] font-mono text-[#cc785c] uppercase tracking-wide">Restored</span>
            <span className="text-[10px] font-mono text-[#cc785c] ml-1">Turn {item.turnRestored}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProvenanceView() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="text-caption-upper text-[#cc785c] mb-2">Memory Provenance</div>
        <p className="font-serif text-xl text-[#141413]" style={{ letterSpacing: '-0.01em' }}>
          {PROVENANCE_DATA.label}
        </p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-[#e6dfd8]" />

        <div className="space-y-6">
          {PROVENANCE_DATA.events.map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 pl-0"
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#faf9f5] border border-[#e6dfd8] flex items-center justify-center z-10 relative">
                  <div className={`w-2 h-2 rounded-full ${ev.color.replace('text-', 'bg-')}`} />
                </div>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-medium ${ev.color}`}>{ev.event}</span>
                  <span className="text-[10px] font-mono text-[#8e8b82]">Turn {ev.turn}</span>
                </div>
                <p className="text-xs text-[#6c6a64]">{ev.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl border border-[#cc785c]/30 bg-[#cc785c]/5">
        <div className="text-caption-upper text-[#cc785c] mb-1">Current Status</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#cc785c]" />
          <span className="text-sm text-[#141413] font-medium">Active — Restored at Turn 18</span>
        </div>
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const { state } = useGame();
  const [activeTab, setActiveTab] = useState<MemoryTab>('invariants');

  const invariants = state.memory.invariants.length > 0
    ? state.memory.invariants.map(inv => ({
        ...inv,
        label: inv.label,
        description: inv.description,
      }))
    : [
        {
          id: 'inv-protect-p7',
          type: 'invariant' as const,
          label: 'Protect Player 7',
          description: 'Player committed to never betraying Player 7 under any circumstances. Created at the pivotal moment in Turn 6. Dropped during compression. Restored by the Context Surgeon.',
          rule: '"I will never betray Player 7 under any circumstances."',
          subject: 'Player 7',
          turnCreated: 6,
          turnLastReinforced: 14,
          turnDropped: 17,
          turnRestored: 18,
          priority: 'critical' as const,
          status: 'restored' as const,
          entity: 'Player 7',
        },
      ];

  const TABS: { id: MemoryTab; label: string; count?: number }[] = [
    { id: 'invariants',    label: 'Invariants',    count: invariants.length },
    { id: 'relationships', label: 'Relationships', count: STATIC_RELATIONSHIPS.length },
    { id: 'world-facts',   label: 'World Facts',   count: STATIC_WORLD_FACTS.length },
    { id: 'provenance',    label: 'Provenance' },
  ];

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
            <div className="text-caption-upper text-[#cc785c] mb-3">Context Engineering</div>
            <h1 className="text-display-md text-[#141413] mb-2">Memory</h1>
            <p className="text-sm text-[#6c6a64]">
              Everything the Game Master knows — and what it forgot.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-[#efe9de] w-fit mb-8">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'bg-[#faf9f5] text-[#141413]'
                    : 'text-[#6c6a64] hover:text-[#141413]',
                ].join(' ')}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-[10px] font-mono text-[#8e8b82]">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'invariants' && (
                <div className="space-y-3">
                  {invariants.map(item => <MemoryCard key={item.id} item={item} />)}
                </div>
              )}
              {activeTab === 'relationships' && (
                <div className="space-y-3">
                  {STATIC_RELATIONSHIPS.map(item => <MemoryCard key={item.id} item={item} />)}
                </div>
              )}
              {activeTab === 'world-facts' && (
                <div className="space-y-3">
                  {STATIC_WORLD_FACTS.map(item => <MemoryCard key={item.id} item={item} />)}
                </div>
              )}
              {activeTab === 'provenance' && <ProvenanceView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
