// ─────────────────────────────────────────────────────────────────────────────
// ROOM CLIENT — Clean Frontend API Wrapper for Multiplayer Rooms
// Handles networking, session persistence, and realtime polling synchronization
// ─────────────────────────────────────────────────────────────────────────────

import { Room, RoomPlayer, PlayerActionPayload } from '@/types';

export interface PlayerSession {
  playerId: string;
  playerName: string;
  roomCode: string;
  isHost: boolean;
}

const SESSION_KEY_PREFIX = 'glass_game_session_';

export const roomClient = {
  // ── Session Storage Helpers ───────────────────────────────────────────────
  saveSession(session: PlayerSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${SESSION_KEY_PREFIX}${session.roomCode.toUpperCase()}`, JSON.stringify(session));
      localStorage.setItem('glass_game_active_room', session.roomCode.toUpperCase());
    } catch {}
  },

  getSession(roomCode: string): PlayerSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`${SESSION_KEY_PREFIX}${roomCode.toUpperCase()}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // ── API Operations ────────────────────────────────────────────────────────
  async createRoom(hostName: string): Promise<{ room: Room; hostPlayer: RoomPlayer }> {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to create room');
    }

    this.saveSession({
      playerId: data.hostPlayer.id,
      playerName: data.hostPlayer.name,
      roomCode: data.room.code,
      isHost: true,
    });

    return data;
  },

  async joinRoom(code: string, playerName: string): Promise<{ room: Room; player: RoomPlayer }> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const err = new Error(data.message || data.error || 'Failed to join room');
      (err as any).code = data.error;
      throw err;
    }

    this.saveSession({
      playerId: data.player.id,
      playerName: data.player.name,
      roomCode: data.room.code,
      isHost: false,
    });

    return data;
  },

  async getRoom(code: string): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}`, {
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Room not found');
    }

    return data.room;
  },

  async startGame(code: string, playerId: string): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to start game');
    }

    return data.room;
  },

  async submitAction(code: string, playerId: string, action: PlayerActionPayload): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, action }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to submit action');
    }

    return data.room;
  },

  async applySurgery(code: string, playerId: string): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/surgery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to apply surgery');
    }

    return data.room;
  },

  // ── Polling Subscription Helper ───────────────────────────────────────────
  subscribeToRoom(
    code: string,
    onUpdate: (room: Room) => void,
    onError?: (err: Error) => void,
    intervalMs = 1200
  ): () => void {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const room = await roomClient.getRoom(code);
        if (active) onUpdate(room);
      } catch (err: any) {
        if (active && onError) onError(err);
      }
    };

    // Initial immediate fetch
    poll();
    const timer = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  },
};
