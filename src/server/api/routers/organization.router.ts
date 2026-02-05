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
  // Sprint 12 - Target Company financial filters
  revenueMin: z.number().positive().optional(),
  revenueMax: z.number().positive().optional(),
  ebitdaMin: z.number().positive().optional(),
  ebitdaMax: z.number().positive().optional(),
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

  // Sprint 12 - Target Company Financial Metrics
  revenue: z.number().positive().optional().nullable(),
  ebitda: z.number().optional().nullable(), // Can be negative
  revenueGrowth: z.number().min(-100).max(1000).optional().nullable(), // Percentage
  grossMargin: z.number().min(0).max(100).optional().nullable(), // Percentage
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
        // Sprint 12 - Target Company filters
        revenueMin,
        revenueMax,
        ebitdaMin,
        ebitdaMax,
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

      // Sprint 12 - Filter by revenue range (for target companies)
      if (revenueMin !== undefined || revenueMax !== undefined) {
        where.revenue = {
          ...(revenueMin !== undefined && { gte: revenueMin }),
          ...(revenueMax !== undefined && { lte: revenueMax }),
        };
      }

      // Sprint 12 - Filter by EBITDA range (for target companies)
      if (ebitdaMin !== undefined || ebitdaMax !== undefined) {
        where.ebitda = {
          ...(ebitdaMin !== undefined && { gte: ebitdaMin }),
          ...(ebitdaMax !== undefined && { lte: ebitdaMax }),
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
        // Sprint 12 - Target Company financial metrics
        revenue: org.revenue ? Number(org.revenue) : null,
        ebitda: org.ebitda ? Number(org.ebitda) : null,
        revenueGrowth: org.revenueGrowth ? Number(org.revenueGrowth) : null,
        grossMargin: org.grossMargin ? Number(org.grossMargin) : null,
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
        // Sprint 12 - Target Company financial metrics
        revenue: organization.revenue ? Number(organization.revenue) : null,
        ebitda: organization.ebitda ? Number(organization.ebitda) : null,
        revenueGrowth: organization.revenueGrowth ? Number(organization.revenueGrowth) : null,
        grossMargin: organization.grossMargin ? Number(organization.grossMargin) : null,
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
          // Sprint 12 - Target Company financial metrics
          revenue: input.revenue,
          ebitda: input.ebitda,
          revenueGrowth: input.revenueGrowth,
          grossMargin: input.grossMargin,
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
        // Sprint 12 - Target Company financial metrics
        revenue: organization.revenue ? Number(organization.revenue) : null,
        ebitda: organization.ebitda ? Number(organization.ebitda) : null,
        revenueGrowth: organization.revenueGrowth ? Number(organization.revenueGrowth) : null,
        grossMargin: organization.grossMargin ? Number(organization.grossMargin) : null,
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
        // Sprint 12 - Target Company financial metrics
        revenue: organization.revenue ? Number(organization.revenue) : null,
        ebitda: organization.ebitda ? Number(organization.ebitda) : null,
        revenueGrowth: organization.revenueGrowth ? Number(organization.revenueGrowth) : null,
        grossMargin: organization.grossMargin ? Number(organization.grossMargin) : null,
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
        // Sprint 12 - Target Company financial metrics
        revenue: org.revenue ? Number(org.revenue) : null,
        ebitda: org.ebitda ? Number(org.ebitda) : null,
        revenueGrowth: org.revenueGrowth ? Number(org.revenueGrowth) : null,
        grossMargin: org.grossMargin ? Number(org.grossMargin) : null,
      }));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  // ============================================================================
  // SPRINT 12 - TARGET COMPANY OPERATIONS
  // ============================================================================

  /**
   * List Target Companies only - shortcut for listing target companies
   */
  listTargetCompanies: protectedProcedure
    .input(
      z.object({
        revenueMin: z.number().positive().optional(),
        revenueMax: z.number().positive().optional(),
        ebitdaMin: z.number().optional(),
        ebitdaMax: z.number().optional(),
        industryFocus: z.array(z.string()).optional(),
        geographyFocus: z.array(z.string()).optional(),
        search: z.string().optional(),
        ...PaginationSchema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        revenueMin,
        revenueMax,
        ebitdaMin,
        ebitdaMax,
        industryFocus,
        geographyFocus,
        search,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.OrganizationWhereInput = {
        type: 'TARGET_COMPANY',
        deletedAt: null,
      };

      // Filter by revenue range
      if (revenueMin !== undefined || revenueMax !== undefined) {
        where.revenue = {
          ...(revenueMin !== undefined && { gte: revenueMin }),
          ...(revenueMax !== undefined && { lte: revenueMax }),
        };
      }

      // Filter by EBITDA range
      if (ebitdaMin !== undefined || ebitdaMax !== undefined) {
        where.ebitda = {
          ...(ebitdaMin !== undefined && { gte: ebitdaMin }),
          ...(ebitdaMax !== undefined && { lte: ebitdaMax }),
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
                ownedByStakes: true,
                targets: true,
              },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : [{ revenue: 'desc' }, { name: 'asc' }],
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
        revenue: org.revenue ? Number(org.revenue) : null,
        ebitda: org.ebitda ? Number(org.ebitda) : null,
        revenueGrowth: org.revenueGrowth ? Number(org.revenueGrowth) : null,
        grossMargin: org.grossMargin ? Number(org.grossMargin) : null,
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
   * Calculate fit score for a target company against a SPAC's criteria
   */
  calculateFitScore: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        spacId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, spacId } = input;

      // Fetch the target organization
      const organization = await ctx.db.organization.findUnique({
        where: { id: organizationId },
        include: {
          ownedByStakes: {
            include: {
              owner: { select: { id: true, name: true, type: true } },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target company not found',
        });
      }

      if (organization.type !== 'TARGET_COMPANY') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization is not a target company',
        });
      }

      // Fetch the SPAC's criteria
      const spac = await ctx.db.spac.findUnique({
        where: { id: spacId },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      // Calculate fit scores based on criteria matching
      const revenue = organization.revenue ? Number(organization.revenue) : 0;
      const ebitda = organization.ebitda ? Number(organization.ebitda) : 0;
      const trustAmount = spac.trustAmount ? Number(spac.trustAmount) : 0;

      // Size score: How well does the target's size match the SPAC's capital?
      // Target EV should typically be 3-5x trust amount
      let sizeScore = 50; // Default
      if (revenue > 0 && trustAmount > 0) {
        const targetEV = revenue * 3; // Rough EV estimate
        const ratio = targetEV / trustAmount;
        if (ratio >= 2 && ratio <= 6) {
          sizeScore = 90; // Good fit
        } else if (ratio >= 1 && ratio <= 8) {
          sizeScore = 70; // Acceptable
        } else {
          sizeScore = 30; // Poor fit
        }
      }

      // Sector score: Industry alignment
      let sectorScore = 50;
      if (spac.targetSectors.length > 0 && organization.industryFocus.length > 0) {
        const overlap = spac.targetSectors.filter((s) =>
          organization.industryFocus.some((i) => i.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(i.toLowerCase()))
        );
        sectorScore = overlap.length > 0 ? 90 : 30;
      }

      // Geography score
      let geographyScore = 50;
      if (spac.targetGeographies.length > 0 && organization.geographyFocus.length > 0) {
        const overlap = spac.targetGeographies.filter((g) =>
          organization.geographyFocus.some((og) => og.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(og.toLowerCase()))
        );
        geographyScore = overlap.length > 0 ? 90 : 30;
      } else if (organization.headquarters) {
        // Use headquarters as geography proxy
        geographyScore = 60;
      }

      // Ownership score: Cleaner ownership = higher score
      let ownershipScore = 70; // Default for unclear
      const totalOwnership = organization.ownedByStakes.reduce(
        (sum, stake) => sum + (stake.ownershipPct ? Number(stake.ownershipPct) : 0),
        0
      );
      if (totalOwnership > 0) {
        // PE-backed targets typically easier to transact
        const peBackedCount = organization.ownedByStakes.filter((s) => s.owner.type === 'PE_FIRM').length;
        if (peBackedCount > 0) {
          ownershipScore = 85; // PE-backed is good
        } else if (totalOwnership > 90) {
          ownershipScore = 80; // Clear majority ownership
        } else if (totalOwnership > 50) {
          ownershipScore = 60; // Fragmented
        } else {
          ownershipScore = 50; // Unclear
        }
      }

      // Overall score (weighted average)
      const overallScore = Math.round(
        sizeScore * 0.3 + sectorScore * 0.3 + geographyScore * 0.2 + ownershipScore * 0.2
      );

      // Generate AI summary (simple version - could be enhanced with Claude API)
      const aiSummary = `Target company ${organization.name} has a fit score of ${overallScore}/100 for ${spac.name || spac.ticker}. Size fit: ${sizeScore >= 70 ? 'Good' : 'Moderate'}. Sector alignment: ${sectorScore >= 70 ? 'Strong' : 'Limited'}. Geography match: ${geographyScore >= 70 ? 'Yes' : 'Partial'}. Ownership clarity: ${ownershipScore >= 70 ? 'Clear' : 'Complex'}.`;

      const aiRecommendation =
        overallScore >= 75
          ? 'Strong fit - recommend prioritizing this opportunity.'
          : overallScore >= 50
            ? 'Moderate fit - worth exploring with due diligence on weak areas.'
            : 'Limited fit - consider only if strategic rationale is compelling.';

      // Upsert the fit score
      const fitScore = await ctx.db.targetFitScore.upsert({
        where: {
          organizationId_spacId: { organizationId, spacId },
        },
        create: {
          organizationId,
          spacId,
          overallScore,
          sizeScore,
          sectorScore,
          geographyScore,
          ownershipScore,
          aiSummary,
          aiRecommendation,
          calculatedBy: ctx.user?.id || 'system',
        },
        update: {
          overallScore,
          sizeScore,
          sectorScore,
          geographyScore,
          ownershipScore,
          aiSummary,
          aiRecommendation,
          calculatedAt: new Date(),
          calculatedBy: ctx.user?.id || 'system',
        },
      });

      return fitScore;
    }),

  /**
   * Get fit score for a target company against a SPAC
   */
  getFitScore: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        spacId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const fitScore = await ctx.db.targetFitScore.findUnique({
        where: {
          organizationId_spacId: {
            organizationId: input.organizationId,
            spacId: input.spacId,
          },
        },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
      });

      return fitScore;
    }),

  /**
   * List all fit scores for a target company
   */
  listFitScores: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fitScores = await ctx.db.targetFitScore.findMany({
        where: { organizationId: input.organizationId },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: { overallScore: 'desc' },
      });

      return fitScores;
    }),
});
