import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/web-push';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coupleId: true, name: true }
    });

    if (!currentUser?.coupleId) {
      return NextResponse.json({ error: 'You are not in a couple.' }, { status: 400 });
    }

    // Find the partner
    const partner = await prisma.user.findFirst({
      where: {
        coupleId: currentUser.coupleId,
        id: { not: session.user.id }
      }
    });

    if (!partner || !partner.pushEnabled || !partner.pushSubscription) {
      return NextResponse.json({ error: 'Your partner has not enabled push notifications.' }, { status: 400 });
    }
    
    const subscription = JSON.parse(partner.pushSubscription);
    const payload = {
      title: 'Invito a Momento!',
      body: `${currentUser.name || 'Il tuo partner'} ti ha invitato a catturare un Momento!`,
      icon: '/icons/icon-192x192.png',
      url: '/momento'
    };

    await sendNotification(subscription, payload);

    return NextResponse.json({ success: true, message: 'Invitation sent.' }, { status: 200 });

  } catch (error) {
    console.error('Failed to send momento invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 