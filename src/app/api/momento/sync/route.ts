import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_CHANNEL = 'momento-sync';
const publisher = new Redis(REDIS_URL);

export async function POST(request: Request) {
  try {
    const queuedMessages = await request.json();

    if (!Array.isArray(queuedMessages) || queuedMessages.length === 0) {
      return NextResponse.json({ message: 'No messages to sync' }, { status: 200 });
    }

    console.log(`Received ${queuedMessages.length} messages to sync from background sync. Publishing to Redis...`);

    // Process each message
    for (const msg of queuedMessages) {
      const broadcastMessage = JSON.stringify({
        ...msg,
        synced: true,
        timestamp: new Date().toISOString()
      });
      await publisher.publish(REDIS_CHANNEL, broadcastMessage);
    }

    return NextResponse.json({ success: true, message: `Published ${queuedMessages.length} messages to Redis.` }, { status: 200 });

  } catch (error) {
    console.error('API Sync Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to sync messages.' }, { status: 500 });
  }
} 