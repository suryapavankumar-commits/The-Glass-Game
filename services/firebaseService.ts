// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE SERVICE — Cloud Database Synchronization
// Persists rooms, participants, and join events to Firestore
// ─────────────────────────────────────────────────────────────────────────────

import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, RoomPlayer } from '@/types';

export const firebaseService = {
  /**
   * Persists a newly created room and its host player into Firestore
   */
  async recordRoomCreated(room: Room, hostPlayer: RoomPlayer): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', room.code);
      await setDoc(roomRef, {
        id: room.id,
        code: room.code,
        hostId: hostPlayer.id,
        hostName: hostPlayer.name,
        status: room.status,
        maxPlayers: room.maxPlayers,
        playerCount: 1,
        players: [
          {
            id: hostPlayer.id,
            name: hostPlayer.name,
            role: hostPlayer.role,
            roleLabel: hostPlayer.roleLabel,
            isHost: true,
            connected: true,
            joinedAt: hostPlayer.joinedAt,
          },
        ],
        createdAt: room.createdAt,
        updatedAt: serverTimestamp(),
      });

      // Also record in subcollection: rooms/{code}/players/{id}
      const playerRef = doc(db, 'rooms', room.code, 'players', hostPlayer.id);
      await setDoc(playerRef, {
        id: hostPlayer.id,
        name: hostPlayer.name,
        role: hostPlayer.role,
        roleLabel: hostPlayer.roleLabel,
        isHost: true,
        connected: true,
        joinedAt: hostPlayer.joinedAt,
        roomCode: room.code,
        syncedAt: serverTimestamp(),
      });

      // Also record in top-level players collection for easy directory queries
      const globalPlayerRef = doc(db, 'players', hostPlayer.id);
      await setDoc(globalPlayerRef, {
        id: hostPlayer.id,
        name: hostPlayer.name,
        role: hostPlayer.role,
        roleLabel: hostPlayer.roleLabel,
        isHost: true,
        roomCode: room.code,
        joinedAt: hostPlayer.joinedAt,
        syncedAt: serverTimestamp(),
      });

      console.log(`[Firebase] Room ${room.code} and host ${hostPlayer.name} recorded in Firestore.`);
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error).includes('PERMISSION_DENIED')) {
        console.error(
          '[Firebase] ⚠️ PERMISSION DENIED: Your Firebase Firestore Security Rules are locked. Go to Firebase Console -> Firestore Database -> Rules, and set:\nallow read, write: if true;'
        );
      } else {
        console.warn('[Firebase] Warning: Failed to record room creation in Firestore:', error);
      }
    }
  },

  /**
   * Persists a player joining an existing room into Firestore
   */
  async recordPlayerJoined(roomCode: string, player: RoomPlayer, currentPlayersCount: number): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();

      // 1. Write individual player document inside the room subcollection
      const playerRef = doc(db, 'rooms', cleanCode, 'players', player.id);
      await setDoc(playerRef, {
        id: player.id,
        name: player.name,
        role: player.role,
        roleLabel: player.roleLabel,
        isHost: player.isHost,
        connected: true,
        joinedAt: player.joinedAt,
        roomCode: cleanCode,
        syncedAt: serverTimestamp(),
      });

      // 2. Write to top-level players collection
      const globalPlayerRef = doc(db, 'players', player.id);
      await setDoc(globalPlayerRef, {
        id: player.id,
        name: player.name,
        role: player.role,
        roleLabel: player.roleLabel,
        isHost: player.isHost,
        roomCode: cleanCode,
        joinedAt: player.joinedAt,
        syncedAt: serverTimestamp(),
      });

      // 3. Update the parent room document's participant array & count (using setDoc merge so it never fails if doc is missing)
      const roomRef = doc(db, 'rooms', cleanCode);
      await setDoc(
        roomRef,
        {
          code: cleanCode,
          playerCount: currentPlayersCount,
          players: arrayUnion({
            id: player.id,
            name: player.name,
            role: player.role,
            roleLabel: player.roleLabel,
            isHost: player.isHost,
            connected: true,
            joinedAt: player.joinedAt,
          }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`[Firebase] Player ${player.name} (${player.roleLabel}) joined room ${cleanCode} synced to Firestore.`);
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error).includes('PERMISSION_DENIED')) {
        console.error(
          '[Firebase] ⚠️ PERMISSION DENIED: Your Firebase Firestore Security Rules are locked. Go to Firebase Console -> Firestore Database -> Rules, and set:\nallow read, write: if true;'
        );
      } else {
        console.warn(`[Firebase] Warning: Failed to sync player join for ${player.name} in Firestore:`, error);
      }
    }
  },

  /**
   * Updates room status when game starts
   */
  async recordGameStarted(roomCode: string): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const roomRef = doc(db, 'rooms', cleanCode);
      await setDoc(
        roomRef,
        {
          status: 'playing',
          gameStartedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`[Firebase] Room ${cleanCode} status updated to 'playing' in Firestore.`);
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error).includes('PERMISSION_DENIED')) {
        console.error(
          '[Firebase] ⚠️ PERMISSION DENIED: Your Firebase Firestore Security Rules are locked. Go to Firebase Console -> Firestore Database -> Rules, and set:\nallow read, write: if true;'
        );
      } else {
        console.warn(`[Firebase] Warning: Failed to update game status in Firestore:`, error);
      }
    }
  },
};
