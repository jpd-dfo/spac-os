/**
 * SPAC OS - Target Router
 * Full CRUD operations for acquisition targets with status management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
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
        where.priority = {};
        if (priorityMin !== undefined) (where.priority as Record<string, unknown>).gte = priorityMin;
        if (priorityMax !== undefined) (where.priority as Record<string, unknown>).lte = priorityMax;
      }

      if (evMin !== undefined || evMax !== undefined) {
        where.enterpriseValue = {};
        if (evMin !== undefined) (where.enterpriseValue as Record<string, unknown>).gte = evMin;
        if (evMax !== undefined) (where.enterpriseValue as Record<string, unknown>).lte = evMax;
      }

      // Execute query with pagination
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

      return target;
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
});
