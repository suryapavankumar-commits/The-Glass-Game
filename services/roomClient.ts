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

  clearSession(roomCode?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (roomCode) {
        localStorage.removeItem(`${SESSION_KEY_PREFIX}${roomCode.toUpperCase()}`);
        sessionStorage.removeItem(`glass_game_room_${roomCode.toUpperCase()}`);
      }
      localStorage.removeItem('glass_game_active_room');
    } catch {}
  },

  // ── Instant Room State Caching ────────────────────────────────────────────
  saveCachedRoom(room: Room): void {
    if (typeof window === 'undefined' || !room?.code) return;
    try {
      sessionStorage.setItem(`glass_game_room_${room.code.toUpperCase()}`, JSON.stringify(room));
    } catch {}
  },

  getCachedRoom(roomCode: string): Room | null {
    if (typeof window === 'undefined' || !roomCode) return null;
    try {
      const data = sessionStorage.getItem(`glass_game_room_${roomCode.toUpperCase()}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearCachedRoom(roomCode: string): void {
    if (typeof window === 'undefined' || !roomCode) return;
    try {
      sessionStorage.removeItem(`glass_game_room_${roomCode.toUpperCase()}`);
    } catch {}
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

    this.saveCachedRoom(data.room);

    // Client-side Firestore sync
    try {
      const { firebaseService } = await import('@/services/firebaseService');
      firebaseService.recordRoomCreated(data.room, data.hostPlayer).catch(console.warn);
    } catch {}

    return data;
  },

  async joinRoom(code: string, playerName: string, existingPlayerId?: string): Promise<{ room: Room; player: RoomPlayer }> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, playerId: existingPlayerId }),
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

    this.saveCachedRoom(data.room);

    // Client-side Firestore sync
    try {
      const { firebaseService } = await import('@/services/firebaseService');
      firebaseService.recordPlayerJoined(data.room.code, data.player, data.room.players.length).catch(console.warn);
    } catch {}

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

    this.saveCachedRoom(data.room);
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

    this.saveCachedRoom(data.room);
    return data.room;
  },

  async advanceGame(code: string, requesterId: string): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to advance game');
    }

    this.saveCachedRoom(data.room);
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

    this.saveCachedRoom(data.room);
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

    this.saveCachedRoom(data.room);
    return data.room;
  },

  async removePlayer(code: string, requesterId: string, targetPlayerId: string): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId, targetPlayerId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to remove player');
    }

    this.saveCachedRoom(data.room);
    return data.room;
  },

  async removeAllPlayers(code: string, requesterId: string): Promise<Room> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${cleanCode}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId, removeAll: true }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to remove all players');
    }

    this.saveCachedRoom(data.room);
    return data.room;
  },

  async deleteRoom(code: string, requesterId: string): Promise<void> {
    const cleanCode = code.trim().toUpperCase();
    this.clearCachedRoom(cleanCode);
    const res = await fetch(`/api/rooms/${cleanCode}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to delete room');
    }
  },

  // ── Polling Subscription Helper ───────────────────────────────────────────
  subscribeToRoom(
    code: string,
    onUpdate: (room: Room) => void,
    onError?: (err: Error) => void,
    intervalMs = 800
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
