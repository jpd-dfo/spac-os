/**
 * SPAC OS - Company Router
 * Full CRUD operations for CRM companies (Sprint 8)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema, PaginationSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

import { Prisma } from '@prisma/client';

// ============================================================================
// SCHEMAS
// ============================================================================

const CompanyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.string().max(100).optional().nullable(), // "Investment Bank", "Law Firm", "Target", etc.
  size: z.string().max(50).optional().nullable(), // "1-50", "51-200", etc.
  headquarters: z.string().max(255).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

const CompanyUpdateSchema = CompanyCreateSchema.partial();

const CompanyFilterSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  type: z.string().optional(),
  size: z.string().optional(),
  ...PaginationSchema.shape,
});

const CompanyDealCreateSchema = z.object({
  companyId: UuidSchema,
  dealName: z.string().min(1).max(255),
  role: z.string().min(1).max(100), // "Lead Advisor", "Co-Counsel", etc.
  status: z.string().min(1).max(50), // "Won", "Lost", "In Progress"
  value: z.number().positive().optional().nullable(),
  closedAt: z.coerce.date().optional().nullable(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const companyRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * List companies with pagination, search, and filters
   */
  list: protectedProcedure
    .input(CompanyFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        industry,
        type,
        size,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.CompanyWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { headquarters: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (industry) {
        where.industry = { contains: industry, mode: 'insensitive' };
      }

      if (type) {
        where.type = { contains: type, mode: 'insensitive' };
      }

      if (size) {
        where.size = size;
      }

      const [items, total] = await Promise.all([
        ctx.db.company.findMany({
          where,
          include: {
            _count: {
              select: { contacts: true, deals: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.company.count({ where }),
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
   * Get single company by ID with contacts and deals
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUnique({
        where: { id: input.id },
        include: {
          contacts: {
            orderBy: { lastName: 'asc' },
          },
          deals: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { contacts: true, deals: true },
          },
        },
      });

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }

      // Serialize Decimal fields in deals
      return {
        ...company,
        deals: company.deals.map((deal) => ({
          ...deal,
          value: deal.value ? Number(deal.value) : null,
        })),
      };
    }),

  /**
   * Create a new company
   */
  create: orgAuditedProcedure
    .input(CompanyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.create({
        data: {
          name: input.name,
          industry: input.industry,
          website: input.website,
          description: input.description,
          type: input.type,
          size: input.size,
          headquarters: input.headquarters,
          foundedYear: input.foundedYear,
          logoUrl: input.logoUrl,
        },
        include: {
          _count: {
            select: { contacts: true, deals: true },
          },
        },
      });

      return company;
    }),

  /**
   * Update an existing company
   */
  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: CompanyUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.company.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }

      const company = await ctx.db.company.update({
        where: { id: input.id },
        data: input.data,
        include: {
          contacts: true,
          deals: true,
          _count: {
            select: { contacts: true, deals: true },
          },
        },
      });

      // Serialize Decimal fields in deals
      return {
        ...company,
        deals: company.deals.map((deal) => ({
          ...deal,
          value: deal.value ? Number(deal.value) : null,
        })),
      };
    }),

  /**
   * Delete a company (optionally cascade to contacts)
   */
  delete: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      cascadeContacts: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.company.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { contacts: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }

      // If not cascading and there are contacts, prevent deletion
      if (!input.cascadeContacts && existing._count.contacts > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot delete company with ${existing._count.contacts} associated contacts. Set cascadeContacts to true to delete anyway.`,
        });
      }

      // Use transaction for cascading delete
      if (input.cascadeContacts) {
        await ctx.db.$transaction([
          // Disconnect contacts from company (set companyId to null)
          ctx.db.contact.updateMany({
            where: { companyId: input.id },
            data: { companyId: null },
          }),
          // Delete deals (will cascade automatically due to onDelete: Cascade)
          ctx.db.companyDeal.deleteMany({
            where: { companyId: input.id },
          }),
          // Delete company
          ctx.db.company.delete({
            where: { id: input.id },
          }),
        ]);
      } else {
        // Delete deals and company
        await ctx.db.$transaction([
          ctx.db.companyDeal.deleteMany({
            where: { companyId: input.id },
          }),
          ctx.db.company.delete({
            where: { id: input.id },
          }),
        ]);
      }

      return { success: true };
    }),

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search companies by name (typeahead)
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const companies = await ctx.db.company.findMany({
        where: {
          name: { contains: input.query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          industry: true,
          type: true,
          logoUrl: true,
          _count: {
            select: { contacts: true },
          },
        },
        orderBy: { name: 'asc' },
        take: input.limit,
      });

      return companies;
    }),

  // ============================================================================
  // DEAL HISTORY
  // ============================================================================

  /**
   * Get company deal history
   */
  getDeals: protectedProcedure
    .input(z.object({
      companyId: UuidSchema,
      status: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { companyId, status, page, pageSize } = input;

      // Verify company exists
      const company = await ctx.db.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true },
      });

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }

      const where: Prisma.CompanyDealWhereInput = {
        companyId,
      };

      if (status) {
        where.status = status;
      }

      const [rawDeals, total] = await Promise.all([
        ctx.db.companyDeal.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.companyDeal.count({ where }),
      ]);

      // Serialize Decimal fields
      const deals = rawDeals.map((deal) => ({
        ...deal,
        value: deal.value ? Number(deal.value) : null,
      }));

      // Calculate statistics
      const allDeals = await ctx.db.companyDeal.findMany({
        where: { companyId },
        select: { status: true, value: true },
      });

      const stats = {
        totalDeals: allDeals.length,
        wonDeals: allDeals.filter((d) => d.status === 'Won').length,
        lostDeals: allDeals.filter((d) => d.status === 'Lost').length,
        inProgressDeals: allDeals.filter((d) => d.status === 'In Progress').length,
        totalValue: allDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
        wonValue: allDeals
          .filter((d) => d.status === 'Won')
          .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
      };

      return {
        company,
        deals,
        stats,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Add a deal to company history
   */
  addDeal: orgAuditedProcedure
    .input(CompanyDealCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify company exists
      const company = await ctx.db.company.findUnique({
        where: { id: input.companyId },
      });

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }

      const deal = await ctx.db.companyDeal.create({
        data: {
          companyId: input.companyId,
          dealName: input.dealName,
          role: input.role,
          status: input.status,
          value: input.value,
          closedAt: input.closedAt,
        },
      });

      return {
        ...deal,
        value: deal.value ? Number(deal.value) : null,
      };
    }),

  /**
   * Update a company deal
   */
  updateDeal: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: z.object({
        dealName: z.string().min(1).max(255).optional(),
        role: z.string().min(1).max(100).optional(),
        status: z.string().min(1).max(50).optional(),
        value: z.number().positive().optional().nullable(),
        closedAt: z.coerce.date().optional().nullable(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.companyDeal.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      const deal = await ctx.db.companyDeal.update({
        where: { id: input.id },
        data: input.data,
      });

      return {
        ...deal,
        value: deal.value ? Number(deal.value) : null,
      };
    }),

  /**
   * Delete a company deal
   */
  deleteDeal: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.companyDeal.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      await ctx.db.companyDeal.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get company statistics overview
   */
  getStatistics: protectedProcedure
    .input(z.object({
      industry: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.CompanyWhereInput = {};

      if (input.industry) {
        where.industry = { contains: input.industry, mode: 'insensitive' };
      }

      if (input.type) {
        where.type = { contains: input.type, mode: 'insensitive' };
      }

      const [
        total,
        byIndustry,
        byType,
        bySize,
        recentCompanies,
      ] = await Promise.all([
        ctx.db.company.count({ where }),
        ctx.db.company.groupBy({
          by: ['industry'],
          where: { ...where, industry: { not: null } },
          _count: true,
          orderBy: { _count: { industry: 'desc' } },
          take: 10,
        }),
        ctx.db.company.groupBy({
          by: ['type'],
          where: { ...where, type: { not: null } },
          _count: true,
          orderBy: { _count: { type: 'desc' } },
          take: 10,
        }),
        ctx.db.company.groupBy({
          by: ['size'],
          where: { ...where, size: { not: null } },
          _count: true,
          orderBy: { _count: { size: 'desc' } },
        }),
        ctx.db.company.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            industry: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        total,
        byIndustry: byIndustry
          .filter((i) => i.industry)
          .map((i) => ({ industry: i.industry, count: i._count })),
        byType: byType
          .filter((t) => t.type)
          .map((t) => ({ type: t.type, count: t._count })),
        bySize: bySize
          .filter((s) => s.size)
          .map((s) => ({ size: s.size, count: s._count })),
        recentCompanies,
      };
    }),
});
