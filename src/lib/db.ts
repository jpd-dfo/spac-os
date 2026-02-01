/**
 * SPAC OS - Database Client Re-export
 * Re-exports the Prisma client from server/db.ts for backwards compatibility
 */

export { db, checkDatabaseConnection, disconnectDatabase } from '@/server/db';

// Alias for legacy code that uses 'prisma' instead of 'db'
export { db as prisma } from '@/server/db';
