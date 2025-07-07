import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { imageId } = params;

  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { 
        path: true,
        thumbnailPath: true,
        memory: { select: { coupleId: true } } 
      },
    });

    if (!image || !image.memory || image.memory.coupleId !== session.user.coupleId) {
      return new NextResponse('Not Found or Forbidden', { status: 404 });
    }

    // Delete the image record from the database
    await prisma.image.delete({
      where: { id: imageId },
    });

    // Delete the physical files
    const fullPath = path.join(process.cwd(), image.path);
    await fs.unlink(fullPath);

    if (image.thumbnailPath) {
        const fullThumbnailPath = path.join(process.cwd(), image.thumbnailPath);
        await fs.unlink(fullThumbnailPath);
    }

    return new NextResponse('Image deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting image:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        // If file not found, it might have been already deleted.
        // We can consider the DB deletion a success in this case.
        return new NextResponse('Image record deleted, file not found on server.', { status: 200 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 