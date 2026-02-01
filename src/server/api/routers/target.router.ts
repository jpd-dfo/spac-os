/**
 * SPAC OS - Target Router
 * Full CRUD operations for acquisition targets
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';
import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';
import {
  TargetCreateSchema,
  TargetUpdateSchema,
  TargetFilterSchema,
  UuidSchema,
} from '@/schemas';

export const targetRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const target = await ctx.db.target.findUnique({
        where: { id: input.id },
        include: {
          spac: {
            select: { id: true, name: true, ticker: true, status: true },
          },
          contacts: {
            include: {
              contact: true,
            },
          },
          documents: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          tasks: {
            where: { deletedAt: null, status: { not: 'COMPLETED' } },
            orderBy: { dueDate: 'asc' },
            take: 10,
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              documents: true,
              tasks: true,
              contacts: true,
            },
          },
        },
      });

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      return target;
    }),

  list: protectedProcedure
    .input(TargetFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        spacId,
        status,
        stage,
        industry,
        sector,
        search,
        priorityMin,
        priorityMax,
        evMin,
        evMax,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.TargetWhereInput = {
        deletedAt: null,
      };

      if (spacId) where.spacId = spacId;
      if (status?.length) where.status = { in: status };
      if (stage?.length) where.stage = { in: stage };
      if (industry) where.industry = { contains: industry, mode: 'insensitive' };
      if (sector) where.sector = { contains: sector, mode: 'insensitive' };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (priorityMin !== undefined || priorityMax !== undefined) {
        where.priority = {
          ...(priorityMin !== undefined && { gte: priorityMin }),
          ...(priorityMax !== undefined && { lte: priorityMax }),
        };
      }
      if (evMin !== undefined || evMax !== undefined) {
        where.enterpriseValue = {
          ...(evMin !== undefined && { gte: evMin }),
          ...(evMax !== undefined && { lte: evMax }),
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.target.findMany({
          where,
          include: {
            spac: {
              select: { id: true, name: true, ticker: true },
            },
            _count: {
              select: { documents: true, tasks: true, contacts: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { priority: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.target.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  create: orgAuditedProcedure
    .input(TargetCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate SPAC exists if provided
      if (input.spacId) {
        const spac = await ctx.db.spac.findUnique({
          where: { id: input.spacId },
        });
        if (!spac) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'SPAC not found',
          });
        }
      }

      const target = await ctx.db.target.create({
        data: {
          ...input,
          identifiedDate: input.identifiedDate || new Date(),
        },
        include: {
          spac: true,
        },
      });

      return target;
    }),

  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: TargetUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.target.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      const target = await ctx.db.target.update({
        where: { id: input.id },
        data: input.data,
        include: {
          spac: true,
          contacts: { include: { contact: true } },
        },
      });

      return target;
    }),

  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.target.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      await ctx.db.target.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  // ============================================================================
  // SPECIALIZED QUERIES
  // ============================================================================

  /**
   * Get target pipeline grouped by status
   */
  getPipeline: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.TargetWhereInput = {
        deletedAt: null,
        status: { notIn: ['PASSED', 'TERMINATED', 'CLOSED'] },
        ...(input.spacId && { spacId: input.spacId }),
      };

      const targets = await ctx.db.target.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          stage: true,
          priority: true,
          probability: true,
          enterpriseValue: true,
          industry: true,
          spac: {
            select: { id: true, name: true, ticker: true },
          },
        },
        orderBy: [{ priority: 'asc' }, { probability: 'desc' }],
      });

      // Group by status
      const pipeline: Record<string, typeof targets> = {};
      for (const target of targets) {
        if (!pipeline[target.status]) pipeline[target.status] = [];
        pipeline[target.status].push(target);
      }

      return pipeline;
    }),

  /**
   * Get due diligence status
   */
  getDueDiligenceStatus: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const target = await ctx.db.target.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          status: true,
          dueDiligenceStatus: true,
          keyRisks: true,
          keyOpportunities: true,
          documents: {
            where: {
              deletedAt: null,
              type: 'DUE_DILIGENCE',
            },
            select: {
              id: true,
              name: true,
              category: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          tasks: {
            where: {
              deletedAt: null,
              category: 'due_diligence',
            },
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              assignee: {
                select: { id: true, name: true },
              },
            },
            orderBy: { dueDate: 'asc' },
          },
        },
      });

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      // Calculate DD completion
      const ddTasks = target.tasks;
      const completedTasks = ddTasks.filter((t) => t.status === 'COMPLETED').length;
      const completionRate = ddTasks.length > 0 ? completedTasks / ddTasks.length : 0;

      return {
        ...target,
        ddProgress: {
          totalTasks: ddTasks.length,
          completedTasks,
          completionRate,
          pendingTasks: ddTasks.filter((t) => t.status !== 'COMPLETED'),
        },
      };
    }),

  /**
   * Get valuation comparison with similar targets
   */
  getValuationComparison: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const target = await ctx.db.target.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          industry: true,
          sector: true,
          enterpriseValue: true,
          revenue: true,
          ebitda: true,
          evRevenue: true,
          evEbitda: true,
        },
      });

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      // Find comparable targets in same industry
      const comparables = await ctx.db.target.findMany({
        where: {
          id: { not: target.id },
          deletedAt: null,
          industry: target.industry,
          enterpriseValue: { not: null },
        },
        select: {
          id: true,
          name: true,
          enterpriseValue: true,
          revenue: true,
          ebitda: true,
          evRevenue: true,
          evEbitda: true,
          status: true,
        },
        take: 10,
      });

      // Calculate industry averages
      const avgEvRevenue =
        comparables.reduce((sum, c) => sum + (Number(c.evRevenue) || 0), 0) /
        (comparables.filter((c) => c.evRevenue).length || 1);
      const avgEvEbitda =
        comparables.reduce((sum, c) => sum + (Number(c.evEbitda) || 0), 0) /
        (comparables.filter((c) => c.evEbitda).length || 1);

      return {
        target,
        comparables,
        industryAverages: {
          evRevenue: avgEvRevenue,
          evEbitda: avgEvEbitda,
        },
        premium: {
          evRevenue: target.evRevenue
            ? ((Number(target.evRevenue) - avgEvRevenue) / avgEvRevenue) * 100
            : null,
          evEbitda: target.evEbitda
            ? ((Number(target.evEbitda) - avgEvEbitda) / avgEvEbitda) * 100
            : null,
        },
      };
    }),

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Update target status
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: z.enum([
        'IDENTIFIED',
        'PRELIMINARY',
        'NDA_SIGNED',
        'DUE_DILIGENCE',
        'TERM_SHEET',
        'LOI',
        'DEFINITIVE',
        'CLOSED',
        'PASSED',
        'TERMINATED',
      ]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.target.findUnique({
        where: { id: input.id },
      });

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      // Update relevant date fields based on status
      const updateData: Prisma.TargetUpdateInput = { status: input.status };

      switch (input.status) {
        case 'NDA_SIGNED':
          updateData.ndaDate = new Date();
          updateData.ndaSignedDate = new Date();
          break;
        case 'LOI':
          updateData.loiDate = new Date();
          updateData.loiSignedDate = new Date();
          break;
        case 'DEFINITIVE':
          updateData.daDate = new Date();
          updateData.daSignedDate = new Date();
          break;
        case 'CLOSED':
          updateData.actualCloseDate = new Date();
          break;
      }

      const updated = await ctx.db.target.update({
        where: { id: input.id },
        data: updateData,
        include: { spac: true },
      });

      return updated;
    }),

  /**
   * Assign target to a SPAC
   */
  assignToSpac: orgAuditedProcedure
    .input(z.object({
      targetId: UuidSchema,
      spacId: UuidSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const [target, spac] = await Promise.all([
        ctx.db.target.findUnique({ where: { id: input.targetId } }),
        ctx.db.spac.findUnique({ where: { id: input.spacId } }),
      ]);

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      const updated = await ctx.db.target.update({
        where: { id: input.targetId },
        data: { spacId: input.spacId },
        include: { spac: true },
      });

      return updated;
    }),

  /**
   * Update evaluation scores
   */
  updateScores: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      managementScore: z.number().int().min(1).max(10).optional(),
      marketScore: z.number().int().min(1).max(10).optional(),
      financialScore: z.number().int().min(1).max(10).optional(),
      operationalScore: z.number().int().min(1).max(10).optional(),
      riskScore: z.number().int().min(1).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...scores } = input;

      const target = await ctx.db.target.findUnique({
        where: { id },
      });

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      // Calculate overall score as average
      const scoreValues = Object.values(scores).filter((v) => v !== undefined) as number[];
      const overallScore =
        scoreValues.length > 0
          ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
          : null;

      const updated = await ctx.db.target.update({
        where: { id },
        data: {
          ...scores,
          overallScore,
        },
      });

      return updated;
    }),

  /**
   * Add/remove contact from target
   */
  manageContacts: orgAuditedProcedure
    .input(z.object({
      targetId: UuidSchema,
      action: z.enum(['add', 'remove']),
      contactId: UuidSchema,
      role: z.string().max(100).optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { targetId, action, contactId, role, isPrimary } = input;

      if (action === 'add') {
        await ctx.db.targetContact.upsert({
          where: {
            targetId_contactId: { targetId, contactId },
          },
          create: {
            targetId,
            contactId,
            role,
            isPrimary: isPrimary || false,
          },
          update: {
            role,
            isPrimary,
          },
        });
      } else {
        await ctx.db.targetContact.delete({
          where: {
            targetId_contactId: { targetId, contactId },
          },
        });
      }

      return { success: true };
    }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getStatistics: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.TargetWhereInput = {
        deletedAt: null,
        ...(input.spacId && { spacId: input.spacId }),
      };

      const [
        total,
        byStatus,
        byStage,
        byIndustry,
        avgValuation,
        conversionRate,
      ] = await Promise.all([
        ctx.db.target.count({ where }),
        ctx.db.target.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        ctx.db.target.groupBy({
          by: ['stage'],
          where,
          _count: true,
        }),
        ctx.db.target.groupBy({
          by: ['industry'],
          where: { ...where, industry: { not: null } },
          _count: true,
          orderBy: { _count: { industry: 'desc' } },
          take: 10,
        }),
        ctx.db.target.aggregate({
          where: { ...where, enterpriseValue: { not: null } },
          _avg: { enterpriseValue: true, evRevenue: true, evEbitda: true },
        }),
        // Calculate conversion rate (closed / total non-identified)
        Promise.all([
          ctx.db.target.count({
            where: { ...where, status: 'CLOSED' },
          }),
          ctx.db.target.count({
            where: { ...where, status: { not: 'IDENTIFIED' } },
          }),
        ]).then(([closed, total]) => (total > 0 ? closed / total : 0)),
      ]);

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        byStage: Object.fromEntries(byStage.map((s) => [s.stage, s._count])),
        byIndustry: byIndustry
          .filter((i) => i.industry)
          .map((i) => ({ industry: i.industry, count: i._count })),
        averages: {
          enterpriseValue: avgValuation._avg.enterpriseValue,
          evRevenue: avgValuation._avg.evRevenue,
          evEbitda: avgValuation._avg.evEbitda,
        },
        conversionRate,
      };
    }),
});
