'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-[200] p-4"
        >
          <div className="container mx-auto max-w-md">
            <div
              className="glass-effect-dark flex items-center justify-center p-3 rounded-xl shadow-lg text-white"
            >
              <WifiOff className="h-5 w-5 mr-3" />
              <p className="font-semibold text-sm">Sei offline. Alcune funzionalità potrebbero non essere disponibili.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 