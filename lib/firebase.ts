// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CLIENT CONFIGURATION
// Initialized with project credentials for game-23c5b
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyA3XPaQ9wLujf93_C0rpP7wnqQWmH0fRDA",
  authDomain: "game-23c5b.firebaseapp.com",
  projectId: "game-23c5b",
  storageBucket: "game-23c5b.firebasestorage.app",
  messagingSenderId: "990370950769",
  appId: "1:990370950769:web:df61516db55d38c0edb5d0",
  measurementId: "G-CYBXYMH4XX"
};

// Safe singleton initialization for Next.js (client & server safe)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore database
export const db = getFirestore(app);

// Initialize Analytics (client-only)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined') {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const supported = await isSupported();
      if (supported) {
        return getAnalytics(app);
      }
    } catch {
      // Analytics blocked or unavailable
    }
  }
  return null;
};
