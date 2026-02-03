/**
 * SPAC OS - Compliance Router
 * Compliance tracking, SEC comments, board meetings, conflicts, and trading windows
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ComplianceItemCreateSchema,
  BoardMeetingCreateSchema,
  ConflictCreateSchema,
  InsiderTradingWindowCreateSchema,
  UuidSchema,
  PaginationSchema,
  ComplianceStatusSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

/** Resolution entry structure for board meetings */
interface BoardResolution {
  number: number;
  title: string;
  description?: string;
  votesFor?: number;
  votesAgainst?: number;
  abstentions?: number;
  passed?: boolean;
}

export const complianceRouter = createTRPCRouter({
  // ============================================================================
  // COMPLIANCE ITEMS
  // ============================================================================

  complianceItems_getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.complianceItem.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance item not found' });
      }

      return item;
    }),

  complianceItems_list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      status: z.array(ComplianceStatusSchema).optional(),
      category: z.string().optional(),
      dueBefore: z.coerce.date().optional(),
      dueAfter: z.coerce.date().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, status, category, dueBefore, dueAfter, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.ComplianceItemWhereInput = {};
      if (spacId) {where.spacId = spacId;}
      if (status?.length) {where.status = { in: status as any };}
      if (category) {where.category = category;}
      if (dueBefore || dueAfter) {
        where.dueDate = {
          ...(dueBefore && { lte: dueBefore }),
          ...(dueAfter && { gte: dueAfter }),
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.complianceItem.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { dueDate: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.complianceItem.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  complianceItems_create: orgAuditedProcedure
    .input(ComplianceItemCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.complianceItem.create({
        data: input as any,
        include: { spac: true },
      });
    }),

  complianceItems_update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: ComplianceItemCreateSchema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.complianceItem.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance item not found' });
      }

      return ctx.db.complianceItem.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  complianceItems_updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: ComplianceStatusSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.complianceItem.findUnique({
        where: { id: input.id },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance item not found' });
      }

      const updateData: Prisma.ComplianceItemUpdateInput = { status: input.status as any };
      if (input.status === 'COMPLIANT') {
        updateData.completedDate = new Date();
      }

      return ctx.db.complianceItem.update({
        where: { id: input.id },
        data: updateData,
      });
    }),

  complianceItems_getOverdue: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ComplianceItemWhereInput = {
        status: { in: ['PENDING', 'IN_PROGRESS'] as any },
        dueDate: { lt: new Date() },
      };
      if (input.spacId) {where.spacId = input.spacId;}

      return ctx.db.complianceItem.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: { dueDate: 'asc' },
      });
    }),

  complianceItems_getStatistics: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ComplianceItemWhereInput = {};
      if (input.spacId) {where.spacId = input.spacId;}

      const [total, byStatus, byCategory, overdue] = await Promise.all([
        ctx.db.complianceItem.count({ where }),
        ctx.db.complianceItem.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        ctx.db.complianceItem.groupBy({
          by: ['category'],
          where,
          _count: true,
        }),
        ctx.db.complianceItem.count({
          where: {
            ...where,
            status: { in: ['PENDING', 'IN_PROGRESS'] as any },
            dueDate: { lt: new Date() },
          },
        }),
      ]);

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
        overdue,
      };
    }),

  // ============================================================================
  // BOARD MEETINGS
  // ============================================================================

  boardMeetings_getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.boardMeeting.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
      });

      if (!meeting) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Board meeting not found' });
      }

      return meeting;
    }),

  boardMeetings_list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      scheduledAfter: z.coerce.date().optional(),
      scheduledBefore: z.coerce.date().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, type, status, scheduledAfter, scheduledBefore, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.BoardMeetingWhereInput = {};
      if (spacId) {where.spacId = spacId;}
      if (type) {where.type = type;}
      if (status) {where.status = status;}
      if (scheduledAfter || scheduledBefore) {
        where.scheduledDate = {
          ...(scheduledAfter && { gte: scheduledAfter }),
          ...(scheduledBefore && { lte: scheduledBefore }),
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.boardMeeting.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { scheduledDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.boardMeeting.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  boardMeetings_create: orgAuditedProcedure
    .input(BoardMeetingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.boardMeeting.create({
        data: input as any,
        include: { spac: true },
      });
    }),

  boardMeetings_update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: BoardMeetingCreateSchema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.boardMeeting.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Board meeting not found' });
      }

      return ctx.db.boardMeeting.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  boardMeetings_updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
      actualDate: z.coerce.date().optional(),
      quorumMet: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, status, actualDate, quorumMet } = input;

      return ctx.db.boardMeeting.update({
        where: { id },
        data: {
          status,
          actualDate: actualDate || (status === 'completed' ? new Date() : undefined),
          quorumMet,
        },
      });
    }),

  boardMeetings_addResolution: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      resolution: z.object({
        number: z.number().int().positive(),
        title: z.string(),
        description: z.string().optional(),
        votesFor: z.number().int().min(0).optional(),
        votesAgainst: z.number().int().min(0).optional(),
        abstentions: z.number().int().min(0).optional(),
        passed: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.boardMeeting.findUnique({
        where: { id: input.id },
      });

      if (!meeting) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Board meeting not found' });
      }

      const resolutions = ((meeting.resolutions as unknown) as BoardResolution[]) || [];
      resolutions.push(input.resolution);

      return ctx.db.boardMeeting.update({
        where: { id: input.id },
        data: { resolutions: resolutions as any },
      });
    }),

  boardMeetings_getUpcoming: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      days: z.number().int().min(1).max(90).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + input.days);

      const where: Prisma.BoardMeetingWhereInput = {
        status: 'scheduled',
        scheduledDate: {
          gte: new Date(),
          lte: cutoffDate,
        },
      };
      if (input.spacId) {where.spacId = input.spacId;}

      return ctx.db.boardMeeting.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: { scheduledDate: 'asc' },
      });
    }),

  // ============================================================================
  // CONFLICTS OF INTEREST
  // ============================================================================

  conflicts_getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const conflict = await ctx.db.conflict.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
      });

      if (!conflict) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conflict not found' });
      }

      return conflict;
    }),

  conflicts_list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      severity: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional(),
      isResolved: z.boolean().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, severity, isResolved, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.ConflictWhereInput = {};
      if (spacId) {where.spacId = spacId;}
      if (severity?.length) {where.severity = { in: severity as any };}
      if (isResolved !== undefined) {where.isResolved = isResolved;}

      const [items, total] = await Promise.all([
        ctx.db.conflict.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.conflict.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  conflicts_create: orgAuditedProcedure
    .input(ConflictCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.conflict.create({
        data: input as any,
        include: { spac: true },
      });
    }),

  conflicts_update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: ConflictCreateSchema.partial().omit({ spacId: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.conflict.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conflict not found' });
      }

      return ctx.db.conflict.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  conflicts_resolve: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      resolution: z.string().min(1),
      disclosedIn: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conflict = await ctx.db.conflict.findUnique({
        where: { id: input.id },
      });

      if (!conflict) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conflict not found' });
      }

      return ctx.db.conflict.update({
        where: { id: input.id },
        data: {
          isResolved: true,
          resolution: input.resolution,
          resolvedDate: new Date(),
          disclosedDate: input.disclosedIn ? new Date() : undefined,
          disclosedIn: input.disclosedIn,
        },
      });
    }),

  conflicts_getUnresolved: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ConflictWhereInput = { isResolved: false };
      if (input.spacId) {where.spacId = input.spacId;}

      return ctx.db.conflict.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
      });
    }),

  // ============================================================================
  // INSIDER TRADING WINDOWS
  // ============================================================================

  tradingWindows_getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const window = await ctx.db.insiderTradingWindow.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!window) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trading window not found' });
      }

      return window;
    }),

  tradingWindows_list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      status: z.array(z.enum(['OPEN', 'CLOSED', 'BLACKOUT'])).optional(),
      userId: UuidSchema.optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, status, userId, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.InsiderTradingWindowWhereInput = {};
      if (spacId) {where.spacId = spacId;}
      if (status?.length) {where.status = { in: status as any };}
      if (userId) {where.userId = userId;}

      const [items, total] = await Promise.all([
        ctx.db.insiderTradingWindow.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { startDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.insiderTradingWindow.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  tradingWindows_create: orgAuditedProcedure
    .input(InsiderTradingWindowCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Extract the validated data (InsiderTradingWindowCreateSchema has a refine)
      const data = input as unknown as z.infer<typeof InsiderTradingWindowCreateSchema>;
      return ctx.db.insiderTradingWindow.create({
        data: data as any,
        include: { spac: true, user: true },
      });
    }),

  tradingWindows_update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: z.object({
        userId: UuidSchema.optional().nullable(),
        status: z.enum(['OPEN', 'CLOSED', 'BLACKOUT']).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional().nullable(),
        reason: z.string().max(255).optional().nullable(),
        affectsAll: z.boolean().optional(),
        affectedPersons: z.array(z.object({
          userId: z.string().uuid().optional(),
          name: z.string(),
          role: z.string().optional(),
        })).optional(),
        notificationSent: z.boolean().optional(),
        notes: z.string().optional().nullable(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.insiderTradingWindow.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trading window not found' });
      }

      return ctx.db.insiderTradingWindow.update({
        where: { id: input.id },
        data: input.data as any,
      });
    }),

  tradingWindows_close: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      endDate: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const window = await ctx.db.insiderTradingWindow.findUnique({
        where: { id: input.id },
      });

      if (!window) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trading window not found' });
      }

      return ctx.db.insiderTradingWindow.update({
        where: { id: input.id },
        data: {
          status: 'CLOSED' as any,
          endDate: input.endDate || new Date(),
        },
      });
    }),

  tradingWindows_getActiveBlackouts: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.InsiderTradingWindowWhereInput = {
        status: 'BLACKOUT' as any,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      };
      if (input.spacId) {where.spacId = input.spacId;}

      return ctx.db.insiderTradingWindow.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: { startDate: 'desc' },
      });
    }),

  tradingWindows_canTrade: protectedProcedure
    .input(z.object({
      spacId: UuidSchema,
      userId: UuidSchema,
    }))
    .query(async ({ ctx, input }) => {
      // Check for any active blackout periods
      // Use AND to combine the two OR conditions properly
      const blackouts = await ctx.db.insiderTradingWindow.findMany({
        where: {
          spacId: input.spacId,
          status: 'BLACKOUT' as any,
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
              ],
            },
            {
              OR: [
                { affectsAll: true },
                { userId: input.userId },
              ],
            },
          ],
        },
      });

      return {
        canTrade: blackouts.length === 0,
        activeBlackouts: blackouts,
      };
    }),
});
