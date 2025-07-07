import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/notifications';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID notifica richiesto' },
        { status: 400 }
      );
    }

    const updatedNotification = await markNotificationAsRead(notificationId);

    return NextResponse.json({
      message: 'Notifica segnata come letta',
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Errore nel segnare notifica come letta:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 