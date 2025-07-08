import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const shareCreateSchema = z.object({
  password: z.string().min(4, 'La password deve essere di almeno 4 caratteri').optional(),
  expiresInDays: z.number().int().positive().optional(),
});

async function checkMemoryOwnership(memoryId: string, userId: string) {
    const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
        select: { authorId: true }
    });
    return memory?.authorId === userId;
}

// Create or update a shared link for a memory
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const memoryId = params.id;

  if (!await checkMemoryOwnership(memoryId, userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = shareCreateSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: result.error.format() }, { status: 400 });
  }

  const { password, expiresInDays } = result.data;

  try {
    const token = crypto.randomBytes(16).toString('hex');
    let hashedPassword = null;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
    }

    let expiresAt = null;
    if (expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Upsert: Create a new link or update the existing one for this memory
    const sharedLink = await prisma.sharedLink.upsert({
        where: { memoryId: memoryId },
        update: {
            token,
            password: hashedPassword,
            expiresAt,
        },
        create: {
            token,
            memoryId,
            userId,
            password: hashedPassword,
            expiresAt,
        }
    });

    return NextResponse.json({ 
        message: 'Link di condivisione creato/aggiornato con successo',
        token: sharedLink.token,
        expiresAt: sharedLink.expiresAt
    }, { status: 201 });

  } catch (error) {
    console.error(`Errore nella creazione del link di condivisione per il ricordo ${memoryId}:`, error);
    return NextResponse.json({ error: 'Impossibile creare il link di condivisione.' }, { status: 500 });
  }
}

// GET existing share settings for a memory
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const memoryId = params.id;

    if (!await checkMemoryOwnership(memoryId, userId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const sharedLink = await prisma.sharedLink.findUnique({
            where: { memoryId: memoryId },
            select: {
                token: true,
                expiresAt: true,
                password: true, // We check for existence, not the value itself
            }
        });

        if (!sharedLink) {
            return NextResponse.json({ isShared: false }, { status: 200 });
        }

        return NextResponse.json({
            isShared: true,
            token: sharedLink.token,
            expiresAt: sharedLink.expiresAt,
            hasPassword: !!sharedLink.password,
        });

    } catch (error) {
        console.error(`Errore nel recupero delle impostazioni di condivisione per il ricordo ${memoryId}:`, error);
        return NextResponse.json({ error: 'Impossibile recuperare le impostazioni.' }, { status: 500 });
    }
}

// DELETE a shared link for a memory
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const memoryId = params.id;

    if (!await checkMemoryOwnership(memoryId, userId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await prisma.sharedLink.delete({
            where: { memoryId: memoryId },
        });
        return NextResponse.json({ message: 'Condivisione revocata con successo' }, { status: 200 });
    } catch (error) {
        // Handle case where the link doesn't exist gracefully
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return NextResponse.json({ message: 'Nessun link di condivisione da revocare.' }, { status: 200 });
        }
        console.error(`Errore nella revoca della condivisione per il ricordo ${memoryId}:`, error);
        return NextResponse.json({ error: 'Impossibile revocare la condivisione.' }, { status: 500 });
    }
} 