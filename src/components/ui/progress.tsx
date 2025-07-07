'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  max?: number;
}

export function Progress({ value, className, max = 100 }: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), max);
  
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-gray-200 h-2",
        className
      )}
    >
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out rounded-full"
        style={{ 
          width: `${(percentage / max) * 100}%`,
        }}
      />
    </div>
  );
} 