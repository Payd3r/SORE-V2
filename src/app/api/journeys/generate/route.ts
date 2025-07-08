import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const generateJourneySchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  const { coupleId } = session.user;

  const result = generateJourneySchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: result.error.format() }, { status: 400 });
  }

  const { title, description, startDate, endDate } = result.data;

  try {
    // 1. Find all memories within the date range that have location
    const memories = await prisma.memory.findMany({
      where: {
        coupleId: coupleId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        latitude: { not: null },
        longitude: { not: null },
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (memories.length < 2) {
      return NextResponse.json({ error: 'Non ci sono abbastanza ricordi con dati di localizzazione in questo periodo per creare un viaggio.' }, { status: 400 });
    }

    // 2. Use a transaction to create the journey and link memories
    const newJourney = await prisma.$transaction(async (tx) => {
      // a. Create the Journey
      const journey = await tx.journey.create({
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          couple: {
            connect: { id: coupleId },
          },
        },
      });

      // b. Create the JourneyMemory links
      const journeyMemoriesData = memories.map((memory, index) => ({
        journeyId: journey.id,
        memoryId: memory.id,
        order: index,
      }));

      await tx.journeyMemory.createMany({
        data: journeyMemoriesData,
      });

      return journey;
    });

    return NextResponse.json(newJourney, { status: 201 });

  } catch (error) {
    console.error('Errore nella creazione del viaggio:', error);
    return NextResponse.json({ error: 'Impossibile creare il viaggio.' }, { status: 500 });
  }
} 