import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.coupleId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { coupleId } = session.user;

  try {
    const memories = await prisma.memory.findMany({
      where: { coupleId },
      select: {
        title: true,
        date: true,
        mood: true,
        spotifyTrack: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const totalMemories = memories.length;
    const totalImages = await prisma.image.count({ where: { memory: { coupleId } } });
    
    const oldestMemory = memories[0] || null;
    const newestMemory = memories[totalMemories - 1] || null;

    const memoriesByYear = memories.reduce((acc: Record<string, number>, memory) => {
      const year = new Date(memory.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const moodsDistribution = memories.reduce((acc: Record<string, number>, memory) => {
      if (memory.mood) {
        acc[memory.mood] = (acc[memory.mood] || 0) + 1;
      }
      return acc;
    }, {});

    const artistsFrequency = memories.reduce((acc: Record<string, number>, memory) => {
      // The spotifyTrack is stored as JSON, so we need to parse it.
      const track = memory.spotifyTrack as any;
      if (track && track.artists) {
        track.artists.forEach((artist: { name: string }) => {
          acc[artist.name] = (acc[artist.name] || 0) + 1;
        });
      }
      return acc;
    }, {});

    const topArtists = Object.entries(artistsFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const stats = {
      totalMemories,
      totalImages,
      oldestMemory: oldestMemory ? { title: oldestMemory.title, date: oldestMemory.date } : null,
      newestMemory: newestMemory ? { title: newestMemory.title, date: newestMemory.date } : null,
      memoriesByYear,
      moodsDistribution,
      topArtists,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('[STATS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 