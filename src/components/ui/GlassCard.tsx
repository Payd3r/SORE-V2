'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function GlassCard({ children, className, interactive = false, ...props }: GlassCardProps) {
  const interactiveClasses = interactive
    ? 'hover:border-white/40 hover:shadow-cyan-500/20 focus-visible:border-white/40 focus-visible:shadow-cyan-500/20'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-white/20 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition-all duration-300',
        interactiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
} 