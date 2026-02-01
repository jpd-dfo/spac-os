/**
 * SPAC OS - tRPC Server Caller
 * Server-side tRPC caller for RSC and server actions
 */

import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { createTRPCContext, createCallerFactory } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';

/**
 * Create a tRPC caller factory from the app router
 */
const createCaller = createCallerFactory(appRouter);

/**
 * Create a cached tRPC caller for server components
 * This uses React's cache() to dedupe calls within a single request
 */
export const api = cache(async () => {
  const headersData = await headers();

  return createCaller(
    await createTRPCContext({
      req: {
        headers: headersData,
      } as Request,
      resHeaders: new Headers(),
    })
  );
});

/**
 * Get the tRPC API caller for server-side usage
 * @example
 * const caller = await getApiCaller();
 * const spacs = await caller.spac.list({ page: 1, pageSize: 10 });
 */
export async function getApiCaller() {
  return api();
}
