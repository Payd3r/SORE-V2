import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { GlassCard } from './glass-card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
    buttonProps?: ButtonProps;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => {
  return (
    <GlassCard className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        {Icon && <Icon className="w-16 h-16 mb-4 text-white/50" />}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/70 mb-6">{description}</p>
        {action && (
            <Button onClick={action.onClick} {...action.buttonProps}>
            {action.text}
            </Button>
        )}
    </GlassCard>
  );
};

export { EmptyState }; 