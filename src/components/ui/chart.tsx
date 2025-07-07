'use client';

import * as React from 'react';
import {
  Area,
  Bar,
  Cell,
  Line,
  Pie,
  RadialBar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
} from 'recharts';

import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

// #region Chart Components
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: any; // Simplified config type
    children: React.ReactElement;
  }
>(({ id, className, children, ...props }, ref) => (
  <div
    data-chart={id}
    ref={ref}
    className={cn(
      "aspect-video [&_.recharts-cartesian-axis-tick_text]:fill-white/70 [&_.recharts-cartesian-grid_line]:stroke-white/20 [&_.recharts-polar-grid_line]:stroke-white/20",
      className
    )}
    {...props}
  >
    <ResponsiveContainer>{children}</ResponsiveContainer>
  </div>
));
ChartContainer.displayName = 'ChartContainer';

const ChartTooltip = (props: TooltipProps<any, any>) => (
  <RechartsTooltip
    content={<ChartTooltipContent />}
    {...props}
  />
);
ChartTooltip.displayName = 'ChartTooltip';

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipProps<any, any> & React.ComponentProps<'div'>
>(({ active, payload, label, className, ...props }, ref) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <GlassCard
      ref={ref}
      className={cn(
        'grid min-w-[8rem] items-start gap-1.5 border p-2 text-sm',
        className
      )}
      {...props}
    >
      {label && <div className="font-medium text-white">{label}</div>}
      <div className="grid gap-1.5">
        {payload.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:fill-[var(--color)] [&>svg]:stroke-[var(--color)]"
            style={{ '--color': item.color } as React.CSSProperties}
          >
            {item.payload.icon ? (
              <item.payload.icon />
            ) : (
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[--color] bg-[--color]"
              />
            )}
            <div className="flex flex-1 justify-between leading-none">
              <p className="text-white/80">{item.name}</p>
              <p className="font-medium text-white">
                {item.value}
                <span className="text-white/60">{item.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
});
ChartTooltipContent.displayName = 'ChartTooltipContent';

// Export recharts components
export {
  Area as ChartArea,
  Bar as ChartBar,
  Cell as ChartCell,
  Line as ChartLine,
  Pie as ChartPie,
  RadialBar as ChartRadialBar,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
};
export * from 'recharts'; 