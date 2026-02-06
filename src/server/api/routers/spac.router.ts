/**
 * SPAC OS - SPAC Router
 * Full CRUD operations for SPACs with search, filter, and analytics
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  SpacCreateSchema,
  SpacUpdateSchema,
  SpacFilterSchema,
  UuidSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

import type { Prisma } from '@prisma/client';



export const spacRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

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
            include: {
              sponsor: true,
            },
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
          documents: {
            where: { deletedAt: null },
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          filings: {
            take: 10,
            orderBy: { filedDate: 'desc' },
          },
          tasks: {
            where: { deletedAt: null },
            take: 20,
            orderBy: { dueDate: 'asc' },
          },
          financials: {
            take: 10,
            orderBy: { createdAt: 'desc' },
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
   * List SPACs with filtering and pagination
   */
  list: protectedProcedure
    .input(SpacFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        organizationId,
        status,
        phase,
        ticker,
        search,
        deadlineBefore,
        deadlineAfter,
        ipoSizeMin,
        ipoSizeMax,
        targetSectors,
        targetGeographies,
        tags,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.SpacWhereInput = {
        deletedAt: null,
      };

      if (organizationId) {where.organizationId = organizationId;}
      if (status?.length) {where.status = { in: status };}
      if (phase?.length) {where.phase = { in: phase as any };}
      if (ticker) {where.ticker = { contains: ticker, mode: 'insensitive' };}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { ticker: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (deadlineBefore || deadlineAfter) {
        where.deadlineDate = {
          ...(deadlineBefore && { lte: deadlineBefore }),
          ...(deadlineAfter && { gte: deadlineAfter }),
        };
      }
      if (ipoSizeMin || ipoSizeMax) {
        where.ipoSize = {
          ...(ipoSizeMin && { gte: ipoSizeMin }),
          ...(ipoSizeMax && { lte: ipoSizeMax }),
        };
      }
      if (targetSectors?.length) {where.targetSectors = { hasSome: targetSectors };}
      if (targetGeographies?.length) {where.targetGeographies = { hasSome: targetGeographies };}
      if (tags?.length) {where.tags = { hasSome: tags };}

      const [rawItems, total] = await Promise.all([
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
              select: { targets: true, tasks: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
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
        trustAccounts: spac.trustAccounts.map((ta) => ({
          ...ta,
          currentBalance: ta.currentBalance ? Number(ta.currentBalance) : null,
          perShareValue: ta.perShareValue ? Number(ta.perShareValue) : null,
          accruedInterest: ta.accruedInterest ? Number(ta.accruedInterest) : null,
        })),
        sponsors: spac.sponsors.map((s) => ({
          ...s,
          ownershipPct: s.ownershipPct ? Number(s.ownershipPct) : null,
        })),
      }));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
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
          ...input as any,
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
        data: input.data as any,
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

  // ============================================================================
  // SPECIALIZED QUERIES
  // ============================================================================

  /**
   * Get SPAC with full details for dashboard
   */
  getDashboard: protectedProcedure
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
            where: { deletedAt: null, status: { not: 'PASSED' } },
            orderBy: { priority: 'asc' },
            take: 5,
          },
          trustAccounts: {
            orderBy: { balanceDate: 'desc' },
            take: 1,
          },
          filings: {
            where: { status: { not: 'WITHDRAWN' } },
            orderBy: { filedDate: 'desc' },
            take: 5,
          },
          tasks: {
            where: { deletedAt: null, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
            orderBy: { dueDate: 'asc' },
            take: 10,
            include: {
              assignee: { select: { id: true, name: true, image: true } },
            },
          },
          milestones: {
            where: { isCompleted: false },
            orderBy: { targetDate: 'asc' },
            take: 5,
          },
          complianceItems: {
            where: { status: { in: ['PENDING', 'IN_PROGRESS', 'NON_COMPLIANT'] } },
            orderBy: { dueDate: 'asc' },
            take: 5,
          },
          redemptions: {
            orderBy: { eventDate: 'desc' },
            take: 3,
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
   * Get SPACs approaching deadline
   */
  getApproachingDeadlines: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema.optional(),
      daysAhead: z.number().int().min(1).max(365).default(90),
    }))
    .query(async ({ ctx, input }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + input.daysAhead);

      const where: Prisma.SpacWhereInput = {
        deletedAt: null,
        status: { in: ['SEARCHING', 'LOI_SIGNED'] },
        deadlineDate: {
          lte: cutoffDate,
          gte: new Date(),
        },
        ...(input.organizationId && { organizationId: input.organizationId }),
      };

      return ctx.db.spac.findMany({
        where,
        orderBy: { deadlineDate: 'asc' },
        include: {
          sponsors: {
            where: { isPrimary: true },
            include: { sponsor: { select: { name: true } } },
          },
          trustAccounts: {
            orderBy: { balanceDate: 'desc' },
            take: 1,
          },
        },
      });
    }),

  /**
   * Get SPAC timeline with all key events
   */
  getTimeline: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const spac = await ctx.db.spac.findUnique({
        where: { id: input.id },
        select: {
          ipoDate: true,
          deadlineDate: true,
          daAnnouncedDate: true,
          proxyFiledDate: true,
          voteDate: true,
          closingDate: true,
          milestones: {
            orderBy: { targetDate: 'asc' },
            select: {
              id: true,
              name: true,
              targetDate: true,
              actualDate: true,
              isCompleted: true,
              type: true,
            },
          },
          filings: {
            orderBy: { filedDate: 'desc' },
            select: {
              id: true,
              type: true,
              status: true,
              filedDate: true,
              effectiveDate: true,
              title: true,
            },
          },
          redemptions: {
            orderBy: { eventDate: 'asc' },
            select: {
              id: true,
              eventDate: true,
              eventType: true,
              redemptionRate: true,
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

      // Build timeline events
      interface TimelineEvent {
        date: Date | null;
        type: string;
        title: string;
        status: 'past' | 'current' | 'future';
        details?: Record<string, unknown>;
      }
      const events: TimelineEvent[] = [];

      const now = new Date();

      if (spac.ipoDate) {
        events.push({
          date: spac.ipoDate,
          type: 'ipo',
          title: 'IPO Date',
          status: spac.ipoDate < now ? 'past' : 'future',
        });
      }

      if (spac.daAnnouncedDate) {
        events.push({
          date: spac.daAnnouncedDate,
          type: 'da_announced',
          title: 'Definitive Agreement Announced',
          status: spac.daAnnouncedDate < now ? 'past' : 'future',
        });
      }

      if (spac.voteDate) {
        events.push({
          date: spac.voteDate,
          type: 'vote',
          title: 'Shareholder Vote',
          status: spac.voteDate < now ? 'past' : 'future',
        });
      }

      if (spac.deadlineDate) {
        events.push({
          date: spac.deadlineDate,
          type: 'deadline',
          title: 'SPAC Deadline',
          status: spac.deadlineDate < now ? 'past' : 'future',
        });
      }

      // Add milestones
      for (const m of spac.milestones) {
        events.push({
          date: m.targetDate,
          type: 'milestone',
          title: m.name,
          status: m.isCompleted ? 'past' : (m.targetDate && m.targetDate < now ? 'current' : 'future'),
          details: m,
        });
      }

      // Add filings
      for (const f of spac.filings) {
        if (f.filedDate) {
          events.push({
            date: f.filedDate,
            type: 'filing',
            title: `${f.type} Filed`,
            status: 'past',
            details: f,
          });
        }
      }

      // Sort by date
      events.sort((a, b) => {
        if (!a.date) {return 1;}
        if (!b.date) {return -1;}
        return a.date.getTime() - b.date.getTime();
      });

      return events;
    }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get aggregated statistics for SPACs
   */
  getStatistics: protectedProcedure
    .input(z.object({ organizationId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.SpacWhereInput = {
        deletedAt: null,
        ...(input.organizationId && { organizationId: input.organizationId }),
      };

      const [
        total,
        byStatus,
        byPhase,
        averages,
        recentlyCreated,
      ] = await Promise.all([
        ctx.db.spac.count({ where }),
        ctx.db.spac.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        ctx.db.spac.groupBy({
          by: ['phase'],
          where,
          _count: true,
        }),
        ctx.db.spac.aggregate({
          where,
          _avg: {
            ipoSize: true,
            trustBalance: true,
          },
          _sum: {
            ipoSize: true,
            trustBalance: true,
          },
        }),
        ctx.db.spac.count({
          where: {
            ...where,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        byPhase: Object.fromEntries(byPhase.map((p) => [p.phase, p._count])),
        averageIpoSize: averages._avg.ipoSize,
        totalIpoSize: averages._sum.ipoSize,
        averageTrustBalance: averages._avg.trustBalance,
        totalTrustBalance: averages._sum.trustBalance,
        createdLast30Days: recentlyCreated,
      };
    }),

  /**
   * Get SPAC pipeline overview
   */
  getPipeline: protectedProcedure
    .input(z.object({ organizationId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.SpacWhereInput = {
        deletedAt: null,
        ...(input.organizationId && { organizationId: input.organizationId }),
      };

      const spacs = await ctx.db.spac.findMany({
        where,
        select: {
          id: true,
          name: true,
          ticker: true,
          status: true,
          phase: true,
          deadlineDate: true,
          ipoSize: true,
          trustBalance: true,
          targets: {
            where: { deletedAt: null, status: { notIn: ['PASSED', 'TERMINATED'] } },
            select: { id: true, status: true, stage: true },
          },
          _count: {
            select: { tasks: { where: { status: { not: 'COMPLETED' } } } },
          },
        },
        orderBy: { status: 'asc' },
      });

      // Group by status
      const pipeline: Record<string, typeof spacs> = {};
      for (const spac of spacs) {
        if (!pipeline[spac.status]) {pipeline[spac.status] = [];}
        pipeline[spac.status]!.push(spac);
      }

      return pipeline;
    }),

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Extend SPAC deadline
   */
  extendDeadline: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      months: z.number().int().min(1).max(12).default(1),
      contributionAmount: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const spac = await ctx.db.spac.findUnique({
        where: { id: input.id },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      if (!spac.deadlineDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'SPAC does not have a deadline set',
        });
      }

      if (spac.extensionsUsed >= spac.maxExtensions) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum extensions already used',
        });
      }

      const newDeadline = new Date(spac.deadlineDate);
      newDeadline.setMonth(newDeadline.getMonth() + input.months);

      const updated = await ctx.db.spac.update({
        where: { id: input.id },
        data: {
          deadlineDate: newDeadline,
          extensionDeadline: newDeadline,
          extensionsUsed: { increment: 1 },
          extensionCount: { increment: 1 },
        },
      });

      return updated;
    }),

  /**
   * Update SPAC status with validation
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: z.enum([
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
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const spac = await ctx.db.spac.findUnique({
        where: { id: input.id },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        SEARCHING: ['LOI_SIGNED', 'LIQUIDATING', 'TERMINATED'],
        LOI_SIGNED: ['DA_ANNOUNCED', 'SEARCHING', 'TERMINATED'],
        DA_ANNOUNCED: ['SEC_REVIEW', 'TERMINATED'],
        SEC_REVIEW: ['SHAREHOLDER_VOTE', 'TERMINATED'],
        SHAREHOLDER_VOTE: ['CLOSING', 'TERMINATED'],
        CLOSING: ['COMPLETED', 'TERMINATED'],
        LIQUIDATING: ['LIQUIDATED'],
        COMPLETED: [],
        LIQUIDATED: [],
        TERMINATED: [],
      };

      if (!validTransitions[spac.status]?.includes(input.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot transition from ${spac.status} to ${input.status}`,
        });
      }

      const updated = await ctx.db.spac.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return updated;
    }),
});
