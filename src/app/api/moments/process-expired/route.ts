import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { processExpiredMoments } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica autenticazione (opzionale per job automatici)
    if (!session?.user) {
      // Permetti l'accesso solo se è una chiamata interna o da un job schedulato
      // In produzione, questo endpoint dovrebbe essere protetto da un token API
      console.log('Processing expired moments without user session (automated job)');
    } else {
      // Se c'è una sessione, verifica i permessi admin
      if (!hasPermission(session.user.role, 'moment:manage_all')) {
        return NextResponse.json(
          { error: 'Permessi insufficienti' },
          { status: 403 }
        );
      }
    }

    console.log('Starting expired moments processing...');
    const result = await processExpiredMoments();

    return NextResponse.json({
      message: 'Elaborazione momenti scaduti completata',
      processedCount: result.processedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore nell\'elaborazione momenti scaduti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'moment:read')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Restituisce informazioni sui momenti che scadranno presto
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const expiringSoon = await prisma.moment.count({
      where: {
        expiresAt: {
          gte: now,
          lte: in24Hours,
        },
        status: {
          notIn: ['completed', 'expired'],
        },
      },
    });

    const alreadyExpired = await prisma.moment.count({
      where: {
        expiresAt: {
          lt: now,
        },
        status: {
          notIn: ['completed', 'expired'],
        },
      },
    });

    return NextResponse.json({
      expiringSoon,
      alreadyExpired,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore nel recupero informazioni scadenza:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 