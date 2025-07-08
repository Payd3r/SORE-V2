import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const countdownUpdateSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio').optional(),
  description: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});

async function checkCountdownOwnership(countdownId: string, coupleId: string) {
  const countdown = await prisma.countdown.findUnique({
    where: { id: countdownId },
  });
  return countdown?.coupleId === coupleId;
}

// GET a single countdown
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!await checkCountdownOwnership(params.id, session.user.coupleId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const countdown = await prisma.countdown.findUnique({ where: { id: params.id } });
  if (!countdown) {
    return NextResponse.json({ error: 'Countdown not found' }, { status: 404 });
  }
  return NextResponse.json(countdown);
}


// PUT update a countdown
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!await checkCountdownOwnership(params.id, session.user.coupleId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const validation = countdownUpdateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }
  
  try {
    const updatedCountdown = await prisma.countdown.update({
      where: { id: params.id },
      data: validation.data,
    });
    return NextResponse.json(updatedCountdown);
  } catch (error) {
    console.error('Errore nell\'aggiornare il countdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a countdown
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  
  if (!await checkCountdownOwnership(params.id, session.user.coupleId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.countdown.delete({
      where: { id: params.id },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Errore nell\'eliminare il countdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 