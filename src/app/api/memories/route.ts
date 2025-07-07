import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { MemoryFilters, MemoryCategory, MemoryMood } from '@/types/memory';

/**
 * @swagger
 * /memories:
 *   get:
 *     summary: Retrieve a list of memories
 *     description: Fetches a paginated list of memories for the authenticated user's couple, with optional filters.
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter memories by author's user ID.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter memories by category.
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *         description: Filter memories by mood.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date for a date range filter.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for a date range filter.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter memories by location (case-insensitive search).
 *       - in: query
 *         name: withImages
 *         schema:
 *           type: boolean
 *         description: Include image details in the response.
 *       - in: query
 *         name: withMoments
 *         schema:
 *           type: boolean
 *         description: Include moment details in the response.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: The number of items to return.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: The number of items to skip for pagination.
 *     responses:
 *       '200':
 *         description: A list of memories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 memories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Memory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       '400':
 *         description: User does not belong to a couple.
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
// GET /api/memories - Recupera lista memorie con filtri
export async function GET(request: Request) {
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

    // Parsing parametri query
    const { searchParams } = new URL(request.url);
    
    const filters: MemoryFilters = {
      coupleId: user.couple.id,
      authorId: searchParams.get('authorId') || undefined,
      category: searchParams.get('category') as MemoryCategory || undefined,
      mood: searchParams.get('mood') as MemoryMood || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      location: searchParams.get('location') || undefined,
      withImages: searchParams.get('withImages') === 'true',
      withMoments: searchParams.get('withMoments') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Costruisci query where
    const whereClause: any = {
      coupleId: filters.coupleId
    };

    if (filters.authorId) {
      whereClause.authorId = filters.authorId;
    }

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.mood) {
      whereClause.mood = filters.mood;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.date = {};
      if (filters.startDate) {
        whereClause.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.date.lte = filters.endDate;
      }
    }

    if (filters.location) {
      whereClause.location = {
        contains: filters.location,
        mode: 'insensitive'
      };
    }

    // Costruisci query include
    const includeClause: any = {
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
          name: true
        }
      }
    };

    if (filters.withImages) {
      includeClause.images = {
        select: {
          id: true,
          filename: true,
          originalName: true,
          path: true,
          thumbnailPath: true,
          category: true,
          isFavorite: true,
          width: true,
          height: true
        }
      };
    }

    if (filters.withMoments) {
      includeClause.moments = {
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          expiresAt: true,
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
      };
    }

    // Esegui query
    const [memories, totalCount] = await Promise.all([
      prisma.memory.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { date: 'desc' },
        take: filters.limit,
        skip: filters.offset
      }),
      prisma.memory.count({
        where: whereClause
      })
    ]);

    console.log(`Recuperate ${memories.length} memorie su ${totalCount} totali`);

    return NextResponse.json({
      memories: memories,
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset! + filters.limit!) < totalCount
      },
      filters: {
        category: filters.category,
        mood: filters.mood,
        authorId: filters.authorId,
        dateRange: filters.startDate || filters.endDate ? {
          start: filters.startDate,
          end: filters.endDate
        } : undefined,
        location: filters.location
      }
    });

  } catch (error) {
    console.error('Errore nel recupero delle memorie:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 