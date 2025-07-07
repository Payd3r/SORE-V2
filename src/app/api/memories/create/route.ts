import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { CreateMemoryDto, MemoryCategory, MemoryMood, MEMORY_VALIDATION } from '@/types/memory';

// Validazione dati input
function validateMemoryData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validazione campi obbligatori
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Il titolo è obbligatorio');
  } else if (data.title.length > MEMORY_VALIDATION.TITLE_MAX_LENGTH) {
    errors.push(`Il titolo non può superare ${MEMORY_VALIDATION.TITLE_MAX_LENGTH} caratteri`);
  }

  if (!data.date) {
    errors.push('La data è obbligatoria');
  } else if (isNaN(Date.parse(data.date))) {
    errors.push('La data non è valida');
  }

  // Validazione campi opzionali
  if (data.description && data.description.length > MEMORY_VALIDATION.DESCRIPTION_MAX_LENGTH) {
    errors.push(`La descrizione non può superare ${MEMORY_VALIDATION.DESCRIPTION_MAX_LENGTH} caratteri`);
  }

  if (data.location && data.location.length > MEMORY_VALIDATION.LOCATION_MAX_LENGTH) {
    errors.push(`La location non può superare ${MEMORY_VALIDATION.LOCATION_MAX_LENGTH} caratteri`);
  }

  // Validazione categoria
  if (data.category && !Object.values(MemoryCategory).includes(data.category)) {
    errors.push('Categoria non valida');
  }

  // Validazione mood
  if (data.mood && !Object.values(MemoryMood).includes(data.mood)) {
    errors.push('Mood non valido');
  }

  // Validazione coordinate
  if (data.latitude && (isNaN(parseFloat(data.latitude)) || Math.abs(parseFloat(data.latitude)) > 90)) {
    errors.push('Latitudine non valida');
  }

  if (data.longitude && (isNaN(parseFloat(data.longitude)) || Math.abs(parseFloat(data.longitude)) > 180)) {
    errors.push('Longitudine non valida');
  }

  return { isValid: errors.length === 0, errors };
}

// Sanitizzazione dati
function sanitizeMemoryData(data: any): CreateMemoryDto {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    date: new Date(data.date),
    location: data.location?.trim() || undefined,
    latitude: data.latitude?.toString() || undefined,
    longitude: data.longitude?.toString() || undefined,
    category: data.category || undefined,
    mood: data.mood || undefined,
    authorId: data.authorId,
    coupleId: data.coupleId,
    imageIds: data.imageIds || undefined
  };
}

/**
 * @swagger
 * /memories/create:
 *   post:
 *     summary: Create a new memory
 *     description: Creates a new memory for the authenticated user's couple.
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMemoryInput'
 *     responses:
 *       '201':
 *         description: Memory created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 *       '400':
 *         description: Invalid input data, user not in a couple, or invalid image IDs.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
    if (!hasPermission(session.user.role, 'memory:create')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Parsing dati input
    const body = await request.json();
    console.log('Dati ricevuti per creazione memoria:', body);

    // Validazione dati
    const { isValid, errors } = validateMemoryData(body);
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
    const memoryData = sanitizeMemoryData({
      ...body,
      authorId: session.user.id,
      coupleId: user.couple.id
    });

    // Verifica che le immagini (se specificate) esistano e appartengano alla coppia
    if (memoryData.imageIds && memoryData.imageIds.length > 0) {
      const images = await prisma.image.findMany({
        where: {
          id: { in: memoryData.imageIds },
          OR: [
            { memoryId: null }, // Immagini non ancora associate
            { memory: { coupleId: user.couple.id } } // Immagini già associate alla coppia
          ]
        }
      });

      if (images.length !== memoryData.imageIds.length) {
        return NextResponse.json(
          { error: 'Alcune immagini specificate non esistono o non appartengono alla coppia' },
          { status: 400 }
        );
      }

      // Verifica limite massimo immagini
      if (memoryData.imageIds.length > MEMORY_VALIDATION.MAX_IMAGES_PER_MEMORY) {
        return NextResponse.json(
          { error: `Massimo ${MEMORY_VALIDATION.MAX_IMAGES_PER_MEMORY} immagini per memoria` },
          { status: 400 }
        );
      }
    }

    // Creazione memoria nel database
    const memory = await prisma.memory.create({
      data: {
        title: memoryData.title,
        description: memoryData.description,
        date: memoryData.date,
        location: memoryData.location,
        latitude: memoryData.latitude,
        longitude: memoryData.longitude,
        category: memoryData.category,
        mood: memoryData.mood,
        authorId: memoryData.authorId,
        coupleId: memoryData.coupleId,
        // Associa le immagini se specificate
        ...(memoryData.imageIds && {
          images: {
            connect: memoryData.imageIds.map(id => ({ id }))
          }
        })
      },
      include: {
        author: {
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
        images: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            path: true,
            thumbnailPath: true,
            category: true,
            isFavorite: true
          }
        },
        moments: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true
          }
        }
      }
    });

    console.log('Memoria creata con successo:', memory.id);

    return NextResponse.json({
      message: 'Memoria creata con successo',
      memory: memory
    });

  } catch (error) {
    console.error('Errore nella creazione della memoria:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 