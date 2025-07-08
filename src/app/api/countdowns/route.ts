import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const countdownCreateSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  description: z.string().optional(),
  date: z.string().datetime(),
});

// GET all countdowns for the couple
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { coupleId } = session.user;

  try {
    const countdowns = await prisma.countdown.findMany({
      where: { coupleId },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(countdowns);
  } catch (error) {
    console.error('Errore nel recuperare i countdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new countdown
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { coupleId } = session.user;
  const body = await request.json();

  const validation = countdownCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const { title, description, date } = validation.data;

  try {
    const newCountdown = await prisma.countdown.create({
      data: {
        title,
        description,
        date: new Date(date),
        coupleId,
      },
    });
    return NextResponse.json(newCountdown, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del countdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 