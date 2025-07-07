'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface MomentProgressViewProps {
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  partnerAvatarUrl?: string;
  onRetry?: () => void;
  onDone?: () => void;
}

const statusInfo = {
  uploading: { icon: Loader2, text: 'Caricamento...' },
  processing: { icon: Loader2, text: 'Elaborazione...' },
  completed: { icon: CheckCircle, text: 'Momento creato!' },
  failed: { icon: AlertTriangle, text: 'Creazione fallita' },
};

export default function MomentProgressView({ 
  status, 
  progress, 
  partnerAvatarUrl, 
  onRetry,
  onDone
}: MomentProgressViewProps) {
  const { icon: Icon, text } = statusInfo[status];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <GlassCard className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            <Image
              src={partnerAvatarUrl || '/default-avatar.png'}
              alt="Partner"
              layout="fill"
              className="rounded-full"
            />
            <div className="absolute -bottom-2 -right-2">
              <Icon className={`w-8 h-8 ${status === 'completed' ? 'text-green-500' : 'text-blue-500'}`} />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">{text}</h2>
        
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <motion.div
            className="bg-blue-600 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        
        {status === 'failed' && (
          <Button onClick={onRetry} variant="glass" className="mt-4">
            Riprova
          </Button>
        )}
        
        {status === 'completed' && (
          <Button onClick={onDone} variant="glass" className="mt-4">
            Fatto
          </Button>
        )}
      </GlassCard>
    </div>
  );
} 