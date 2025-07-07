'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewport } from '@/hooks/useViewport';

export default function CustomInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { isMobile } = useViewport();

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e);
    
    // Mostra il prompt solo se non è già stato installato
    // e se non è stato mostrato di recente
    if (!localStorage.getItem('install-prompt-dismissed')) {
      setIsVisible(true);
    }
  }, []);

  const handleAppInstalled = useCallback(() => {
    // Nascondi il prompt dopo l'installazione
    setIsVisible(false);
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostra il prompt nativo del browser
    (deferredPrompt as any).prompt();
    
    // Aspetta la scelta dell'utente
    const { outcome } = await (deferredPrompt as any).userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setIsVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Salva la scelta per non mostrare più il prompt
    try {
      localStorage.setItem('install-prompt-dismissed', 'true');
    } catch (error) {
      console.error('Failed to set localStorage item:', error);
    }
  };

  if (!isVisible || !isMobile) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="relative p-6 rounded-2xl overflow-hidden glass-effect-dark">
          {/* Sfondo animato */}
          <div className="absolute inset-0 z-0">
            <motion.div
              className="absolute top-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full"
              animate={{
                x: [-20, 100, -20],
                y: [-20, 80, -20],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-500/30 rounded-full"
              animate={{
                x: [20, -80, 20],
                y: [20, -60, 20],
                scale: [1, 1.3, 1],
              }}
              transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse', delay: 3 }}
            />
          </div>

          <div className="relative z-10 text-white">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Download className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-lg">Installa SORE</h3>
                <p className="text-sm mt-1 opacity-80">
                  Ottieni la migliore esperienza installando l'app sul tuo dispositivo.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="text-white hover:bg-white/10"
              >
                Più tardi
              </Button>
              <Button
                onClick={handleInstall}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Installa
              </Button>
            </div>
          </div>
          
          {/* Bottone di chiusura */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 