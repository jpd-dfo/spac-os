/**
 * SPAC OS - Target Router
 * Full CRUD operations for acquisition targets with status management
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

// Input validation schemas
const UuidSchema = z.string().uuid();

const TargetStatusSchema = z.enum([
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
]);

const DealStageSchema = z.enum([
  'ORIGINATION',
  'PRELIMINARY_REVIEW',
  'DEEP_DIVE',
  'NEGOTIATION',
  'DOCUMENTATION',
  'CLOSING',
  'TERMINATED',
]);

const TargetCreateSchema = z.object({
  spacId: UuidSchema.optional().nullable(),
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional().nullable(),
  status: TargetStatusSchema.default('IDENTIFIED'),
  stage: DealStageSchema.default('ORIGINATION'),
  priority: z.number().int().min(1).max(5).default(3),
  probability: z.number().int().min(0).max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  sector: z.string().max(100).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  subIndustry: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable(),
  headquarters: z.string().max(255).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  employeeCount: z.number().int().positive().optional().nullable(),
  revenue: z.number().min(0).optional().nullable(),
  revenueYear: z.number().int().min(2000).max(new Date().getFullYear() + 1).optional().nullable(),
  ebitda: z.number().optional().nullable(),
  grossMargin: z.number().min(0).max(1).optional().nullable(),
  growthRate: z.number().min(-1).max(10).optional().nullable(),
  ltmRevenue: z.number().min(0).optional().nullable(),
  ltmEbitda: z.number().optional().nullable(),
  projectedRevenue: z.number().min(0).optional().nullable(),
  projectedEbitda: z.number().optional().nullable(),
  enterpriseValue: z.number().min(0).optional().nullable(),
  equityValue: z.number().min(0).optional().nullable(),
  evRevenue: z.number().min(0).max(100).optional().nullable(),
  evEbitda: z.number().min(0).max(100).optional().nullable(),
  managementScore: z.number().int().min(1).max(10).optional().nullable(),
  marketScore: z.number().int().min(1).max(10).optional().nullable(),
  financialScore: z.number().int().min(1).max(10).optional().nullable(),
  operationalScore: z.number().int().min(1).max(10).optional().nullable(),
  riskScore: z.number().int().min(1).max(10).optional().nullable(),
  overallScore: z.number().min(1).max(10).optional().nullable(),
  proposedValuation: z.number().min(0).optional().nullable(),
  rolloverEquity: z.number().min(0).max(1).optional().nullable(),
  identifiedDate: z.coerce.date().optional().nullable(),
  firstContactDate: z.coerce.date().optional().nullable(),
  ndaDate: z.coerce.date().optional().nullable(),
  loiDate: z.coerce.date().optional().nullable(),
  daDate: z.coerce.date().optional().nullable(),
  expectedCloseDate: z.coerce.date().optional().nullable(),
  dueDiligenceStatus: z.string().max(100).optional().nullable(),
  keyRisks: z.array(z.string()).default([]),
  keyOpportunities: z.array(z.string()).default([]),
  investmentHighlights: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
  confidentialityLevel: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
});

const TargetUpdateSchema = TargetCreateSchema.partial();

const TargetListSchema = z.object({
  spacId: UuidSchema.optional(),
  status: z.array(TargetStatusSchema).optional(),
  stage: z.array(DealStageSchema).optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  search: z.string().optional(),
  priorityMin: z.number().int().min(1).max(5).optional(),
  priorityMax: z.number().int().min(1).max(5).optional(),
  evMin: z.number().min(0).optional(),
  evMax: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const targetRouter = createTRPCRouter({
  /**
   * List targets with filtering and pagination
   */
  list: protectedProcedure
    .input(TargetListSchema)
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

      // Build where clause
      const where: Record<string, unknown> = {
        deletedAt: null,
      };

      if (spacId) {where['spacId'] = spacId;}
      if (status?.length) {where['status'] = { in: status };}
      if (stage?.length) {where['stage'] = { in: stage };}
      if (industry) {where['industry'] = { contains: industry, mode: 'insensitive' };}
      if (sector) {where['sector'] = { contains: sector, mode: 'insensitive' };}

      if (search) {
        where['OR'] = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (priorityMin !== undefined || priorityMax !== undefined) {
        where['priority'] = {};
        if (priorityMin !== undefined) {(where['priority'] as Record<string, unknown>)['gte'] = priorityMin;}
        if (priorityMax !== undefined) {(where['priority'] as Record<string, unknown>)['lte'] = priorityMax;}
      }

      if (evMin !== undefined || evMax !== undefined) {
        where['enterpriseValue'] = {};
        if (evMin !== undefined) {(where['enterpriseValue'] as Record<string, unknown>)['gte'] = evMin;}
        if (evMax !== undefined) {(where['enterpriseValue'] as Record<string, unknown>)['lte'] = evMax;}
      }

      // Execute query with pagination
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

      // Transform Decimal/BigInt fields to serializable types
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

  /**
   * Get a single target by ID
   */
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
            include: { contact: true },
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

      // Transform Decimal/BigInt fields to serializable types
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

  /**
   * Create a new target
   */
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

  /**
   * Update a target
   */
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
      const stageMappingUpdate: Record<string, 'SOURCING' | 'SCREENING' | 'PRELIMINARY_DD' | 'FULL_DD' | 'NEGOTIATION' | 'DOCUMENTATION' | 'CLOSING'> = {
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
      if (input.data.stage !== undefined) { updateData.stage = input.data.stage ? stageMappingUpdate[input.data.stage] ?? null : null; }
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

  /**
   * Soft delete a target
   */
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

  /**
   * Update target status with date tracking
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: TargetStatusSchema,
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

      // Build update data with relevant date fields
      const updateData: Record<string, unknown> = { status: input.status };

      switch (input.status) {
        case 'NDA_SIGNED':
          updateData['ndaDate'] = new Date();
          updateData['ndaSignedDate'] = new Date();
          break;
        case 'LOI':
          updateData['loiDate'] = new Date();
          updateData['loiSignedDate'] = new Date();
          break;
        case 'DEFINITIVE':
          updateData['daDate'] = new Date();
          updateData['daSignedDate'] = new Date();
          break;
        case 'CLOSED':
          updateData['actualCloseDate'] = new Date();
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
   * Update target priority
   */
  updatePriority: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      priority: z.number().int().min(1).max(5),
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

      const updated = await ctx.db.target.update({
        where: { id: input.id },
        data: { priority: input.priority },
        include: { spac: true },
      });

      return updated;
    }),
});
