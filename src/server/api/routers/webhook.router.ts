/**
 * SPAC OS - Webhook Router
 * Webhook management and delivery
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
  adminProcedure,
} from '../trpc';
import {
  WebhookCreateSchema,
  UuidSchema,
  PaginationSchema,
  WebhookEventTypeSchema,
} from '@/schemas';

export const webhookRouter = createTRPCRouter({
  /**
   * List webhooks for an organization
   */
  list: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema,
      isActive: z.boolean().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId, isActive, page, pageSize } = input;

      const where: any = { organizationId };
      if (isActive !== undefined) where.isActive = isActive;

      const [items, total] = await Promise.all([
        ctx.db.webhook.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            url: true,
            events: true,
            isActive: true,
            lastTriggeredAt: true,
            failureCount: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        ctx.db.webhook.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Get webhook by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const webhook = await ctx.db.webhook.findUnique({
        where: { id: input.id },
        include: {
          deliveries: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!webhook) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      }

      // Don't expose the secret
      return {
        ...webhook,
        secret: undefined,
        secretHint: webhook.secret.slice(0, 4) + '****',
      };
    }),

  /**
   * Create a new webhook
   */
  create: orgAuditedProcedure
    .input(WebhookCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate URL is reachable (optional - could be async)
      try {
        new URL(input.url);
      } catch {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid webhook URL',
        });
      }

      const webhook = await ctx.db.webhook.create({
        data: input,
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          createdAt: true,
        },
      });

      return webhook;
    }),

  /**
   * Update a webhook
   */
  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: z.object({
        name: z.string().min(1).max(255).optional(),
        url: z.string().url().optional(),
        secret: z.string().min(16).max(255).optional(),
        events: z.array(WebhookEventTypeSchema).min(1).optional(),
        isActive: z.boolean().optional(),
        headers: z.record(z.string()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.webhook.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      }

      const webhook = await ctx.db.webhook.update({
        where: { id: input.id },
        data: input.data,
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          updatedAt: true,
        },
      });

      return webhook;
    }),

  /**
   * Delete a webhook
   */
  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.webhook.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      }

      await ctx.db.webhook.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Toggle webhook active status
   */
  toggle: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await ctx.db.webhook.findUnique({
        where: { id: input.id },
      });

      if (!webhook) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      }

      const updated = await ctx.db.webhook.update({
        where: { id: input.id },
        data: {
          isActive: !webhook.isActive,
          failureCount: !webhook.isActive ? 0 : webhook.failureCount, // Reset failures on re-enable
        },
      });

      return { isActive: updated.isActive };
    }),

  /**
   * Test a webhook
   */
  test: protectedProcedure
    .input(z.object({
      id: UuidSchema,
      eventType: WebhookEventTypeSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await ctx.db.webhook.findUnique({
        where: { id: input.id },
      });

      if (!webhook) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      }

      const eventType = input.eventType || webhook.events[0];
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          message: 'This is a test webhook delivery',
        },
      };

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const start = Date.now();

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': eventType,
            ...((webhook.headers as Record<string, string>) || {}),
          },
          body: JSON.stringify(payload),
        });

        const duration = Date.now() - start;
        const responseText = await response.text();

        // Record delivery
        await ctx.db.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            eventType,
            payload,
            statusCode: response.status,
            response: responseText.slice(0, 1000),
            deliveredAt: new Date(),
            duration,
            success: response.ok,
          },
        });

        return {
          success: response.ok,
          statusCode: response.status,
          duration,
          response: responseText.slice(0, 500),
        };
      } catch (error) {
        const duration = Date.now() - start;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Record failed delivery
        await ctx.db.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            eventType,
            payload,
            duration,
            success: false,
            error: errorMessage,
          },
        });

        return {
          success: false,
          error: errorMessage,
          duration,
        };
      }
    }),

  /**
   * Get delivery history for a webhook
   */
  getDeliveries: protectedProcedure
    .input(z.object({
      webhookId: UuidSchema,
      success: z.boolean().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { webhookId, success, page, pageSize } = input;

      const where: any = { webhookId };
      if (success !== undefined) where.success = success;

      const [items, total] = await Promise.all([
        ctx.db.webhookDelivery.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.webhookDelivery.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Retry a failed delivery
   */
  retryDelivery: protectedProcedure
    .input(z.object({ deliveryId: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.webhookDelivery.findUnique({
        where: { id: input.deliveryId },
        include: { webhook: true },
      });

      if (!delivery) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery not found' });
      }

      if (!delivery.webhook.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Webhook is not active',
        });
      }

      const payload = delivery.payload as any;
      const signature = crypto
        .createHmac('sha256', delivery.webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const start = Date.now();

      try {
        const response = await fetch(delivery.webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': delivery.eventType,
            'X-Webhook-Retry': 'true',
            ...((delivery.webhook.headers as Record<string, string>) || {}),
          },
          body: JSON.stringify(payload),
        });

        const duration = Date.now() - start;
        const responseText = await response.text();

        // Update delivery
        await ctx.db.webhookDelivery.update({
          where: { id: input.deliveryId },
          data: {
            statusCode: response.status,
            response: responseText.slice(0, 1000),
            deliveredAt: new Date(),
            duration,
            success: response.ok,
            attempts: { increment: 1 },
            error: response.ok ? null : `HTTP ${response.status}`,
          },
        });

        // Update webhook failure count
        if (response.ok) {
          await ctx.db.webhook.update({
            where: { id: delivery.webhookId },
            data: { failureCount: 0 },
          });
        }

        return {
          success: response.ok,
          statusCode: response.status,
          duration,
        };
      } catch (error) {
        const duration = Date.now() - start;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await ctx.db.webhookDelivery.update({
          where: { id: input.deliveryId },
          data: {
            duration,
            success: false,
            attempts: { increment: 1 },
            error: errorMessage,
          },
        });

        // Increment failure count
        await ctx.db.webhook.update({
          where: { id: delivery.webhookId },
          data: { failureCount: { increment: 1 } },
        });

        return {
          success: false,
          error: errorMessage,
          duration,
        };
      }
    }),

  /**
   * Get webhook statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ organizationId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const webhooks = await ctx.db.webhook.findMany({
        where: { organizationId: input.organizationId },
        include: {
          _count: {
            select: { deliveries: true },
          },
        },
      });

      const deliveryStats = await ctx.db.webhookDelivery.groupBy({
        by: ['success'],
        where: {
          webhook: { organizationId: input.organizationId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      });

      return {
        totalWebhooks: webhooks.length,
        activeWebhooks: webhooks.filter((w) => w.isActive).length,
        totalDeliveries: deliveryStats.reduce((sum, s) => sum + s._count, 0),
        successfulDeliveries: deliveryStats.find((s) => s.success)?._count || 0,
        failedDeliveries: deliveryStats.find((s) => !s.success)?._count || 0,
        webhooksWithFailures: webhooks.filter((w) => w.failureCount > 0).length,
      };
    }),

  /**
   * Regenerate webhook secret
   */
  regenerateSecret: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await ctx.db.webhook.findUnique({
        where: { id: input.id },
      });

      if (!webhook) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      }

      const newSecret = crypto.randomBytes(32).toString('hex');

      await ctx.db.webhook.update({
        where: { id: input.id },
        data: { secret: newSecret },
      });

      return { secret: newSecret };
    }),
});
