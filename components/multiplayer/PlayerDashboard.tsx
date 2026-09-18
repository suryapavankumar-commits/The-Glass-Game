import React from 'react';
import { motion } from 'framer-motion';
import { RoomPlayer, GameState } from '@/types';

interface PlayerDashboardProps {
  player: RoomPlayer;
  gameState: GameState;
}

export function PlayerDashboard({ player, gameState }: PlayerDashboardProps) {
  // If the game is generating or verifying context, show a cinematic phase loader
  const isProcessing = ['generating_situation', 'verifying_context', 'context_surgery', 'commander_decision', 'assigning_objectives'].includes(gameState.phase);

  return (
    <div className="absolute top-4 left-4 z-40 max-w-sm pointer-events-none">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-4 font-mono shadow-2xl pointer-events-auto">
        <h3 className="text-orange-400 font-bold mb-1 uppercase text-sm tracking-wider">
          {player.name} — {player.roleLabel}
        </h3>
        <div className="h-px bg-gradient-to-r from-orange-500/50 to-transparent w-full mb-3" />
        
        {isProcessing ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-center gap-3 text-cyan-400 text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>
              {gameState.phase.replace('_', ' ').toUpperCase()}...
            </span>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Global Orders</p>
              <p className="text-sm text-gray-200">
                {gameState.latestDecision?.globalOrders || "Awaiting orders..."}
              </p>
            </div>
            
            {player.privateObjective && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                <p className="text-xs text-orange-400 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Private Objective</span>
                  <span className="text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded">CLASSIFIED</span>
                </p>
                <p className="text-sm text-orange-100">
                  {player.privateObjective.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
