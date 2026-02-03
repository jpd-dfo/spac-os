/**
 * SPAC OS - Financial Router
 * Trust accounts, cap table, warrants, redemptions, PIPE, and earnouts
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  TrustAccountCreateSchema,
  CapTableEntryCreateSchema,
  WarrantCreateSchema,
  RedemptionCreateSchema,
  PipeInvestorCreateSchema,
  EarnoutCreateSchema,
  UuidSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

/** Balance history entry structure */
interface BalanceHistoryEntry {
  date: Date;
  balance: number;
  perShare: number;
  note?: string;
}

export const financialRouter = createTRPCRouter({
  // ============================================================================
  // TRUST ACCOUNTS
  // ============================================================================

  /**
   * Get trust accounts by SPAC ID
   */
  trustAccountList: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.db.trustAccount.findMany({
        where: { spacId: input.spacId },
        orderBy: { balanceDate: 'desc' },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
      });
    }),

  /**
   * Get latest trust account for a SPAC
   */
  trustAccountGetLatest: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.db.trustAccount.findFirst({
        where: { spacId: input.spacId },
        orderBy: { balanceDate: 'desc' },
        include: {
          spac: { select: { id: true, name: true, ticker: true, sharesOutstanding: true } },
        },
      });
    }),

  /**
   * Create a trust account
   */
  trustAccountCreate: orgAuditedProcedure
    .input(TrustAccountCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trustAccount.create({
        data: input as any,
        include: { spac: true },
      });
    }),

  /**
   * Update a trust account
   */
  trustAccountUpdate: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: TrustAccountCreateSchema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.trustAccount.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trust account not found' });
      }

      return ctx.db.trustAccount.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  /**
   * Record a balance update for a trust account
   */
  trustAccountRecordBalance: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      balance: z.number().positive(),
      balanceDate: z.coerce.date(),
      perShareValue: z.number().positive(),
      accruedInterest: z.number().min(0).optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.trustAccount.findUnique({
        where: { id: input.id },
      });

      if (!account) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trust account not found' });
      }

      // Add to balance history
      const balanceHistory = (account.balanceHistory as BalanceHistoryEntry[] | null) ?? [];
      balanceHistory.push({
        date: input.balanceDate,
        balance: input.balance,
        perShare: input.perShareValue,
        note: input.note,
      });

      return ctx.db.trustAccount.update({
        where: { id: input.id },
        data: {
          currentBalance: input.balance,
          balanceDate: input.balanceDate,
          perShareValue: input.perShareValue,
          accruedInterest: input.accruedInterest,
          balanceHistory: balanceHistory as any,
        },
      });
    }),

  /**
   * Get balance history for a SPAC's trust account
   */
  trustAccountGetBalanceHistory: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.trustAccount.findFirst({
        where: { spacId: input.spacId },
        orderBy: { balanceDate: 'desc' },
      });

      if (!account) {
        return [];
      }

      return (account.balanceHistory as BalanceHistoryEntry[] | null) ?? [];
    }),

  // ============================================================================
  // CAP TABLE
  // ============================================================================

  /**
   * Get cap table entries by SPAC ID
   */
  capTableList: protectedProcedure
    .input(z.object({
      spacId: UuidSchema,
      shareClass: z.string().optional(),
      holderType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.CapTableEntryWhereInput = { spacId: input.spacId };
      if (input.shareClass) {where.shareClass = input.shareClass;}
      if (input.holderType) {where.holderType = input.holderType;}

      return ctx.db.capTableEntry.findMany({
        where,
        orderBy: [{ ownershipPct: 'desc' }],
      });
    }),

  /**
   * Get cap table summary for a SPAC
   */
  capTableGetSummary: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.capTableEntry.findMany({
        where: { spacId: input.spacId },
      });

      // Group by share class
      const byClass: Record<string, { shares: bigint; ownership: number; count: number }> = {};
      const byHolder: Record<string, { shares: bigint; ownership: number; count: number }> = {};

      for (const entry of entries) {
        // By class
        if (!byClass[entry.shareClass]) {
          byClass[entry.shareClass] = { shares: BigInt(0), ownership: 0, count: 0 };
        }
        const classEntry = byClass[entry.shareClass];
        if (classEntry) {
          classEntry.shares += entry.sharesOwned;
          classEntry.ownership += Number(entry.ownershipPct);
          classEntry.count++;
        }

        // By holder type
        if (!byHolder[entry.holderType]) {
          byHolder[entry.holderType] = { shares: BigInt(0), ownership: 0, count: 0 };
        }
        const holderEntry = byHolder[entry.holderType];
        if (holderEntry) {
          holderEntry.shares += entry.sharesOwned;
          holderEntry.ownership += Number(entry.ownershipPct);
          holderEntry.count++;
        }
      }

      return {
        totalEntries: entries.length,
        totalShares: entries.reduce((sum, e) => sum + e.sharesOwned, BigInt(0)),
        byShareClass: Object.entries(byClass).map(([name, data]) => ({
          shareClass: name,
          totalShares: data.shares.toString(),
          totalOwnership: data.ownership,
          holderCount: data.count,
        })),
        byHolderType: Object.entries(byHolder).map(([name, data]) => ({
          holderType: name,
          totalShares: data.shares.toString(),
          totalOwnership: data.ownership,
          holderCount: data.count,
        })),
      };
    }),

  /**
   * Create a cap table entry
   */
  capTableCreate: orgAuditedProcedure
    .input(CapTableEntryCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.capTableEntry.create({ data: input as any });
    }),

  /**
   * Update a cap table entry
   */
  capTableUpdate: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: CapTableEntryCreateSchema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.capTableEntry.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cap table entry not found' });
      }

      return ctx.db.capTableEntry.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  /**
   * Delete a cap table entry
   */
  capTableDelete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.capTableEntry.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ============================================================================
  // WARRANTS
  // ============================================================================

  /**
   * Get warrants by SPAC ID
   */
  warrantList: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.db.warrant.findMany({
        where: { spacId: input.spacId },
        orderBy: { type: 'asc' },
      });
    }),

  /**
   * Get warrant summary for a SPAC
   */
  warrantGetSummary: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const warrants = await ctx.db.warrant.findMany({
        where: { spacId: input.spacId },
      });

      const summary: Record<string, { total: bigint; exercised: bigint; redeemed: bigint; outstanding: bigint }> = {
        PUBLIC: { total: BigInt(0), exercised: BigInt(0), redeemed: BigInt(0), outstanding: BigInt(0) },
        PRIVATE: { total: BigInt(0), exercised: BigInt(0), redeemed: BigInt(0), outstanding: BigInt(0) },
        WORKING_CAPITAL: { total: BigInt(0), exercised: BigInt(0), redeemed: BigInt(0), outstanding: BigInt(0) },
        FORWARD_PURCHASE: { total: BigInt(0), exercised: BigInt(0), redeemed: BigInt(0), outstanding: BigInt(0) },
      };

      for (const w of warrants) {
        const summaryEntry = summary[w.type];
        if (summaryEntry) {
          summaryEntry.total += w.totalWarrants;
          summaryEntry.exercised += w.warrantsExercised;
          summaryEntry.redeemed += w.warrantsRedeemed;
          summaryEntry.outstanding +=
            w.totalWarrants - w.warrantsExercised - w.warrantsRedeemed;
        }
      }

      return Object.entries(summary).map(([type, data]) => ({
        type,
        totalWarrants: data.total.toString(),
        exercised: data.exercised.toString(),
        redeemed: data.redeemed.toString(),
        outstanding: data.outstanding.toString(),
      }));
    }),

  /**
   * Create a warrant
   */
  warrantCreate: orgAuditedProcedure
    .input(WarrantCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.warrant.create({ data: input as any });
    }),

  /**
   * Update a warrant
   */
  warrantUpdate: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: (WarrantCreateSchema as any)._def.schema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.warrant.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Warrant not found' });
      }

      return ctx.db.warrant.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  /**
   * Record warrant exercise
   */
  warrantRecordExercise: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      exercised: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const warrant = await ctx.db.warrant.findUnique({
        where: { id: input.id },
      });

      if (!warrant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Warrant not found' });
      }

      const newExercised = warrant.warrantsExercised + BigInt(input.exercised);
      if (newExercised + warrant.warrantsRedeemed > warrant.totalWarrants) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exercise would exceed total warrants',
        });
      }

      return ctx.db.warrant.update({
        where: { id: input.id },
        data: { warrantsExercised: newExercised },
      });
    }),

  /**
   * Record warrant redemption
   */
  warrantRecordRedemption: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      redeemed: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const warrant = await ctx.db.warrant.findUnique({
        where: { id: input.id },
      });

      if (!warrant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Warrant not found' });
      }

      const newRedeemed = warrant.warrantsRedeemed + BigInt(input.redeemed);
      if (warrant.warrantsExercised + newRedeemed > warrant.totalWarrants) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Redemption would exceed available warrants',
        });
      }

      return ctx.db.warrant.update({
        where: { id: input.id },
        data: { warrantsRedeemed: newRedeemed },
      });
    }),

  // ============================================================================
  // REDEMPTIONS
  // ============================================================================

  /**
   * Get redemptions by SPAC ID
   */
  redemptionList: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.db.redemption.findMany({
        where: { spacId: input.spacId },
        orderBy: { eventDate: 'desc' },
      });
    }),

  /**
   * Create a redemption record
   */
  redemptionCreate: orgAuditedProcedure
    .input(RedemptionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate redemption rate calculation
      const calculatedRate = Number(input.sharesRedeemed) / Number(input.sharesEligible);
      if (Math.abs(calculatedRate - Number(input.redemptionRate)) > 0.001) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Redemption rate does not match shares calculation',
        });
      }

      return ctx.db.redemption.create({
        data: input as any,
        include: { spac: true },
      });
    }),

  /**
   * Update a redemption record
   */
  redemptionUpdate: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: (RedemptionCreateSchema as any)._def.schema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.redemption.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Redemption not found' });
      }

      return ctx.db.redemption.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  /**
   * Get redemption history with cumulative stats
   */
  redemptionGetHistory: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const redemptions = await ctx.db.redemption.findMany({
        where: { spacId: input.spacId },
        orderBy: { eventDate: 'asc' },
      });

      // Calculate cumulative stats
      let cumulativeRedeemed = BigInt(0);
      let cumulativePayout = 0;

      return redemptions.map((r) => {
        cumulativeRedeemed += r.sharesRedeemed;
        cumulativePayout += Number(r.totalPayout);

        return {
          ...r,
          cumulativeRedeemed: cumulativeRedeemed.toString(),
          cumulativePayout,
        };
      });
    }),

  // ============================================================================
  // PIPE INVESTORS
  // ============================================================================

  /**
   * Get PIPE investors by SPAC ID
   */
  pipeList: protectedProcedure
    .input(z.object({
      spacId: UuidSchema,
      status: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.PipeInvestorWhereInput = { spacId: input.spacId };
      if (input.status?.length) {
        where.status = { in: input.status as any };
      }

      return ctx.db.pipeInvestor.findMany({
        where,
        orderBy: [{ status: 'asc' }, { committedAmount: 'desc' }],
      });
    }),

  /**
   * Get PIPE summary for a SPAC
   */
  pipeGetSummary: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const investors = await ctx.db.pipeInvestor.findMany({
        where: { spacId: input.spacId },
      });

      const byStatus: Record<string, { count: number; target: number; committed: number; funded: number }> = {};

      for (const inv of investors) {
        if (!byStatus[inv.status]) {
          byStatus[inv.status] = { count: 0, target: 0, committed: 0, funded: 0 };
        }
        const statusEntry = byStatus[inv.status];
        if (statusEntry) {
          statusEntry.count++;
          statusEntry.target += Number(inv.targetAmount ?? 0);
          statusEntry.committed += Number(inv.committedAmount ?? 0);
          statusEntry.funded += Number(inv.fundedAmount ?? 0);
        }
      }

      const totals = {
        totalInvestors: investors.length,
        totalTarget: investors.reduce((sum, i) => sum + Number(i.targetAmount ?? 0), 0),
        totalCommitted: investors.reduce((sum, i) => sum + Number(i.committedAmount ?? 0), 0),
        totalFunded: investors.reduce((sum, i) => sum + Number(i.fundedAmount ?? 0), 0),
      };

      return {
        ...totals,
        byStatus: Object.entries(byStatus).map(([status, data]) => ({
          status,
          ...data,
        })),
        conversionRate: totals.totalTarget > 0 ? totals.totalCommitted / totals.totalTarget : 0,
        fundingRate: totals.totalCommitted > 0 ? totals.totalFunded / totals.totalCommitted : 0,
      };
    }),

  /**
   * Create a PIPE investor
   */
  pipeCreate: orgAuditedProcedure
    .input(PipeInvestorCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pipeInvestor.create({ data: input as any });
    }),

  /**
   * Update a PIPE investor
   */
  pipeUpdate: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: PipeInvestorCreateSchema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.pipeInvestor.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'PIPE investor not found' });
      }

      return ctx.db.pipeInvestor.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  /**
   * Update PIPE investor status
   */
  pipeUpdateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: z.enum(['PROSPECT', 'CONTACTED', 'INTERESTED', 'TERM_SHEET', 'COMMITTED', 'FUNDED', 'DECLINED']),
      committedAmount: z.number().positive().optional(),
      fundedAmount: z.number().positive().optional(),
      commitmentDate: z.coerce.date().optional(),
      fundingDate: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, status, ...data } = input;

      const updateData: Prisma.PipeInvestorUpdateInput = { status };
      if (data.committedAmount) {updateData.committedAmount = data.committedAmount;}
      if (data.fundedAmount) {updateData.fundedAmount = data.fundedAmount;}
      if (status === 'COMMITTED' && !data.commitmentDate) {
        updateData.commitmentDate = new Date();
      } else if (data.commitmentDate) {
        updateData.commitmentDate = data.commitmentDate;
      }
      if (status === 'FUNDED' && !data.fundingDate) {
        updateData.fundingDate = new Date();
      } else if (data.fundingDate) {
        updateData.fundingDate = data.fundingDate;
      }

      return ctx.db.pipeInvestor.update({
        where: { id },
        data: updateData,
      });
    }),

  // ============================================================================
  // EARNOUTS
  // ============================================================================

  /**
   * Get earnouts by SPAC ID
   */
  earnoutList: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.db.earnout.findMany({
        where: { spacId: input.spacId },
        orderBy: [{ status: 'asc' }, { measurementEnd: 'asc' }],
      });
    }),

  /**
   * Create an earnout
   */
  earnoutCreate: orgAuditedProcedure
    .input(EarnoutCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.earnout.create({ data: input as any });
    }),

  /**
   * Update an earnout
   */
  earnoutUpdate: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: (EarnoutCreateSchema as any)._def.schema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.earnout.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Earnout not found' });
      }

      return ctx.db.earnout.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  /**
   * Update earnout progress
   */
  earnoutUpdateProgress: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      currentValue: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const earnout = await ctx.db.earnout.findUnique({
        where: { id: input.id },
      });

      if (!earnout) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Earnout not found' });
      }

      const updateData: Prisma.EarnoutUpdateInput = {
        currentValue: input.currentValue,
        status: 'TRACKING',
      };

      // Check if target achieved
      if (input.currentValue >= Number(earnout.targetValue)) {
        updateData.status = 'ACHIEVED';
        updateData.achievedDate = new Date();
        updateData.sharesEarned = earnout.earnoutShares;
      }

      return ctx.db.earnout.update({
        where: { id: input.id },
        data: updateData,
      });
    }),

  /**
   * Mark earnout as expired
   */
  earnoutMarkExpired: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const earnout = await ctx.db.earnout.findUnique({
        where: { id: input.id },
      });

      if (!earnout) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Earnout not found' });
      }

      if (earnout.status === 'ACHIEVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot expire an achieved earnout',
        });
      }

      return ctx.db.earnout.update({
        where: { id: input.id },
        data: {
          status: 'EXPIRED',
        },
      });
    }),

  /**
   * Get earnout summary for a SPAC
   */
  earnoutGetSummary: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const earnouts = await ctx.db.earnout.findMany({
        where: { spacId: input.spacId },
      });

      return {
        total: earnouts.length,
        byStatus: {
          pending: earnouts.filter((e) => e.status === 'PENDING').length,
          tracking: earnouts.filter((e) => e.status === 'TRACKING').length,
          achieved: earnouts.filter((e) => e.status === 'ACHIEVED').length,
          missed: earnouts.filter((e) => e.status === 'MISSED').length,
          expired: earnouts.filter((e) => e.status === 'EXPIRED').length,
        },
        totalEarnoutShares: earnouts.reduce((sum, e) => sum + e.earnoutShares, BigInt(0)).toString(),
        totalSharesEarned: earnouts.reduce((sum, e) => sum + e.sharesEarned, BigInt(0)).toString(),
      };
    }),
});
