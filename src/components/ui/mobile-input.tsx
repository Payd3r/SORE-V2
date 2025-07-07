'use client';

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';

export interface MobileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  fullWidth?: boolean;
  glassEffect?: boolean;
  preventZoom?: boolean;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({
    className,
    label,
    error,
    helperText,
    size = 'md',
    variant = 'default',
    fullWidth = false,
    glassEffect = false,
    preventZoom = true,
    type = 'text',
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const { isMobile, isIOS } = useViewport();

    // Gestione focus e tastiera mobile
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      if (isMobile) {
        setIsKeyboardVisible(true);
        
        // Scroll to input on mobile
        setTimeout(() => {
          event.target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
      
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setIsKeyboardVisible(false);
      onBlur?.(event);
    };

    // Gestione viewport per tastiera
    useEffect(() => {
      if (!isMobile) return;

      const handleVisualViewportChange = () => {
        if ('visualViewport' in window) {
          const visualViewport = window.visualViewport as any;
          const heightDiff = window.innerHeight - visualViewport.height;
          setIsKeyboardVisible(heightDiff > 150);
        }
      };

      if ('visualViewport' in window) {
        const visualViewport = window.visualViewport as any;
        visualViewport.addEventListener('resize', handleVisualViewportChange);
        
        return () => {
          visualViewport.removeEventListener('resize', handleVisualViewportChange);
        };
      }
    }, [isMobile]);

    // Dimensioni ottimizzate per touch
    const sizes = {
      sm: 'h-10 px-3 text-sm',
      md: 'h-12 px-4 text-base',
      lg: 'h-14 px-5 text-lg'
    };

    // Varianti di stile
    const variants = {
      default: 'border border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
      filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500',
      outline: 'border-2 border-gray-300 bg-transparent focus:border-blue-500'
    };

    // Effetto vetro liquido
    const glassStyles = glassEffect ? 
      'backdrop-blur-md bg-white/10 border border-white/20' : '';

    // Previeni zoom su iOS
    const iosInputProps = preventZoom && isIOS() ? {
      style: { fontSize: '16px' } // Previene zoom automatico su iOS
    } : {};

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-red-600' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref && node) {
                (ref as React.MutableRefObject<HTMLInputElement>).current = node;
              }
            }}
            type={type}
            className={cn(
              // Base styles
              'w-full rounded-lg font-medium transition-all duration-200',
              'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
              // Touch optimizations
              'touch-manipulation',
              // Focus styles
              isFocused && 'transform scale-105',
              // Size styles
              sizes[size],
              // Variant styles
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : variants[variant],
              // Glass effect
              glassStyles,
              // Full width
              fullWidth && 'w-full',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...iosInputProps}
            {...props}
          />

          {/* Focus indicator */}
          {isFocused && (
            <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none animate-pulse" />
          )}
        </div>

        {/* Helper text or error */}
        {(error || helperText) && (
          <p
            className={cn(
              'mt-2 text-sm transition-all duration-200',
              error ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}

        {/* Keyboard spacer for mobile */}
        {isMobile && isKeyboardVisible && (
          <div className="h-64" />
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

export { MobileInput }; 