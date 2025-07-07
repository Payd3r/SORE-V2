'use client';

import { useRef, useEffect, useState } from 'react';
import { useMomentoCamera } from '@/hooks/useMomentoCamera';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import OrientationGuide from './OrientationGuide';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import PartnerStatusIndicator from './PartnerStatusIndicator';
import { usePartnerSync } from '@/hooks/usePartnerSync';
import MomentProgressView from './MomentProgressView';

interface CameraViewProps {
  momentId: string;
  onCaptureSuccess: (result: any) => void;
  onCancel: () => void;
}

export default function CameraView({ momentId, onCaptureSuccess, onCancel }: CameraViewProps) {
  const {
    videoRef,
    start,
    stop,
    switchCamera,
    capturePhoto,
    error,
    retryCamera,
  } = useMomentoCamera();
  
  const [showOverlay, setShowOverlay] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const orientation = useScreenOrientation();
  const partnerState = usePartnerSync(momentId);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);
  
  useEffect(() => {
    if (partnerState.status === 'connected' && !isUploading) {
      setCountdown(3);
    }
  }, [partnerState.status, isUploading]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleCaptureAndUpload();
      setCountdown(null);
    }
  }, [countdown]);
  
  const handleCaptureAndUpload = async () => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(30); // Simulate some progress
    toast.info('Capturing and uploading moment...');

    const dataUrl = capturePhoto();
    if (!dataUrl) {
      toast.error('Failed to capture photo.');
      setIsUploading(false);
      setUploadStatus('failed');
      return;
    }

    try {
        const blob = await (await fetch(dataUrl)).blob();
        setPreviewUrl(URL.createObjectURL(blob));
        
        const formData = new FormData();
        formData.append('file', blob, 'moment.jpg');

        const response = await fetch(`/api/moments/${momentId}/upload`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            setUploadStatus('processing');
            setUploadProgress(70);
            // Simulate processing
            setTimeout(() => {
              setUploadStatus('completed');
              setUploadProgress(100);
              toast.success('Moment captured and uploaded successfully!');
            }, 2000);
        } else {
            setUploadStatus('failed');
            toast.error(result.error || 'Upload failed.');
        }
    } catch (error) {
        setUploadStatus('failed');
        toast.error('An unexpected error occurred during upload.');
        console.error("Upload error:", error);
    } finally {
        setIsUploading(false);
    }
  };
  
  const gestureRef = useTouchGestures<HTMLDivElement>({
    onTap: handleCaptureAndUpload,
    onSwipeDown: onCancel
  });

  if (error) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
        <p className="text-red-500 mb-4">{error.message}</p>
        <button onClick={retryCamera} className="bg-indigo-600 px-4 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        ref={gestureRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <PartnerStatusIndicator momentId={momentId} />

        {uploadStatus !== 'idle' && (
          <MomentProgressView 
            status={uploadStatus} 
            progress={uploadProgress} 
            onDone={() => onCaptureSuccess(null)}
            onRetry={handleCaptureAndUpload}
          />
        )}

        {countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center text-9xl font-bold text-white"
          >
            {countdown > 0 ? countdown : ''}
          </motion.div>
        )}

        {previewUrl && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                <Image src={previewUrl} alt="Moment preview" layout="fill" objectFit="contain" />
            </div>
        )}

        {/* Overlay */}
        <AnimatePresence>
        {showOverlay && !previewUrl && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-center p-4"
          >
            <GlassCard onClick={() => setShowOverlay(false)} className="cursor-pointer">
              {orientation === 'portrait' ? (
                <OrientationGuide />
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white mb-4">Modalità Momento</h2>
                  <p className="text-lg text-gray-300 mb-8">Tutto pronto!</p>
                  <p className="text-gray-400">Tocca lo schermo per scattare.</p>
                </>
              )}
            </GlassCard>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
          <Button variant="glass" onClick={onCancel} className="p-3 rounded-full" disabled={isUploading}>
            <X size={24} />
          </Button>
          <Button variant="glass" onClick={handleCaptureAndUpload} className="w-20 h-20 rounded-full border-4 border-white" disabled={isUploading}>
             {isUploading ? <Loader2 className="animate-spin" size={40} /> : <Camera size={40} />}
          </Button>
          <Button variant="glass" onClick={switchCamera} className="p-3 rounded-full" disabled={isUploading}>
            <RefreshCw size={24} />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 