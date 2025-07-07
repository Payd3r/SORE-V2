import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/memories/[id]/ideas - Get all ideas linked to a specific memory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user is part of a couple
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    // Check if the memory exists and belongs to the user's couple
    const memory = await prisma.memory.findUnique({
      where: { id },
      include: { couple: true },
    });

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (memory.coupleId !== user.couple.id) {
      return NextResponse.json({ error: 'Unauthorized - Memory does not belong to your couple' }, { status: 403 });
    }

    // Get all ideas linked to this memory
    const ideas = await prisma.ideas.findMany({
      where: {
        memoryId: id,
        coupleId: user.couple.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Also include memory information
    const memoryInfo = {
      id: memory.id,
      title: memory.title,
      description: memory.description,
      date: memory.date,
      location: memory.location,
      category: memory.category,
      mood: memory.mood,
      createdAt: memory.createdAt,
    };

    return NextResponse.json({
      memory: memoryInfo,
      ideas,
      count: ideas.length,
    });

  } catch (error) {
    console.error('Error getting memory ideas:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 