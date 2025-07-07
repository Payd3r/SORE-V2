'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  deepLink?: string;
}

interface NotificationListProps {
  className?: string;
  limit?: number;
  showReadNotifications?: boolean;
}

export function NotificationList({ 
  className, 
  limit, 
  showReadNotifications = true 
}: NotificationListProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    fetchNotifications();
  }, [session?.user?.id, showReadNotifications]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (!showReadNotifications) params.append('unread', 'true');

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Errore nel recupero notifiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (markingAsRead.includes(notificationId)) return;

    setMarkingAsRead(prev => [...prev, notificationId]);
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Errore nel segnare notifica come letta:', error);
    } finally {
      setMarkingAsRead(prev => prev.filter(id => id !== notificationId));
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Errore nel segnare tutte le notifiche come lette:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'moment_created': '📸',
      'moment_ready': '✨',
      'moment_partner_captured': '👥',
      'moment_completed': '✅',
      'moment_expired': '⏳',
      'memory_created': '💝',
      'anniversary_reminder': '🎉',
      'idea_added': '💡',
      'challenge_completed': '🏆',
      'new_images': '📷',
      'content_uploaded': '📎',
    };
    return iconMap[type] || '🔔';
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Ora';
    if (diffMinutes < 60) return `${diffMinutes}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className={className}>
      {unreadNotifications.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Notifiche ({unreadNotifications.length} non lette)
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
          >
            Segna tutte come lette
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-2">🔔</div>
          <p className="text-gray-500">Nessuna notifica</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 transition-all hover:shadow-md ${
                !notification.isRead 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className={`text-sm ${
                      !notification.isRead 
                        ? 'font-medium text-gray-900' 
                        : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-2 ml-3">
                      {!notification.isRead && (
                        <Badge variant="default" className="bg-blue-500">
                          Nuovo
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    {notification.deepLink && (
                      <Link href={notification.deepLink}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Visualizza
                        </Button>
                      </Link>
                    )}
                    
                    {!notification.isRead && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => markAsRead(notification.id)}
                        disabled={markingAsRead.includes(notification.id)}
                      >
                        {markingAsRead.includes(notification.id) ? 'Segnando...' : 'Segna come letta'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 