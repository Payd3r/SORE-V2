import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { couple: true } });

    if (!user?.couple?.id) {
        return new NextResponse('User is not in a couple', { status: 400 });
    }

    const coupleId = user.couple.id;

    const travelPoints = await prisma.memory.findMany({
        where: {
            coupleId,
            latitude: { not: null },
            longitude: { not: null },
        },
        orderBy: {
            date: 'asc',
        },
        select: {
            latitude: true,
            longitude: true,
        },
    });

    const routeCoordinates = travelPoints.map(point => [point.latitude!, point.longitude!]);

    return NextResponse.json(routeCoordinates);
} 