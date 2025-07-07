import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPushSubscriptionStatus } from '@/lib/push-notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const status = await getPushSubscriptionStatus(session.user.id);

    return NextResponse.json({
      ...status,
      userId: session.user.id
    });

  } catch (error) {
    console.error('Errore nel controllo stato push:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 