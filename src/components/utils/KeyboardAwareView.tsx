'use client';

import React from 'react';
import { useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';
import { cn } from '@/lib/utils';

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  className?: string;
}

export default function KeyboardAwareView({ children, className }: KeyboardAwareViewProps) {
  const { height: keyboardHeight, isVisible } = useVirtualKeyboard();

  const style = {
    paddingBottom: isVisible ? `${keyboardHeight}px` : '0px',
    transition: 'padding-bottom 0.2s ease-out',
  };

  return (
    <div style={style} className={cn('w-full h-full', className)}>
      {children}
    </div>
  );
} 