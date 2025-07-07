'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/utils/OptimizedImage';
import { CheckCircle, XCircle, Star } from 'lucide-react';

interface PhotoThumbnailProps {
  src: string;
  alt: string;
  isCover?: boolean;
  isSelected?: boolean;
  isSelectable?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
  onRemove?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function PhotoThumbnail({
  src,
  alt,
  isCover = false,
  isSelected = false,
  isSelectable = true,
  onSelect,
  onDeselect,
  onRemove,
  className,
  children,
}: PhotoThumbnailProps) {
  
  const handleClick = () => {
    if (isSelectable) {
      if (isSelected) {
        onDeselect?.();
      } else {
        onSelect?.();
      }
    }
  };

  return (
    <div
      className={cn(
        'relative group aspect-square w-full overflow-hidden rounded-lg transition-all duration-300',
        isSelectable && 'cursor-pointer',
        isSelected && 'ring-2 ring-offset-2 ring-offset-background ring-cyan-500',
        className
      )}
      onClick={handleClick}
    >
      {isCover && (
        <div className="absolute top-2 left-2 z-10">
          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
        </div>
      )}
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className={cn(
            "object-cover transition-transform duration-300",
            isSelected ? 'scale-105' : 'group-hover:scale-110'
        )}
      />
      
      {isSelectable && (
        <div className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
           {isSelected && <CheckCircle className="absolute top-2 right-2 h-6 w-6 text-white bg-cyan-500 rounded-full" />}
        </div>
      )}

      {onRemove && (
         <button
            onClick={(e) => {
                e.stopPropagation();
                onRemove();
            }}
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            aria-label="Remove photo"
         >
            <XCircle className="h-4 w-4" />
        </button>
      )}

      {children && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
          {children}
        </div>
      )}
    </div>
  );
} 