'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type MotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useHapticFeedback, HAPTIC_PATTERNS } from '@/hooks/useHapticFeedback';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useViewport } from '@/hooks/useViewport';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  longPressAction?: () => void;
}

type MobileButtonProps = ButtonProps & MotionProps;

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant, size, asChild = false, onClick, longPressAction, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const triggerHapticFeedback = useHapticFeedback();
    const { isTouchDevice } = useViewport();

    const gestureRef = useTouchGestures<HTMLButtonElement>({
      onTap: () => {
        if (disabled) return;
        triggerHapticFeedback(HAPTIC_PATTERNS.TAP);
        onClick?.(new MouseEvent('click') as any);
      },
      onLongPress: () => {
        if (disabled || !longPressAction) return;
        triggerHapticFeedback(HAPTIC_PATTERNS.LONG_PRESS);
        longPressAction();
      },
    });

    const combinedRef = (node: HTMLButtonElement) => {
      (gestureRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    if (!isTouchDevice) {
      // Fallback per non-touch
      return (
         <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={onClick}
          disabled={disabled}
          {...props}
        />
      );
    }

    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="inline-block"
      >
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={combinedRef}
          disabled={disabled}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            // Preveniamo il doppio evento su touch
            e.preventDefault();
          }}
          {...props}
        />
      </motion.div>
    );
  }
);

MobileButton.displayName = 'MobileButton';

export { MobileButton, buttonVariants }; 