'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface MomentoStatusProps {
  lastMessage: any; // Ideally, a more specific type
}

export default function MomentoStatus({ lastMessage }: MomentoStatusProps) {
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'welcome':
        toast.info(lastMessage.message);
        break;
      case 'image_captured':
        toast.success("Il partner ha catturato la sua immagine!");
        break;
      case 'sync_start':
        toast.loading("Sincronizzazione delle foto in corso...");
        break;
      case 'sync_complete':
        toast.dismiss();
        toast.success("Momento creato con successo!");
        break;
      case 'error':
        toast.error(lastMessage.message || "Si è verificato un errore.");
        break;
      default:
        // You can ignore other message types here
        break;
    }
  }, [lastMessage]);

  return <Toaster position="top-center" richColors />;
} 