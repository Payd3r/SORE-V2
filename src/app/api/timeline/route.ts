import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTimeline, type TimelineView, type TimelineMemory } from '@/lib/timeline-system';

// GET /api/timeline - Get chronological timeline of memories with mood integration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'Utente non appartiene a nessuna coppia' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const view = (searchParams.get('view') || 'month') as TimelineView;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const moodFilter = searchParams.get('mood')?.split(',');
    const locationFilter = searchParams.get('location')?.split(',');
    const categoryFilter = searchParams.get('category')?.split(',');
    const authorFilter = searchParams.get('author')?.split(',');
    const searchQuery = searchParams.get('search') ?? undefined;
    const includeImages = searchParams.get('includeImages') !== 'false';
    const includeMoments = searchParams.get('includeMoments') !== 'false';
    const includeIdeas = searchParams.get('includeIdeas') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build date range filter
    let dateRange: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    // Build query conditions
    const whereCondition: any = {
      coupleId: user.couple.id,
    };

    if (dateRange) {
      whereCondition.date = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    if (categoryFilter && categoryFilter.length > 0) {
      whereCondition.category = {
        in: categoryFilter,
      };
    }

    if (authorFilter && authorFilter.length > 0) {
      whereCondition.authorId = {
        in: authorFilter,
      };
    }

    if (moodFilter && moodFilter.length > 0) {
      whereCondition.mood = {
        in: moodFilter,
      };
    }

    if (locationFilter && locationFilter.length > 0) {
      whereCondition.location = {
        in: locationFilter.map(loc => ({
          contains: loc,
          mode: 'insensitive' as const,
        })),
      };
    }

    if (searchQuery) {
      whereCondition.OR = [
        {
          title: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          location: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    // Fetch memories with related data
    const memories = await prisma.memory.findMany({
      where: whereCondition,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: includeImages ? {
          select: {
            id: true,
            filename: true,
            thumbnailPath: true,
          },
          take: 10, // Limit images per memory for performance
        } : false,
        moments: includeMoments ? {
          select: {
            id: true,
            status: true,
            combinedImagePath: true,
          },
        } : false,

      },
      orderBy: {
        date: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Convert to timeline format
    const timelineMemories: TimelineMemory[] = memories.map(memory => ({
      id: memory.id,
      title: memory.title,
      description: memory.description ?? undefined,
      date: memory.date,
      location: memory.location ?? undefined,
      mood: memory.mood ?? undefined,
      category: memory.category ?? undefined,
      author: {
        id: memory.author.id,
        name: memory.author.name || 'Unknown User',
        email: memory.author.email,
      },
      images: includeImages ? (memory.images as any) : undefined,
      moments: includeMoments ? (memory.moments as any) : undefined,
      ideas: undefined, // Ideas will be fetched separately if needed
    }));

    // Generate timeline data
    const timelineData = generateTimeline(timelineMemories, {
      view,
      dateRange,
      moodFilter,
      locationFilter,
      categoryFilter,
      authorFilter,
      searchQuery,
    });

    // Get total count for pagination
    const totalCount = await prisma.memory.count({
      where: whereCondition,
    });

    // Additional metadata
    const metadata = {
      view,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + memories.length < totalCount,
      },
      filters: {
        dateRange,
        mood: moodFilter,
        location: locationFilter,
        category: categoryFilter,
        author: authorFilter,
        search: searchQuery,
      },
      includes: {
        images: includeImages,
        moments: includeMoments,
        ideas: includeIdeas,
      },
    };

    return NextResponse.json({
      success: true,
      data: timelineData,
      metadata,
    });

  } catch (error) {
    console.error('Errore nella generazione della timeline:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione della timeline' },
      { status: 500 }
    );
  }
} 