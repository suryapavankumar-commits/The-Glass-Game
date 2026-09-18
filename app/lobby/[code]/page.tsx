'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Shield, ArrowRight, Loader2, Sparkles, LogOut, UserMinus, UserX, Trash2 } from 'lucide-react';
import { Room, RoomPlayer } from '@/types';
import { roomClient, PlayerSession } from '@/services/roomClient';
import { Nav } from '@/components/navigation/Nav';

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(() => roomClient.getCachedRoom(code));
  const [session, setSession] = useState<PlayerSession | null>(() => roomClient.getSession(code));
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preload the 1.8MB 3D human model in background while players wait in the lobby
  // Ensures 3D characters load instantly when entering the Citadel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'fetch';
      link.href = '/models/readyplayer.me.glb';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      return () => {
        try {
          document.head.removeChild(link);
        } catch {}
      };
    }
  }, []);

  // Load / refresh session from localStorage on mount
  useEffect(() => {
    const saved = roomClient.getSession(code);
    if (saved) setSession(saved);
  }, [code]);

  // Subscribe to room updates (fast 800ms polling with Firestore resilience)
  useEffect(() => {
    let confirmedInRoom = Boolean(roomClient.getCachedRoom(code)?.players.some((p) => p.id === roomClient.getSession(code)?.playerId));
    let failCount = 0;

    const unsubscribe = roomClient.subscribeToRoom(
      code,
      (updatedRoom) => {
        failCount = 0;
        setError(null);
        setRoom(updatedRoom);

        // Check if non-host player was kicked from room (only after confirmed presence)
        const currentSession = roomClient.getSession(code);
        if (currentSession && !currentSession.isHost) {
          const stillInRoom = updatedRoom.players.some((p) => p.id === currentSession.playerId);
          if (stillInRoom) {
            confirmedInRoom = true;
          } else if (confirmedInRoom) {
            roomClient.clearSession(code);
            alert('You have been removed from this Citadel room by the Commander.');
            router.push('/');
            return;
          }
        }

        // When host starts game, transition all players
        if (updatedRoom.status === 'playing') {
          router.push(`/play?room=${code}`);
        }
      },
      (err) => {
        failCount++;
        const currentSession = roomClient.getSession(code);
        if (failCount >= 2 && err.message && (err.message.includes('not found') || err.message.includes('ROOM_NOT_FOUND'))) {
          if (currentSession && !currentSession.isHost) {
            roomClient.clearSession(code);
            alert('This Citadel room has been deleted by the Commander.');
            router.push('/');
            return;
          }
        }
        // Only display visible error banner if multiple consecutive polls fail
        if (failCount >= 3) {
          setError(err.message || 'Error connecting to room');
        }
      },
      800
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

  const handleRemovePlayer = async (targetPlayer: RoomPlayer) => {
    if (!session || !session.playerId || actionLoading) return;
    if (!window.confirm(`Remove operative "${targetPlayer.name}" from the Citadel room?`)) return;

    setActionLoading(targetPlayer.id);
    setError(null);
    try {
      const updated = await roomClient.removePlayer(code, session.playerId, targetPlayer.id);
      setRoom(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to remove player');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAll = async () => {
    if (!session || !session.playerId || actionLoading) return;
    if (!window.confirm('Remove ALL visiting operatives from the room? Only you (the Commander) will remain.')) return;

    setActionLoading('removeAll');
    setError(null);
    try {
      const updated = await roomClient.removeAllPlayers(code, session.playerId);
      setRoom(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to remove all operatives');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!session || !session.playerId || actionLoading) return;
    if (!window.confirm('DANGER: Permanently delete this room? All connected operatives will be disconnected.')) return;

    setActionLoading('delete');
    setError(null);
    try {
      await roomClient.deleteRoom(code, session.playerId);
      roomClient.clearSession(code);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete room');
      setActionLoading(null);
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8c8880] uppercase tracking-widest block">
                  CONNECTED CITADEL ENTITIES
                </span>
                {isHost && room && room.players.length > 1 && (
                  <span className="text-[10px] font-mono text-[#8c8880]">
                    Hover to manage operatives
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {room?.players.map((p, idx) => {
                  const isCurrent = session?.playerId === p.id;
                  const canKick = isHost && !p.isHost && p.id !== session?.playerId;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all group ${
                        isCurrent
                          ? 'bg-[#faf6f0] border-[#cc785c] shadow-xs'
                          : 'bg-[#faf9f5] border-[#e6dfd8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <div className="truncate flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#141413] truncate font-sans">
                              {p.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-semibold px-1 rounded bg-[#cc785c]/15 text-[#cc785c] shrink-0">
                                YOU
                              </span>
                            )}
                            {p.isHost && (
                              <span className="text-[9px] font-mono px-1 rounded bg-[#181715] text-[#faf9f5] shrink-0">
                                HOST
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wider truncate">
                            {p.roleLabel}
                          </div>
                        </div>
                      </div>

                      {/* Remove specific person button (Host only) */}
                      {canKick && (
                        <button
                          onClick={() => handleRemovePlayer(p)}
                          disabled={actionLoading === p.id}
                          title={`Remove ${p.name} from room`}
                          className="ml-2 p-1.5 rounded-md text-[#8c8880] hover:text-[#c64545] hover:bg-[#c64545]/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {actionLoading === p.id ? (
                            <Loader2 size={14} className="animate-spin text-[#c64545]" />
                          ) : (
                            <UserMinus size={14} />
                          )}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Creator / Host Administrative Controls Bar */}
            {isHost && (
              <div className="pt-3 pb-1 border-t border-[#f0ece4] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8c8880]">
                  <Shield size={13} className="text-[#cc785c]" />
                  <span>COMMANDER CONTROLS</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Remove All */}
                  <button
                    onClick={handleRemoveAll}
                    disabled={actionLoading !== null || !room || room.players.length <= 1}
                    title="Remove all visiting operatives from the room"
                    className="px-2.5 py-1.5 rounded-lg border border-[#e6dfd8] hover:border-[#cc785c] bg-white hover:bg-[#faf6f0] text-[#6c6a64] hover:text-[#cc785c] text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'removeAll' ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <UserX size={12} />
                    )}
                    <span>REMOVE ALL ({Math.max(0, (room?.players.length || 1) - 1)})</span>
                  </button>

                  {/* Delete Room */}
                  <button
                    onClick={handleDeleteRoom}
                    disabled={actionLoading !== null}
                    title="Permanently delete room"
                    className="px-2.5 py-1.5 rounded-lg border border-[#c64545]/30 hover:border-[#c64545] bg-white hover:bg-[#c64545]/10 text-[#c64545] text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {actionLoading === 'delete' ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    <span>DELETE ROOM</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions / Start Controls */}
            <div className="pt-4 border-t border-[#f0ece4] flex flex-col items-center gap-3">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={starting || actionLoading !== null || !room || room.players.length === 0}
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
