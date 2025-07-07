'use client';

import { useState, useEffect } from 'react';

interface VirtualKeyboardInfo {
  isVisible: boolean;
  height: number;
}

export function useVirtualKeyboard(): VirtualKeyboardInfo {
  const [info, setInfo] = useState<VirtualKeyboardInfo>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const visualViewport = window.visualViewport;

    const handleResize = () => {
      // Calcola l'altezza della tastiera (o di altre UI del browser)
      const keyboardHeight = visualViewport.height - window.innerHeight;
      
      setInfo({
        isVisible: keyboardHeight > 150, // Una soglia per considerare la tastiera visibile
        height: Math.max(0, keyboardHeight),
      });
    };

    visualViewport.addEventListener('resize', handleResize);
    
    // Esegui una volta all'inizio
    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return info;
} 