/**
 * SPAC OS - Task Router
 * Workflow task management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  UuidSchema,
  PaginationSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
} from '@/schemas';

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
          milestone: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true, image: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          parentTask: { select: { id: true, title: true } },
          subtasks: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignee: { select: { id: true, name: true } },
            },
          },
          comments: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
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

      const where: any = { deletedAt: null };

      if (spacId) where.spacId = spacId;
      if (targetId) where.targetId = targetId;
      if (filingId) where.filingId = filingId;
      if (milestoneId) where.milestoneId = milestoneId;
      if (assigneeId) where.assigneeId = assigneeId;
      if (status?.length) where.status = { in: status };
      if (priority?.length) where.priority = { in: priority };
      if (dueBefore) where.dueDate = { ...where.dueDate, lte: dueBefore };
      if (dueAfter) where.dueDate = { ...where.dueDate, gte: dueAfter };
      if (category) where.category = category;
      if (tags?.length) where.tags = { hasSome: tags };
      if (!includeSubtasks) where.parentTaskId = null;

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
            _count: { select: { subtasks: true, comments: true } },
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
        data: input,
        include: {
          spac: true,
          target: true,
          assignee: true,
          createdBy: true,
        },
      });

      // Create notification for assignee
      if (input.assigneeId && input.assigneeId !== input.createdById) {
        await ctx.db.notification.create({
          data: {
            userId: input.assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You have been assigned to: ${input.title}`,
            linkType: 'task',
            linkId: task.id,
          },
        });
      }

      return task;
    }),

  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: TaskUpdateSchema,
    }))
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

      const task = await ctx.db.task.update({
        where: { id: input.id },
        data: input.data,
        include: {
          spac: true,
          target: true,
          assignee: true,
        },
      });

      // Notify if assignee changed
      if (
        input.data.assigneeId &&
        input.data.assigneeId !== existing.assigneeId
      ) {
        await ctx.db.notification.create({
          data: {
            userId: input.data.assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'Task Reassigned',
            message: `You have been assigned to: ${task.title}`,
            linkType: 'task',
            linkId: task.id,
          },
        });
      }

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
      actualHours: z.number().positive().optional(),
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

      const updateData: any = { status: input.status };

      if (input.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedDate = new Date();
        if (input.actualHours) updateData.actualHours = input.actualHours;
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

      // Notify new assignee
      if (input.assigneeId) {
        await ctx.db.notification.create({
          data: {
            userId: input.assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'Task Assigned',
            message: `You have been assigned to: ${task.title}`,
            linkType: 'task',
            linkId: task.id,
          },
        });
      }

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
      const updateData: any = { ...input.data };

      if (input.data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedDate = new Date();
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

      const where: any = {
        deletedAt: null,
        assigneeId: userId,
      };

      if (input.status?.length) {
        where.status = { in: input.status };
      } else {
        where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
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
      const where: any = {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      };

      if (input.spacId) where.spacId = input.spacId;
      if (input.assigneeId) where.assigneeId = input.assigneeId;

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
      const where: any = {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        assigneeId: { not: null },
      };

      if (input.spacId) where.spacId = input.spacId;

      const tasks = await ctx.db.task.groupBy({
        by: ['assigneeId'],
        where,
        _count: true,
        _sum: { estimatedHours: true },
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
        estimatedHours: t._sum.estimatedHours || 0,
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
      dueDate.setDate(dueDate.getDate() + input.days);

      const where: any = {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: {
          gte: new Date(),
          lte: dueDate,
        },
      };

      if (input.spacId) where.spacId = input.spacId;

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
      const where: any = { deletedAt: null };
      if (input.spacId) where.spacId = input.spacId;
      if (input.assigneeId) where.assigneeId = input.assigneeId;

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
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
              dueDate: { lt: new Date() },
            },
          }),
          ctx.db.task.count({
            where: {
              ...where,
              status: 'COMPLETED',
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
