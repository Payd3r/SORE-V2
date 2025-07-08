import { pusherServer } from '@/lib/pusher/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id || !session.user.coupleId) {
    return res.status(401).send('Unauthorized');
  }

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // Il nome del canale deve essere 'private-couple-COUPLE_ID'
  const expectedChannel = `private-couple-${session.user.coupleId}`;
  if (channel !== expectedChannel) {
    return res.status(403).send('Forbidden');
  }

  const userData = {
    user_id: session.user.id,
    user_info: {
        name: session.user.name,
        image: session.user.image,
    }
  };

  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channel, userData);
    res.send(authResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
} 