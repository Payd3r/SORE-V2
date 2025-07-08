import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all journeys for the couple
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { coupleId } = session.user;

  try {
    const journeys = await prisma.journey.findMany({
      where: {
        coupleId: coupleId,
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    return NextResponse.json(journeys);
  } catch (error) {
    console.error('Errore nel recupero dei viaggi:', error);
    return NextResponse.json({ error: 'Impossibile recuperare i viaggi.' }, { status: 500 });
  }
} 