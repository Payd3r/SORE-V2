'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher/client';
import { Channel } from 'pusher-js';
import Image from 'next/image';
import { CameraCapture } from './CameraCapture';
import { Button } from '@/components/ui/button';
import { Sparkles, Hourglass, UserCheck, Camera as CameraIcon, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/lib/analytics';

type MomentStatus = 'idle' | 'initiating_capture' | 'waiting_for_partner' | 'prompted_to_join' | 'partner_capturing' | 'uploading' | 'completed' | 'failed' | 'loading' | 'expired';

interface MomentPayload {
  id: string;
  initiator: { id: string; name: string };
  expiresAt: string;
}

interface CompletedMomentPayload {
    id: string;
    combinedImage: string | null;
}

interface MomentManagerProps {
    memoryId?: string; // Memory ID is optional
}

export const MomentManager: React.FC<MomentManagerProps> = ({ memoryId }) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [status, setStatus] = useState<MomentStatus>('loading');
  const [momentId, setMomentId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [completedImageUrl, setCompletedImageUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const coupleId = session?.user?.coupleId;

  const resetState = useCallback(() => {
    setStatus('idle');
    setMomentId(null);
    setIsCameraOpen(false);
    setCompletedImageUrl(null);
  }, []);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator.onLine === 'boolean') {
        setIsOnline(navigator.onLine);
    }
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch active moment on mount
  useEffect(() => {
    const fetchActiveMoment = async () => {
        // Only fetch if idle, to avoid interrupting an ongoing flow
        if (status !== 'loading') return;

        try {
            const response = await fetch('/api/moments/active');
            if (response.ok) {
                const moment = await response.json();
                if (moment && session?.user?.id) {
                    setMomentId(moment.id);
                    if (moment.initiatorId === session.user.id) {
                        setStatus('waiting_for_partner');
                    } else {
                        // Partner needs expiration info too, to not show an expired prompt
                        if (moment.expiresAt && new Date() > new Date(moment.expiresAt)) {
                            setStatus('expired');
                        } else {
                            setStatus('prompted_to_join');
                        }
                    }
                } else {
                    setStatus('idle');
                }
            } else {
                setStatus('idle');
            }
        } catch (error) {
            console.error("Failed to fetch active moment:", error);
            trackEvent('moment_failed', { stage: 'fetch_active', error: error instanceof Error ? error.message : 'Unknown' });
            setStatus('failed');
        }
    };
    fetchActiveMoment();
  }, [session?.user?.id, status]);

  // Expiration timeout for initiator
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'waiting_for_partner' && momentId) {
        // This requires the full moment object to be fetched or passed
        // For now, let's assume we get expiresAt from somewhere
        // Refetching moment details here would be robust
        const fetchMomentDetails = async () => {
            const res = await fetch(`/api/moments/active`); // re-using active moment endpoint
            if (res.ok) {
                const moment = await res.json();
                if (moment && moment.expiresAt) {
                    const expiryTime = new Date(moment.expiresAt).getTime();
                    const now = Date.now();
                    const delay = expiryTime - now;
                    
                    if (delay > 0) {
                        timer = setTimeout(() => {
                            trackEvent('moment_expired', { momentId });
                            setStatus('expired');
                            toast({
                                title: "Momento Scaduto",
                                description: "Il tuo partner non ha risposto in tempo.",
                                variant: 'destructive'
                            });
                        }, delay);
                    } else {
                        trackEvent('moment_expired', { momentId });
                        setStatus('expired');
                    }
                }
            }
        };
        fetchMomentDetails();
    }
    return () => {
      clearTimeout(timer);
    };
  }, [status, momentId, toast]);

  // Pusher subscription
  useEffect(() => {
    if (!coupleId || !pusherClient) return;
    const channelName = `private-couple-${coupleId}`;
    let channel: Channel;
    try {
        channel = pusherClient.subscribe(channelName);
        const handleMomentInitiated = (payload: MomentPayload) => {
            if (session?.user?.id !== payload.initiator.id) {
                setMomentId(payload.id);
                setStatus('prompted_to_join');
                toast({
                    title: "Momento Speciale!",
                    description: `${payload.initiator.name} ti ha invitato a catturare un momento.`,
                });
            }
        };
        const handleMomentCompleted = (payload: CompletedMomentPayload) => {
            // Check against momentId from state, which is set when flow starts for either user
            if (momentId && payload.id === momentId) {
                trackEvent('moment_completed', { momentId });
                setStatus('completed');
                setCompletedImageUrl(payload.combinedImage);
                toast({
                    title: "Momento Completato!",
                    description: "La vostra foto speciale è pronta.",
                });
            }
        };
        channel.bind('moment:initiated', handleMomentInitiated);
        channel.bind('moment:completed', handleMomentCompleted);
    } catch (error) {
        console.error("Failed to subscribe to Pusher channel:", error);
    }
    return () => {
      if (pusherClient && channel) {
        channel.unbind_all();
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [coupleId, session?.user?.id, toast, momentId]);

  const initiateMomentCapture = () => {
    setStatus('initiating_capture');
    setIsCameraOpen(true);
  };

  const joinMoment = () => {
    trackEvent('moment_partner_joined', { momentId });
    setStatus('partner_capturing');
    setIsCameraOpen(true);
  };
  
  const handleCapture = async (imageDataUrl: string) => {
      setIsCameraOpen(false);
      setStatus('uploading');
      
      const isInitiator = status === 'initiating_capture';
      const endpoint = isInitiator ? '/api/moments/initiate' : `/api/moments/${momentId}/complete`;
      
      const body = isInitiator
        ? { memoryId, initiatorImageBase64: imageDataUrl.split(',')[1] }
        : { partnerImageBase64: imageDataUrl.split(',')[1] };

      try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Request failed");
        }
        
        if (isInitiator) {
            const newMoment = await response.json();
            setMomentId(newMoment.id);
            setStatus('waiting_for_partner');
            trackEvent('moment_initiated', { momentId: newMoment.id, memoryId });
            toast({ title: "Invito inviato!", description: "In attesa che il tuo partner scatti la sua foto." });
        } else {
             toast({ title: "Foto caricata!", description: "La foto è stata inviata per essere combinata." });
        }

      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        trackEvent('moment_failed', { 
            stage: isInitiator ? 'initiate' : 'complete',
            momentId, 
            error: errorMessage 
        });
        toast({ title: 'Errore', description: errorMessage, variant: 'destructive' });
        setStatus('failed');
      }
  };

  const renderContent = () => {
    if (!isOnline) {
        return <p className="flex items-center gap-2 text-red-600"><AlertTriangle className="mr-2 h-4 w-4" /> Sei offline. Connettiti per usare questa funzione.</p>;
    }

    switch (status) {
      case 'loading':
        return <p className="flex items-center gap-2"><Hourglass className="animate-spin mr-2 h-4 w-4" /> Caricamento...</p>;
      case 'idle':
        return <Button onClick={initiateMomentCapture}><Sparkles className="mr-2 h-4 w-4" /> Avvia un Momento</Button>;
      case 'waiting_for_partner':
        return <p className="flex items-center gap-2"><UserCheck className="mr-2 h-4 w-4" /> In attesa del partner...</p>;
      case 'prompted_to_join':
        return (
            <div className="p-4 border rounded-lg text-center">
                <h3 className="font-bold">Invito a un Momento!</h3>
                <p>Sei stato invitato a catturare un momento speciale.</p>
                <Button onClick={joinMoment} className="mt-2"><CameraIcon className="mr-2 h-4 w-4" /> Partecipa</Button>
            </div>
        );
      case 'initiating_capture':
      case 'partner_capturing':
        return isCameraOpen ? <CameraCapture onCapture={handleCapture} onClose={resetState} /> : <p>Pronto a scattare...</p>;
      case 'uploading':
        return <p className="flex items-center gap-2"><Hourglass className="animate-spin mr-2 h-4 w-4" /> Combinando le foto...</p>;
      case 'completed':
        return (
            <div className="text-center">
                <p className="flex items-center justify-center gap-2 text-green-600 mb-4"><CheckCircle className="mr-2 h-4 w-4" /> Momento completato!</p>
                {completedImageUrl && (
                    <Image 
                        src={completedImageUrl} 
                        alt="Momento completato"
                        width={540}
                        height={1080}
                        className="rounded-lg object-contain"
                    />
                )}
                <Button onClick={resetState} className="mt-4">Crea un altro momento</Button>
            </div>
        );
      case 'expired':
        return (
            <div className="text-center">
                <p className="flex items-center justify-center gap-2 text-yellow-600 mb-4"><Hourglass className="mr-2 h-4 w-4" /> Momento Scaduto.</p>
                <Button onClick={resetState}>OK</Button>
            </div>
        );
      case 'failed':
        return (
            <div className="text-center">
                <p className="flex items-center justify-center gap-2 text-red-600 mb-4"><XCircle className="mr-2 h-4 w-4" /> Errore.</p>
                <Button onClick={resetState}>Riprova</Button>
            </div>
        );
      default:
        return null;
    }
  };

  return <div className="p-4 border rounded-lg shadow-md flex justify-center items-center">{renderContent()}</div>;
}; 