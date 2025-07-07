'use client';

import { usePartnerSync } from '@/hooks/usePartnerSync';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Camera, CheckCircle, AlertTriangle } from 'lucide-react';

type PartnerStatus = 'disconnected' | 'connecting' | 'connected' | 'capturing' | 'captured' | 'error';

interface PartnerStatusIndicatorProps {
  momentId: string;
  status?: PartnerStatus;
}

const statusInfo = {
  disconnected: { icon: WifiOff, color: 'text-red-500', text: 'Partner disconnesso' },
  connecting: { icon: Wifi, color: 'text-yellow-500', text: 'Connessione...' },
  connected: { icon: Wifi, color: 'text-green-500', text: 'Connesso' },
  capturing: { icon: Camera, color: 'text-blue-500', text: 'Sta scattando...' },
  captured: { icon: CheckCircle, color: 'text-green-500', text: 'Fatto!' },
  error: { icon: AlertTriangle, color: 'text-red-500', text: 'Errore' },
};

export default function PartnerStatusIndicator({ momentId, status }: PartnerStatusIndicatorProps) {
  const partnerState = usePartnerSync(momentId);
  const currentStatus = status || partnerState.status;
  const { icon: Icon, color, text } = statusInfo[currentStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 right-4"
    >
      <div className="flex items-center gap-2 p-2 rounded-full bg-glass-dark text-white">
        <Icon className={`${color} w-6 h-6`} />
        <span className="text-sm font-medium">{text}</span>
      </div>
    </motion.div>
  );
} 