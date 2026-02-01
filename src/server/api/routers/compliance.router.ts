/**
 * SPAC OS - Compliance Router
 * Compliance tracking, SEC comments, board meetings, conflicts, and trading windows
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';
import {
  ComplianceItemCreateSchema,
  SecCommentCreateSchema,
  BoardMeetingCreateSchema,
  ConflictCreateSchema,
  InsiderTradingWindowCreateSchema,
  UuidSchema,
  PaginationSchema,
  ComplianceStatusSchema,
} from '@/schemas';

export const complianceRouter = createTRPCRouter({
  // ============================================================================
  // COMPLIANCE ITEMS
  // ============================================================================

  complianceItems: {
    getById: protectedProcedure
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

    list: protectedProcedure
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

        const where: any = {};
        if (spacId) where.spacId = spacId;
        if (status?.length) where.status = { in: status };
        if (category) where.category = category;
        if (dueBefore) where.dueDate = { ...where.dueDate, lte: dueBefore };
        if (dueAfter) where.dueDate = { ...where.dueDate, gte: dueAfter };

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

    create: orgAuditedProcedure
      .input(ComplianceItemCreateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.db.complianceItem.create({
          data: input,
          include: { spac: true },
        });
      }),

    update: orgAuditedProcedure
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
          data: input.data,
        });
      }),

    updateStatus: orgAuditedProcedure
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

        const updateData: any = { status: input.status };
        if (input.status === 'COMPLIANT') {
          updateData.completedDate = new Date();
        }

        return ctx.db.complianceItem.update({
          where: { id: input.id },
          data: updateData,
        });
      }),

    getOverdue: protectedProcedure
      .input(z.object({ spacId: UuidSchema.optional() }))
      .query(async ({ ctx, input }) => {
        const where: any = {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        };
        if (input.spacId) where.spacId = input.spacId;

        return ctx.db.complianceItem.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: { dueDate: 'asc' },
        });
      }),

    getStatistics: protectedProcedure
      .input(z.object({ spacId: UuidSchema.optional() }))
      .query(async ({ ctx, input }) => {
        const where: any = {};
        if (input.spacId) where.spacId = input.spacId;

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
              status: { in: ['PENDING', 'IN_PROGRESS'] },
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
  },

  // ============================================================================
  // BOARD MEETINGS
  // ============================================================================

  boardMeetings: {
    getById: protectedProcedure
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

    list: protectedProcedure
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

        const where: any = {};
        if (spacId) where.spacId = spacId;
        if (type) where.type = type;
        if (status) where.status = status;
        if (scheduledAfter) where.scheduledDate = { ...where.scheduledDate, gte: scheduledAfter };
        if (scheduledBefore) where.scheduledDate = { ...where.scheduledDate, lte: scheduledBefore };

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

    create: orgAuditedProcedure
      .input(BoardMeetingCreateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.db.boardMeeting.create({
          data: input,
          include: { spac: true },
        });
      }),

    update: orgAuditedProcedure
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
          data: input.data,
        });
      }),

    updateStatus: orgAuditedProcedure
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

    addResolution: orgAuditedProcedure
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

        const resolutions = meeting.resolutions as any[] || [];
        resolutions.push(input.resolution);

        return ctx.db.boardMeeting.update({
          where: { id: input.id },
          data: { resolutions },
        });
      }),

    getUpcoming: protectedProcedure
      .input(z.object({
        spacId: UuidSchema.optional(),
        days: z.number().int().min(1).max(90).default(30),
      }))
      .query(async ({ ctx, input }) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + input.days);

        const where: any = {
          status: 'scheduled',
          scheduledDate: {
            gte: new Date(),
            lte: cutoffDate,
          },
        };
        if (input.spacId) where.spacId = input.spacId;

        return ctx.db.boardMeeting.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: { scheduledDate: 'asc' },
        });
      }),
  },

  // ============================================================================
  // CONFLICTS OF INTEREST
  // ============================================================================

  conflicts: {
    getById: protectedProcedure
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

    list: protectedProcedure
      .input(z.object({
        spacId: UuidSchema.optional(),
        severity: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional(),
        isResolved: z.boolean().optional(),
        ...PaginationSchema.shape,
      }))
      .query(async ({ ctx, input }) => {
        const { spacId, severity, isResolved, page, pageSize, sortBy, sortOrder } = input;

        const where: any = {};
        if (spacId) where.spacId = spacId;
        if (severity?.length) where.severity = { in: severity };
        if (isResolved !== undefined) where.isResolved = isResolved;

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

    create: orgAuditedProcedure
      .input(ConflictCreateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.db.conflict.create({
          data: input,
          include: { spac: true },
        });
      }),

    update: orgAuditedProcedure
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
          data: input.data,
        });
      }),

    resolve: orgAuditedProcedure
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

    getUnresolved: protectedProcedure
      .input(z.object({ spacId: UuidSchema.optional() }))
      .query(async ({ ctx, input }) => {
        const where: any = { isResolved: false };
        if (input.spacId) where.spacId = input.spacId;

        return ctx.db.conflict.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        });
      }),
  },

  // ============================================================================
  // INSIDER TRADING WINDOWS
  // ============================================================================

  tradingWindows: {
    getById: protectedProcedure
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

    list: protectedProcedure
      .input(z.object({
        spacId: UuidSchema.optional(),
        status: z.array(z.enum(['OPEN', 'CLOSED', 'BLACKOUT'])).optional(),
        userId: UuidSchema.optional(),
        ...PaginationSchema.shape,
      }))
      .query(async ({ ctx, input }) => {
        const { spacId, status, userId, page, pageSize, sortBy, sortOrder } = input;

        const where: any = {};
        if (spacId) where.spacId = spacId;
        if (status?.length) where.status = { in: status };
        if (userId) where.userId = userId;

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

    create: orgAuditedProcedure
      .input(InsiderTradingWindowCreateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.db.insiderTradingWindow.create({
          data: input,
          include: { spac: true, user: true },
        });
      }),

    update: orgAuditedProcedure
      .input(z.object({
        id: UuidSchema,
        data: InsiderTradingWindowCreateSchema.partial().omit({ spacId: true }),
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
          data: input.data,
        });
      }),

    close: orgAuditedProcedure
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
            status: 'CLOSED',
            endDate: input.endDate || new Date(),
          },
        });
      }),

    getActiveBlackouts: protectedProcedure
      .input(z.object({ spacId: UuidSchema.optional() }))
      .query(async ({ ctx, input }) => {
        const where: any = {
          status: 'BLACKOUT',
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        };
        if (input.spacId) where.spacId = input.spacId;

        return ctx.db.insiderTradingWindow.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: { startDate: 'desc' },
        });
      }),

    canTrade: protectedProcedure
      .input(z.object({
        spacId: UuidSchema,
        userId: UuidSchema,
      }))
      .query(async ({ ctx, input }) => {
        // Check for any active blackout periods
        const blackouts = await ctx.db.insiderTradingWindow.findMany({
          where: {
            spacId: input.spacId,
            status: 'BLACKOUT',
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
            OR: [
              { affectsAll: true },
              { userId: input.userId },
            ],
          },
        });

        return {
          canTrade: blackouts.length === 0,
          activeBlackouts: blackouts,
        };
      }),
  },
});
