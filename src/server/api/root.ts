/**
 * SPAC OS - Root API Router
 * Combines all tRPC routers into a single API
 */

import { spacRouter } from './routers/spac';
import { targetRouter } from './routers/target';
import { createTRPCRouter } from './trpc';

/**
 * Main tRPC router combining all domain routers
 *
 * API Structure:
 *
 * - spac.*           - SPAC management (list, getById, create, update, delete)
 * - target.*         - Acquisition target management (list, getById, create, update, delete, updateStatus)
 */
export const appRouter = createTRPCRouter({
  spac: spacRouter,
  target: targetRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
