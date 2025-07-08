'use client';

import React, { useEffect, PropsWithChildren } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface MomentPayload {
  momentId: string;
  initiator: { id: string; name: string };
  expiresAt: string;
}

export const NotificationsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const coupleId = session?.user?.coupleId;

  useEffect(() => {
    if (!coupleId || !pusherClient) {
      return;
    }

    const channelName = `private-couple-${coupleId}`;
    try {
      const channel = pusherClient.subscribe(channelName);

      const handleMomentInitiated = (payload: MomentPayload) => {
        if (session?.user?.id !== payload.initiator.id) {
          toast({
            title: "✨ Invito a un Momento Speciale!",
            description: `${payload.initiator.name} ti sta aspettando per catturare un ricordo insieme.`,
            duration: 10000, // 10 secondi
            action: (
              <Link href={`/moments/join/${payload.momentId}`} passHref>
                <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Partecipa
                </Button>
              </Link>
            ),
          });
        }
      };
      
      channel.bind('moment:initiated', handleMomentInitiated);

      // Qui si possono aggiungere altri binding per altri tipi di notifiche

      return () => {
        if (channel) {
            channel.unbind('moment:initiated', handleMomentInitiated);
        }
        if (pusherClient) {
            pusherClient.unsubscribe(channelName);
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to Pusher channel:', error);
    }
  }, [coupleId, session?.user?.id, toast]);

  return <>{children}</>;
}; 