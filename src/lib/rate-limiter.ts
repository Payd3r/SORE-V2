import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis(process.env.REDIS_URL!);

const RATE_LIMIT_DURATION = 60; // 1 minute in seconds
const RATE_LIMIT_REQUESTS = 100; // Max requests per duration

export async function rateLimiter(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const key = `rate-limit:${ip}`;

  const current = await redis.get(key);
  const currentCount = current ? parseInt(current, 10) : 0;

  if (currentCount >= RATE_LIMIT_REQUESTS) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  await redis.multi().incr(key).expire(key, RATE_LIMIT_DURATION).exec();

  return NextResponse.next();
} 