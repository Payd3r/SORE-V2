import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Memory, Ideas } from '@prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.coupleId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const [memories, ideas, images] = await prisma.$transaction([
      prisma.memory.findMany({
        where: {
          coupleId: session.user.coupleId,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        select: { id: true, title: true },
        take: 5,
      }),
      prisma.ideas.findMany({
        where: {
          coupleId: session.user.coupleId,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        select: { id: true, title: true },
        take: 5,
      }),
      prisma.image.findMany({
        where: {
          originalName: { contains: query },
          memory: {
            coupleId: session.user.coupleId,
          },
        },
        select: { id: true, originalName: true, memoryId: true },
        take: 5,
      }),
    ]);

    const memoryResults = memories.map((memory) => ({
      id: `memory-${memory.id}`,
      type: 'memory',
      title: memory.title,
      url: `/memories/${memory.id}`,
    }));

    const ideaResults = ideas.map((idea) => ({
      id: `idea-${idea.id}`,
      type: 'idea',
      title: idea.title,
      url: `/ideas/${idea.id}`,
    }));

    const imageResults = images
      .filter((image) => image.memoryId) // Includi solo immagini associate a un ricordo
      .map((image) => ({
        id: `image-${image.id}`,
        type: 'image',
        title: image.originalName,
        url: `/memories/${image.memoryId}`, // Link al ricordo contenitore
      }));

    const results = [...memoryResults, ...ideaResults, ...imageResults];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 