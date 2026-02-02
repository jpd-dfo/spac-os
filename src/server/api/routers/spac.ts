/**
 * SPAC OS - SPAC Router
 * Full CRUD operations for SPACs with filtering, search, and audit logging
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  createTRPCRouter,
  protectedProcedure,
} from '../trpc';

// Input validation schemas
const UuidSchema = z.string().min(1, 'ID is required');

const SpacStatusSchema = z.enum([
  'PRE_IPO',
  'SEARCHING',
  'LOI_SIGNED',
  'DEFINITIVE_AGREEMENT',
  'VOTE_PENDING',
  'DE_SPAC_COMPLETE',
  'LIQUIDATED',
]);

// List input schema with pagination, filtering, and sorting
const SpacListSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: SpacStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'ticker', 'status', 'ipoDate', 'deadlineDate', 'trustAmount', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Create input schema - all required Spac fields from Prisma schema
const SpacCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  ticker: z.string().min(1).max(10).regex(/^[A-Z0-9.]+$/, 'Ticker must be uppercase letters, numbers, or dots').optional().nullable(),
  status: SpacStatusSchema.default('SEARCHING'),
  trustAmount: z.number().min(0).optional().nullable(),
  ipoDate: z.coerce.date().optional().nullable(),
  deadlineDate: z.coerce.date().optional().nullable(),
  redemptionRate: z.number().min(0).max(1).optional().nullable(),
});

// Update input schema - all fields optional except id
const SpacUpdateSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(255).optional(),
  ticker: z.string().min(1).max(10).regex(/^[A-Z0-9.]+$/).optional().nullable(),
  status: SpacStatusSchema.optional(),
  trustAmount: z.number().min(0).optional().nullable(),
  ipoDate: z.coerce.date().optional().nullable(),
  deadlineDate: z.coerce.date().optional().nullable(),
  redemptionRate: z.number().min(0).max(1).optional().nullable(),
});

// Update status input schema with audit reason
const SpacUpdateStatusSchema = z.object({
  id: UuidSchema,
  status: SpacStatusSchema,
  reason: z.string().optional(),
});

export const spacRouter = createTRPCRouter({
  /**
   * List SPACs with pagination, filtering, and sorting
   * Returns paginated list with total count
   */
  list: protectedProcedure
    .input(SpacListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search, sortBy, sortOrder } = input;

      // Build where clause for filtering
      const where: Record<string, unknown> = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { ticker: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Calculate pagination offset
      const skip = (page - 1) * limit;

      // Build orderBy clause
      const orderBy = sortBy
        ? { [sortBy]: sortOrder }
        : { updatedAt: 'desc' as const };

      // Execute query with pagination
      const [items, total] = await Promise.all([
        ctx.db.spac.findMany({
          where,
          include: {
            _count: {
              select: {
                targets: true,
                documents: true,
                filings: true,
                tasks: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        ctx.db.spac.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        totalPages,
      };
    }),

  /**
   * Get single SPAC by ID with all related data
   * Returns full SPAC with targets, documents, filings, and tasks
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const spac = await ctx.db.spac.findUnique({
        where: { id: input.id },
        include: {
          targets: {
            orderBy: { updatedAt: 'desc' },
            take: 50,
          },
          documents: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          filings: {
            orderBy: { filingDate: 'desc' },
            take: 20,
          },
          tasks: {
            where: {
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
            orderBy: { dueDate: 'asc' },
            take: 50,
          },
          financials: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: {
            select: {
              targets: true,
              documents: true,
              filings: true,
              tasks: true,
              financials: true,
            },
          },
        },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `SPAC with ID '${input.id}' not found`,
        });
      }

      return spac;
    }),

  /**
   * Create a new SPAC
   * Validates ticker uniqueness before creation
   */
  create: protectedProcedure
    .input(SpacCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate ticker uniqueness if provided
      if (input.ticker) {
        const existingSpac = await ctx.db.spac.findUnique({
          where: { ticker: input.ticker },
        });

        if (existingSpac) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A SPAC with ticker '${input.ticker}' already exists`,
          });
        }
      }

      // Create the SPAC
      const spac = await ctx.db.spac.create({
        data: {
          name: input.name,
          ticker: input.ticker,
          status: input.status,
          trustAmount: input.trustAmount,
          ipoDate: input.ipoDate,
          deadlineDate: input.deadlineDate,
          redemptionRate: input.redemptionRate,
        },
        include: {
          _count: {
            select: {
              targets: true,
              documents: true,
              filings: true,
              tasks: true,
            },
          },
        },
      });

      return spac;
    }),

  /**
   * Update an existing SPAC
   * Validates existence and ticker uniqueness
   */
  update: protectedProcedure
    .input(SpacUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if SPAC exists
      const existingSpac = await ctx.db.spac.findUnique({
        where: { id },
      });

      if (!existingSpac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `SPAC with ID '${id}' not found`,
        });
      }

      // Validate ticker uniqueness if changing
      if (updateData.ticker && updateData.ticker !== existingSpac.ticker) {
        const tickerExists = await ctx.db.spac.findUnique({
          where: { ticker: updateData.ticker },
        });

        if (tickerExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A SPAC with ticker '${updateData.ticker}' already exists`,
          });
        }
      }

      // Remove undefined values from update data
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );

      // Update the SPAC
      const spac = await ctx.db.spac.update({
        where: { id },
        data: cleanUpdateData,
        include: {
          targets: {
            take: 10,
            orderBy: { updatedAt: 'desc' },
          },
          _count: {
            select: {
              targets: true,
              documents: true,
              filings: true,
              tasks: true,
            },
          },
        },
      });

      return spac;
    }),

  /**
   * Soft delete (archive) a SPAC
   * Sets status to LIQUIDATED as a soft delete mechanism
   * Note: Since the Prisma schema doesn't have a deletedAt field,
   * we use status change as an archive mechanism
   */
  delete: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      // Check if SPAC exists
      const existingSpac = await ctx.db.spac.findUnique({
        where: { id: input.id },
      });

      if (!existingSpac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `SPAC with ID '${input.id}' not found`,
        });
      }

      // Archive by setting status to LIQUIDATED
      // In a production system, you might want to add a deletedAt field
      await ctx.db.spac.update({
        where: { id: input.id },
        data: { status: 'LIQUIDATED' },
      });

      return { success: true };
    }),

  /**
   * Update SPAC lifecycle status with audit logging
   * Records the status change with optional reason for compliance tracking
   */
  updateStatus: protectedProcedure
    .input(SpacUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, reason } = input;

      // Check if SPAC exists
      const existingSpac = await ctx.db.spac.findUnique({
        where: { id },
      });

      if (!existingSpac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `SPAC with ID '${id}' not found`,
        });
      }

      const previousStatus = existingSpac.status;

      // Validate status transition (optional business logic)
      const validTransitions: Record<string, string[]> = {
        PRE_IPO: ['SEARCHING'],
        SEARCHING: ['LOI_SIGNED', 'LIQUIDATED'],
        LOI_SIGNED: ['DEFINITIVE_AGREEMENT', 'SEARCHING', 'LIQUIDATED'],
        DEFINITIVE_AGREEMENT: ['VOTE_PENDING', 'SEARCHING', 'LIQUIDATED'],
        VOTE_PENDING: ['DE_SPAC_COMPLETE', 'LIQUIDATED'],
        DE_SPAC_COMPLETE: [], // Terminal state
        LIQUIDATED: [], // Terminal state
      };

      const allowedNextStatuses = validTransitions[previousStatus] || [];

      // Only enforce transitions for non-terminal states
      if (allowedNextStatuses.length > 0 && !allowedNextStatuses.includes(status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid status transition from '${previousStatus}' to '${status}'. Allowed transitions: ${allowedNextStatuses.join(', ')}`,
        });
      }

      // Terminal states cannot transition
      if (allowedNextStatuses.length === 0 && previousStatus !== status) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot change status from terminal state '${previousStatus}'`,
        });
      }

      // Update the SPAC status
      const spac = await ctx.db.spac.update({
        where: { id },
        data: { status },
        include: {
          _count: {
            select: {
              targets: true,
              documents: true,
              filings: true,
              tasks: true,
            },
          },
        },
      });

      // Create audit log entry if user has an organization
      if (ctx.user?.organizationId) {
        try {
          await ctx.db.auditLog.create({
            data: {
              organizationId: ctx.user.organizationId,
              userId: ctx.user.id,
              action: 'STATUS_CHANGE',
              entityType: 'spac',
              entityId: id,
              metadata: {
                previousStatus,
                newStatus: status,
                reason: reason || null,
                changedAt: new Date().toISOString(),
              },
            },
          });
        } catch (auditError) {
          // Log but don't fail the operation if audit logging fails
          console.error('Failed to create audit log:', auditError);
        }
      }

      return spac;
    }),

  /**
   * Get SPAC statistics and summary
   * Returns count by status for dashboard
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const [
        totalCount,
        searchingCount,
        loiSignedCount,
        daCount,
        votePendingCount,
        completedCount,
        liquidatedCount,
      ] = await Promise.all([
        ctx.db.spac.count(),
        ctx.db.spac.count({ where: { status: 'SEARCHING' } }),
        ctx.db.spac.count({ where: { status: 'LOI_SIGNED' } }),
        ctx.db.spac.count({ where: { status: 'DEFINITIVE_AGREEMENT' } }),
        ctx.db.spac.count({ where: { status: 'VOTE_PENDING' } }),
        ctx.db.spac.count({ where: { status: 'DE_SPAC_COMPLETE' } }),
        ctx.db.spac.count({ where: { status: 'LIQUIDATED' } }),
      ]);

      return {
        total: totalCount,
        byStatus: {
          PRE_IPO: await ctx.db.spac.count({ where: { status: 'PRE_IPO' } }),
          SEARCHING: searchingCount,
          LOI_SIGNED: loiSignedCount,
          DEFINITIVE_AGREEMENT: daCount,
          VOTE_PENDING: votePendingCount,
          DE_SPAC_COMPLETE: completedCount,
          LIQUIDATED: liquidatedCount,
        },
        active: totalCount - liquidatedCount - completedCount,
      };
    }),
});
