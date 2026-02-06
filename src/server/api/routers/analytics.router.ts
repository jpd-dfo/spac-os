/**
 * SPAC OS - Analytics Router
 * Aggregation and dashboard analytics endpoints
 */

import { z } from 'zod';

import { UuidSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
} from '../trpc';

export const analyticsRouter = createTRPCRouter({
  /**
   * Get organization-wide dashboard statistics
   */
  getDashboard: protectedProcedure
    .input(z.object({ organizationId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = input;

      const [
        spacStats,
        targetStats,
        taskStats,
        complianceStats,
        recentActivity,
      ] = await Promise.all([
        // SPAC statistics
        ctx.db.spac.groupBy({
          by: ['status'],
          where: { organizationId, deletedAt: null },
          _count: true,
        }),

        // Target statistics
        ctx.db.target.groupBy({
          by: ['status'],
          where: {
            spac: { organizationId },
            deletedAt: null,
          },
          _count: true,
        }),

        // Task statistics
        ctx.db.task.groupBy({
          by: ['status'],
          where: {
            spac: { organizationId },
            deletedAt: null,
          },
          _count: true,
        }),

        // Compliance statistics
        ctx.db.complianceItem.groupBy({
          by: ['status'],
          where: {
            spac: { organizationId },
          },
          _count: true,
        }),

        // Recent activity (audit logs)
        ctx.db.auditLog.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        }),
      ]);

      return {
        spacs: {
          byStatus: Object.fromEntries(spacStats.map((s) => [s.status, s._count])),
          total: spacStats.reduce((sum, s) => sum + s._count, 0),
        },
        targets: {
          byStatus: Object.fromEntries(targetStats.map((t) => [t.status, t._count])),
          total: targetStats.reduce((sum, t) => sum + t._count, 0),
        },
        tasks: {
          byStatus: Object.fromEntries(taskStats.map((t) => [t.status, t._count])),
          total: taskStats.reduce((sum, t) => sum + t._count, 0),
          pending: taskStats.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
            .reduce((sum, t) => sum + t._count, 0),
        },
        compliance: {
          byStatus: Object.fromEntries(complianceStats.map((c) => [c.status, c._count])),
          total: complianceStats.reduce((sum, c) => sum + c._count, 0),
          nonCompliant: complianceStats.find((c) => c.status === 'NON_COMPLIANT')?._count || 0,
        },
        recentActivity,
      };
    }),

  /**
   * Get SPAC-specific analytics
   */
  getSpacAnalytics: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const { spacId } = input;

      const [
        spac,
        targetPipeline,
        taskMetrics,
        filingMetrics,
        trustHistory,
        redemptionHistory,
        pipeMetrics,
      ] = await Promise.all([
        ctx.db.spac.findUnique({
          where: { id: spacId },
          include: {
            trustAccounts: { orderBy: { balanceDate: 'desc' }, take: 1 },
            _count: {
              select: {
                targets: true,
                documents: true,
                filings: true,
                tasks: true,
                milestones: true,
                pipes: true,
                earnouts: true,
              },
            },
          },
        }),

        // Target pipeline by status
        ctx.db.target.groupBy({
          by: ['status'],
          where: { spacId, deletedAt: null },
          _count: true,
          _sum: { enterpriseValue: true },
        }),

        // Task completion metrics
        Promise.all([
          ctx.db.task.count({
            where: { spacId, deletedAt: null },
          }),
          ctx.db.task.count({
            where: { spacId, deletedAt: null, status: 'COMPLETED' },
          }),
          ctx.db.task.count({
            where: {
              spacId,
              deletedAt: null,
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
              dueDate: { lt: new Date() },
            },
          }),
        ]),

        // Filing metrics
        ctx.db.filing.groupBy({
          by: ['type', 'status'],
          where: { spacId },
          _count: true,
        }),

        // Trust balance history
        ctx.db.trustAccount.findFirst({
          where: { spacId },
          orderBy: { balanceDate: 'desc' },
          select: { balanceHistory: true },
        }),

        // Redemption history
        ctx.db.redemption.findMany({
          where: { spacId },
          orderBy: { eventDate: 'asc' },
          select: {
            eventDate: true,
            eventType: true,
            redemptionRate: true,
            remainingShares: true,
            remainingTrust: true,
          },
        }),

        // PIPE metrics
        ctx.db.pipeInvestor.aggregate({
          where: { spacId },
          _sum: { targetAmount: true, committedAmount: true, fundedAmount: true },
          _count: true,
        }),
      ]);

      const [totalTasks, completedTasks, overdueTasks] = taskMetrics;

      return {
        spac,
        targets: {
          pipeline: targetPipeline.map((t) => ({
            status: t.status,
            count: t._count,
            totalEV: t._sum.enterpriseValue,
          })),
          total: targetPipeline.reduce((sum, t) => sum + t._count, 0),
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
        },
        filings: filingMetrics,
        trustHistory: (trustHistory?.balanceHistory as unknown as Array<{ date: Date; balance: number; perShare: number; note?: string }>) || [],
        redemptions: redemptionHistory,
        pipe: {
          investorCount: pipeMetrics._count,
          totalTarget: pipeMetrics._sum.targetAmount,
          totalCommitted: pipeMetrics._sum.committedAmount,
          totalFunded: pipeMetrics._sum.fundedAmount,
        },
      };
    }),

  /**
   * Get timeline data for charts
   */
  getTimelineData: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema,
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      metric: z.enum(['spacs_created', 'targets_added', 'tasks_completed', 'filings']),
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId, startDate, endDate, metric } = input;

      switch (metric) {
        case 'spacs_created':
          return ctx.db.spac.groupBy({
            by: ['createdAt'],
            where: {
              organizationId,
              createdAt: { gte: startDate, lte: endDate },
            },
            _count: true,
          });

        case 'targets_added':
          return ctx.db.target.groupBy({
            by: ['createdAt'],
            where: {
              spac: { organizationId },
              createdAt: { gte: startDate, lte: endDate },
            },
            _count: true,
          });

        case 'tasks_completed':
          return ctx.db.task.groupBy({
            by: ['completedAt'],
            where: {
              spac: { organizationId },
              status: 'COMPLETED',
              completedAt: { gte: startDate, lte: endDate },
            },
            _count: true,
          });

        case 'filings':
          return ctx.db.filing.groupBy({
            by: ['filedDate'],
            where: {
              spac: { organizationId },
              filedDate: { gte: startDate, lte: endDate },
            },
            _count: true,
          });

        default:
          return [];
      }
    }),

  /**
   * Get deadline alerts
   */
  getDeadlineAlerts: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema,
      daysAhead: z.number().int().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId, daysAhead } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const [spacDeadlines, taskDeadlines, complianceDeadlines, filingDeadlines] =
        await Promise.all([
          // SPAC deadlines
          ctx.db.spac.findMany({
            where: {
              organizationId,
              deletedAt: null,
              status: { in: ['SEARCHING', 'LOI_SIGNED'] },
              deadlineDate: { gte: new Date(), lte: cutoffDate },
            },
            select: {
              id: true,
              name: true,
              ticker: true,
              deadlineDate: true,
              status: true,
            },
            orderBy: { deadlineDate: 'asc' },
          }),

          // Task deadlines
          ctx.db.task.findMany({
            where: {
              spac: { organizationId },
              deletedAt: null,
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
              dueDate: { gte: new Date(), lte: cutoffDate },
            },
            select: {
              id: true,
              title: true,
              dueDate: true,
              priority: true,
              spac: { select: { id: true, name: true, ticker: true } },
              assignee: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: 'asc' },
            take: 20,
          }),

          // Compliance deadlines
          ctx.db.complianceItem.findMany({
            where: {
              spac: { organizationId },
              status: { in: ['PENDING', 'IN_PROGRESS'] },
              dueDate: { gte: new Date(), lte: cutoffDate },
            },
            select: {
              id: true,
              name: true,
              category: true,
              dueDate: true,
              spac: { select: { id: true, name: true, ticker: true } },
            },
            orderBy: { dueDate: 'asc' },
            take: 20,
          }),

          // Filing deadlines
          ctx.db.filing.findMany({
            where: {
              spac: { organizationId },
              status: { in: ['DRAFTING', 'INTERNAL_REVIEW', 'LEGAL_REVIEW'] },
              dueDate: { gte: new Date(), lte: cutoffDate },
            },
            select: {
              id: true,
              type: true,
              title: true,
              dueDate: true,
              status: true,
              spac: { select: { id: true, name: true, ticker: true } },
            },
            orderBy: { dueDate: 'asc' },
            take: 20,
          }),
        ]);

      return {
        spacDeadlines,
        taskDeadlines,
        complianceDeadlines,
        filingDeadlines,
        summary: {
          totalAlerts:
            spacDeadlines.length +
            taskDeadlines.length +
            complianceDeadlines.length +
            filingDeadlines.length,
          criticalCount: spacDeadlines.length, // SPAC deadlines are critical
        },
      };
    }),

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema,
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId, period } = input;

      const periodStart = new Date();
      switch (period) {
        case 'week':
          periodStart.setDate(periodStart.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(periodStart.getMonth() - 1);
          break;
        case 'quarter':
          periodStart.setMonth(periodStart.getMonth() - 3);
          break;
        case 'year':
          periodStart.setFullYear(periodStart.getFullYear() - 1);
          break;
      }

      const [
        tasksCompleted,
        targetsEvaluated,
        filingsSubmitted,
        documentsUploaded,
      ] = await Promise.all([
        ctx.db.task.count({
          where: {
            spac: { organizationId },
            status: 'COMPLETED',
            completedAt: { gte: periodStart },
          },
        }),
        ctx.db.target.count({
          where: {
            spac: { organizationId },
            status: { notIn: ['IDENTIFIED'] },
            updatedAt: { gte: periodStart },
          },
        }),
        ctx.db.filing.count({
          where: {
            spac: { organizationId },
            status: { in: ['FILED', 'EFFECTIVE'] },
            filedDate: { gte: periodStart },
          },
        }),
        ctx.db.document.count({
          where: {
            spac: { organizationId },
            createdAt: { gte: periodStart },
          },
        }),
      ]);

      return {
        period,
        periodStart,
        metrics: {
          tasksCompleted,
          targetsEvaluated,
          filingsSubmitted,
          documentsUploaded,
        },
      };
    }),

  /**
   * Get user activity metrics
   */
  getUserActivity: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema,
      days: z.number().int().min(1).max(90).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId, days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [userActions, topUsers] = await Promise.all([
        // Actions by user
        ctx.db.auditLog.groupBy({
          by: ['userId', 'action'],
          where: {
            organizationId,
            createdAt: { gte: startDate },
            userId: { not: null },
          },
          _count: true,
        }),

        // Top active users
        ctx.db.auditLog.groupBy({
          by: ['userId'],
          where: {
            organizationId,
            createdAt: { gte: startDate },
            userId: { not: null },
          },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),
      ]);

      // Get user details
      const userIds = topUsers.map((u) => u.userId).filter(Boolean) as string[];
      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      return {
        days,
        actionsByUser: userActions,
        topUsers: topUsers.map((u) => ({
          user: userMap.get(u.userId!),
          actionCount: u._count,
        })),
      };
    }),
});
