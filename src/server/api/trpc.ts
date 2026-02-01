/**
 * SPAC OS - tRPC Base Setup
 * Server-side tRPC configuration with context and procedures
 * Uses Clerk for authentication
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@/server/db';
import { logger } from '@/lib/logger';

/**
 * User type from Clerk context
 */
interface ClerkUser {
  id: string;
  email?: string;
  organizationId?: string;
  role?: string;
}

/**
 * Context type for tRPC procedures
 */
export interface Context {
  db: typeof db;
  user: ClerkUser | null;
  headers: Headers;
}

/**
 * Create context for tRPC requests
 * Provides access to database and authenticated user
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions): Promise<Context> => {
  const { userId, orgId } = await auth();

  let user: ClerkUser | null = null;

  if (userId) {
    user = {
      id: userId,
      organizationId: orgId ?? undefined,
    };
  }

  return {
    db,
    user,
    headers: opts.req.headers,
  };
};

/**
 * Create inner context without request headers
 * Useful for server-side calls
 */
export const createInnerTRPCContext = async (): Promise<Context> => {
  const { userId, orgId } = await auth();

  let user: ClerkUser | null = null;

  if (userId) {
    user = {
      id: userId,
      organizationId: orgId ?? undefined,
    };
  }

  return {
    db,
    user,
    headers: new Headers(),
  };
};

/**
 * Initialize tRPC with superjson transformer for date serialization
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Middleware for logging requests
 */
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  logger.info(`[tRPC] ${type} ${path} - ${duration}ms`);

  return result;
});

/**
 * Middleware for authentication
 * Ensures user is logged in via Clerk
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Middleware for organization access
 * Ensures user has access to the organization
 */
const enforceOrgAccess = t.middleware(async ({ ctx, next, rawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const input = rawInput as { organizationId?: string };

  // Check if the user belongs to the organization
  if (input?.organizationId && ctx.user.organizationId !== input.organizationId) {
    // Verify membership in database
    const membership = await ctx.db.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this organization',
      });
    }
  }

  return next();
});

/**
 * Middleware for admin-only actions
 */
const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Check admin role from Clerk organization role or database
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'org:admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next();
});

/**
 * Audit logging middleware
 * Records all mutations to audit log
 */
const auditMiddleware = t.middleware(async ({ ctx, path, type, rawInput, next }) => {
  const result = await next();

  // Only audit mutations and if user is authenticated
  if (type === 'mutation' && ctx.user) {
    try {
      const input = rawInput as Record<string, unknown>;
      const organizationId = (input?.organizationId as string) || ctx.user.organizationId;

      if (organizationId) {
        await ctx.db.auditLog.create({
          data: {
            organizationId,
            userId: ctx.user.id,
            action: path.includes('create')
              ? 'CREATE'
              : path.includes('update')
              ? 'UPDATE'
              : path.includes('delete')
              ? 'DELETE'
              : 'UPDATE',
            entityType: path.split('.')[0],
            entityId: (input?.id as string) || null,
            newValues: input,
            metadata: { path, type },
          },
        });
      }
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }

  return result;
});

/**
 * Export reusable router and procedures
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const mergeRouters = t.mergeRouters;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure.use(loggerMiddleware);

/**
 * Protected procedure - requires Clerk authentication
 */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth);

/**
 * Org procedure - requires authentication and organization access
 */
export const orgProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(enforceOrgAccess);

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(enforceAdmin);

/**
 * Audited procedure - requires auth and creates audit log
 */
export const auditedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(auditMiddleware);

/**
 * Org audited procedure - combines org access and audit
 */
export const orgAuditedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(enforceOrgAccess)
  .use(auditMiddleware);
