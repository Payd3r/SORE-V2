import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unregisterPushSubscription } from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    await unregisterPushSubscription(session.user.id);

    return NextResponse.json({
      message: 'Sottoscrizione push rimossa con successo',
      success: true
    });

  } catch (error) {
    console.error('Errore nella rimozione push:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 