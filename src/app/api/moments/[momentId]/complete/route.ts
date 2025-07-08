import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { getFileBuffer, saveFile, getPublicUrl } from '@/lib/storage';
import { combineMomentPhotos } from '@/lib/upload/image-processor';
import { pusherServer } from '@/lib/pusher/server';
import { v4 as uuidv4 } from 'uuid';

interface RequestBody {
    partnerImageBase64: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: { momentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'moment:complete')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { momentId } = params;
        if (!momentId) {
            return NextResponse.json({ error: 'momentId is required' }, { status: 400 });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { coupleId: true }
        });

        if (!user?.coupleId) {
            return NextResponse.json({ error: 'User does not belong to a couple' }, { status: 400 });
        }

        const moment = await prisma.moment.findFirst({
            where: { 
                id: momentId,
                coupleId: user.coupleId,
                status: 'PENDING_PARTNER'
            },
            select: {
                id: true,
                initiatorId: true,
                initiatorImage: true,
                expiresAt: true,
            }
        });

        if (!moment) {
            return NextResponse.json({ error: 'Moment not found, not accessible, or not pending partner action' }, { status: 404 });
        }

        if (moment.expiresAt && new Date() > moment.expiresAt) {
            // Optionally, update the moment status to FAILED
            await prisma.moment.update({
                where: { id: moment.id },
                data: { status: 'FAILED' }
            });
            return NextResponse.json({ error: 'This moment has expired.' }, { status: 410 }); // 410 Gone
        }

        // Ensure the user completing the moment is not the initiator
        if (moment.initiatorId === session.user.id) {
            return NextResponse.json({ error: 'Initiator cannot complete their own moment' }, { status: 403 });
        }

        const { partnerImageBase64 }: RequestBody = await request.json();
        if (!partnerImageBase64) {
            return NextResponse.json({ error: 'partnerImageBase64 is required' }, { status: 400 });
        }

        // 1. Get image buffers
        const partnerImageBuffer = Buffer.from(partnerImageBase64, 'base64');
        const initiatorImageBuffer = await getFileBuffer(moment.initiatorImage);

        // 2. Combine photos
        const combinedImageBuffer = await combineMomentPhotos(initiatorImageBuffer, partnerImageBuffer);

        // 3. Save partner's raw image
        const partnerImagePath = `moments/partner-${uuidv4()}.webp`;
        await saveFile(partnerImagePath, partnerImageBuffer, 'image/webp');

        // 4. Save combined image
        const combinedImagePath = `moments/combined-${uuidv4()}.webp`;
        await saveFile(combinedImagePath, combinedImageBuffer, 'image/webp');

        // 5. Update moment in DB
        const updatedMoment = await prisma.moment.update({
            where: { id: momentId },
            data: {
                status: 'COMPLETED',
                participantId: session.user.id,
                partnerImage: partnerImagePath,
                combinedImage: combinedImagePath,
            },
        });
        
        const pusherPayload = {
            id: updatedMoment.id,
            combinedImage: updatedMoment.combinedImage ? getPublicUrl(updatedMoment.combinedImage) : null
        };
        
        // 6. Notify initiator via Pusher
        await pusherServer.trigger(
            `private-couple-${user.coupleId}`,
            'moment:completed',
            pusherPayload
        );

        return NextResponse.json(updatedMoment, { status: 200 });

    } catch (error) {
        console.error(`[Moment Complete] Error completing moment ${params.momentId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to complete moment', details: errorMessage }, { status: 500 });
    }
} 