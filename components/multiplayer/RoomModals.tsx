'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Key, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { roomClient } from '@/services/roomClient';

interface RoomModalsProps {
  createOpen: boolean;
  joinOpen: boolean;
  onClose: () => void;
}

export function RoomModals({ createOpen, joinOpen, onClose }: RoomModalsProps) {
  const router = useRouter();

  // Create Room State
  const [hostName, setHostName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Room State
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setCreateError('Please enter your name.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const { room } = await roomClient.createRoom(hostName.trim());
      onClose();
      router.push(`/lobby/${room.code}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();

    if (cleanCode.length !== 6) {
      setJoinError('Room code must be exactly 6 characters.');
      return;
    }
    if (!playerName.trim()) {
      setJoinError('Please enter your name.');
      return;
    }

    setJoinLoading(true);
    setJoinError(null);

    try {
      const { room } = await roomClient.joinRoom(cleanCode, playerName.trim());
      onClose();
      router.push(`/lobby/${room.code}`);
    } catch (err: any) {
      if (err.code === 'ROOM_FULL') {
        setJoinError('ROOM FULL — 10 / 10 PLAYERS CONNECTED');
      } else if (err.code === 'ROOM_NOT_FOUND') {
        setJoinError('ROOM NOT FOUND — Verify the 6-character code');
      } else if (err.code === 'GAME_ALREADY_STARTED') {
        setJoinError('GAME ALREADY STARTED — Room is in session');
      } else {
        setJoinError(err.message || 'Failed to join room');
      }
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {(createOpen || joinOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-[#faf9f5] border border-[#e6dfd8] rounded-xl shadow-2xl p-6 relative overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6c6a64] hover:text-[#141413] hover:bg-[#eae4dc] transition-colors"
            >
              <X size={18} />
            </button>

            {/* ── CREATE ROOM MODAL ── */}
            {createOpen && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#cc785c]" />
                  <span className="text-[11px] font-mono text-[#cc785c] uppercase tracking-widest">
                    Multiplayer Session
                  </span>
                </div>
                <h3 className="text-xl font-serif text-[#141413] font-medium mb-1">Create a Room</h3>
                <p className="text-xs text-[#6c6a64] mb-6">
                  Host an authoritative Citadel simulation for up to 10 players.
                </p>

                {createError && (
                  <div className="mb-4 p-3 rounded-lg bg-[#c64545]/10 border border-[#c64545]/30 flex items-start gap-2.5 text-xs text-[#c64545]">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider mb-1.5">
                      Your Name / Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Surya or Commander Vale"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      maxLength={24}
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#e6dfd8] text-sm text-[#141413] placeholder:text-[#a09d96] focus:outline-none focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c] transition-all font-sans"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-[#f0ebe1] border border-[#e6dfd8] flex items-center gap-3">
                    <Users size={16} className="text-[#cc785c]" />
                    <span className="text-xs text-[#6c6a64]">
                      Capacity: <strong className="text-[#141413]">10 Players Max</strong> (Server-enforced)
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full mt-2 py-3 px-4 rounded-lg bg-[#141413] text-[#faf9f5] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#282724] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Generating Room...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Room & Enter Lobby</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── JOIN ROOM MODAL ── */}
            {joinOpen && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#cc785c]" />
                  <span className="text-[11px] font-mono text-[#cc785c] uppercase tracking-widest">
                    Enter Citadel
                  </span>
                </div>
                <h3 className="text-xl font-serif text-[#141413] font-medium mb-1">Join a Room</h3>
                <p className="text-xs text-[#6c6a64] mb-6">
                  Enter the 6-character room code to join an active lobby.
                </p>

                {joinError && (
                  <div className="mb-4 p-3 rounded-lg bg-[#c64545]/10 border border-[#c64545]/30 flex items-start gap-2.5 text-xs text-[#c64545] font-mono">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider mb-1.5">
                      Room Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ABC7K2"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        autoFocus
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#e6dfd8] text-base font-mono font-bold tracking-widest text-[#141413] placeholder:text-[#a09d96] focus:outline-none focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c] uppercase transition-all"
                      />
                      <Key size={16} className="absolute right-3.5 top-3 text-[#a09d96]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider mb-1.5">
                      Your Name / Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maya or Operative 03"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={24}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#e6dfd8] text-sm text-[#141413] placeholder:text-[#a09d96] focus:outline-none focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c] transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joinLoading}
                    className="w-full mt-2 py-3 px-4 rounded-lg bg-[#cc785c] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#b5654c] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    {joinLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying Room...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Room</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
