/**
 * SPAC OS - Mandate Router
 * Manages IB (Investment Bank) mandates for tracking which IBs have mandates to sell/advise companies
 * Sprint 11 - IB Firm Management
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema } from '@/schemas';

import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const MandateServiceTypeSchema = z.enum([
  'MA_SELLSIDE',
  'MA_BUYSIDE',
  'CAPITAL_RAISE',
  'RESTRUCTURING',
  'FAIRNESS_OPINION',
  'SPAC_ADVISORY',
  'OTHER',
]);

const MandateStatusSchema = z.enum([
  'ACTIVE',
  'WON',
  'LOST',
  'COMPLETED',
  'ON_HOLD',
]);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const MandateCreateSchema = z.object({
  organizationId: UuidSchema,
  clientName: z.string().min(1).max(255),
  serviceType: MandateServiceTypeSchema,
  status: MandateStatusSchema.default('ACTIVE'),
  dealValue: z.number().positive().optional().nullable(),
  expectedFee: z.number().positive().optional().nullable(),
  mandateDate: z.coerce.date().optional().nullable(),
  expectedCloseDate: z.coerce.date().optional().nullable(),
  actualCloseDate: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  contactIds: z.array(UuidSchema).default([]),
});

const MandateUpdateSchema = MandateCreateSchema.partial().omit({
  organizationId: true,
});

const MandateFilterSchema = z.object({
  status: MandateStatusSchema.optional(),
  serviceType: MandateServiceTypeSchema.optional(),
  organizationId: UuidSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform Decimal fields to numbers for JSON serialization
 */
function transformMandateDecimals<T extends { dealValue: unknown; expectedFee: unknown }>(
  mandate: T
): Omit<T, 'dealValue' | 'expectedFee'> & { dealValue: number | null; expectedFee: number | null } {
  return {
    ...mandate,
    dealValue: mandate.dealValue ? Number(mandate.dealValue) : null,
    expectedFee: mandate.expectedFee ? Number(mandate.expectedFee) : null,
  };
}

// ============================================================================
// MANDATE ROUTER
// ============================================================================

export const mandateRouter = createTRPCRouter({
  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  /**
   * List all mandates with optional filters and pagination
   */
  list: protectedProcedure
    .input(MandateFilterSchema)
    .query(async ({ ctx, input }) => {
      const { status, serviceType, organizationId, limit, cursor } = input;

      const where: Prisma.IBMandateWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (serviceType) {
        where.serviceType = serviceType;
      }

      if (organizationId) {
        where.organizationId = organizationId;
      }

      // Cursor-based pagination
      const cursorObj = cursor ? { id: cursor } : undefined;

      const rawMandates = await ctx.db.iBMandate.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              subType: true,
              logoUrl: true,
            },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: limit + 1,
        cursor: cursorObj,
        skip: cursor ? 1 : 0,
      });

      // Determine if there are more results
      let nextCursor: string | undefined;
      if (rawMandates.length > limit) {
        const nextItem = rawMandates.pop();
        nextCursor = nextItem?.id;
      }

      // Transform Decimal fields
      const mandates = rawMandates.map(transformMandateDecimals);

      return {
        items: mandates,
        nextCursor,
        hasMore: !!nextCursor,
      };
    }),

  /**
   * List mandates for a specific IB organization with pagination
   */
  listByOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: UuidSchema,
        status: MandateStatusSchema.optional(),
        serviceType: MandateServiceTypeSchema.optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { organizationId, status, serviceType, limit, cursor } = input;

      // Verify organization exists and is an IB
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
          message: 'Organization must be of type IB to have mandates',
        });
      }

      const where: Prisma.IBMandateWhereInput = {
        organizationId,
      };

      if (status) {
        where.status = status;
      }

      if (serviceType) {
        where.serviceType = serviceType;
      }

      // Cursor-based pagination
      const cursorObj = cursor ? { id: cursor } : undefined;

      const rawMandates = await ctx.db.iBMandate.findMany({
        where,
        include: {
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // ACTIVE first
          { mandateDate: 'desc' },
        ],
        take: limit + 1,
        cursor: cursorObj,
        skip: cursor ? 1 : 0,
      });

      // Determine if there are more results
      let nextCursor: string | undefined;
      if (rawMandates.length > limit) {
        const nextItem = rawMandates.pop();
        nextCursor = nextItem?.id;
      }

      // Transform Decimal fields
      const mandates = rawMandates.map(transformMandateDecimals);

      return {
        organization,
        items: mandates,
        nextCursor,
        hasMore: !!nextCursor,
        total: mandates.length,
      };
    }),

  // ============================================================================
  // READ OPERATIONS
  // ============================================================================

  /**
   * Get a single mandate by ID with contacts included
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const rawMandate = await ctx.db.iBMandate.findUnique({
        where: { id: input.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              subType: true,
              website: true,
              logoUrl: true,
              headquarters: true,
            },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!rawMandate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Mandate not found',
        });
      }

      return transformMandateDecimals(rawMandate);
    }),

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  /**
   * Create a new mandate (validates organization exists and is type IB)
   */
  create: protectedProcedure
    .input(MandateCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, contactIds, ...mandateData } = input;

      // Verify organization exists and is an IB
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
          message: 'Mandates can only be created for IB (Investment Bank) organizations',
        });
      }

      // Verify all contact IDs exist if provided
      if (contactIds.length > 0) {
        const contacts = await ctx.db.contact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true },
        });

        if (contacts.length !== contactIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'One or more contact IDs are invalid',
          });
        }
      }

      const rawMandate = await ctx.db.iBMandate.create({
        data: {
          organizationId,
          clientName: mandateData.clientName,
          serviceType: mandateData.serviceType,
          status: mandateData.status,
          dealValue: mandateData.dealValue,
          expectedFee: mandateData.expectedFee,
          mandateDate: mandateData.mandateDate,
          expectedCloseDate: mandateData.expectedCloseDate,
          actualCloseDate: mandateData.actualCloseDate,
          description: mandateData.description,
          notes: mandateData.notes,
          contacts: contactIds.length > 0
            ? { connect: contactIds.map((id) => ({ id })) }
            : undefined,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
        },
      });

      return transformMandateDecimals(rawMandate);
    }),

  // ============================================================================
  // UPDATE OPERATIONS
  // ============================================================================

  /**
   * Update mandate details/status
   */
  update: protectedProcedure
    .input(
      z.object({
        id: UuidSchema,
        data: MandateUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify mandate exists
      const existing = await ctx.db.iBMandate.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Mandate not found',
        });
      }

      // Verify all contact IDs exist if provided
      if (data.contactIds && data.contactIds.length > 0) {
        const contacts = await ctx.db.contact.findMany({
          where: { id: { in: data.contactIds } },
          select: { id: true },
        });

        if (contacts.length !== data.contactIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'One or more contact IDs are invalid',
          });
        }
      }

      // Extract contactIds from data for special handling
      const { contactIds, ...updateData } = data;

      const rawMandate = await ctx.db.iBMandate.update({
        where: { id },
        data: {
          ...updateData,
          // Handle contacts: set to provided IDs if specified
          ...(contactIds !== undefined && {
            contacts: {
              set: contactIds.map((cId) => ({ id: cId })),
            },
          }),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
        },
      });

      return transformMandateDecimals(rawMandate);
    }),

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  /**
   * Delete a mandate
   */
  delete: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.iBMandate.findUnique({
        where: { id: input.id },
        select: { id: true, clientName: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Mandate not found',
        });
      }

      await ctx.db.iBMandate.delete({
        where: { id: input.id },
      });

      return { success: true, deletedId: input.id };
    }),
});
