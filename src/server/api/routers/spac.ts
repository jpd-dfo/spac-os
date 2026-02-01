/**
 * SPAC OS - SPAC Router
 * Full CRUD operations for SPACs with filtering and search
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

// Input validation schemas
const UuidSchema = z.string().uuid();

const SpacStatusSchema = z.enum([
  'SEARCHING',
  'LOI_SIGNED',
  'DA_ANNOUNCED',
  'SEC_REVIEW',
  'SHAREHOLDER_VOTE',
  'CLOSING',
  'COMPLETED',
  'LIQUIDATING',
  'LIQUIDATED',
  'TERMINATED',
]);

const SpacPhaseSchema = z.enum([
  'FORMATION',
  'IPO',
  'TARGET_SEARCH',
  'DUE_DILIGENCE',
  'NEGOTIATION',
  'DEFINITIVE_AGREEMENT',
  'SEC_REVIEW',
  'SHAREHOLDER_VOTE',
  'CLOSING',
  'DE_SPAC',
]);

const SpacCreateSchema = z.object({
  organizationId: UuidSchema,
  name: z.string().min(1).max(255),
  ticker: z.string().min(1).max(10).regex(/^[A-Z0-9.]+$/).optional().nullable(),
  cusip: z.string().length(9).optional().nullable(),
  isin: z.string().length(12).optional().nullable(),
  cik: z.string().max(10).optional().nullable(),
  status: SpacStatusSchema.default('SEARCHING'),
  phase: SpacPhaseSchema.default('FORMATION'),
  ipoDate: z.coerce.date().optional().nullable(),
  ipoSize: z.number().min(0).optional().nullable(),
  ipoPrice: z.number().positive().optional().nullable(),
  trustSize: z.number().min(0).optional().nullable(),
  trustBalance: z.number().min(0).optional().nullable(),
  trustPerShare: z.number().positive().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  deadlineDate: z.coerce.date().optional().nullable(),
  maxExtensions: z.number().int().min(0).max(12).default(6),
  extensionMonths: z.number().int().min(1).max(12).default(1),
  description: z.string().optional().nullable(),
  investmentThesis: z.string().optional().nullable(),
  targetSectors: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  targetGeographies: z.array(z.string()).default([]),
  targetSizeMin: z.number().min(0).optional().nullable(),
  targetSizeMax: z.number().min(0).optional().nullable(),
  exchange: z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

const SpacUpdateSchema = SpacCreateSchema.partial().omit({ organizationId: true });

const SpacListSchema = z.object({
  organizationId: UuidSchema.optional(),
  status: z.array(SpacStatusSchema).optional(),
  phase: z.array(SpacPhaseSchema).optional(),
  ticker: z.string().optional(),
  search: z.string().optional(),
  deadlineBefore: z.coerce.date().optional(),
  deadlineAfter: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const spacRouter = createTRPCRouter({
  /**
   * List SPACs with filtering and pagination
   */
  list: protectedProcedure
    .input(SpacListSchema)
    .query(async ({ ctx, input }) => {
      const {
        organizationId,
        status,
        phase,
        ticker,
        search,
        deadlineBefore,
        deadlineAfter,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      // Build where clause
      const where: Record<string, unknown> = {
        deletedAt: null,
      };

      if (organizationId) where.organizationId = organizationId;
      if (status?.length) where.status = { in: status };
      if (phase?.length) where.phase = { in: phase };
      if (ticker) where.ticker = { contains: ticker, mode: 'insensitive' };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { ticker: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (deadlineBefore || deadlineAfter) {
        where.deadline = {};
        if (deadlineBefore) (where.deadline as Record<string, unknown>).lte = deadlineBefore;
        if (deadlineAfter) (where.deadline as Record<string, unknown>).gte = deadlineAfter;
      }

      // Execute query with pagination
      const [items, total] = await Promise.all([
        ctx.db.spac.findMany({
          where,
          include: {
            sponsors: {
              include: { sponsor: { select: { id: true, name: true, tier: true } } },
              where: { isPrimary: true },
            },
            trustAccounts: {
              orderBy: { balanceDate: 'desc' },
              take: 1,
            },
            _count: {
              select: { targets: true, tasks: true, filings: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.spac.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get a single SPAC by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const spac = await ctx.db.spac.findUnique({
        where: { id: input.id },
        include: {
          organization: true,
          sponsors: {
            include: { sponsor: true },
          },
          targets: {
            where: { deletedAt: null },
            take: 10,
            orderBy: { updatedAt: 'desc' },
          },
          trustAccounts: {
            orderBy: { balanceDate: 'desc' },
            take: 1,
          },
          filings: {
            orderBy: { filedDate: 'desc' },
            take: 5,
          },
          tasks: {
            where: { deletedAt: null, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
            orderBy: { dueDate: 'asc' },
            take: 10,
          },
          milestones: {
            where: { isCompleted: false },
            orderBy: { targetDate: 'asc' },
            take: 5,
          },
          _count: {
            select: {
              targets: true,
              documents: true,
              filings: true,
              tasks: true,
              milestones: true,
            },
          },
        },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      return spac;
    }),

  /**
   * Create a new SPAC
   */
  create: orgAuditedProcedure
    .input(SpacCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate ticker uniqueness
      if (input.ticker) {
        const existing = await ctx.db.spac.findUnique({
          where: { ticker: input.ticker },
        });
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A SPAC with this ticker already exists',
          });
        }
      }

      const spac = await ctx.db.spac.create({
        data: {
          ...input,
          deadlineDate: input.deadline || input.deadlineDate,
        },
        include: {
          organization: true,
        },
      });

      return spac;
    }),

  /**
   * Update a SPAC
   */
  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: SpacUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.spac.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      // Validate ticker uniqueness if changing
      if (input.data.ticker && input.data.ticker !== existing.ticker) {
        const tickerExists = await ctx.db.spac.findUnique({
          where: { ticker: input.data.ticker },
        });
        if (tickerExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A SPAC with this ticker already exists',
          });
        }
      }

      const spac = await ctx.db.spac.update({
        where: { id: input.id },
        data: input.data,
        include: {
          organization: true,
          sponsors: { include: { sponsor: true } },
        },
      });

      return spac;
    }),

  /**
   * Soft delete a SPAC
   */
  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.spac.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      await ctx.db.spac.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),
});
