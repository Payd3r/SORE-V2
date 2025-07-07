import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { t } from '@/lib/localization';
import { encrypt } from '@/lib/crypto';

// Zod schema for subscription validation
const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const subscription = await request.json();

    // Validate subscription object
    const validation = subscriptionSchema.safeParse(subscription);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid subscription object', details: validation.error.format() }, { status: 400 });
    }

    // Encrypt and save the subscription
    const encryptedSubscription = encrypt(JSON.stringify(validation.data));

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushSubscription: encryptedSubscription,
        pushEnabled: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription.' }, { status: 500 });
  }
} 