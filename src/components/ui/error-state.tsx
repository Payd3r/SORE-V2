import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { GlassCard } from './glass-card';
import { LucideIcon, AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: {
    text: string;
    onClick: () => void;
    buttonProps?: ButtonProps;
  };
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
    icon: Icon = AlertTriangle, 
    title = "An Error Occurred", 
    message, 
    action, 
    className 
}) => {
  return (
    <GlassCard className={cn("flex flex-col items-center justify-center p-8 text-center border-red-500/30 bg-red-500/10", className)}>
        {Icon && <Icon className="w-16 h-16 mb-4 text-red-400" />}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-red-300/80 mb-6">{message}</p>
        {action && (
            <Button onClick={action.onClick} variant="destructive" {...action.buttonProps}>
            {action.text}
            </Button>
        )}
    </GlassCard>
  );
};

export { ErrorState }; 