'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/firebase';

export function FirebaseInit() {
  useEffect(() => {
    // Safely initialize analytics in browser
    initAnalytics().catch(() => {
      // Ignored if blocked or offline
    });
  }, []);

  return null;
}
