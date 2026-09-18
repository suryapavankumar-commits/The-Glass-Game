import { db } from './lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function wipeDatabase() {
  console.log('Wiping rooms...');
  const roomsSnapshot = await getDocs(collection(db, 'rooms'));
  for (const roomDoc of roomsSnapshot.docs) {
    const roomId = roomDoc.id;
    console.log(`Deleting room ${roomId}...`);
    // delete players subcollection
    const playersSnapshot = await getDocs(collection(db, 'rooms', roomId, 'players'));
    for (const playerDoc of playersSnapshot.docs) {
      await deleteDoc(doc(db, 'rooms', roomId, 'players', playerDoc.id));
    }
    await deleteDoc(doc(db, 'rooms', roomId));
  }

  console.log('Wiping players...');
  const playersCol = await getDocs(collection(db, 'players'));
  for (const p of playersCol.docs) {
    await deleteDoc(doc(db, 'players', p.id));
  }

  console.log('Database wipe complete.');
  process.exit(0);
}

wipeDatabase().catch(console.error);
