import React from 'react';
import { cn } from '@/lib/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', className, label }) => {
  if (orientation === 'vertical') {
    return <div className={cn('h-full w-px bg-white/20', className)} />;
  }

  if (label) {
    return (
      <div className={cn("flex items-center my-4", className)}>
        <div className="flex-grow border-t border-white/20"></div>
        <span className="flex-shrink mx-4 text-white/50 text-sm">{label}</span>
        <div className="flex-grow border-t border-white/20"></div>
      </div>
    );
  }

  return <div className={cn('w-full h-px bg-white/20 my-4', className)} />;
};

export { Divider }; 