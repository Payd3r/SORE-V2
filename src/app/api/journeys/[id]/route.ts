import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const journeyUpdateSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio').optional(),
  description: z.string().optional().nullable(),
});

async function checkJourneyOwnership(journeyId: string, coupleId: string) {
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
  });
  return journey?.coupleId === coupleId;
}

// GET a single journey with its memories
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!await checkJourneyOwnership(params.id, session.user.coupleId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const journey = await prisma.journey.findUnique({
      where: { id: params.id },
      include: {
        memories: {
          orderBy: {
            order: 'asc',
          },
          include: {
            memory: true,
          },
        },
      },
    });

    if (!journey) {
      return NextResponse.json({ error: 'Viaggio non trovato' }, { status: 404 });
    }

    return NextResponse.json(journey);
  } catch (error) {
    console.error(`Errore nel recupero del viaggio ${params.id}:`, error);
    return NextResponse.json({ error: 'Impossibile recuperare il viaggio.' }, { status: 500 });
  }
}

// UPDATE a journey
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!await checkJourneyOwnership(params.id, session.user.coupleId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = journeyUpdateSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: result.error.format() }, { status: 400 });
  }

  try {
    const updatedJourney = await prisma.journey.update({
      where: { id: params.id },
      data: result.data,
    });
    return NextResponse.json(updatedJourney);
  } catch (error) {
    console.error(`Errore nell'aggiornamento del viaggio ${params.id}:`, error);
    return NextResponse.json({ error: 'Impossibile aggiornare il viaggio.' }, { status: 500 });
  }
}

// DELETE a journey
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!await checkJourneyOwnership(params.id, session.user.coupleId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.journey.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Viaggio eliminato con successo' }, { status: 200 });
  } catch (error) {
    console.error(`Errore nell'eliminazione del viaggio ${params.id}:`, error);
    return NextResponse.json({ error: 'Impossibile eliminare il viaggio.' }, { status: 500 });
  }
} 