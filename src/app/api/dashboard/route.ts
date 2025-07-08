import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { coupleId } = session.user;

  try {
    const [
        recentMemories, 
        latestIdeas,
        upcomingCountdown,
        moodStats
    ] = await Promise.all([
      // Get the 5 most recent memories
      prisma.memory.findMany({
        where: { coupleId },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          images: {
            where: { isCover: true },
            take: 1,
          },
        },
      }),
      // Get the 5 most recent ideas
      prisma.ideas.findMany({
        where: { coupleId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Get the nearest upcoming countdown
      prisma.countdown.findFirst({
          where: {
              coupleId,
              date: {
                  gte: new Date()
              }
          },
          orderBy: {
              date: 'asc'
          },
          select: {
              id: true,
              title: true,
              date: true,
              createdAt: true
          }
      }),
      // Get mood stats for the last 30 days
      prisma.mood.groupBy({
          by: ['mood'],
          where: {
              coupleId,
              createdAt: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 30))
              }
          },
          _count: {
              mood: true
          },
          orderBy: {
              _count: {
                  mood: 'desc'
              }
          },
          take: 1
      })
    ]);

    const topMood = moodStats.length > 0 ? moodStats[0] : null;

    return NextResponse.json({ 
        recentMemories, 
        latestIdeas,
        upcomingCountdown,
        topMood
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 