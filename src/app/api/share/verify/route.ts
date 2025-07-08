import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const verifySchema = z.object({
  token: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  const result = verifySchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: result.error.format() }, { status: 400 });
  }

  const { token, password } = result.data;

  try {
    const sharedLink = await prisma.sharedLink.findUnique({
      where: { token },
    });

    if (!sharedLink || !sharedLink.password) {
      // This should not happen if the frontend calls this endpoint correctly
      return NextResponse.json({ error: 'Nessuna password richiesta per questo link.' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, sharedLink.password);

    if (isMatch) {
      return NextResponse.json({ message: 'Password corretta.' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Password non corretta.' }, { status: 401 });
    }

  } catch (error) {
    console.error(`Errore nella verifica della password per il token ${token}:`, error);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
} 