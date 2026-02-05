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

import { SpacStatusSchema } from '@/schemas';

// Input validation schemas
const UuidSchema = z.string().min(1, 'ID is required');

// List input schema with pagination, filtering, and sorting
const SpacListSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: SpacStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'ticker', 'status', 'ipoDate', 'deadlineDate', 'trustAmount', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Phase enum schema - matches Prisma SpacPhase enum
const SpacPhaseSchema = z.enum([
  'PRE_IPO',
  'IPO',
  'TARGET_SEARCH',
  'LOI',
  'DUE_DILIGENCE',
  'DA_NEGOTIATION',
  'SEC_REVIEW',
  'PROXY',
  'VOTE',
  'CLOSING',
  'POST_CLOSE',
  'LIQUIDATION',
]);

// Create input schema - all required Spac fields from Prisma schema
const SpacCreateSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required').max(255),
  ticker: z.string().min(1).max(10).regex(/^[A-Z0-9.]+$/, 'Ticker must be uppercase letters, numbers, or dots').optional().nullable(),
  status: SpacStatusSchema.default('SEARCHING'),
  phase: SpacPhaseSchema.default('TARGET_SEARCH'),
  description: z.string().optional().nullable(),

  // Financial Information
  trustAmount: z.number().min(0).optional().nullable(),
  trustBalance: z.number().min(0).optional().nullable(),
  ipoSize: z.number().min(0).optional().nullable(),
  sharesOutstanding: z.number().int().min(0).optional().nullable(),

  // Dates
  ipoDate: z.coerce.date().optional().nullable(),
  deadlineDate: z.coerce.date().optional().nullable(),

  // Extensions
  maxExtensions: z.number().int().min(0).max(12).default(6),

  // Redemption
  redemptionRate: z.number().min(0).max(1).optional().nullable(),

  // Target criteria
  targetSectors: z.array(z.string()).default([]),
  targetGeographies: z.array(z.string()).default([]),
});

