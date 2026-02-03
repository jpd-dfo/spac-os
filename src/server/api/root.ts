/**
 * SPAC OS - Root API Router
 * Combines all tRPC routers into a single API
 */

import { documentRouter } from './routers/document.router';
import { noteRouter } from './routers/note.router';
import { spacRouter } from './routers/spac';
import { targetRouter } from './routers/target.router';
import { createTRPCRouter } from './trpc';

/**
 * Main tRPC router combining all domain routers
 *
 * API Structure:
 *
 * - spac.*           - SPAC management (list, getById, create, update, delete)
 * - target.*         - Acquisition target management (list, getById, create, update, delete, updateStatus)
 * - note.*           - Note management (list, getById, create, update, delete, getByTarget, getBySpac)
 * - document.*       - Document management (list, getById, create, update, delete, getSignedUrl, getVersionHistory)
 */
export const appRouter = createTRPCRouter({
  spac: spacRouter,
  target: targetRouter,
  note: noteRouter,
  document: documentRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
