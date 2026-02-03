/**
 * SPAC OS - Target Router
 * Full CRUD operations for acquisition targets
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  TargetCreateSchema,
  TargetUpdateSchema,
  TargetFilterSchema,
  UuidSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

import { Prisma } from '@prisma/client';



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

      // Serialize Decimal fields
      return {
        ...target,
        valuation: target.valuation ? Number(target.valuation) : null,
        enterpriseValue: target.enterpriseValue ? Number(target.enterpriseValue) : null,
        revenue: target.revenue ? Number(target.revenue) : null,
        ebitda: target.ebitda ? Number(target.ebitda) : null,
        evRevenue: target.evRevenue ? Number(target.evRevenue) : null,
        evEbitda: target.evEbitda ? Number(target.evEbitda) : null,
        aiScore: target.aiScore ? Number(target.aiScore) : null,
        overallScore: target.overallScore ? Number(target.overallScore) : null,
        probability: target.probability ? Number(target.probability) : null,
        transactions: target.transactions.map((t) => ({
          ...t,
          amount: t.amount ? Number(t.amount) : null,
        })),
      };
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

      if (spacId) {where.spacId = spacId;}
      if (status?.length) {where.status = { in: status };}
      // Map DealStage schema values to TargetStage Prisma enum values
      if (stage?.length) {
        const stageMapping: Record<string, 'SOURCING' | 'SCREENING' | 'PRELIMINARY_DD' | 'FULL_DD' | 'NEGOTIATION' | 'DOCUMENTATION' | 'CLOSING'> = {
          'ORIGINATION': 'SOURCING',
          'PRELIMINARY_REVIEW': 'SCREENING',
          'DEEP_DIVE': 'FULL_DD',
          'NEGOTIATION': 'NEGOTIATION',
          'DOCUMENTATION': 'DOCUMENTATION',
          'CLOSING': 'CLOSING',
        };
        const mappedStages = stage
          .map(s => stageMapping[s])
          .filter((s): s is 'SOURCING' | 'SCREENING' | 'PRELIMINARY_DD' | 'FULL_DD' | 'NEGOTIATION' | 'DOCUMENTATION' | 'CLOSING' => s !== undefined);
        if (mappedStages.length) {
          where.stage = { in: mappedStages };
        }
      }
      if (industry) {where.industry = { contains: industry, mode: 'insensitive' };}
      if (sector) {where.sector = { contains: sector, mode: 'insensitive' };}

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

      const [rawItems, total] = await Promise.all([
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

      // Serialize Decimal fields
      const items = rawItems.map((target) => ({
        ...target,
        valuation: target.valuation ? Number(target.valuation) : null,
        enterpriseValue: target.enterpriseValue ? Number(target.enterpriseValue) : null,
        revenue: target.revenue ? Number(target.revenue) : null,
        ebitda: target.ebitda ? Number(target.ebitda) : null,
        evRevenue: target.evRevenue ? Number(target.evRevenue) : null,
        evEbitda: target.evEbitda ? Number(target.evEbitda) : null,
        aiScore: target.aiScore ? Number(target.aiScore) : null,
        overallScore: target.overallScore ? Number(target.overallScore) : null,
        probability: target.probability ? Number(target.probability) : null,
      }));

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

      // Map stage to valid Prisma TargetStage values
      const stageMapping: Record<string, 'SOURCING' | 'SCREENING' | 'PRELIMINARY_DD' | 'FULL_DD' | 'NEGOTIATION' | 'DOCUMENTATION' | 'CLOSING'> = {
        'ORIGINATION': 'SOURCING',
        'PRELIMINARY_REVIEW': 'SCREENING',
        'DEEP_DIVE': 'FULL_DD',
        'NEGOTIATION': 'NEGOTIATION',
        'DOCUMENTATION': 'DOCUMENTATION',
        'CLOSING': 'CLOSING',
      };

      const target = await ctx.db.target.create({
        data: {
          name: input.name,
          description: input.description,
          industry: input.industry,
          sector: input.sector,
          status: input.status,
          stage: input.stage ? stageMapping[input.stage] ?? null : null,
          valuation: input.enterpriseValue,
          enterpriseValue: input.enterpriseValue,
          revenue: input.revenue,
          ebitda: input.ebitda,
          evRevenue: input.evRevenue,
          evEbitda: input.evEbitda,
          aiScore: input.overallScore,
          overallScore: input.overallScore,
          managementScore: input.managementScore,
          marketScore: input.marketScore,
          financialScore: input.financialScore,
          operationalScore: input.operationalScore,
          riskScore: input.riskScore,
          priority: input.priority,
          probability: input.probability,
          dueDiligenceStatus: input.dueDiligenceStatus ? { status: input.dueDiligenceStatus } : undefined,
          keyRisks: input.keyRisks,
          keyOpportunities: input.keyOpportunities,
          identifiedDate: input.identifiedDate || new Date(),
          ndaDate: input.ndaDate,
          ndaSignedDate: input.ndaDate,
          loiDate: input.loiDate,
          loiSignedDate: input.loiDate,
          daDate: input.daDate,
          daSignedDate: input.daDate,
          expectedCloseDate: input.expectedCloseDate,
          ...(input.spacId && { spac: { connect: { id: input.spacId } } }),
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

      // Map stage to valid Prisma TargetStage values
      const stageMapping: Record<string, 'SOURCING' | 'SCREENING' | 'PRELIMINARY_DD' | 'FULL_DD' | 'NEGOTIATION' | 'DOCUMENTATION' | 'CLOSING'> = {
        'ORIGINATION': 'SOURCING',
        'PRELIMINARY_REVIEW': 'SCREENING',
        'DEEP_DIVE': 'FULL_DD',
        'NEGOTIATION': 'NEGOTIATION',
        'DOCUMENTATION': 'DOCUMENTATION',
        'CLOSING': 'CLOSING',
      };

      // Build update data with only valid Prisma fields
      const updateData: Parameters<typeof ctx.db.target.update>[0]['data'] = {};

      if (input.data.name !== undefined) { updateData.name = input.data.name; }
      if (input.data.description !== undefined) { updateData.description = input.data.description; }
      if (input.data.industry !== undefined) { updateData.industry = input.data.industry; }
      if (input.data.sector !== undefined) { updateData.sector = input.data.sector; }
      if (input.data.status !== undefined) { updateData.status = input.data.status; }
      if (input.data.stage !== undefined) { updateData.stage = input.data.stage ? stageMapping[input.data.stage] ?? null : null; }
      if (input.data.enterpriseValue !== undefined) {
        updateData.enterpriseValue = input.data.enterpriseValue;
        updateData.valuation = input.data.enterpriseValue;
      }
      if (input.data.revenue !== undefined) { updateData.revenue = input.data.revenue; }
      if (input.data.ebitda !== undefined) { updateData.ebitda = input.data.ebitda; }
      if (input.data.evRevenue !== undefined) { updateData.evRevenue = input.data.evRevenue; }
      if (input.data.evEbitda !== undefined) { updateData.evEbitda = input.data.evEbitda; }
      if (input.data.overallScore !== undefined) {
        updateData.overallScore = input.data.overallScore;
        updateData.aiScore = input.data.overallScore;
      }
      if (input.data.managementScore !== undefined) { updateData.managementScore = input.data.managementScore; }
      if (input.data.marketScore !== undefined) { updateData.marketScore = input.data.marketScore; }
      if (input.data.financialScore !== undefined) { updateData.financialScore = input.data.financialScore; }
      if (input.data.operationalScore !== undefined) { updateData.operationalScore = input.data.operationalScore; }
      if (input.data.riskScore !== undefined) { updateData.riskScore = input.data.riskScore; }
      if (input.data.priority !== undefined) { updateData.priority = input.data.priority; }
      if (input.data.probability !== undefined) { updateData.probability = input.data.probability; }
      if (input.data.dueDiligenceStatus !== undefined) { updateData.dueDiligenceStatus = input.data.dueDiligenceStatus ? { status: input.data.dueDiligenceStatus } : Prisma.JsonNull; }
      if (input.data.keyRisks !== undefined) { updateData.keyRisks = input.data.keyRisks; }
      if (input.data.keyOpportunities !== undefined) { updateData.keyOpportunities = input.data.keyOpportunities; }
      if (input.data.identifiedDate !== undefined) { updateData.identifiedDate = input.data.identifiedDate; }
      if (input.data.ndaDate !== undefined) {
        updateData.ndaDate = input.data.ndaDate;
        updateData.ndaSignedDate = input.data.ndaDate;
      }
      if (input.data.loiDate !== undefined) {
        updateData.loiDate = input.data.loiDate;
        updateData.loiSignedDate = input.data.loiDate;
      }
      if (input.data.daDate !== undefined) {
        updateData.daDate = input.data.daDate;
        updateData.daSignedDate = input.data.daDate;
      }
      if (input.data.expectedCloseDate !== undefined) { updateData.expectedCloseDate = input.data.expectedCloseDate; }
      if (input.data.spacId !== undefined) {
        if (input.data.spacId) {
          updateData.spac = { connect: { id: input.data.spacId } };
        } else {
          updateData.spac = { disconnect: true };
        }
      }

      const target = await ctx.db.target.update({
        where: { id: input.id },
        data: updateData,
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

      // Group by status and serialize Decimals
      const pipeline: Record<string, Array<{
        id: string;
        name: string;
        status: string;
        stage: string | null;
        priority: number | null;
        probability: number | null;
        enterpriseValue: number | null;
        industry: string | null;
        spac: { id: string; name: string; ticker: string | null } | null;
      }>> = {};

      for (const target of targets) {
        const status = target.status;
        if (!pipeline[status]) {pipeline[status] = [];}
        pipeline[status]!.push({
          ...target,
          enterpriseValue: target.enterpriseValue ? Number(target.enterpriseValue) : null,
          probability: target.probability ? Number(target.probability) : null,
        });
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

      // Serialize Decimals for target
      const serializedTarget = {
        ...target,
        enterpriseValue: target.enterpriseValue ? Number(target.enterpriseValue) : null,
        revenue: target.revenue ? Number(target.revenue) : null,
        ebitda: target.ebitda ? Number(target.ebitda) : null,
        evRevenue: target.evRevenue ? Number(target.evRevenue) : null,
        evEbitda: target.evEbitda ? Number(target.evEbitda) : null,
      };

      // Serialize Decimals for comparables
      const serializedComparables = comparables.map((c) => ({
        ...c,
        enterpriseValue: c.enterpriseValue ? Number(c.enterpriseValue) : null,
        revenue: c.revenue ? Number(c.revenue) : null,
        ebitda: c.ebitda ? Number(c.ebitda) : null,
        evRevenue: c.evRevenue ? Number(c.evRevenue) : null,
        evEbitda: c.evEbitda ? Number(c.evEbitda) : null,
      }));

      return {
        target: serializedTarget,
        comparables: serializedComparables,
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
          enterpriseValue: avgValuation._avg.enterpriseValue ? Number(avgValuation._avg.enterpriseValue) : null,
          evRevenue: avgValuation._avg.evRevenue ? Number(avgValuation._avg.evRevenue) : null,
          evEbitda: avgValuation._avg.evEbitda ? Number(avgValuation._avg.evEbitda) : null,
        },
        conversionRate,
      };
    }),
});
