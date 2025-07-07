'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

interface NotificationBadgeProps {
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({ className, showZero = false }: NotificationBadgeProps) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    fetchUnreadCount();
    
    // Polling per aggiornamenti in tempo reale (ogni 30 secondi)
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unread=true');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Errore nel recupero notifiche non lette:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!showZero && unreadCount === 0) {
    return null;
  }

  const badgeClassName = unreadCount > 0 
    ? `bg-red-500 text-white hover:bg-red-600 animate-pulse ${className}` 
    : className;

  return (
    <Badge 
      variant={unreadCount > 0 ? "default" : "secondary"}
      className={badgeClassName}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
} 