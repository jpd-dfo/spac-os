/**
 * SPAC OS - Prisma Client Singleton
 * Database client with connection pooling for Next.js
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

// Declare global type for Prisma client singleton
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with appropriate logging configuration
 */
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

/**
 * Prisma client singleton
 * Uses global variable to prevent multiple instances in development
 * due to Next.js hot reloading
 */
export const db = globalThis.prisma ?? createPrismaClient();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

/**
 * Helper function to check database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown handler
 */
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect();
}
