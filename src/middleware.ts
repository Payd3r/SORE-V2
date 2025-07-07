import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { rateLimiter } from './lib/rate-limiter'

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = await rateLimiter(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }

    const csrfToken = req.cookies.get('csrf-token')?.value
    const csrfHeader = req.headers.get('x-csrf-token')

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        if (!csrfToken || !csrfHeader || csrfToken !== csrfHeader) {
            return new NextResponse('Invalid CSRF token', { status: 403 })
        }
    }
  }

  const response = NextResponse.next()

  if (!req.cookies.has('csrf-token')) {
    const token = nanoid(32)
    response.cookies.set('csrf-token', token, {
      httpOnly: false, // Accessible by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: '/:path*',
} 