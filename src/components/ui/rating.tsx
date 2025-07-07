"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  count?: number;
  initialValue?: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
  iconClassName?: string;
  readonly?: boolean;
}

const Rating: React.FC<RatingProps> = ({
  count = 5,
  initialValue = 0,
  onChange,
  size = 24,
  className,
  iconClassName,
  readonly = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);
  const [currentValue, setCurrentValue] = useState(initialValue);

  const handleMouseMove = (index: number) => {
    if (readonly) return;
    setHoverValue(index + 1);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverValue(undefined);
  };

  const handleClick = (index: number) => {
    if (readonly) return;
    const newValue = index + 1;
    setCurrentValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const stars = Array(count).fill(0);

  return (
    <div className={cn("flex items-center", readonly ? 'cursor-default' : 'cursor-pointer', className)}>
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              'transition-colors',
              (hoverValue || currentValue) >= starValue
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-400 fill-transparent',
              iconClassName
            )}
            onMouseMove={() => handleMouseMove(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
};

export { Rating }; 