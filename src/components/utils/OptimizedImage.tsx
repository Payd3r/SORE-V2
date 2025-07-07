'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function OptimizedImage({
  className,
  containerClassName,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <div className={cn('relative w-full h-auto overflow-hidden', containerClassName)}>
      <Image
        alt={alt}
        className={cn('transition-opacity duration-300', className)}
        placeholder="blur"
        quality={80}
        {...props}
      />
    </div>
  );
} 