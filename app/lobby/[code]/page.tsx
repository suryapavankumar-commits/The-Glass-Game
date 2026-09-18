'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Shield, ArrowRight, Loader2, Sparkles, LogOut } from 'lucide-react';
import { Room, RoomPlayer } from '@/types';
import { roomClient, PlayerSession } from '@/services/roomClient';
import { Nav } from '@/components/navigation/Nav';

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const saved = roomClient.getSession(code);
    setSession(saved);
  }, [code]);

  // Subscribe to room updates (polling every 1.2s)
  useEffect(() => {
    const unsubscribe = roomClient.subscribeToRoom(
      code,
      (updatedRoom) => {
        setRoom(updatedRoom);
        // When host starts game, transition all players
        if (updatedRoom.status === 'playing') {
          router.push(`/play?room=${code}`);
        }
      },
      (err) => {
        setError(err.message || 'Error connecting to room');
      },
      1200
    );

    return () => unsubscribe();
  }, [code, router]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = async () => {
    if (!session || !session.playerId) return;
    setStarting(true);
    setError(null);
    try {
      await roomClient.startGame(code, session.playerId);
      router.push(`/play?room=${code}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
      setStarting(false);
    }
  };

  const isHost = session?.isHost || (room && session && room.hostId === session.playerId);

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans text-[#141413]">
      <Nav />

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl bg-white border border-[#e6dfd8] rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header Banner */}
          <div className="bg-[#181715] p-8 text-center text-[#faf9f5] relative border-b border-[#2a2926]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#252320] border border-[#383530] text-[11px] font-mono text-[#cc785c] uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
              Shared Citadel Assembly
            </div>

            <h1 className="text-2xl md:text-3xl font-serif tracking-tight mb-2 text-[#f5efe6]">
              THE GLASS GAME
            </h1>
            <p className="text-xs text-[#a09d96] font-mono">
              REALTIME MULTIPLAYER LOBBY • AUTHORITATIVE STATE
            </p>

            {/* Room Code Badge */}
            <div className="mt-6 inline-flex flex-col items-center">
              <span className="text-[10px] font-mono text-[#8c8880] uppercase tracking-widest mb-1">
                ROOM CODE
              </span>
              <div className="flex items-center gap-3 bg-[#252320] border border-[#3d3a34] rounded-xl px-6 py-3 shadow-inner">
                <span className="text-3xl md:text-4xl font-mono font-bold tracking-[0.25em] text-[#ffeedd]">
                  {code}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-[#302d28] hover:bg-[#3d3a34] text-[#cc785c] transition-colors cursor-pointer"
                  title="Copy Room Code"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
              </div>
              {copied && (
                <span className="text-[10px] font-mono text-emerald-400 mt-1">Code copied to clipboard</span>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Capacity Status */}
            <div className="flex items-center justify-between border-b border-[#f0ece4] pb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#cc785c]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#6c6a64]">
                  Capacity
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-[#141413]">
                  {room ? room.players.length : '...'} / 10 PLAYERS CONNECTED
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-xs ${
                        room && i < room.players.length ? 'bg-[#cc785c]' : 'bg-[#e6dfd8]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#c64545]/10 border border-[#c64545]/30 text-xs text-[#c64545] font-mono">
                {error}
              </div>
            )}

            {/* Players Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-[#8c8880] uppercase tracking-widest block">
                CONNECTED CITADEL ENTITIES
              </span>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {room?.players.map((p, idx) => {
                  const isCurrent = session?.playerId === p.id;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-[#faf6f0] border-[#cc785c] shadow-xs'
                          : 'bg-[#faf9f5] border-[#e6dfd8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#141413] truncate font-sans">
                              {p.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-semibold px-1 rounded bg-[#cc785c]/15 text-[#cc785c]">
                                YOU
                              </span>
                            )}
                            {p.isHost && (
                              <span className="text-[9px] font-mono px-1 rounded bg-[#181715] text-[#faf9f5]">
                                HOST
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wider truncate">
                            {p.roleLabel}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Actions / Start Controls */}
            <div className="pt-4 border-t border-[#f0ece4] flex flex-col items-center gap-3">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={starting || !room || room.players.length === 0}
                  className="w-full py-4 px-6 rounded-xl bg-[#141413] text-[#faf9f5] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#282724] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {starting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Initiating Shared Simulation...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-[#cc785c]" />
                      <span>START GAME FOR ALL PLAYERS</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-xl bg-[#f0ebe1] border border-[#e6dfd8] text-center flex items-center justify-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-ping" />
                  <span className="text-xs font-mono text-[#6c6a64] uppercase tracking-wider">
                    Waiting for Host to start the Citadel simulation...
                  </span>
                </div>
              )}

              <p className="text-[11px] text-[#8c8880] text-center font-serif italic">
                Share this room code with up to 10 players to inhabit the same physical world and observe the shared Context Engine.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
