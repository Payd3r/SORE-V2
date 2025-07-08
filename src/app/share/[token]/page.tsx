import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ShareView from '@/components/Share/ShareView';

interface SharePageProps {
  params: {
    token: string;
  };
}

async function getSharedMemory(token: string) {
  const sharedLink = await prisma.sharedLink.findUnique({
    where: { token },
    include: {
      memory: {
        include: {
          images: true,
          videos: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!sharedLink) {
    return null;
  }

  // Check for expiration
  if (sharedLink.expiresAt && new Date() > new Date(sharedLink.expiresAt)) {
    // Optionally delete expired links
    // await prisma.sharedLink.delete({ where: { id: sharedLink.id } });
    return null; 
  }

  return sharedLink;
}


export default async function SharePage({ params }: SharePageProps) {
  const sharedLink = await getSharedMemory(params.token);

  if (!sharedLink) {
    notFound();
  }

  // If password protected, ShareView will handle the password prompt
  return <ShareView sharedLink={sharedLink} />;
} 