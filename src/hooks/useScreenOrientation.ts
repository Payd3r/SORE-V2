'use client';

import { useState, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape';

export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    handleOrientationChange();

    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
} 