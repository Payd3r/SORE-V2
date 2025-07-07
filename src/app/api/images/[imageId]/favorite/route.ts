import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.coupleId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { imageId } = params;

  try {
    // First, verify the image exists and belongs to the user's couple
    const imageToToggle = await prisma.image.findFirst({
      where: {
        id: imageId,
        memory: {
          coupleId: session.user.coupleId,
        },
      },
      select: {
        isFavorite: true,
      },
    });

    if (!imageToToggle) {
      return new NextResponse('Not Found or Forbidden', { status: 404 });
    }

    // Toggle the isFavorite status
    const updatedImage = await prisma.image.update({
      where: {
        id: imageId,
      },
      data: {
        isFavorite: !imageToToggle.isFavorite,
      },
      select: {
        id: true,
        isFavorite: true,
      }
    });

    return NextResponse.json(updatedImage, { status: 200 });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 