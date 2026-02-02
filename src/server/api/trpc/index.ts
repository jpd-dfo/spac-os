/**
 * SPAC OS - tRPC Base Setup
 * Server-side tRPC configuration with context and procedures
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@/server/db';
import { getServerAuthSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Context creation for tRPC
 * Provides access to database and session in all procedures
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await getServerAuthSession({ req, res });

  return {
    db,
    session,
    req,
    res,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

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
 * Ensures user is logged in
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Middleware for organization access
 * Ensures user has access to the organization
 */
const enforceOrgAccess = t.middleware(async ({ ctx, next, rawInput }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const input = rawInput as { organizationId?: string };
  if (input?.organizationId) {
    const membership = await ctx.db.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
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
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (ctx.session.user.role !== 'admin') {
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

  // Only audit mutations
  if (type === 'mutation' && ctx.session?.user) {
    try {
      const input = rawInput as Record<string, unknown>;
      await ctx.db.auditLog.create({
        data: {
          organizationId: (input?.organizationId as string) || ctx.session.user.organizationId || '',
          userId: ctx.session.user.id,
          action: path.includes('create') ? 'CREATE' :
                  path.includes('update') ? 'UPDATE' :
                  path.includes('delete') ? 'DELETE' : 'UPDATE',
          entityType: path.split('.')[0],
          entityId: (input?.id as string) || null,
          newValues: input,
          metadata: { path, type },
        },
      });
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

// Public procedure - no authentication required
export const publicProcedure = t.procedure.use(loggerMiddleware);

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth);

// Org procedure - requires authentication and organization access
export const orgProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(enforceOrgAccess);

// Admin procedure - requires admin role
export const adminProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(enforceAdmin);

// Audited procedure - requires auth and creates audit log
export const auditedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(auditMiddleware);

// Org audited procedure - combines org access and audit
export const orgAuditedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth)
  .use(enforceOrgAccess)
  .use(auditMiddleware);
