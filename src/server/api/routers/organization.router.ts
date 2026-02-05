/**
 * SPAC OS - Organization Router
 * Manages PE Firms, IBs, and other organizations in the SPAC ecosystem
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema, PaginationSchema } from '@/schemas';

import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const OrganizationTypeSchema = z.enum([
  'PE_FIRM',
  'IB',
  'TARGET_COMPANY',
  'SERVICE_PROVIDER',
  'LAW_FIRM',
  'ACCOUNTING_FIRM',
  'OTHER',
]);

const OrganizationSubTypeSchema = z.enum([
  // PE sub-types
  'BUYOUT',
  'GROWTH_EQUITY',
  'VENTURE_CAPITAL',
  'FAMILY_OFFICE',
  'SOVEREIGN_WEALTH',
  'HEDGE_FUND',
  // IB sub-types
  'BULGE_BRACKET',
  'MIDDLE_MARKET',
  'BOUTIQUE',
  'REGIONAL',
]);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const OrganizationFilterSchema = z.object({
  type: OrganizationTypeSchema.optional(),
  subType: OrganizationSubTypeSchema.optional(),
  aumMin: z.number().positive().optional(),
  aumMax: z.number().positive().optional(),
  industryFocus: z.array(z.string()).optional(),
  geographyFocus: z.array(z.string()).optional(),
  search: z.string().optional(),
  includeDeleted: z.boolean().default(false),
  ...PaginationSchema.shape,
});

const OrganizationCreateSchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional().nullable(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  type: OrganizationTypeSchema.default('OTHER'),
  subType: OrganizationSubTypeSchema.optional().nullable(),

  // PE-specific fields
  aum: z.number().positive().optional().nullable(),
  fundVintage: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  industryFocus: z.array(z.string()).default([]),
  geographyFocus: z.array(z.string()).default([]),
  dealSizeMin: z.number().positive().optional().nullable(),
  dealSizeMax: z.number().positive().optional().nullable(),

  // General fields
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  headquarters: z.string().max(255).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  employeeCount: z.number().int().positive().optional().nullable(),
});

const OrganizationUpdateSchema = OrganizationCreateSchema.partial();

const OrganizationIncludeSchema = z.object({
  contacts: z.boolean().default(false),
  ownedStakes: z.boolean().default(false),
  ownedByStakes: z.boolean().default(false),
  activities: z.boolean().default(false),
});

// ============================================================================
// ORGANIZATION ROUTER
// ============================================================================

export const organizationRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * List organizations with filters and pagination
   */
  list: protectedProcedure
    .input(OrganizationFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        type,
        subType,
        aumMin,
        aumMax,
        industryFocus,
        geographyFocus,
        search,
        includeDeleted,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.OrganizationWhereInput = {};

      // Only include non-deleted by default
      if (!includeDeleted) {
        where.deletedAt = null;
      }

      // Filter by type
      if (type) {
        where.type = type;
      }

      // Filter by subType
      if (subType) {
        where.subType = subType;
      }

      // Filter by AUM range
      if (aumMin !== undefined || aumMax !== undefined) {
        where.aum = {
          ...(aumMin !== undefined && { gte: aumMin }),
          ...(aumMax !== undefined && { lte: aumMax }),
        };
      }

      // Filter by industry focus (any match)
      if (industryFocus?.length) {
        where.industryFocus = { hasSome: industryFocus };
      }

      // Filter by geography focus (any match)
      if (geographyFocus?.length) {
        where.geographyFocus = { hasSome: geographyFocus };
      }

      // Search across multiple fields
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { headquarters: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [rawItems, total] = await Promise.all([
        ctx.db.organization.findMany({
          where,
          include: {
            _count: {
              select: {
                contacts: true,
                ownedStakes: true,
                ownedByStakes: true,
                spacs: true,
              },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.organization.count({ where }),
      ]);

      // Transform Decimal fields to serializable types
      const items = rawItems.map((org) => ({
        ...org,
        aum: org.aum ? Number(org.aum) : null,
        dealSizeMin: org.dealSizeMin ? Number(org.dealSizeMin) : null,
        dealSizeMax: org.dealSizeMax ? Number(org.dealSizeMax) : null,
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
   * Get single organization by ID with optional includes
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: UuidSchema,
        include: OrganizationIncludeSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id, include } = input;

      const organization = await ctx.db.organization.findUnique({
        where: { id },
        include: {
          contacts: include?.contacts
            ? {
                take: 50,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  title: true,
                  type: true,
                  status: true,
                },
              }
            : false,
          ownedStakes: include?.ownedStakes
            ? {
                include: {
                  owned: {
                    select: { id: true, name: true, type: true },
                  },
                },
              }
            : false,
          ownedByStakes: include?.ownedByStakes
            ? {
                include: {
                  owner: {
                    select: { id: true, name: true, type: true },
                  },
                },
              }
            : false,
          activities: include?.activities
            ? {
                take: 20,
                orderBy: { createdAt: 'desc' },
              }
            : false,
          _count: {
            select: {
              contacts: true,
              ownedStakes: true,
              ownedByStakes: true,
              spacs: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Transform Decimal fields
      return {
        ...organization,
        aum: organization.aum ? Number(organization.aum) : null,
        dealSizeMin: organization.dealSizeMin ? Number(organization.dealSizeMin) : null,
        dealSizeMax: organization.dealSizeMax ? Number(organization.dealSizeMax) : null,
      };
    }),

  /**
   * Create a new organization
   */
  create: protectedProcedure
    .input(OrganizationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate slug
      const existingSlug = await ctx.db.organization.findUnique({
        where: { slug: input.slug },
      });

      if (existingSlug) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this slug already exists',
        });
      }

      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          legalName: input.legalName,
          slug: input.slug,
          type: input.type,
          subType: input.subType,
          aum: input.aum,
          fundVintage: input.fundVintage,
          industryFocus: input.industryFocus,
          geographyFocus: input.geographyFocus,
          dealSizeMin: input.dealSizeMin,
          dealSizeMax: input.dealSizeMax,
          website: input.website,
          description: input.description,
          headquarters: input.headquarters,
          logoUrl: input.logoUrl,
          foundedYear: input.foundedYear,
          employeeCount: input.employeeCount,
        },
        include: {
          _count: {
            select: {
              contacts: true,
              ownedStakes: true,
              ownedByStakes: true,
              spacs: true,
            },
          },
        },
      });

      // Transform Decimal fields
      return {
        ...organization,
        aum: organization.aum ? Number(organization.aum) : null,
        dealSizeMin: organization.dealSizeMin ? Number(organization.dealSizeMin) : null,
        dealSizeMax: organization.dealSizeMax ? Number(organization.dealSizeMax) : null,
      };
    }),

  /**
   * Update an existing organization
   */
  update: protectedProcedure
    .input(
      z.object({
        id: UuidSchema,
        data: OrganizationUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.organization.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Check for duplicate slug if changing
      if (input.data.slug && input.data.slug !== existing.slug) {
        const slugExists = await ctx.db.organization.findUnique({
          where: { slug: input.data.slug },
        });

        if (slugExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An organization with this slug already exists',
          });
        }
      }

      const organization = await ctx.db.organization.update({
        where: { id: input.id },
        data: input.data,
        include: {
          _count: {
            select: {
              contacts: true,
              ownedStakes: true,
              ownedByStakes: true,
              spacs: true,
            },
          },
        },
      });

      // Transform Decimal fields
      return {
        ...organization,
        aum: organization.aum ? Number(organization.aum) : null,
        dealSizeMin: organization.dealSizeMin ? Number(organization.dealSizeMin) : null,
        dealSizeMax: organization.dealSizeMax ? Number(organization.dealSizeMax) : null,
      };
    }),

  /**
   * Soft delete an organization (set deletedAt)
   */
  delete: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.organization.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      await ctx.db.organization.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  // ============================================================================
  // SPECIALIZED QUERIES
  // ============================================================================

  /**
   * List PE Firms only - shortcut for listing PE firms
   */
  listPEFirms: protectedProcedure
    .input(
      z.object({
        subType: OrganizationSubTypeSchema.optional(),
        aumMin: z.number().positive().optional(),
        aumMax: z.number().positive().optional(),
        industryFocus: z.array(z.string()).optional(),
        geographyFocus: z.array(z.string()).optional(),
        search: z.string().optional(),
        ...PaginationSchema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        subType,
        aumMin,
        aumMax,
        industryFocus,
        geographyFocus,
        search,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.OrganizationWhereInput = {
        type: 'PE_FIRM',
        deletedAt: null,
      };

      // Filter by subType
      if (subType) {
        where.subType = subType;
      }

      // Filter by AUM range
      if (aumMin !== undefined || aumMax !== undefined) {
        where.aum = {
          ...(aumMin !== undefined && { gte: aumMin }),
          ...(aumMax !== undefined && { lte: aumMax }),
        };
      }

      // Filter by industry focus (any match)
      if (industryFocus?.length) {
        where.industryFocus = { hasSome: industryFocus };
      }

      // Filter by geography focus (any match)
      if (geographyFocus?.length) {
        where.geographyFocus = { hasSome: geographyFocus };
      }

      // Search across multiple fields
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { headquarters: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [rawItems, total] = await Promise.all([
        ctx.db.organization.findMany({
          where,
          include: {
            _count: {
              select: {
                contacts: true,
                ownedStakes: true,
                spacs: true,
              },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : [{ aum: 'desc' }, { name: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.organization.count({ where }),
      ]);

      // Transform Decimal fields
      const items = rawItems.map((org) => ({
        ...org,
        aum: org.aum ? Number(org.aum) : null,
        dealSizeMin: org.dealSizeMin ? Number(org.dealSizeMin) : null,
        dealSizeMax: org.dealSizeMax ? Number(org.dealSizeMax) : null,
      }));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),
});
