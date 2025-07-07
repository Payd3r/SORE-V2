import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNotificationsForUser, getUnreadNotifications } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let notifications;
    
    if (unreadOnly) {
      notifications = await getUnreadNotifications(session.user.id);
      
      // Se è richiesto solo il conteggio
      if (searchParams.get('count') === 'true') {
        return NextResponse.json({ count: notifications.length });
      }
    } else {
      notifications = await getNotificationsForUser(session.user.id);
    }

    // Applica il limite se specificato
    if (limit && limit > 0) {
      notifications = notifications.slice(0, limit);
    }

    return NextResponse.json({
      notifications,
      count: notifications.length,
      unreadCount: unreadOnly ? notifications.length : notifications.filter(n => !n.isRead).length
    });

  } catch (error) {
    console.error('Errore nel recupero notifiche:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 