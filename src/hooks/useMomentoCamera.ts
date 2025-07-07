'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCamera } from './useCamera';
import { supportsScreenOrientation } from '@/lib/feature-detection';

// Tipo corretto per l'orientamento di blocco
type OrientationLockType = "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";

// Estendiamo il tipo ScreenOrientation per includere le API sperimentali
interface ScreenOrientationWithLock extends ScreenOrientation {
  lock(orientation: OrientationLockType): Promise<void>;
  unlock(): void;
}

export function useMomentoCamera() {
  const camera = useCamera();
  const [isLocked, setIsLocked] = useState(false);
  const [originalOrientation, setOriginalOrientation] = useState<OrientationType | null>(null);

  const lockOrientation = useCallback(async () => {
    if (!supportsScreenOrientation()) return;
    const orientation = screen.orientation as ScreenOrientationWithLock;
    
    try {
      if (typeof orientation.lock === 'function') {
        await orientation.lock('landscape-primary');
        setIsLocked(true);
      }
    } catch (error) {
      console.error('Failed to lock screen orientation:', error);
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    if (!supportsScreenOrientation()) return;
    const orientation = screen.orientation as ScreenOrientationWithLock;

    try {
      if (typeof orientation.unlock === 'function') {
        orientation.unlock();
      }
      setIsLocked(false);
    } catch (error) {
        console.error('Failed to unlock screen orientation:', error);
    }
  }, []);
  
  const startMomentoCamera = useCallback(async () => {
    await lockOrientation();
    setTimeout(() => {
      // @ts-ignore - Confidiamo che start esista
      if (camera.start) camera.start();
    }, 300);
  }, [lockOrientation, camera]);

  const stopMomentoCamera = useCallback(() => {
    // @ts-ignore - Confidiamo che stop esista
    if (camera.stop) camera.stop();
    unlockOrientation();
  }, [camera, unlockOrientation]);
  
  useEffect(() => {
    return () => {
        if(isLocked) {
            unlockOrientation();
        }
    };
  }, [isLocked, unlockOrientation]);

  return {
    ...camera,
    start: startMomentoCamera,
    stop: stopMomentoCamera,
    isOrientationLocked: isLocked,
  };
} 