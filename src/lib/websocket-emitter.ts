import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_CHANNEL = 'momento-sync';

const publisher = new Redis(REDIS_URL);

export interface ProgressPayload {
  type: 'upload_progress' | 'processing_progress';
  fileId: string;
  filename: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  message?: string;
  details?: any;
}

export async function sendProgress(clientId: string, payload: ProgressPayload) {
  try {
    const message = JSON.stringify({
      clientId,
      ...payload,
    });
    await publisher.publish(REDIS_CHANNEL, message);
  } catch (error) {
    console.error('Failed to publish progress to Redis:', error);
  }
} 