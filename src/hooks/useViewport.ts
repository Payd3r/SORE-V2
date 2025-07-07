'use client';

import { useState, useEffect, useCallback } from 'react';
import { supportsScreenOrientation } from '@/lib/feature-detection';

type OrientationType = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  orientationType: OrientationType | null;
  orientationAngle: number | null;
  devicePixelRatio: number;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const getSafeArea = (): ViewportInfo['safeArea'] => {
    if (typeof getComputedStyle === 'undefined') {
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    const style = getComputedStyle(document.documentElement);
    return {
        top: parseInt(style.getPropertyValue('--safe-area-inset-top').replace('px', ''), 10) || 0,
        right: parseInt(style.getPropertyValue('--safe-area-inset-right').replace('px', ''), 10) || 0,
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom').replace('px', ''), 10) || 0,
        left: parseInt(style.getPropertyValue('--safe-area-inset-left').replace('px', ''), 10) || 0,
    };
};

export function useViewport(): ViewportInfo {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'portrait',
    orientationType: null,
    orientationAngle: null,
    devicePixelRatio: 1,
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const updateViewport = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    const orientationType = supportsScreenOrientation() ? (screen.orientation.type as OrientationType) : null;
    const orientationAngle = supportsScreenOrientation() ? screen.orientation.angle : null;

    setViewportInfo({
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width < height ? 'portrait' : 'landscape',
      orientationType,
      orientationAngle,
      devicePixelRatio,
      safeArea: getSafeArea(),
    });
  }, []);

  useEffect(() => {
    updateViewport();
    window.addEventListener('resize', updateViewport);
    if (supportsScreenOrientation()) {
      screen.orientation.addEventListener('change', updateViewport);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      if (supportsScreenOrientation()) {
        screen.orientation.removeEventListener('change', updateViewport);
      }
    };
  }, [updateViewport]);

  return viewportInfo;
} 