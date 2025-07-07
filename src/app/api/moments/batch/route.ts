import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { MomentStatus } from '@/types/memory';

// Interfaccia per batch update
interface BatchUpdateMomentDto {
  momentIds: string[];
  status?: MomentStatus;
  expiresAt?: string;
}

// Interfaccia per batch delete
interface BatchDeleteMomentDto {
  momentIds: string[];
}

// PUT /api/moments/batch - Aggiorna status di momenti multipli
export async function PUT(request: Request) {
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
    if (!hasPermission(session.user.role, 'moment:participate')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Verifica che l'utente appartenga a una coppia
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

    // Parsing dati input
    const body: BatchUpdateMomentDto = await request.json();
    console.log('Dati ricevuti per batch update momenti:', body);

    // Validazione
    if (!Array.isArray(body.momentIds) || body.momentIds.length === 0) {
      return NextResponse.json(
        { error: 'Lista di ID momenti richiesta' },
        { status: 400 }
      );
    }

    if (body.momentIds.length > 50) {
      return NextResponse.json(
        { error: 'Massimo 50 momenti per operazione batch' },
        { status: 400 }
      );
    }

    // Validazione status se presente
    if (body.status && !Object.values(MomentStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Status non valido' },
        { status: 400 }
      );
    }

    // Validazione expiresAt se presente
    if (body.expiresAt && isNaN(Date.parse(body.expiresAt))) {
      return NextResponse.json(
        { error: 'Data di scadenza non valida' },
        { status: 400 }
      );
    }

    // Verifica che tutti i momenti esistano e appartengano alla coppia dell'utente
    const existingMoments = await prisma.moment.findMany({
      where: {
        id: { in: body.momentIds },
        coupleId: user.couple.id
      },
      include: {
        initiator: { select: { id: true, name: true } },
        participant: { select: { id: true, name: true } },
        memory: { select: { id: true, title: true, authorId: true } }
      }
    });

    if (existingMoments.length !== body.momentIds.length) {
      return NextResponse.json(
        { error: 'Alcuni momenti non esistono o non hai accesso' },
        { status: 404 }
      );
    }

    // Verifica permessi per ogni momento
    const unauthorizedMoments = existingMoments.filter((moment: any) => {
      const isInvolved = moment.initiatorId === session.user.id || moment.participantId === session.user.id;
      const isMemoryAuthor = moment.memory?.authorId === session.user.id;
      const isAdmin = hasPermission(session.user.role, 'moment:manage_all');
      
      return !isInvolved && !isMemoryAuthor && !isAdmin;
    });

    if (unauthorizedMoments.length > 0) {
      return NextResponse.json(
        { 
          error: 'Permessi insufficienti per alcuni momenti',
          unauthorizedMoments: unauthorizedMoments.map((m: any) => m.id)
        },
        { status: 403 }
      );
    }

    // Prepara dati per aggiornamento
    const updateData: any = {};
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    // Esegui batch update
    const updatedMoments = await prisma.moment.updateMany({
      where: {
        id: { in: body.momentIds },
        coupleId: user.couple.id
      },
      data: updateData
    });

    console.log(`Batch update completato: ${updatedMoments.count} momenti aggiornati`);

    // Recupera i momenti aggiornati per la risposta
    const updatedMomentsData = await prisma.moment.findMany({
      where: {
        id: { in: body.momentIds }
      },
      include: {
        initiator: { select: { id: true, name: true } },
        participant: { select: { id: true, name: true } },
        memory: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json({
      message: `${updatedMoments.count} momenti aggiornati con successo`,
      updatedCount: updatedMoments.count,
      moments: updatedMomentsData.map((moment: any) => ({
        id: moment.id,
        status: moment.status,
        expiresAt: moment.expiresAt,
        initiator: moment.initiator,
        participant: moment.participant,
        memory: moment.memory
      }))
    });

  } catch (error) {
    console.error('Errore nel batch update momenti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/moments/batch - Elimina momenti multipli
export async function DELETE(request: Request) {
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
    if (!hasPermission(session.user.role, 'moment:participate')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Verifica che l'utente appartenga a una coppia
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

    // Parsing dati input
    const body: BatchDeleteMomentDto = await request.json();
    console.log('Dati ricevuti per batch delete momenti:', body);

    // Validazione
    if (!Array.isArray(body.momentIds) || body.momentIds.length === 0) {
      return NextResponse.json(
        { error: 'Lista di ID momenti richiesta' },
        { status: 400 }
      );
    }

    if (body.momentIds.length > 20) {
      return NextResponse.json(
        { error: 'Massimo 20 momenti per eliminazione batch' },
        { status: 400 }
      );
    }

    // Verifica che tutti i momenti esistano e appartengano alla coppia dell'utente
    const existingMoments = await prisma.moment.findMany({
      where: {
        id: { in: body.momentIds },
        coupleId: user.couple.id
      },
      include: {
        initiator: { select: { id: true, name: true } },
        participant: { select: { id: true, name: true } },
        memory: { select: { id: true, title: true, authorId: true } },
        images: { select: { id: true, filename: true } }
      }
    });

    if (existingMoments.length !== body.momentIds.length) {
      return NextResponse.json(
        { error: 'Alcuni momenti non esistono o non hai accesso' },
        { status: 404 }
      );
    }

    // Verifica permessi per ogni momento (same logic as single delete)
    const unauthorizedMoments = existingMoments.filter((moment: any) => {
      const isInitiator = moment.initiatorId === session.user.id;
      const isMemoryAuthor = moment.memory?.authorId === session.user.id;
      const isAdmin = hasPermission(session.user.role, 'moment:manage_all');
      
      return !isInitiator && !isMemoryAuthor && !isAdmin;
    });

    if (unauthorizedMoments.length > 0) {
      return NextResponse.json(
        { 
          error: 'Permessi insufficienti per alcuni momenti',
          unauthorizedMoments: unauthorizedMoments.map((m: any) => m.id)
        },
        { status: 403 }
      );
    }

    // Calcola statistiche pre-eliminazione
    const totalImages = existingMoments.reduce((sum: number, moment: any) => sum + moment.images.length, 0);

    // Eliminazione in transazione per garantire consistenza
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Elimina tutte le immagini associate ai momenti
      if (totalImages > 0) {
        await tx.image.deleteMany({
          where: {
            momentId: { in: body.momentIds }
          }
        });
      }

      // 2. Elimina i momenti
      const deletedMoments = await tx.moment.deleteMany({
        where: {
          id: { in: body.momentIds },
          coupleId: user.couple!.id
        }
      });

      return {
        deletedMoments: deletedMoments.count,
        deletedImages: totalImages
      };
    });

    console.log(`Batch delete completato: ${result.deletedMoments} momenti eliminati, ${result.deletedImages} immagini eliminate`);

    return NextResponse.json({
      message: `${result.deletedMoments} momenti eliminati con successo`,
      deletedMoments: result.deletedMoments,
      deletedImages: result.deletedImages,
      momentIds: body.momentIds
    });

  } catch (error) {
    console.error('Errore nel batch delete momenti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 