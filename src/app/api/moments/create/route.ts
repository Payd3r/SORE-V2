import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { CreateMomentDto, MomentStatus, MOMENT_VALIDATION } from '@/types/memory';
import { notifyMomentCreated } from '@/lib/notifications';

// Validazione dati input per moment
function validateMomentData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validazione campi obbligatori
  if (!data.initiatorId || typeof data.initiatorId !== 'string') {
    errors.push('ID iniziatore obbligatorio');
  }

  if (!data.coupleId || typeof data.coupleId !== 'string') {
    errors.push('ID coppia obbligatorio');
  }

  // Validazione memoryId se specificato
  if (data.memoryId && typeof data.memoryId !== 'string') {
    errors.push('ID memoria non valido');
  }

  // Validazione expiresAt se specificato
  if (data.expiresAt && isNaN(Date.parse(data.expiresAt))) {
    errors.push('Data di scadenza non valida');
  }

  return { isValid: errors.length === 0, errors };
}

// Sanitizzazione dati per moment
function sanitizeMomentData(data: any): CreateMomentDto {
  return {
    initiatorId: data.initiatorId,
    participantId: data.participantId || undefined,
    coupleId: data.coupleId,
    memoryId: data.memoryId || undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
  };
}

export async function POST(request: Request) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verifica permessi
    if (!hasPermission(session.user.role, 'moment:create')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Parsing dati input
    const body = await request.json();
    console.log('Dati ricevuti per creazione momento:', body);

    // Validazione dati
    const { isValid, errors } = validateMomentData(body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Dati non validi', details: errors },
        { status: 400 }
      );
    }

    // Verifica che l'utente appartenga alla coppia
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true }
    });

    if (!user?.couple) {
      return NextResponse.json(
        { error: 'Utente non appartiene a nessuna coppia' },
        { status: 400 }
      );
    }

    // Sanitizzazione dati
    const momentData = sanitizeMomentData({
      ...body,
      initiatorId: session.user.id,
      coupleId: user.couple.id
    });

    // Verifica che la memoria (se specificata) esista e appartenga alla coppia
    if (momentData.memoryId) {
      const memory = await prisma.memory.findUnique({
        where: { id: momentData.memoryId },
        include: { couple: true }
      });

      if (!memory) {
        return NextResponse.json(
          { error: 'Memoria non trovata' },
          { status: 404 }
        );
      }

      if (memory.coupleId !== user.couple.id) {
        return NextResponse.json(
          { error: 'La memoria non appartiene alla coppia' },
          { status: 403 }
        );
      }

      // Verifica limite massimo momenti per memoria
      const momentCount = await prisma.moment.count({
        where: { memoryId: momentData.memoryId }
      });

      if (momentCount >= MOMENT_VALIDATION.MAX_MOMENTS_PER_MEMORY) {
        return NextResponse.json(
          { error: `Massimo ${MOMENT_VALIDATION.MAX_MOMENTS_PER_MEMORY} momenti per memoria` },
          { status: 400 }
        );
      }
    }

    // Verifica limite massimo momenti attivi per coppia
    const activeMoments = await prisma.moment.count({
      where: { 
        coupleId: user.couple.id,
        status: { in: [MomentStatus.PENDING, MomentStatus.PARTNER1_CAPTURED, MomentStatus.PARTNER2_CAPTURED] }
      }
    });

    if (activeMoments >= MOMENT_VALIDATION.MAX_ACTIVE_MOMENTS_PER_COUPLE) {
      return NextResponse.json(
        { error: `Massimo ${MOMENT_VALIDATION.MAX_ACTIVE_MOMENTS_PER_COUPLE} momenti attivi per coppia` },
        { status: 400 }
      );
    }

    // Verifica che il partecipante (se specificato) appartenga alla coppia
    if (momentData.participantId) {
      const participant = await prisma.user.findUnique({
        where: { id: momentData.participantId }
      });

      if (!participant || participant.coupleId !== user.couple.id) {
        return NextResponse.json(
          { error: 'Il partecipante non appartiene alla coppia' },
          { status: 400 }
        );
      }
    }

    // Imposta scadenza di default se non specificata
    if (!momentData.expiresAt) {
      momentData.expiresAt = new Date(Date.now() + MOMENT_VALIDATION.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);
    }

    // Creazione momento nel database
    const moment = await prisma.moment.create({
      data: {
        initiatorId: momentData.initiatorId,
        participantId: momentData.participantId,
        coupleId: momentData.coupleId,
        memoryId: momentData.memoryId,
        expiresAt: momentData.expiresAt,
        status: MomentStatus.PENDING
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        participant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        couple: {
          select: {
            id: true,
            name: true,
            inviteCode: true
          }
        },
        memory: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            location: true
          }
        },
        images: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            path: true,
            thumbnailPath: true
          }
        }
      }
    });

    console.log('Momento creato con successo:', moment.id);

    // Invia notifica al partner se specificato
    if (moment.participantId) {
      try {
        await notifyMomentCreated(moment.id, moment.initiatorId, moment.participantId);
        console.log('Notifica momento creato inviata al partner');
      } catch (notificationError) {
        console.error('Errore nell\'invio notifica (non critico):', notificationError);
        // Non interrompere il flusso per errori di notifica
      }
    }

    return NextResponse.json({
      message: 'Momento creato con successo',
      moment: moment
    });

  } catch (error) {
    console.error('Errore nella creazione del momento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 