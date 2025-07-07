import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { registerPushSubscription } from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { subscription } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Dati di sottoscrizione non validi' },
        { status: 400 }
      );
    }

    await registerPushSubscription(session.user.id, subscription);

    return NextResponse.json({
      message: 'Sottoscrizione push registrata con successo',
      success: true
    });

  } catch (error) {
    console.error('Errore nella registrazione push:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 