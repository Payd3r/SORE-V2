import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGpx } from '@/lib/gpx';

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
            date: true,
        },
    });

    if (travelPoints.length === 0) {
        return new NextResponse('No travel points found', { status: 404 });
    }

    const gpxData = {
        trackName: `SORE-V2 Travel Route for ${user.couple.name || 'Couple'}`,
        points: travelPoints.map(p => ({
            lat: p.latitude!,
            lon: p.longitude!,
            time: p.date,
        })),
    };

    const gpxString = createGpx(gpxData);

    return new NextResponse(gpxString, {
        status: 200,
        headers: {
            'Content-Type': 'application/gpx+xml',
            'Content-Disposition': `attachment; filename="sore-v2-route.gpx"`,
        },
    });
} 