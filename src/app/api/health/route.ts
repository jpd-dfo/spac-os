/**
 * SPAC OS - Health Check Endpoint
 * Used for monitoring and load balancer health checks
 */

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env['APP_VERSION'] || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: {
        database: 'connected',
        responseTimeMs: responseTime,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env['APP_VERSION'] || '1.0.0',
        environment: process.env.NODE_ENV,
        checks: {
          database: 'disconnected',
          responseTimeMs: responseTime,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
