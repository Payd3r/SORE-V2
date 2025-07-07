'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, FlipHorizontal, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';

interface CameraAccessProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  facingMode?: 'user' | 'environment';
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  className?: string;
}

export default function CameraAccess({
  isOpen,
  onClose,
  onCapture,
  facingMode = 'environment',
  aspectRatio = 'square',
  className = ''
}: CameraAccessProps) {
  const {
    videoRef,
    canvasRef,
    isLoading,
    error,
    isActive,
    capabilities,
    flashEnabled,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    toggleFlash,
    retryCamera
  } = useCamera({ facingMode, aspectRatio });

  // Gestione apertura/chiusura
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  // Gestione orientamento schermo per iPhone
  useEffect(() => {
    if (isOpen && navigator.userAgent.includes('iPhone')) {
      // Forza orientamento orizzontale se possibile
      if (screen.orientation && 'lock' in screen.orientation) {
        (screen.orientation as any).lock('landscape').catch(console.warn);
      }
    }

    return () => {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    };
  }, [isOpen]);

  // Gestione cattura foto
  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData) {
      onCapture(imageData);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 bg-black ${className}`}
      >
        {/* Header con controlli */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="flex items-center space-x-2">
            {/* Flash toggle */}
            {capabilities && 'torch' in capabilities && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFlash}
                className={`text-white hover:bg-white/20 ${flashEnabled ? 'bg-white/20' : ''}`}
              >
                {flashEnabled ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
              </Button>
            )}

            {/* Switch camera */}
            <Button
              variant="ghost"
              size="sm"
              onClick={switchCamera}
              className="text-white hover:bg-white/20"
            >
              <FlipHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Area video */}
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Avvio fotocamera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="text-white text-center max-w-md mx-4">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-2">Errore Fotocamera</h3>
                  <p className="text-sm mb-4">{error.message}</p>
                  <Button
                    onClick={retryCamera}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Riprova
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`max-w-full max-h-full ${
              aspectRatio === 'square' ? 'aspect-square' : 
              aspectRatio === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'
            } object-cover`}
          />

          {/* Canvas nascosto per cattura */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controlli cattura */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center">
            <Button
              onClick={handleCapture}
              disabled={isLoading || !!error || !isActive}
              className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-50"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 