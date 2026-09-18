// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE SERVICE — Cloud Database Synchronization
// Persists rooms, participants, and join events to Firestore
// ─────────────────────────────────────────────────────────────────────────────

import { doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, RoomPlayer, CanonicalFact, NarrativeClaim, PlayerObjective } from '@/types';

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

  /**
   * Deletes a room document completely from Firestore, including all player sub-documents
   */
  async deleteRoom(roomCode: string): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      
      // Fetch the room to get the players list before deleting
      const roomRef = doc(db, 'rooms', cleanCode);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const roomData = snap.data();
        const players = roomData.players || [];
        
        // Delete all players from the top-level 'players' collection
        for (const player of players) {
          if (player.id) {
            await deleteDoc(doc(db, 'players', player.id)).catch(() => {});
            // Also explicitly delete from the subcollection just in case
            await deleteDoc(doc(db, 'rooms', cleanCode, 'players', player.id)).catch(() => {});
          }
        }
      }

      await deleteDoc(roomRef);
      console.log(`[Firebase] Room ${cleanCode} and its players deleted from Firestore.`);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to delete room ${roomCode} from Firestore:`, error);
    }
  },

  /**
   * Removes a specific player from a room in Firestore
   */
  async removePlayer(roomCode: string, playerId: string, remainingPlayers: RoomPlayer[]): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      // Remove subcollection player document
      await deleteDoc(doc(db, 'rooms', cleanCode, 'players', playerId));
      // Update parent room document with remaining players
      await setDoc(
        doc(db, 'rooms', cleanCode),
        {
          playerCount: remainingPlayers.length,
          players: remainingPlayers,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`[Firebase] Player ${playerId} removed from room ${cleanCode} in Firestore.`);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to remove player from Firestore:`, error);
    }
  },

  /**
   * Removes all non-host players from a room in Firestore
   */
  async removeAllNonHostPlayers(roomCode: string, hostPlayer: RoomPlayer): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      await setDoc(
        doc(db, 'rooms', cleanCode),
        {
          playerCount: 1,
          players: [hostPlayer],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`[Firebase] All non-host players removed from room ${cleanCode} in Firestore.`);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to remove all players from Firestore:`, error);
    }
  },

  /**
   * Retrieves a room document from Firestore for persistent state recovery
   */
  async fetchRoom(roomCode: string): Promise<Room | null> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const roomRef = doc(db, 'rooms', cleanCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return null;
      return snap.data() as Room;
    } catch (error) {
      console.warn(`[Firebase] Failed to fetch room ${roomCode} from Firestore:`, error);
      return null;
    }
  },

  /**
   * Persists a canonical fact to the canonicalFacts subcollection
   */
  async recordCanonicalFact(roomCode: string, fact: CanonicalFact): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const factRef = doc(db, 'rooms', cleanCode, 'canonicalFacts', fact.id);
      await setDoc(factRef, {
        ...fact,
        createdAt: serverTimestamp(),
      });
      console.log(`[Firebase] Canonical fact ${fact.id} recorded for room ${cleanCode}.`);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to record canonical fact:`, error);
    }
  },

  /**
   * Retrieves all canonical facts for a room
   */
  async getCanonicalFacts(roomCode: string): Promise<CanonicalFact[]> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const factsRef = collection(db, 'rooms', cleanCode, 'canonicalFacts');
      const q = query(factsRef, orderBy('establishedInTurn', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data() as CanonicalFact);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to fetch canonical facts:`, error);
      return [];
    }
  },

  /**
   * Persists a narrative claim to the narrativeHistory subcollection
   */
  async recordNarrativeClaim(roomCode: string, claim: NarrativeClaim): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const claimRef = doc(db, 'rooms', cleanCode, 'narrativeHistory', claim.id);
      await setDoc(claimRef, {
        ...claim,
        createdAt: serverTimestamp(),
      });
      console.log(`[Firebase] Narrative claim ${claim.id} recorded for room ${cleanCode}.`);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to record narrative claim:`, error);
    }
  },

  /**
   * Persists a private objective to a specific player's subcollection
   */
  async updatePlayerPrivateObjective(roomCode: string, playerId: string, objective: PlayerObjective): Promise<void> {
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const playerRef = doc(db, 'rooms', cleanCode, 'players', playerId);
      await setDoc(playerRef, {
        privateObjective: objective,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log(`[Firebase] Private objective updated for player ${playerId} in room ${cleanCode}.`);
    } catch (error) {
      console.warn(`[Firebase] Warning: Failed to update private objective:`, error);
    }
  },
};
