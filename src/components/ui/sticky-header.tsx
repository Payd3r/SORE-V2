import React from 'react';
import { cn } from '@/lib/utils';

interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('sticky top-0 z-10 p-4 bg-background/80 backdrop-blur-lg border-b border-white/20', className)}>
      {children}
    </div>
  );
};

export { StickyHeader }; 