import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'moment:read')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { coupleId: true }
        });

        if (!user?.coupleId) {
            // No couple, so no active moment. This is not an error.
            return NextResponse.json(null, { status: 200 });
        }

        const activeMoment = await prisma.moment.findFirst({
            where: {
                coupleId: user.coupleId,
                status: 'PENDING_PARTNER'
            },
            include: {
                initiator: {
                    select: { id: true, name: true }
                }
            }
        });

        if (activeMoment) {
            return NextResponse.json(activeMoment, { status: 200 });
        } else {
            return NextResponse.json(null, { status: 200 });
        }

    } catch (error) {
        console.error('[Active Moment GET] Error fetching active moment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch active moment', details: errorMessage }, { status: 500 });
    }
} 