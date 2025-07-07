'use client';

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Prova a leggere navigator.onLine all'inizio
    // Potrebbe non essere disponibile in SSR, quindi lo mettiamo in un blocco try-catch
    try {
      setIsOnline(navigator.onLine);
    } catch (error) {
      // In caso di errore (es. in SSR), assumiamo di essere online
      setIsOnline(true);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
} 