// Update input schema - all fields optional except id
const SpacUpdateSchema = z.object({
  id: UuidSchema,
  // Basic Information
  name: z.string().min(1).max(255).optional(),
  ticker: z.string().min(1).max(10).regex(/^[A-Z0-9.]+$/).optional().nullable(),
  status: SpacStatusSchema.optional(),
  phase: SpacPhaseSchema.optional(),
  description: z.string().optional().nullable(),

  // Financial Information
  trustAmount: z.number().min(0).optional().nullable(),
  trustBalance: z.number().min(0).optional().nullable(),
  ipoSize: z.number().min(0).optional().nullable(),
  sharesOutstanding: z.number().int().min(0).optional().nullable(),

  // Dates
  ipoDate: z.coerce.date().optional().nullable(),
  deadlineDate: z.coerce.date().optional().nullable(),

  // Extensions
  maxExtensions: z.number().int().min(0).max(12).optional(),

  // Redemption
  redemptionRate: z.number().min(0).max(1).optional().nullable(),

  // Target criteria
  targetSectors: z.array(z.string()).optional(),
  targetGeographies: z.array(z.string()).optional(),
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
        where['status'] = status;
      }

      if (search) {
        where['OR'] = [
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
      const [rawItems, total] = await Promise.all([
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

      // Transform Decimal/BigInt fields to serializable types
      const items = rawItems.map((spac) => ({
        ...spac,
        trustAmount: spac.trustAmount ? Number(spac.trustAmount) : null,
        ipoSize: spac.ipoSize ? Number(spac.ipoSize) : null,
        trustBalance: spac.trustBalance ? Number(spac.trustBalance) : null,
        sharesOutstanding: spac.sharesOutstanding ? Number(spac.sharesOutstanding) : null,
        redemptionRate: spac.redemptionRate ? Number(spac.redemptionRate) : null,
      }));

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
            orderBy: { filedDate: 'desc' },
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

      // Transform Decimal/BigInt fields to serializable types
      return {
        ...spac,
        trustAmount: spac.trustAmount ? Number(spac.trustAmount) : null,
        ipoSize: spac.ipoSize ? Number(spac.ipoSize) : null,
        trustBalance: spac.trustBalance ? Number(spac.trustBalance) : null,
        sharesOutstanding: spac.sharesOutstanding ? Number(spac.sharesOutstanding) : null,
        redemptionRate: spac.redemptionRate ? Number(spac.redemptionRate) : null,
        targets: spac.targets.map((t) => ({
          ...t,
          valuation: t.valuation ? Number(t.valuation) : null,
          enterpriseValue: t.enterpriseValue ? Number(t.enterpriseValue) : null,
          revenue: t.revenue ? Number(t.revenue) : null,
          ebitda: t.ebitda ? Number(t.ebitda) : null,
          evRevenue: t.evRevenue ? Number(t.evRevenue) : null,
          evEbitda: t.evEbitda ? Number(t.evEbitda) : null,
          aiScore: t.aiScore ? Number(t.aiScore) : null,
          overallScore: t.overallScore ? Number(t.overallScore) : null,
          probability: t.probability ? Number(t.probability) : null,
        })),
      };
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
          // Basic Information
          name: input.name,
          ticker: input.ticker,
          status: input.status,
          phase: input.phase,
          description: input.description,

          // Financial Information
          trustAmount: input.trustAmount,
          trustBalance: input.trustBalance,
          ipoSize: input.ipoSize,
          sharesOutstanding: input.sharesOutstanding,

          // Dates
          ipoDate: input.ipoDate,
          deadlineDate: input.deadlineDate,
          deadline: input.deadlineDate, // Also set deadline field

          // Extensions
          maxExtensions: input.maxExtensions,

          // Redemption
          redemptionRate: input.redemptionRate,

          // Target criteria
          targetSectors: input.targetSectors,
          targetGeographies: input.targetGeographies,
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
        SEARCHING: ['LOI_SIGNED', 'LIQUIDATING', 'TERMINATED'],
        LOI_SIGNED: ['DA_ANNOUNCED', 'SEARCHING', 'TERMINATED'],
        DA_ANNOUNCED: ['SEC_REVIEW', 'SEARCHING', 'TERMINATED'],
        SEC_REVIEW: ['SHAREHOLDER_VOTE', 'DA_ANNOUNCED', 'TERMINATED'],
        SHAREHOLDER_VOTE: ['CLOSING', 'TERMINATED'],
        CLOSING: ['COMPLETED', 'TERMINATED'],
        COMPLETED: [], // Terminal state
        LIQUIDATING: ['LIQUIDATED'],
        LIQUIDATED: [], // Terminal state
        TERMINATED: [], // Terminal state
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
        daAnnouncedCount,
        secReviewCount,
        shareholderVoteCount,
        closingCount,
        completedCount,
        liquidatingCount,
        liquidatedCount,
        terminatedCount,
      ] = await Promise.all([
        ctx.db.spac.count(),
        ctx.db.spac.count({ where: { status: 'SEARCHING' } }),
        ctx.db.spac.count({ where: { status: 'LOI_SIGNED' } }),
        ctx.db.spac.count({ where: { status: 'DA_ANNOUNCED' } }),
        ctx.db.spac.count({ where: { status: 'SEC_REVIEW' } }),
        ctx.db.spac.count({ where: { status: 'SHAREHOLDER_VOTE' } }),
        ctx.db.spac.count({ where: { status: 'CLOSING' } }),
        ctx.db.spac.count({ where: { status: 'COMPLETED' } }),
        ctx.db.spac.count({ where: { status: 'LIQUIDATING' } }),
        ctx.db.spac.count({ where: { status: 'LIQUIDATED' } }),
        ctx.db.spac.count({ where: { status: 'TERMINATED' } }),
      ]);

      return {
        total: totalCount,
        byStatus: {
          SEARCHING: searchingCount,
          LOI_SIGNED: loiSignedCount,
          DA_ANNOUNCED: daAnnouncedCount,
          SEC_REVIEW: secReviewCount,
          SHAREHOLDER_VOTE: shareholderVoteCount,
          CLOSING: closingCount,
          COMPLETED: completedCount,
          LIQUIDATING: liquidatingCount,
          LIQUIDATED: liquidatedCount,
          TERMINATED: terminatedCount,
        },
        active: totalCount - liquidatedCount - completedCount - terminatedCount,
      };
    }),
});
