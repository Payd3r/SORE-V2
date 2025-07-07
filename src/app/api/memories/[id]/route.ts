import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { UpdateMemoryDto, MemoryCategory, MemoryMood, MEMORY_VALIDATION } from '@/types/memory';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const memoryUpdateSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio').max(200),
  description: z.string().max(1000).optional(),
  date: z.coerce.date(),
  location: z.string().max(100).optional(),
  mood: z.string().optional(),
  spotifyTrack: z.any().optional(), // Potrebbe essere validato più strettamente
});

/**
 * @swagger
 * /memories/{id}:
 *   get:
 *     summary: Retrieve a single memory by ID
 *     description: Fetches detailed information for a specific memory.
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the memory to retrieve.
 *     responses:
 *       '200':
 *         description: Successfully retrieved memory details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: Insufficient permissions or not authorized to view this memory.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Memory not found.
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
// GET /api/memories/[id] - Recupera una singola memoria
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

    const { id: memoryId } = await params;

    // Recupera memoria con tutte le relazioni
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
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
            metadata: true,
            isFavorite: true,
            width: true,
            height: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        },
        moments: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true,
            expiresAt: true,
            combinedImagePath: true,
            capturedBy: true,
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
            images: {
              select: {
                id: true,
                filename: true,
                path: true,
                thumbnailPath: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!memory) {
      return NextResponse.json(
        { error: 'Memoria non trovata' },
        { status: 404 }
      );
    }

    // Verifica che la memoria appartenga alla coppia dell'utente
    if (memory.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Non hai accesso a questa memoria' },
        { status: 403 }
      );
    }

    console.log(`Memoria recuperata: ${memory.title} con ${memory.moments.length} momenti e ${memory.images.length} immagini`);

    return NextResponse.json({
      memory: memory
    });

  } catch (error) {
    console.error('Errore nel recupero della memoria:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /memories/{id}:
 *   put:
 *     summary: Update a memory
 *     description: Updates an existing memory with new data.
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the memory to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMemoryDto'
 *     responses:
 *       '200':
 *         description: Memory updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 *       '400':
 *         description: Invalid input data.
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Insufficient permissions.
 *       '404':
 *         description: Memory not found.
 *       '500':
 *         description: Internal server error.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'memory:update')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { id: memoryId } = params;
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      return NextResponse.json({ error: 'Memoria non trovata' }, { status: 404 });
    }

    // Solo l'autore o un admin possono modificare
    if (memory.authorId !== session.user.id && session.user.role !== 'admin') {
         return NextResponse.json({ error: 'Non autorizzato a modificare questa memoria' }, { status: 403 });
    }
    
    const body = await request.json();
    const validation = memoryUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { title, description, date, location, mood, spotifyTrack } = validation.data;

    const updatedMemory = await prisma.memory.update({
      where: { id: memoryId },
      data: {
        title,
        description,
        date,
        location,
        mood,
        spotifyTrack: spotifyTrack ? spotifyTrack : undefined,
      },
    });

    return NextResponse.json({ memory: updatedMemory });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della memoria:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

/**
 * @swagger
 * /memories/{id}:
 *   delete:
 *     summary: Delete a memory
 *     description: Permanently deletes a specific memory.
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the memory to delete.
 *     responses:
 *       '204':
 *         description: Memory deleted successfully.
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Insufficient permissions.
 *       '404':
 *         description: Memory not found.
 *       '500':
 *         description: Internal server error.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'memory:delete')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { id: memoryId } = params;
    
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { authorId: true, coupleId: true },
    });

    if (!memory) {
      return NextResponse.json({ error: 'Memoria non trovata' }, { status: 404 });
    }

    // Solo l'autore o un admin possono eliminare
    const canDelete = session.user.role === 'admin' || memory.authorId === session.user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Non autorizzato a eliminare questa memoria' }, { status: 403 });
    }

    // TODO: Gestire l'eliminazione dei file associati (immagini, etc.) dal sistema di storage

    await prisma.memory.delete({
      where: { id: memoryId },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error("Errore durante l'eliminazione della memoria:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // es. violazione di foreign key
        return NextResponse.json({ error: 'Impossibile eliminare il ricordo a causa di altre risorse collegate.' }, { status: 409 });
    }
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
} 