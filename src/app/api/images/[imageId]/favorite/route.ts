import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { imageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.coupleId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { imageId } = params;
  const { isFavorite } = await req.json();

  if (typeof isFavorite !== 'boolean') {
    return new NextResponse('Invalid input', { status: 400 });
  }

  // Verifica che l'immagine appartenga alla coppia dell'utente
  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      coupleId: session.user.coupleId,
    },
  });

  if (!image) {
    return new NextResponse('Image not found or access denied', {
      status: 404,
    });
  }

  const updatedImage = await prisma.image.update({
    where: { id: imageId },
    data: { isFavorite },
  });

  return NextResponse.json(updatedImage);
} 