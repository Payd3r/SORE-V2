import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { processFileGroup } from '@/lib/upload/post-process';
import { UploadType } from '@/lib/upload/multer-config';
import { saveFile, getFileBuffer, deleteFile } from '@/lib/storage';
import { combineMomentPhotos } from '@/lib/upload/image-processor';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function POST(
    request: NextRequest,
    { params }: { params: { momentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'moment:upload')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        
        const { momentId } = params;
        if (!momentId) {
            return NextResponse.json({ error: 'momentId is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { couple: true }
        });

        if (!user?.couple) {
            return NextResponse.json({ error: 'User does not belong to a couple' }, { status: 400 });
        }
        
        const moment = await prisma.moment.findFirst({
            where: { 
                id: momentId,
                coupleId: user.couple.id
            }
        });

        if (!moment) {
            return NextResponse.json({ error: 'Moment not found or not accessible' }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        const result = await prisma.$transaction(async (tx) => {
            const currentMoment = await tx.moment.findUnique({
                where: { id: momentId }
            });

            if (!currentMoment) {
                throw new Error("Moment not found");
            }

            if (currentMoment.status === 'completed') {
                throw new Error("This moment has already been completed.");
            }

            if (currentMoment.tempPhotoPath) {
                const firstPhotoBuffer = await getFileBuffer(currentMoment.tempPhotoPath);
                const combinedBuffer = await combineMomentPhotos(firstPhotoBuffer, buffer);
                
                const combinedFileName = `moment-${momentId}-${uuidv4()}.jpg`;
                const combinedPath = `moments/${combinedFileName}`;
                await saveFile(combinedPath, combinedBuffer, 'image/jpeg');

                const image = await tx.image.create({
                    data: {
                        filename: combinedFileName,
                        originalName: 'combined_moment.jpg',
                        path: combinedPath,
                        mimeType: 'image/jpeg',
                        size: combinedBuffer.length,
                        isCombined: true,
                        momentId: momentId,
                        userId: session.user.id,
                        hash: uuidv4(),
                        category: 'moment',
                    }
                });

                await deleteFile(currentMoment.tempPhotoPath);

                await tx.moment.update({
                    where: { id: momentId },
                    data: {
                        tempPhotoPath: null,
                        status: 'completed',
                        completedAt: new Date()
                    }
                });
                
                return { success: true, message: 'Moment completed successfully!', imageId: image.id };
            } else {
                const tempFileName = `temp-moment-${momentId}-${uuidv4()}`;
                const tempPath = `moments/temp/${tempFileName}`;
                await saveFile(tempPath, buffer, file.type);

                await tx.moment.update({
                    where: { id: momentId },
                    data: {
                        tempPhotoPath: tempPath,
                        status: currentMoment.initiatorId === user.id ? 'partner1_captured' : 'partner2_captured'
                    }
                });
                
                return { success: true, message: 'Your photo has been saved. Waiting for your partner.' };
            }
        });
        
        return NextResponse.json(result);

    } catch (error) {
        console.error('Moment Upload API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

async function updateMomentStatus(momentId: string, userId: string) {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
    });

    if (!moment) return;

    let newStatus = moment.status;
    if (moment.status === 'pending') {
      newStatus = moment.initiatorId === userId ? 'partner1_captured' : 'partner2_captured';
    } else if (moment.status === 'partner1_captured' && moment.participantId === userId) {
      newStatus = 'completed';
    } else if (moment.status === 'partner2_captured' && moment.initiatorId === userId) {
      newStatus = 'completed';
    }

    if (newStatus !== moment.status) {
      await prisma.moment.update({
        where: { id: momentId },
        data: { 
          status: newStatus,
          capturedBy: userId,
          ...(newStatus === 'completed' && { completedAt: new Date() })
        }
      });
      console.log(`Moment ${momentId} status updated to: ${newStatus}`);
    }
  } catch (error) {
      console.error(`Failed to update moment status for ${momentId}:`, error);
  }
} 