'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, VideoOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsCameraReady(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCapturedImage(null);

    // --- iOS/PWA Test Note ---
    // The following section is critical for cross-browser compatibility, especially on iOS.
    // 1. The availability of `navigator.mediaDevices` should be checked.
    // 2. The constraints passed to `getUserMedia` might need adjustments for specific devices.
    // 3. Error handling is key to diagnosing issues during testing.
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("La fotocamera non è supportata su questo browser o dispositivo.");
        return;
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'user', // 'environment' for back camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 16 / 9 }
      }
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      // Extended logging for easier debugging on mobile devices
      console.error('Error accessing camera:', {
          error: err,
          name: err instanceof DOMException ? err.name : 'N/A',
          message: err instanceof DOMException ? err.message : 'N/A',
          userAgent: navigator.userAgent,
          constraints: JSON.stringify(constraints)
      });

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permesso per la fotocamera negato. Controlla le impostazioni del tuo browser.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('Nessuna fotocamera trovata.');
        } else {
           setError('Impossibile accedere alla fotocamera. Riprova.');
        }
      } else {
        setError('Errore sconosciuto durante l\'accesso alla fotocamera.');
      }
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCanPlay = () => {
    setIsCameraReady(true);
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      // Stop the video stream after capture
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (error) {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white p-4 z-50">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Errore Fotocamera</h3>
            <p className="text-center mb-6">{error}</p>
            <Button onClick={onClose}>Chiudi</Button>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="relative w-full h-full">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="object-contain w-full h-full" />
        ) : (
          // --- iOS/PWA Test Note ---
          // The `playsInline` attribute is crucial for preventing the video from
          // automatically entering fullscreen on iOS, which is the desired behavior for a PWA.
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleCanPlay}
            className="w-full h-full object-cover"
          />
        )}
        
        {!isCameraReady && !capturedImage && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
            </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-center items-center">
          {capturedImage ? (
            <div className="flex items-center gap-4">
              <Button onClick={handleRetake} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-5 w-5" />
                Riprova
              </Button>
              <Button onClick={handleConfirm} size="lg">
                <Check className="mr-2 h-5 w-5" />
                Conferma
              </Button>
            </div>
          ) : (
            <Button onClick={handleCapture} size="lg" disabled={!isCameraReady}>
              <Camera className="mr-2 h-5 w-5" />
              {isCameraReady ? 'Scatta' : 'Inizializzazione...'}
            </Button>
          )}
        </div>

        <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-white">
          <VideoOff />
        </Button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}; 