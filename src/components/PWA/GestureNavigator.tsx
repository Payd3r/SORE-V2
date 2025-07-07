'use client';

import React, { useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Clock, Upload, User, Map } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/timeline', label: 'Timeline', icon: Clock },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/profile', label: 'Profile', icon: User },
];

interface GestureNavigatorProps {
  children: React.ReactNode;
  className?: string;
}

export default function GestureNavigator({ children, className }: GestureNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const controls = useAnimation();
  const contentRef = useRef<HTMLDivElement>(null);

  const gestureRef = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: () => {
      const currentIndex = navItems.findIndex(item => item.href === pathname);
      if (currentIndex < navItems.length - 1) {
        router.push(navItems[currentIndex + 1].href);
      }
    },
    onSwipeRight: () => {
      const currentIndex = navItems.findIndex(item => item.href === pathname);
      if (currentIndex > 0) {
        router.push(navItems[currentIndex - 1].href);
      }
    },
  });
  
  const combinedRef = (node: HTMLDivElement) => {
    (gestureRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <motion.div
      ref={combinedRef}
      className={cn("w-full h-full", className)}
      animate={controls}
    >
      {children}
    </motion.div>
  );
} 