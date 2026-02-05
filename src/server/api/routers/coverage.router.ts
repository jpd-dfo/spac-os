/**
 * SPAC OS - Coverage Router
 * Manages IB (Investment Bank) sector/industry coverage and expertise tracking
 * Sprint 11 - IB Firm Management
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema } from '@/schemas';

import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const CoverageExpertiseSchema = z.enum([
  'LEADING',
  'STRONG',
  'MODERATE',
  'EMERGING',
]);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const CoverageCreateSchema = z.object({
  organizationId: UuidSchema,
  sector: z.string().min(1).max(100),
  subSector: z.string().max(100).optional().nullable(),
  geography: z.string().max(100).optional().nullable(),
  expertise: CoverageExpertiseSchema.default('MODERATE'),
  notes: z.string().optional().nullable(),
});

const CoverageUpdateSchema = z.object({
  expertise: CoverageExpertiseSchema.optional(),
  notes: z.string().optional().nullable(),
});

// ============================================================================
// COVERAGE ROUTER
// ============================================================================

export const coverageRouter = createTRPCRouter({
  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  /**
   * Get coverage areas for a specific IB organization
   */
  listByOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: UuidSchema,
        sector: z.string().optional(),
        expertise: CoverageExpertiseSchema.optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { organizationId, sector, expertise, limit } = input;

      // Verify organization exists and is type IB
      const organization = await ctx.db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, type: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      if (organization.type !== 'IB') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Coverage areas can only be listed for Investment Bank (IB) organizations',
        });
      }

      const coverageAreas = await ctx.db.iBCoverage.findMany({
        where: {
          organizationId,
          ...(sector && { sector }),
          ...(expertise && { expertise }),
        },
        include: {
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { sector: 'asc' },
          { subSector: 'asc' },
          { geography: 'asc' },
        ],
        take: limit,
      });

      return {
        organization,
        coverageAreas,
        total: coverageAreas.length,
      };
    }),

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new coverage area
   */
  create: protectedProcedure
    .input(CoverageCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, sector, subSector, geography, expertise, notes } = input;

      // Verify organization exists and is type IB
      const organization = await ctx.db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, type: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      if (organization.type !== 'IB') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Coverage areas can only be created for Investment Bank (IB) organizations',
        });
      }

      // Check for unique constraint violation
      const existingCoverage = await ctx.db.iBCoverage.findUnique({
        where: {
          organizationId_sector_subSector_geography: {
            organizationId,
            sector,
            subSector: subSector ?? '',
            geography: geography ?? '',
          },
        },
      });

      if (existingCoverage) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A coverage area with this sector, sub-sector, and geography combination already exists for this organization',
        });
      }

      const coverage = await ctx.db.iBCoverage.create({
        data: {
          organizationId,
          sector,
          subSector,
          geography,
          expertise,
          notes,
        },
        include: {
          organization: {
            select: { id: true, name: true, type: true },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
      });

      return coverage;
    }),

  /**
   * Update coverage expertise level and notes
   */
  update: protectedProcedure
    .input(
      z.object({
        id: UuidSchema,
        data: CoverageUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify coverage exists
      const existing = await ctx.db.iBCoverage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Coverage area not found',
        });
      }

      const coverage = await ctx.db.iBCoverage.update({
        where: { id },
        data: {
          expertise: data.expertise,
          notes: data.notes,
        },
        include: {
          organization: {
            select: { id: true, name: true, type: true },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
      });

      return coverage;
    }),

  /**
   * Delete a coverage area
   */
  delete: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.iBCoverage.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Coverage area not found',
        });
      }

      await ctx.db.iBCoverage.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  /**
   * Assign a contact to a coverage area
   */
  assignContact: protectedProcedure
    .input(
      z.object({
        coverageId: UuidSchema,
        contactId: UuidSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { coverageId, contactId } = input;

      // Verify coverage exists
      const coverage = await ctx.db.iBCoverage.findUnique({
        where: { id: coverageId },
        include: {
          contacts: {
            select: { id: true },
          },
        },
      });

      if (!coverage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Coverage area not found',
        });
      }

      // Verify contact exists
      const contact = await ctx.db.contact.findUnique({
        where: { id: contactId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Check if contact is already assigned
      const isAlreadyAssigned = coverage.contacts.some((c) => c.id === contactId);
      if (isAlreadyAssigned) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Contact is already assigned to this coverage area',
        });
      }

      const updatedCoverage = await ctx.db.iBCoverage.update({
        where: { id: coverageId },
        data: {
          contacts: {
            connect: { id: contactId },
          },
        },
        include: {
          organization: {
            select: { id: true, name: true, type: true },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
      });

      return updatedCoverage;
    }),

  /**
   * Remove a contact from a coverage area
   */
  removeContact: protectedProcedure
    .input(
      z.object({
        coverageId: UuidSchema,
        contactId: UuidSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { coverageId, contactId } = input;

      // Verify coverage exists
      const coverage = await ctx.db.iBCoverage.findUnique({
        where: { id: coverageId },
        include: {
          contacts: {
            select: { id: true },
          },
        },
      });

      if (!coverage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Coverage area not found',
        });
      }

      // Verify contact exists
      const contact = await ctx.db.contact.findUnique({
        where: { id: contactId },
        select: { id: true },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Check if contact is assigned to this coverage
      const isAssigned = coverage.contacts.some((c) => c.id === contactId);
      if (!isAssigned) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Contact is not assigned to this coverage area',
        });
      }

      const updatedCoverage = await ctx.db.iBCoverage.update({
        where: { id: coverageId },
        data: {
          contacts: {
            disconnect: { id: contactId },
          },
        },
        include: {
          organization: {
            select: { id: true, name: true, type: true },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
      });

      return updatedCoverage;
    }),
});
