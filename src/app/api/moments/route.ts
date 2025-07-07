import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { MomentFilters, MomentStatus } from '@/types/memory';

// GET /api/moments - Recupera lista momenti con filtri
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

    // Parsing parametri query
    const { searchParams } = new URL(request.url);
    
    const filters: MomentFilters = {
      coupleId: user.couple.id,
      status: searchParams.get('status') as MomentStatus || undefined,
      initiatorId: searchParams.get('initiatorId') || undefined,
      participantId: searchParams.get('participantId') || undefined,
      memoryId: searchParams.get('memoryId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Costruisci query where
    const whereClause: any = {
      coupleId: filters.coupleId
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.initiatorId) {
      whereClause.initiatorId = filters.initiatorId;
    }

    if (filters.participantId) {
      whereClause.participantId = filters.participantId;
    }

    if (filters.memoryId) {
      whereClause.memoryId = filters.memoryId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    // Esegui query
    const [moments, totalCount] = await Promise.all([
      prisma.moment.findMany({
        where: whereClause,
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
              description: true,
              date: true,
              location: true,
              category: true
            }
          },
          images: {
            select: {
              id: true,
              filename: true,
              originalName: true,
              path: true,
              thumbnailPath: true,
              width: true,
              height: true
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset
      }),
      prisma.moment.count({
        where: whereClause
      })
    ]);

    console.log(`Recuperati ${moments.length} momenti su ${totalCount} totali`);

    return NextResponse.json({
      moments: moments,
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset! + filters.limit!) < totalCount
      },
      filters: {
        status: filters.status,
        initiatorId: filters.initiatorId,
        participantId: filters.participantId,
        memoryId: filters.memoryId,
        dateRange: filters.startDate || filters.endDate ? {
          start: filters.startDate,
          end: filters.endDate
        } : undefined
      }
    });

  } catch (error) {
    console.error('Errore nel recupero dei momenti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 