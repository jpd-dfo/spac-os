/**
 * SPAC OS - Alert Router
 * CRUD operations for compliance alerts
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  createAlert,
  dismissAlert,
  dismissMany,
  getActiveAlertsWithCount,
  getAlertById,
  getRecentAlerts,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  markManyAsRead,
  syncAlertsToDatabase,
  type AlertSeverity,
  type AlertType,
} from '@/lib/compliance/alertService';
import { PaginationSchema, UuidSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
} from '../trpc';

// Schema definitions
const AlertTypeSchema = z.enum([
  'DEADLINE_APPROACHING',
  'DEADLINE_CRITICAL',
  'DEADLINE_MISSED',
  'FILING_REQUIRED',
  'COMPLIANCE_WARNING',
]);

const AlertSeveritySchema = z.enum(['high', 'medium', 'low']);

const AlertCreateSchema = z.object({
  spacId: UuidSchema.optional().nullable(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  dueDate: z.coerce.date().optional().nullable(),
});

export const alertRouter = createTRPCRouter({
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get alert by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ input }) => {
      const alert = await getAlertById(input.id);

      if (!alert) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Alert not found' });
      }

      return alert;
    }),

  /**
   * List active (non-dismissed) alerts with optional filters
   */
  list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      severity: z.array(AlertSeveritySchema).optional(),
      type: z.array(AlertTypeSchema).optional(),
      isRead: z.boolean().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ input }) => {
      const { spacId, severity, type, isRead, page, pageSize } = input;

      // Single optimized query for both list and count
      const { alerts, total } = await getActiveAlertsWithCount({
        spacId,
        severity: severity as AlertSeverity[] | undefined,
        type: type as AlertType[] | undefined,
        isRead,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      return {
        items: alerts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get unread alert count
   */
  getUnreadCount: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }).optional())
    .query(async ({ input }) => {
      const count = await getUnreadCount(input?.spacId);
      return { count };
    }),

  /**
   * Get recent alerts (for header dropdown)
   */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }).optional())
    .query(async ({ input }) => {
      return getRecentAlerts(input?.limit ?? 5);
    }),

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Create a new alert
   */
  create: protectedProcedure
    .input(AlertCreateSchema)
    .mutation(async ({ input }) => {
      return createAlert({
        spacId: input.spacId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
      });
    }),

  /**
   * Mark an alert as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ input }) => {
      const alert = await getAlertById(input.id);

      if (!alert) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Alert not found' });
      }

      return markAsRead(input.id);
    }),

  /**
   * Mark multiple alerts as read
   */
  markManyAsRead: protectedProcedure
    .input(z.object({ ids: z.array(UuidSchema).min(1) }))
    .mutation(async ({ input }) => {
      return markManyAsRead(input.ids);
    }),

  /**
   * Mark all alerts as read
   */
  markAllAsRead: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }).optional())
    .mutation(async ({ input }) => {
      return markAllAsRead(input?.spacId);
    }),

  /**
   * Dismiss an alert
   */
  dismiss: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ input }) => {
      const alert = await getAlertById(input.id);

      if (!alert) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Alert not found' });
      }

      return dismissAlert(input.id);
    }),

  /**
   * Dismiss multiple alerts
   */
  dismissMany: protectedProcedure
    .input(z.object({ ids: z.array(UuidSchema).min(1) }))
    .mutation(async ({ input }) => {
      return dismissMany(input.ids);
    }),

  /**
   * Generate and sync alerts to database
   * Scans for deadlines and compliance issues, creates new alerts
   */
  generate: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }).optional())
    .mutation(async ({ input }) => {
      const createdCount = await syncAlertsToDatabase(input?.spacId);
      return {
        success: true,
        createdCount,
        message: createdCount > 0
          ? `Generated ${createdCount} new alert(s)`
          : 'No new alerts generated',
      };
    }),
});
