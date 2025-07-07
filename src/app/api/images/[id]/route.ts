import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import fs from 'fs/promises';
import path from 'path';

// Interfaccia per risposta dettaglio immagine
interface ImageDetailResponse {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnailPath: string;
  category: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  hash?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: any; // Metadati JSON estesi
  memory?: {
    id: string;
    title: string;
    description?: string;
    date: string;
    location?: string;
    category?: string;
    mood?: string;
  };
  moment?: {
    id: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    initiator: {
      id: string;
      name: string;
    };
    participant?: {
      id: string;
      name: string;
    };
  };
  // Navigazione tra immagini adiacenti
  navigation?: {
    previous?: { id: string; thumbnailPath: string };
    next?: { id: string; thumbnailPath: string };
    total: number;
    position: number;
  };
}

// GET /api/images/[id] - Recupera dettagli completi di un'immagine
export async function GET(
  request: NextRequest,
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
    if (!hasPermission(session.user.role, 'memory:read')) {
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

    const { id: imageId } = await params;

    // Parametri query per navigazione
    const searchParams = request.nextUrl.searchParams;
    const includeNavigation = searchParams.get('includeNavigation') === 'true';
    const galleryContext = searchParams.get('context'); // 'memory', 'moment', 'all'
    const contextId = searchParams.get('contextId'); // ID memoria o momento per navigazione

    // Recupera immagine con dettagli completi
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            location: true,
            category: true,
            mood: true,
            coupleId: true
          }
        },
        moment: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true,
            coupleId: true,
            initiator: {
              select: {
                id: true,
                name: true
              }
            },
            participant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Immagine non trovata' },
        { status: 404 }
      );
    }

    // Verifica accesso alla coppia
    const belongsToCouple = 
      (image.memory && image.memory.coupleId === user.couple.id) ||
      (image.moment && image.moment.coupleId === user.couple.id);

    if (!belongsToCouple) {
      return NextResponse.json(
        { error: 'Non hai accesso a questa immagine' },
        { status: 403 }
      );
    }

    // Prepara risposta base
    const response: ImageDetailResponse = {
      id: image.id,
      filename: image.filename,
      originalName: image.originalName,
      path: image.path,
      thumbnailPath: image.thumbnailPath || '',
      category: image.category || 'OTHER',
      size: image.size,
      width: image.width || undefined,
      height: image.height || undefined,
      mimeType: image.mimeType,
      hash: image.hash || undefined,
      isFavorite: image.isFavorite,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
      metadata: image.metadata || undefined
    };

    // Aggiungi informazioni memoria se presente
    if (image.memory) {
      response.memory = {
        id: image.memory.id,
        title: image.memory.title,
        description: image.memory.description || undefined,
        date: image.memory.date.toISOString(),
        location: image.memory.location || undefined,
        category: image.memory.category || undefined,
        mood: image.memory.mood || undefined
      };
    }

    // Aggiungi informazioni momento se presente
    if (image.moment) {
      response.moment = {
        id: image.moment.id,
        status: image.moment.status,
        createdAt: image.moment.createdAt.toISOString(),
        completedAt: image.moment.completedAt?.toISOString() || undefined,
        initiator: {
          id: image.moment.initiator.id,
          name: image.moment.initiator.name || 'Utente Sconosciuto'
        },
        participant: image.moment.participant ? {
          id: image.moment.participant.id,
          name: image.moment.participant.name || 'Utente Sconosciuto'
        } : undefined
      };
    }

    // Calcola navigazione se richiesta
    if (includeNavigation) {
      let whereClause: any = {
        OR: [
          { memory: { coupleId: user.couple.id } },
          { moment: { coupleId: user.couple.id } }
        ]
      };

      // Filtra per contesto se specificato
      if (galleryContext === 'memory' && contextId) {
        whereClause = { memoryId: contextId };
      } else if (galleryContext === 'moment' && contextId) {
        whereClause = { momentId: contextId };
      }

      // Trova immagini adiacenti
      const [allImages, currentPosition] = await Promise.all([
        prisma.image.findMany({
          where: whereClause,
          select: { id: true, thumbnailPath: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.image.count({
          where: {
            ...whereClause,
            createdAt: { gt: image.createdAt }
          }
        })
      ]);

      const currentIndex = allImages.findIndex(img => img.id === imageId);
      const total = allImages.length;
      const position = currentPosition + 1;

      response.navigation = {
        total,
        position,
        previous: currentIndex > 0 ? {
          id: allImages[currentIndex - 1].id,
          thumbnailPath: allImages[currentIndex - 1].thumbnailPath || ''
        } : undefined,
        next: currentIndex < total - 1 ? {
          id: allImages[currentIndex + 1].id,
          thumbnailPath: allImages[currentIndex + 1].thumbnailPath || ''
        } : undefined
      };
    }

    console.log(`Dettagli immagine ${imageId} recuperati con successo`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Errore nel recupero dettagli immagine:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/images/[id] - Elimina un'immagine
export async function DELETE(
  request: NextRequest,
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
    if (!hasPermission(session.user.role, 'memory:delete')) {
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

    const { id: imageId } = await params;

    // Verifica che l'immagine esista e appartenga alla coppia
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        memory: { select: { coupleId: true, authorId: true } },
        moment: { select: { coupleId: true, initiatorId: true } }
      }
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Immagine non trovata' },
        { status: 404 }
      );
    }

    // Verifica accesso e permessi di eliminazione
    const belongsToCouple = 
      (existingImage.memory && existingImage.memory.coupleId === user.couple.id) ||
      (existingImage.moment && existingImage.moment.coupleId === user.couple.id);

    if (!belongsToCouple) {
      return NextResponse.json(
        { error: 'Non hai accesso a questa immagine' },
        { status: 403 }
      );
    }

    // Verifica se l'utente può eliminare (autore memoria o partecipante momento o admin)
    const canDelete = 
      hasPermission(session.user.role, 'memory:manage_all') ||
      (existingImage.memory && existingImage.memory.authorId === session.user.id) ||
      (existingImage.moment && existingImage.moment.initiatorId === session.user.id);

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Non hai i permessi per eliminare questa immagine' },
        { status: 403 }
      );
    }

    // Elimina file fisici se esistono
    try {
      const imagePath = path.join(process.cwd(), 'public', existingImage.path);
      await fs.unlink(imagePath);
    } catch (fileError) {
      console.warn('File immagine non trovato o già eliminato:', existingImage.path);
    }

    if (existingImage.thumbnailPath) {
      try {
        const thumbnailPath = path.join(process.cwd(), 'public', existingImage.thumbnailPath);
        await fs.unlink(thumbnailPath);
      } catch (fileError) {
        console.warn('File thumbnail non trovato o già eliminato:', existingImage.thumbnailPath);
      }
    }

    // Elimina record dal database
    await prisma.image.delete({
      where: { id: imageId }
    });

    console.log(`Immagine ${imageId} eliminata con successo`);

    return NextResponse.json({
      message: 'Immagine eliminata con successo',
      deletedImage: {
        id: existingImage.id,
        filename: existingImage.filename,
        originalName: existingImage.originalName
      }
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione immagine:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 