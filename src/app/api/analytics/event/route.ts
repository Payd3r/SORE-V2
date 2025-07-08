import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const eventSchema = z.object({
  eventName: z.string().min(1, { message: "Event name cannot be empty" }),
  properties: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // This endpoint can be called by non-authenticated users if needed,
    // so we don't hard-fail if there's no session.
    // The userId and coupleId will just be null.

    const body = await request.json();
    const { eventName, properties } = eventSchema.parse(body);

    await prisma.analyticsEvent.create({
      data: {
        eventName,
        properties: properties || {},
        userId: session?.user?.id,
        coupleId: session?.user?.coupleId,
      },
    });

    return NextResponse.json({ success: true }, { status: 202 }); // 202 Accepted

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
    }
    // Don't log the error for analytics to avoid creating noise, but return a generic server error
    console.error('[ANALYTICS_EVENT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
} 