'use client';

import { useCallback } from 'react';
import { supportsVibration } from '@/lib/feature-detection';

type HapticPattern = number | number[];

export function useHapticFeedback() {
  const trigger = useCallback((pattern: HapticPattern = 50) => {
    if (supportsVibration()) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback failed. This can happen if the document is hidden.', error);
      }
    } else {
      // Potrebbe essere utile un log in modalità dev per notificare che la feature non è supportata
      // console.log('Haptic feedback is not supported on this device/browser.');
    }
  }, []);

  return trigger;
}

// Esempi di pattern predefiniti
export const HAPTIC_PATTERNS = {
  TAP: 10,
  SUCCESS: [100, 30, 100],
  ERROR: [75, 50, 75, 50, 75],
  NOTIFICATION: [200, 100, 200],
  LONG_PRESS: 30,
}; 