import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const photos = await prisma.image.findMany({
            where: {
                latitude: {
                    not: null,
                },
                longitude: {
                    not: null,
                },
            },
            select: {
                id: true,
                path: true,
                latitude: true,
                longitude: true,
            },
        });
        return NextResponse.json(photos);
    } catch (error) {
        console.error('Failed to fetch photos:', error);
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }
} 