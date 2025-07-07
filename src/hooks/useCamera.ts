import { useState, useRef, useCallback, useEffect } from 'react';

export interface CameraError {
  type: 'permission' | 'device' | 'network' | 'unknown';
  message: string;
}

export interface CameraHookOptions {
  facingMode?: 'user' | 'environment';
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  autoStart?: boolean;
}

export interface CameraHookReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  error: CameraError | null;
  isActive: boolean;
  capabilities: MediaTrackCapabilities | null;
  facingMode: 'user' | 'environment';
  flashEnabled: boolean;
  startCamera: (facing?: 'user' | 'environment') => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  switchCamera: () => void;
  toggleFlash: () => Promise<void>;
  retryCamera: () => void;
  clearError: () => void;
}

export function useCamera(options: CameraHookOptions = {}): CameraHookReturn {
  const {
    facingMode = 'environment',
    aspectRatio = 'square',
    autoStart = false
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [capabilities, setCapabilities] = useState<MediaTrackCapabilities | null>(null);

  // Ottieni le constraint della fotocamera
  const getCameraConstraints = useCallback((facing: 'user' | 'environment') => {
    const baseConstraints: MediaStreamConstraints = {
      video: {
        facingMode: facing,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        aspectRatio: aspectRatio === 'square' ? 1 : aspectRatio === 'landscape' ? 16/9 : 9/16
      },
      audio: false
    };

    // Constraint specifiche per iPhone
    if (navigator.userAgent.includes('iPhone')) {
      const videoConstraints = baseConstraints.video as MediaTrackConstraints;
      baseConstraints.video = {
        ...videoConstraints,
        width: { ideal: 1920, min: 1280, max: 3840 },
        height: { ideal: 1080, min: 720, max: 2160 },
        frameRate: { ideal: 30, min: 15, max: 60 }
      };
    }

    return baseConstraints;
  }, [aspectRatio]);

  // Avvia la fotocamera
  const startCamera = useCallback(async (facing?: 'user' | 'environment') => {
    const targetFacing = facing || currentFacingMode;
    
    try {
      setIsLoading(true);
      setError(null);

      // Ferma lo stream esistente
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = getCameraConstraints(targetFacing);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        setCurrentFacingMode(targetFacing);

        // Ottieni le capacità della fotocamera
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const trackCapabilities = videoTrack.getCapabilities();
          setCapabilities(trackCapabilities);
        }
      }
    } catch (err) {
      console.error('Errore accesso fotocamera:', err);
      let errorType: CameraError['type'] = 'unknown';
      let errorMessage = 'Errore sconosciuto';

      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            errorType = 'permission';
            errorMessage = 'Accesso alla fotocamera negato. Abilita i permessi nelle impostazioni.';
            break;
          case 'NotFoundError':
            errorType = 'device';
            errorMessage = 'Nessuna fotocamera trovata sul dispositivo.';
            break;
          case 'NotReadableError':
            errorType = 'device';
            errorMessage = 'Fotocamera in uso da un\'altra applicazione.';
            break;
          case 'OverconstrainedError':
            errorType = 'device';
            errorMessage = 'Impostazioni fotocamera non supportate.';
            break;
          default:
            errorMessage = err.message || 'Errore di accesso alla fotocamera';
        }
      }

      setError({ type: errorType, message: errorMessage });
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentFacingMode, getCameraConstraints]);

  // Ferma la fotocamera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setCapabilities(null);
    setFlashEnabled(false);
  }, []);

  // Cattura foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Imposta dimensioni canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Disegna il frame video sul canvas
    context.drawImage(video, 0, 0);

    // Converti in base64
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [isActive]);

  // Cambia fotocamera (fronte/retro)
  const switchCamera = useCallback(() => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startCamera(newFacingMode);
  }, [currentFacingMode, startCamera]);

  // Gestione flash (se supportato)
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      // Prova ad applicare constraint per flash/torch
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any]
      });
      setFlashEnabled(!flashEnabled);
    } catch (err) {
      console.error('Errore controllo flash:', err);
    }
  }, [flashEnabled]);

  // Riprova accesso fotocamera
  const retryCamera = useCallback(() => {
    startCamera(currentFacingMode);
  }, [currentFacingMode, startCamera]);

  // Cancella errore
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Avvio automatico
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    error,
    isActive,
    capabilities,
    facingMode: currentFacingMode,
    flashEnabled,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    toggleFlash,
    retryCamera,
    clearError
  };
} 