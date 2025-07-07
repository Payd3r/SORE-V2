import { NextResponse } from 'next/server';

/**
 * Health Check endpoint per Docker e monitoring
 * GET /api/health
 */
export async function GET() {
  try {
    // Basic health check - potrebbe essere esteso con controlli database/redis
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      }, 
      { status: 503 }
    );
  }
} 