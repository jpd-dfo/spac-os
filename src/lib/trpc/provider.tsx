/**
 * SPAC OS - tRPC Provider
 * React Query + tRPC provider for client components
 */

'use client';

import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';

import { trpc } from './client';

/**
 * Get the base URL for tRPC requests
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }

  // SSR should use absolute URL
  if (process.env['VERCEL_URL']) {
    return `https://${process.env['VERCEL_URL']}`;
  }

  // Fallback to localhost
  return `http://localhost:${process.env['PORT'] ?? 3000}`;
}

/**
 * tRPC + React Query Provider
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() => {
    return trpc.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              'x-trpc-source': 'react',
            };
          },
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
