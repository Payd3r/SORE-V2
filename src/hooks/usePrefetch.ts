'use client';

import { useCallback } from 'react';

export function usePrefetch() {
  const prefetchRoutes = useCallback((routes: string[]) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH_ROUTES',
        payload: routes,
      });
    }
  }, []);

  return prefetchRoutes;
} 