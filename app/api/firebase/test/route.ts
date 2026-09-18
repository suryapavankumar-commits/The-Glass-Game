import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const testDocRef = doc(db, 'system_status', 'connectivity_test');
    await setDoc(testDocRef, {
      status: 'connected',
      verifiedAt: new Date().toISOString(),
      message: 'Firestore security rules are active and allowing writes!',
    });

    return NextResponse.json({
      success: true,
      message: 'Firestore write succeeded! Rules are correctly set to allow read/write.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        code: error?.code || 'unknown',
        error: error?.message || String(error),
        tip: 'Click the Rules tab in Firebase console and change allow read, write: if false; to if true;',
      },
      { status: 403 }
    );
  }
}
