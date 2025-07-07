'use client';

import { useRef, useEffect, useCallback } from 'react';

type GestureHandler = () => void;
type PinchHandler = (scale: number, delta: number) => void;

interface TouchGestureOptions {
  onSwipeLeft?: GestureHandler;
  onSwipeRight?: GestureHandler;
  onSwipeUp?: GestureHandler;
  onSwipeDown?: GestureHandler;
  onTap?: GestureHandler;
  onDoubleTap?: GestureHandler;
  onLongPress?: GestureHandler;
  onPinch?: PinchHandler;

  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapThreshold?: number;
}

export function useTouchGestures<T extends HTMLElement>(options: TouchGestureOptions) {
  const targetRef = useRef<T>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<number>(0);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const pinchStartDist = useRef<number>(0);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapThreshold = 300,
  } = options;

  const getDistance = (touches: TouchList) => {
    return Math.hypot(
      touches[0].pageX - touches[1].pageX,
      touches[0].pageY - touches[1].pageY
    );
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const { touches } = e;
      if (touches.length === 1) {
        const touch = touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

        if (onLongPress) {
          longPressTimeout.current = setTimeout(() => {
            onLongPress();
            touchStart.current = null; // Prevent other events after long press
          }, longPressDelay);
        }
      } else if (touches.length === 2 && onPinch) {
        pinchStartDist.current = getDistance(touches);
      }
    },
    [onLongPress, onPinch, longPressDelay]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      if (!touchStart.current && e.touches.length !== 2) return;

      if (e.touches.length === 2 && onPinch && pinchStartDist.current > 0) {
        const currentDist = getDistance(e.touches);
        const scale = currentDist / pinchStartDist.current;
        const delta = currentDist - pinchStartDist.current;
        onPinch(scale, delta);
      }
    },
    [onPinch]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      
      if (!touchStart.current) return;
      
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const endTime = Date.now();
      const timeDiff = endTime - touchStart.current.time;

      if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
        // Swipe
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 0) onSwipeRight?.();
          else onSwipeLeft?.();
        } else {
          // Vertical swipe
          if (dy > 0) onSwipeDown?.();
          else onSwipeUp?.();
        }
      } else {
        // Tap or Double Tap
        if (onDoubleTap) {
            const now = Date.now();
            if (now - lastTap.current < doubleTapThreshold) {
              onDoubleTap?.();
              lastTap.current = 0; // Reset after double tap
            } else {
              onTap?.();
            }
            lastTap.current = now;
        } else {
            onTap?.();
        }
      }
      
      touchStart.current = null;
      pinchStartDist.current = 0;
    },
    [
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onTap,
      onDoubleTap,
      swipeThreshold,
      doubleTapThreshold,
    ]
  );

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart as EventListener);
    element.addEventListener('touchmove', handleTouchMove as EventListener);
    element.addEventListener('touchend', handleTouchEnd as EventListener);
    element.addEventListener('touchcancel', handleTouchEnd as EventListener);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchmove', handleTouchMove as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
      element.removeEventListener('touchcancel', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return targetRef;
} 