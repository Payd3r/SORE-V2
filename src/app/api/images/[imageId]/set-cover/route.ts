import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { imageId } = params;

  try {
    const image = await db.image.findUnique({
      where: { id: imageId },
      select: { memoryId: true, memory: { select: { coupleId: true } } },
    });

    if (!image || !image.memory || image.memory.coupleId !== session.user.coupleId) {
      return new NextResponse('Not Found or Forbidden', { status: 404 });
    }

    const { memoryId } = image;

    await db.$transaction(async (prisma: Prisma.TransactionClient) => {
      // Remove cover status from all other images in the memory
      await prisma.image.updateMany({
        where: {
          memoryId: memoryId,
          isCover: true,
        },
        data: {
          isCover: false,
        },
      });

      // Set the new cover image
      await prisma.image.update({
        where: {
          id: imageId,
        },
        data: {
          isCover: true,
        },
      });
    });

    return new NextResponse('Cover image updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error setting cover image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 