/**
 * SPAC OS - Ownership Router
 * Manages ownership stakes (PE firm ownership of portfolio companies)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema } from '@/schemas';

import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const StakeTypeSchema = z.enum([
  'MAJORITY',
  'MINORITY',
  'CONTROL',
  'GROWTH_EQUITY',
  'CO_INVEST',
]);

const ExitStatusSchema = z.enum([
  'ACTIVE',
  'PARTIALLY_EXITED',
  'FULLY_EXITED',
  'WRITTEN_OFF',
]);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const OwnershipStakeCreateSchema = z.object({
  ownerId: UuidSchema,
  ownedId: UuidSchema,
  ownershipPct: z.number().min(0).max(100),
  stakeType: StakeTypeSchema,
  investmentDate: z.coerce.date().optional().nullable(),
  entryValuation: z.number().positive().optional().nullable(),
  entryMultiple: z.number().positive().optional().nullable(),
  boardSeats: z.number().int().min(0).optional().nullable(),
  exitWindow: z.coerce.date().optional().nullable(),
  estimatedHoldYears: z.number().int().min(0).optional().nullable(),
  exitStatus: ExitStatusSchema.default('ACTIVE'),
  exitDate: z.coerce.date().optional().nullable(),
  exitValuation: z.number().positive().optional().nullable(),
  exitMultiple: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const OwnershipStakeUpdateSchema = OwnershipStakeCreateSchema.partial().omit({
  ownerId: true,
  ownedId: true,
});

// ============================================================================
// OWNERSHIP ROUTER
// ============================================================================

export const ownershipRouter = createTRPCRouter({
  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  /**
   * List all portfolio companies owned by an organization (PE firm)
   * Returns ownership stakes where the specified org is the owner
   */
  listByOwner: protectedProcedure
    .input(
      z.object({
        ownerId: UuidSchema,
        exitStatus: ExitStatusSchema.optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { ownerId, exitStatus, limit } = input;

      // Verify the owner organization exists
      const owner = await ctx.db.organization.findUnique({
        where: { id: ownerId },
        select: { id: true, name: true },
      });

      if (!owner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Owner organization not found',
        });
      }

      const rawStakes = await ctx.db.ownershipStake.findMany({
        where: {
          ownerId,
          ...(exitStatus && { exitStatus }),
        },
        include: {
          owned: {
            select: {
              id: true,
              name: true,
              type: true,
              subType: true,
              headquarters: true,
              industryFocus: true,
              website: true,
              logoUrl: true,
            },
          },
        },
        orderBy: [
          { exitStatus: 'asc' }, // ACTIVE first
          { investmentDate: 'desc' },
        ],
        take: limit,
      });

      // Transform Decimal fields to numbers for serialization
      const stakes = rawStakes.map((stake) => ({
        ...stake,
        ownershipPct: Number(stake.ownershipPct),
        entryValuation: stake.entryValuation ? Number(stake.entryValuation) : null,
        entryMultiple: stake.entryMultiple ? Number(stake.entryMultiple) : null,
        exitValuation: stake.exitValuation ? Number(stake.exitValuation) : null,
        exitMultiple: stake.exitMultiple ? Number(stake.exitMultiple) : null,
      }));

      return {
        owner,
        stakes,
        total: stakes.length,
      };
    }),

  /**
   * List all owners of a company (portfolio company)
   * Returns ownership stakes where the specified org is the owned entity
   */
  listByOwned: protectedProcedure
    .input(
      z.object({
        ownedId: UuidSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const { ownedId } = input;

      // Verify the owned organization exists
      const owned = await ctx.db.organization.findUnique({
        where: { id: ownedId },
        select: { id: true, name: true, type: true },
      });

      if (!owned) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }

      const rawStakes = await ctx.db.ownershipStake.findMany({
        where: { ownedId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              type: true,
              subType: true,
              aum: true,
              headquarters: true,
              website: true,
              logoUrl: true,
            },
          },
        },
        orderBy: [
          { ownershipPct: 'desc' }, // Largest ownership first
          { investmentDate: 'asc' },
        ],
      });

      // Transform Decimal fields to numbers for serialization
      const stakes = rawStakes.map((stake) => ({
        ...stake,
        ownershipPct: Number(stake.ownershipPct),
        entryValuation: stake.entryValuation ? Number(stake.entryValuation) : null,
        entryMultiple: stake.entryMultiple ? Number(stake.entryMultiple) : null,
        exitValuation: stake.exitValuation ? Number(stake.exitValuation) : null,
        exitMultiple: stake.exitMultiple ? Number(stake.exitMultiple) : null,
        owner: {
          ...stake.owner,
          aum: stake.owner.aum ? Number(stake.owner.aum) : null,
        },
      }));

      // Calculate total ownership percentage
      const totalOwnership = stakes.reduce((sum, stake) => sum + stake.ownershipPct, 0);

      return {
        owned,
        stakes,
        total: stakes.length,
        totalOwnership,
      };
    }),

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new ownership stake
   */
  create: protectedProcedure
    .input(OwnershipStakeCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify owner organization exists
      const owner = await ctx.db.organization.findUnique({
        where: { id: input.ownerId },
        select: { id: true, name: true },
      });

      if (!owner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Owner organization not found',
        });
      }

      // Verify owned organization exists
      const owned = await ctx.db.organization.findUnique({
        where: { id: input.ownedId },
        select: { id: true, name: true },
      });

      if (!owned) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Owned company not found',
        });
      }

      // Prevent self-ownership
      if (input.ownerId === input.ownedId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'An organization cannot own itself',
        });
      }

      // Check if ownership stake already exists between these entities
      const existingStake = await ctx.db.ownershipStake.findFirst({
        where: {
          ownerId: input.ownerId,
          ownedId: input.ownedId,
        },
      });

      if (existingStake) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An ownership stake already exists between these organizations. Use update to modify it.',
        });
      }

      const stake = await ctx.db.ownershipStake.create({
        data: {
          ownerId: input.ownerId,
          ownedId: input.ownedId,
          ownershipPct: input.ownershipPct,
          stakeType: input.stakeType,
          investmentDate: input.investmentDate,
          entryValuation: input.entryValuation,
          entryMultiple: input.entryMultiple,
          boardSeats: input.boardSeats,
          exitWindow: input.exitWindow,
          estimatedHoldYears: input.estimatedHoldYears,
          exitStatus: input.exitStatus,
          exitDate: input.exitDate,
          exitValuation: input.exitValuation,
          exitMultiple: input.exitMultiple,
          notes: input.notes,
        },
        include: {
          owner: {
            select: { id: true, name: true, type: true },
          },
          owned: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      // Transform Decimal fields
      return {
        ...stake,
        ownershipPct: Number(stake.ownershipPct),
        entryValuation: stake.entryValuation ? Number(stake.entryValuation) : null,
        entryMultiple: stake.entryMultiple ? Number(stake.entryMultiple) : null,
        exitValuation: stake.exitValuation ? Number(stake.exitValuation) : null,
        exitMultiple: stake.exitMultiple ? Number(stake.exitMultiple) : null,
      };
    }),

  /**
   * Update an existing ownership stake
   */
  update: protectedProcedure
    .input(
      z.object({
        id: UuidSchema,
        data: OwnershipStakeUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify stake exists
      const existing = await ctx.db.ownershipStake.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ownership stake not found',
        });
      }

      // Validate exit status transitions
      if (data.exitStatus && data.exitStatus !== existing.exitStatus) {
        // If marking as exited, require exit date
        if (
          (data.exitStatus === 'FULLY_EXITED' || data.exitStatus === 'WRITTEN_OFF') &&
          !data.exitDate &&
          !existing.exitDate
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Exit date is required when marking stake as fully exited or written off',
          });
        }
      }

      const stake = await ctx.db.ownershipStake.update({
        where: { id },
        data: {
          ownershipPct: data.ownershipPct,
          stakeType: data.stakeType,
          investmentDate: data.investmentDate,
          entryValuation: data.entryValuation,
          entryMultiple: data.entryMultiple,
          boardSeats: data.boardSeats,
          exitWindow: data.exitWindow,
          estimatedHoldYears: data.estimatedHoldYears,
          exitStatus: data.exitStatus,
          exitDate: data.exitDate,
          exitValuation: data.exitValuation,
          exitMultiple: data.exitMultiple,
          notes: data.notes,
        },
        include: {
          owner: {
            select: { id: true, name: true, type: true },
          },
          owned: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      // Transform Decimal fields
      return {
        ...stake,
        ownershipPct: Number(stake.ownershipPct),
        entryValuation: stake.entryValuation ? Number(stake.entryValuation) : null,
        entryMultiple: stake.entryMultiple ? Number(stake.entryMultiple) : null,
        exitValuation: stake.exitValuation ? Number(stake.exitValuation) : null,
        exitMultiple: stake.exitMultiple ? Number(stake.exitMultiple) : null,
      };
    }),

  /**
   * Delete an ownership stake
   */
  delete: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.ownershipStake.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ownership stake not found',
        });
      }

      await ctx.db.ownershipStake.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
