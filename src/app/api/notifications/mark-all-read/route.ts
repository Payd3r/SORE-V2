import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markNotificationsAsRead } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Segna tutte le notifiche non lette come lette
    const result = await markNotificationsAsRead(session.user.id);

    return NextResponse.json({
      message: 'Tutte le notifiche sono state segnate come lette',
      updatedCount: result.count
    });

  } catch (error) {
    console.error('Errore nel segnare tutte le notifiche come lette:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 