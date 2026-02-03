/**
 * SPAC OS - Task Router
 * Workflow task management
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  TaskCreateSchema,
  TaskUpdateSchema,
  UuidSchema,
  PaginationSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

export const taskRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          target: { select: { id: true, name: true } },
          filing: { select: { id: true, type: true, title: true } },
          assignee: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      return task;
    }),

  list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      targetId: UuidSchema.optional(),
      filingId: UuidSchema.optional(),
      milestoneId: UuidSchema.optional(),
      assigneeId: UuidSchema.optional(),
      status: z.array(TaskStatusSchema).optional(),
      priority: z.array(TaskPrioritySchema).optional(),
      dueBefore: z.coerce.date().optional(),
      dueAfter: z.coerce.date().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().optional(),
      includeSubtasks: z.boolean().default(false),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const {
        spacId,
        targetId,
        filingId,
        milestoneId,
        assigneeId,
        status,
        priority,
        dueBefore,
        dueAfter,
        category,
        tags,
        search,
        includeSubtasks,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.TaskWhereInput = { deletedAt: null };

      if (spacId) {where.spacId = spacId;}
      if (targetId) {where.targetId = targetId;}
      if (filingId) {where.filingId = filingId;}
      // milestoneId not in Task schema
      if (assigneeId) {where.assigneeId = assigneeId;}
      if (status?.length) {where.status = { in: status as any };}
      if (priority?.length) {where.priority = { in: priority };}
      if (dueBefore || dueAfter) {
        where.dueDate = {
          ...(dueBefore && { lte: dueBefore }),
          ...(dueAfter && { gte: dueAfter }),
        };
      }
      if (category) {where.category = category;}
      // tags and parentTaskId not in schema

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.task.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
            target: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, image: true } },
          },
          orderBy: sortBy
            ? { [sortBy]: sortOrder }
            : [{ priority: 'asc' }, { dueDate: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.task.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  create: orgAuditedProcedure
    .input(TaskCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.create({
        data: input as any,
        include: {
          spac: true,
          target: true,
          assignee: true,
        },
      });

      return task;
    }),

  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: TaskUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const taskId = input.id as string;
      const existing = await ctx.db.task.findUnique({
        where: { id: taskId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const task = await ctx.db.task.update({
        where: { id: taskId },
        data: input.data as any,
        include: {
          spac: true,
          target: true,
          assignee: true,
        },
      });

      return task;
    }),

  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.task.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      await ctx.db.task.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  // ============================================================================
  // SPECIALIZED OPERATIONS
  // ============================================================================

  /**
   * Update task status
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: TaskStatusSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const updateData: Prisma.TaskUpdateInput = { status: input.status as any };

      if (input.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      const updated = await ctx.db.task.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  /**
   * Assign task to user
   */
  assign: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      assigneeId: UuidSchema.nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const updated = await ctx.db.task.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
        include: { assignee: true },
      });

      return updated;
    }),

  /**
   * Bulk update tasks
   */
  bulkUpdate: orgAuditedProcedure
    .input(z.object({
      ids: z.array(UuidSchema).min(1),
      data: z.object({
        status: TaskStatusSchema.optional(),
        priority: TaskPrioritySchema.optional(),
        assigneeId: UuidSchema.nullable().optional(),
        dueDate: z.coerce.date().nullable().optional(),
        tags: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Prisma.TaskUpdateInput = { ...input.data } as any;

      if (input.data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      const result = await ctx.db.task.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: updateData,
      });

      return { updated: result.count };
    }),

  /**
   * Get my tasks (assigned to current user)
   */
  getMyTasks: protectedProcedure
    .input(z.object({
      status: z.array(TaskStatusSchema).optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const where: Prisma.TaskWhereInput = {
        deletedAt: null,
        assigneeId: userId,
      };

      if (input.status?.length) {
        where.status = { in: input.status as any };
      } else {
        where.status = { notIn: ['COMPLETED', 'CANCELLED'] as any };
      }

      const [items, total] = await Promise.all([
        ctx.db.task.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
            target: { select: { id: true, name: true } },
          },
          orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.task.count({ where }),
      ]);

      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  /**
   * Get overdue tasks
   */
  getOverdue: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      assigneeId: UuidSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.TaskWhereInput = {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] as any },
        dueDate: { lt: new Date() },
      };

      if (input.spacId) {where.spacId = input.spacId;}
      if (input.assigneeId) {where.assigneeId = input.assigneeId;}

      const tasks = await ctx.db.task.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      return tasks;
    }),

  /**
   * Get task workload by user
   */
  getWorkload: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.TaskWhereInput = {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] as any },
        assigneeId: { not: null },
      };

      if (input.spacId) {where.spacId = input.spacId;}

      const tasks = await ctx.db.task.groupBy({
        by: ['assigneeId'],
        where,
        _count: true,
      });

      // Get user details
      const userIds = tasks.map((t) => t.assigneeId).filter(Boolean) as string[];
      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      return tasks.map((t) => ({
        user: userMap.get(t.assigneeId!),
        taskCount: t._count,
      }));
    }),

  /**
   * Get tasks due soon
   */
  getDueSoon: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      days: z.number().int().min(1).max(30).default(7),
    }))
    .query(async ({ ctx, input }) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (input.days as number));

      const where: Prisma.TaskWhereInput = {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] as any },
        dueDate: {
          gte: new Date(),
          lte: dueDate,
        },
      };

      if (input.spacId) {where.spacId = input.spacId;}

      const tasks = await ctx.db.task.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      return tasks;
    }),

  /**
   * Get task statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      assigneeId: UuidSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.TaskWhereInput = { deletedAt: null };
      if (input.spacId) {where.spacId = input.spacId;}
      if (input.assigneeId) {where.assigneeId = input.assigneeId;}

      const [total, byStatus, byPriority, overdue, completedThisWeek] =
        await Promise.all([
          ctx.db.task.count({ where }),
          ctx.db.task.groupBy({
            by: ['status'],
            where,
            _count: true,
          }),
          ctx.db.task.groupBy({
            by: ['priority'],
            where,
            _count: true,
          }),
          ctx.db.task.count({
            where: {
              ...where,
              status: { notIn: ['COMPLETED', 'CANCELLED'] as any },
              dueDate: { lt: new Date() },
            },
          }),
          ctx.db.task.count({
            where: {
              ...where,
              status: 'COMPLETED' as any,
              completedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        byPriority: Object.fromEntries(
          byPriority.map((p) => [p.priority, p._count])
        ),
        overdue,
        completedThisWeek,
      };
    }),
});
