import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextSurgeryVisualizerProps {
  phase: string;
}

export function ContextSurgeryVisualizer({ phase }: ContextSurgeryVisualizerProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (phase === 'context_surgery') {
      setStep(1);
      const timers = [
        setTimeout(() => setStep(2), 1500),
        setTimeout(() => setStep(3), 3000),
        setTimeout(() => setStep(4), 4500),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setStep(0);
    }
  }, [phase]);

  if (phase !== 'context_surgery' && step === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md font-mono"
      >
        <div className="max-w-2xl w-full border border-red-500/30 bg-black/90 p-8 rounded-lg shadow-2xl shadow-red-500/10">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-3"
          >
            <span className="animate-pulse">⚠</span> CONTEXT INTEGRITY COMPROMISED
          </motion.h2>

          <div className="space-y-4 text-sm md:text-base text-gray-300">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : -20 }}
              className="border-l-2 border-orange-500 pl-4 py-1"
            >
              <p className="text-orange-400 font-semibold mb-1">CONTEXT SURGEON ENGAGED</p>
              <p>Isolating narrative contradiction against Canonical Firebase Memory...</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: step >= 2 ? 1 : 0, x: step >= 2 ? 0 : -20 }}
              className="border-l-2 border-red-500 pl-4 py-1"
            >
              <p className="text-red-400 font-semibold mb-1">CONTRADICTION DETECTED</p>
              <p>Input claim violates established chronological facts.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: step >= 3 ? 1 : 0, x: step >= 3 ? 0 : -20 }}
              className="border-l-2 border-green-500 pl-4 py-1"
            >
              <p className="text-green-400 font-semibold mb-1">NARRATIVE REPAIRED</p>
              <p>✓ Established facts preserved</p>
              <p>✓ Contradiction identified as unverified claim</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 4 ? 1 : 0 }}
              className="mt-8 pt-4 border-t border-white/10 text-center text-gray-400"
            >
              Forwarding corrected context to Commander Vale...
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
