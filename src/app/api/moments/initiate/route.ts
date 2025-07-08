import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher/server';
import { z } from 'zod';
import { saveFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { hasPermission } from '@/lib/roles';

const initiateMomentSchema = z.object({
  memoryId: z.string().cuid().optional(), // Memory is optional for a moment
  initiatorImageBase64: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.coupleId) {
        return NextResponse.json({ error: 'Not authenticated or not in a couple' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'moment:create')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { memoryId, initiatorImageBase64 } = initiateMomentSchema.parse(body);

    // 1. Save initiator's image
    const imageBuffer = Buffer.from(initiatorImageBase64, 'base64');
    const imagePath = `moments/initiator-${uuidv4()}.webp`;
    await saveFile(imagePath, imageBuffer, 'image/webp');
    
    // 2. Create the moment record
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const newMoment = await prisma.moment.create({
      data: {
        coupleId: session.user.coupleId,
        initiatorId: session.user.id,
        memoryId: memoryId,
        initiatorImage: imagePath,
        status: 'PENDING_PARTNER',
        expiresAt: expiresAt,
      },
      include: {
        initiator: {
            select: { id: true, name: true }
        }
      }
    });
    
    // 3. Trigger Pusher event for the partner
    const channelName = `private-couple-${session.user.coupleId}`;
    const pusherPayload = {
      id: newMoment.id,
      initiator: {
        id: newMoment.initiator.id,
        name: newMoment.initiator.name,
      },
      expiresAt: newMoment.expiresAt,
    };
    await pusherServer.trigger(channelName, 'moment:initiated', pusherPayload);

    return NextResponse.json(newMoment, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
    }
    console.error('[MOMENT_INITIATE_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 