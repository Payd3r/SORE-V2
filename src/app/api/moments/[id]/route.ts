import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { UpdateMomentDto, MomentStatus } from '@/types/memory';
import { notifyPartnerCaptured, notifyMomentCompleted } from '@/lib/notifications';
import { combineFromMoment } from '@/lib/photo-combiner';
import { updateMemoryTimelineForMoment } from '@/lib/memory-timeline';

// GET /api/moments/[id] - Recupera un singolo momento
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!hasPermission(session.user.role, 'moment:read')) {
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

    const { id: momentId } = await params;

    // Recupera momento con tutte le relazioni
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
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
            location: true,
            category: true,
            mood: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        images: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            path: true,
            thumbnailPath: true,
            category: true,
            metadata: true,
            width: true,
            height: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!moment) {
      return NextResponse.json(
        { error: 'Momento non trovato' },
        { status: 404 }
      );
    }

    // Verifica che il momento appartenga alla coppia dell'utente
    if (moment.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Non hai accesso a questo momento' },
        { status: 403 }
      );
    }

    // Informazioni aggiuntive per il debug
    const isUserInvolved = moment.initiatorId === session.user.id || moment.participantId === session.user.id;
    const timeUntilExpiry = moment.expiresAt ? Math.max(0, moment.expiresAt.getTime() - Date.now()) : null;
    const isExpired = moment.expiresAt ? moment.expiresAt.getTime() < Date.now() : false;

    console.log(`Momento recuperato: ${moment.id}, status: ${moment.status}, utente coinvolto: ${isUserInvolved}, scaduto: ${isExpired}`);

    return NextResponse.json({
      moment: moment,
      metadata: {
        isUserInvolved,
        timeUntilExpiry,
        isExpired,
        canParticipate: isUserInvolved && !isExpired && moment.status !== MomentStatus.COMPLETED
      }
    });

  } catch (error) {
    console.error('Errore nel recupero del momento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT /api/moments/[id] - Aggiorna un momento
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: momentId } = await params;

    // Verifica che il momento esista e appartenga alla coppia
    const existingMoment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: { couple: true }
    });

    if (!existingMoment) {
      return NextResponse.json(
        { error: 'Momento non trovato' },
        { status: 404 }
      );
    }

    if (existingMoment.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Non hai accesso a questo momento' },
        { status: 403 }
      );
    }

    // Verifica che l'utente sia coinvolto nel momento
    const isUserInvolved = existingMoment.initiatorId === session.user.id || existingMoment.participantId === session.user.id;
    if (!isUserInvolved) {
      return NextResponse.json(
        { error: 'Non sei coinvolto in questo momento' },
        { status: 403 }
      );
    }

    // Parsing dati input
    const body = await request.json();
    console.log('Dati ricevuti per aggiornamento momento:', body);

    // Validazione dati di aggiornamento
    const updateData: UpdateMomentDto = {};
    const errors: string[] = [];

    if (body.status !== undefined) {
      if (!Object.values(MomentStatus).includes(body.status)) {
        errors.push('Stato non valido');
      } else {
        // Validazione logica di transizione stati
        const currentStatus = existingMoment.status;
        const newStatus = body.status;

        // Logica di validazione delle transizioni
        const validTransitions: Record<string, string[]> = {
          [MomentStatus.PENDING]: [MomentStatus.PARTNER1_CAPTURED, MomentStatus.PARTNER2_CAPTURED, MomentStatus.EXPIRED],
          [MomentStatus.PARTNER1_CAPTURED]: [MomentStatus.PARTNER2_CAPTURED, MomentStatus.COMPLETED, MomentStatus.EXPIRED],
          [MomentStatus.PARTNER2_CAPTURED]: [MomentStatus.PARTNER1_CAPTURED, MomentStatus.COMPLETED, MomentStatus.EXPIRED],
          [MomentStatus.COMPLETED]: [], // Stato finale
          [MomentStatus.EXPIRED]: []   // Stato finale
        };

        if (currentStatus !== newStatus && validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
          errors.push(`Transizione di stato non valida da ${currentStatus} a ${newStatus}`);
        } else {
          updateData.status = newStatus;
          
          // Auto-complete se entrambi i partner hanno catturato
          if ((newStatus === MomentStatus.PARTNER1_CAPTURED && existingMoment.status === MomentStatus.PARTNER2_CAPTURED) ||
              (newStatus === MomentStatus.PARTNER2_CAPTURED && existingMoment.status === MomentStatus.PARTNER1_CAPTURED)) {
            updateData.status = MomentStatus.COMPLETED;
            updateData.completedAt = new Date();
          }
        }
      }
    }

    if (body.capturedBy !== undefined) {
      if (body.capturedBy && body.capturedBy !== existingMoment.initiatorId && body.capturedBy !== existingMoment.participantId) {
        errors.push('L\'utente che cattura deve essere coinvolto nel momento');
      } else {
        updateData.capturedBy = body.capturedBy || null;
      }
    }

    if (body.combinedImagePath !== undefined) {
      if (typeof body.combinedImagePath !== 'string' && body.combinedImagePath !== null) {
        errors.push('Percorso immagine combinata non valido');
      } else {
        updateData.combinedImagePath = body.combinedImagePath;
      }
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt && isNaN(Date.parse(body.expiresAt))) {
        errors.push('Data di scadenza non valida');
      } else {
                 updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Dati non validi', details: errors },
        { status: 400 }
      );
    }

    // Se non ci sono campi da aggiornare
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare specificato' },
        { status: 400 }
      );
    }

    // Aggiorna momento nel database
    const updatedMoment = await prisma.moment.update({
      where: { id: momentId },
      data: updateData,
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
            name: true
          }
        },
        memory: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        images: {
          select: {
            id: true,
            filename: true,
            path: true,
            thumbnailPath: true
          }
        }
      }
    });

    console.log('Momento aggiornato con successo:', updatedMoment.id, 'nuovo status:', updatedMoment.status);

    // Invio notifiche basate sulle transizioni di stato
    if (updateData.status && existingMoment.status !== updateData.status) {
      try {
        const oldStatus = existingMoment.status;
        const newStatus = updateData.status;

        // Notifica quando un partner ha catturato
        if ((oldStatus === MomentStatus.PENDING && (newStatus === MomentStatus.PARTNER1_CAPTURED || newStatus === MomentStatus.PARTNER2_CAPTURED)) ||
            (oldStatus === MomentStatus.PARTNER1_CAPTURED && newStatus === MomentStatus.PARTNER2_CAPTURED) ||
            (oldStatus === MomentStatus.PARTNER2_CAPTURED && newStatus === MomentStatus.PARTNER1_CAPTURED)) {
          
          // Notifica l'altro partner
          const otherPartnerId = existingMoment.initiatorId === session.user.id ? existingMoment.participantId : existingMoment.initiatorId;
          if (otherPartnerId) {
            await notifyPartnerCaptured(updatedMoment.id, session.user.id, otherPartnerId);
            console.log('Notifica partner catturato inviata');
          }
        }

        // Notifica quando il momento è completato
        if (newStatus === MomentStatus.COMPLETED) {
          await notifyMomentCompleted(updatedMoment.id, updatedMoment.coupleId);
          console.log('Notifica momento completato inviata');

          // Combina automaticamente le foto se disponibili
          try {
            const combinedResult = await combineFromMoment(updatedMoment.id);
            if (combinedResult) {
              console.log('Foto combinate automaticamente:', combinedResult.combinedPath);
              
              // Salva l'immagine combinata nel database con metadati estesi
              const combinedImage = await prisma.image.create({
                data: {
                  filename: combinedResult.combinedFilename,
                  originalName: `Combined_${combinedResult.metadata.momentInfo.id}.webp`,
                  path: combinedResult.combinedPath,
                  thumbnailPath: combinedResult.thumbnailPath,
                  size: combinedResult.metadata.size,
                  width: combinedResult.metadata.width,
                  height: combinedResult.metadata.height,
                  mimeType: 'image/webp',
                  category: 'MOMENT', // Tag automatico per momenti
                  hash: '', // Hash sarà calcolato se necessario
                  isFavorite: false,
                  momentId: updatedMoment.id,
                  memoryId: updatedMoment.memoryId,
                  metadata: JSON.stringify({
                    type: 'combined_moment',
                    originalImages: combinedResult.metadata.originalImages,
                    image1Metadata: combinedResult.metadata.image1Metadata,
                    image2Metadata: combinedResult.metadata.image2Metadata,
                    momentInfo: combinedResult.metadata.momentInfo,
                    combinedAt: combinedResult.metadata.completedAt,
                    partners: {
                      initiator: {
                        id: combinedResult.metadata.momentInfo.initiatorId,
                        name: combinedResult.metadata.image1Metadata.photographer?.name || 'Sconosciuto'
                      },
                      participant: combinedResult.metadata.momentInfo.participantId ? {
                        id: combinedResult.metadata.momentInfo.participantId,
                        name: combinedResult.metadata.image2Metadata.photographer?.name || 'Sconosciuto'
                      } : null
                    },
                    exifData: {
                      image1: combinedResult.metadata.image1Metadata.exif,
                      image2: combinedResult.metadata.image2Metadata.exif
                    },
                    timestamps: {
                      momentCreated: combinedResult.metadata.momentInfo.createdAt,
                      momentCompleted: combinedResult.metadata.momentInfo.completedAt,
                      image1Captured: combinedResult.metadata.image1Metadata.capturedAt,
                      image2Captured: combinedResult.metadata.image2Metadata.capturedAt
                    }
                  })
                }
              });

              console.log('Immagine combinata salvata nel database con metadati estesi:', combinedImage.id);
              
              // L'immagine combinata è già collegata al momento tramite momentId
              // Non serve aggiornare il momento poiché la relazione è già stabilita

            } else {
              console.log('Combinazione foto non disponibile (foto insufficienti)');
            }
          } catch (combineError) {
            console.error('Errore nella combinazione foto (non critico):', combineError);
            // Non interrompere il flusso per errori di combinazione
          }

          // Aggiorna timeline della memoria
          try {
            await updateMemoryTimelineForMoment(updatedMoment.id);
            console.log('Timeline memoria aggiornata');
          } catch (timelineError) {
            console.error('Errore nell\'aggiornamento timeline (non critico):', timelineError);
            // Non interrompere il flusso per errori di timeline
          }
        }

      } catch (notificationError) {
        console.error('Errore nell\'invio notifiche (non critico):', notificationError);
        // Non interrompere il flusso per errori di notifica
      }
    }

    return NextResponse.json({
      message: 'Momento aggiornato con successo',
      moment: updatedMoment
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento del momento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/moments/[id] - Elimina un momento
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verifica permessi (solo admin o chi è coinvolto nel momento)
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

    const { id: momentId } = await params;

    // Verifica che il momento esista e appartenga alla coppia
    const existingMoment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: { 
        couple: true,
        images: true,
        memory: {
          select: {
            id: true,
            title: true,
            authorId: true
          }
        }
      }
    });

    if (!existingMoment) {
      return NextResponse.json(
        { error: 'Momento non trovato' },
        { status: 404 }
      );
    }

    if (existingMoment.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Non hai accesso a questo momento' },
        { status: 403 }
      );
    }

    // Verifica permessi specifici: 
    // - Chi ha iniziato il momento può sempre eliminarlo
    // - L'autore della memoria può eliminare momenti della sua memoria
    // - Admin può eliminare qualsiasi momento
    const isInitiator = existingMoment.initiatorId === session.user.id;
    const isMemoryAuthor = existingMoment.memory?.authorId === session.user.id;
    const isAdmin = hasPermission(session.user.role, 'moment:manage_all');
    
    if (!isInitiator && !isMemoryAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Solo chi ha iniziato il momento, l\'autore della memoria associata o un admin può eliminarlo' },
        { status: 403 }
      );
    }

    // Eliminazione in transazione per garantire consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Elimina tutte le immagini associate al momento
      if (existingMoment.images.length > 0) {
        await tx.image.deleteMany({
          where: {
            momentId: momentId
          }
        });
      }

      // 2. Elimina il momento stesso
      const deletedMoment = await tx.moment.delete({
        where: { id: momentId },
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
          memory: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      return {
        moment: deletedMoment,
        stats: {
          deletedImages: existingMoment.images.length
        }
      };
    });

    console.log('Momento eliminato con successo:', result.moment.id);
    console.log('Statistiche eliminazione:', result.stats);

    return NextResponse.json({
      message: 'Momento eliminato con successo',
      moment: {
        id: result.moment.id,
        status: result.moment.status,
        initiator: result.moment.initiator,
        participant: result.moment.participant,
        memory: result.moment.memory
      },
      deletedResources: result.stats
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione del momento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 