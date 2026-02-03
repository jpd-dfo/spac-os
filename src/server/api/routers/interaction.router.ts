/**
 * SPAC OS - Interaction Router
 * Sprint 8 CRM Module - Interaction CRUD operations
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema, PaginationSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

// ============================================================================
// INTERACTION SCHEMAS
// ============================================================================

export const InteractionTypeSchema = z.enum([
  'EMAIL',
  'CALL',
  'MEETING',
  'NOTE',
  'TASK',
  'LINKEDIN',
  'OTHER',
]);

const InteractionCreateSchema = z.object({
  contactId: UuidSchema,
  type: InteractionTypeSchema,
  subject: z.string().max(255).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  date: z.coerce.date().optional().default(() => new Date()),
  duration: z.number().int().min(0).max(10080).optional().nullable(), // max 1 week in minutes
  outcome: z.string().max(1000).optional().nullable(),
});

const InteractionUpdateSchema = z.object({
  type: InteractionTypeSchema.optional(),
  subject: z.string().max(255).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  date: z.coerce.date().optional(),
  duration: z.number().int().min(0).max(10080).optional().nullable(),
  outcome: z.string().max(1000).optional().nullable(),
});

const InteractionFilterSchema = z.object({
  contactId: UuidSchema.optional(),
  type: z.array(InteractionTypeSchema).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  ...PaginationSchema.shape,
});

export const interactionRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get a single interaction by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const interaction = await ctx.db.interaction.findUnique({
        where: { id: input.id },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              companyId: true,
              companyRef: {
                select: { id: true, name: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      if (!interaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Interaction not found',
        });
      }

      return interaction;
    }),

  /**
   * List interactions with filtering and pagination
   */
  list: protectedProcedure
    .input(InteractionFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        contactId,
        type,
        dateFrom,
        dateTo,
        search,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.InteractionWhereInput = {};

      if (contactId) {
        where.contactId = contactId;
      }

      if (type?.length) {
        where.type = { in: type };
      }

      if (dateFrom || dateTo) {
        where.date = {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        };
      }

      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { outcome: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.interaction.findMany({
          where,
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
              },
            },
            createdBy: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: sortBy
            ? { [sortBy]: sortOrder }
            : { date: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.interaction.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Create a new interaction
   * Also updates Contact.lastInteractionAt
   */
  create: orgAuditedProcedure
    .input(InteractionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate contact exists
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.contactId },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Create interaction and update contact's lastInteractionAt in a transaction
      const [interaction] = await ctx.db.$transaction([
        ctx.db.interaction.create({
          data: {
            contactId: input.contactId,
            type: input.type,
            subject: input.subject,
            description: input.description,
            date: input.date,
            duration: input.duration,
            outcome: input.outcome,
            createdById: ctx.user?.id,
          },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
              },
            },
            createdBy: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        }),
        ctx.db.contact.update({
          where: { id: input.contactId },
          data: { lastInteractionAt: input.date },
        }),
      ]);

      return interaction;
    }),

  /**
   * Update an interaction
   */
  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: InteractionUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.interaction.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Interaction not found',
        });
      }

      const interaction = await ctx.db.interaction.update({
        where: { id: input.id },
        data: input.data,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      // If date was updated, recalculate contact's lastInteractionAt
      if (input.data.date) {
        const latestInteraction = await ctx.db.interaction.findFirst({
          where: { contactId: interaction.contactId },
          orderBy: { date: 'desc' },
          select: { date: true },
        });

        if (latestInteraction) {
          await ctx.db.contact.update({
            where: { id: interaction.contactId },
            data: { lastInteractionAt: latestInteraction.date },
          });
        }
      }

      return interaction;
    }),

  /**
   * Delete an interaction
   */
  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.interaction.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Interaction not found',
        });
      }

      await ctx.db.interaction.delete({
        where: { id: input.id },
      });

      // Recalculate contact's lastInteractionAt after deletion
      const latestInteraction = await ctx.db.interaction.findFirst({
        where: { contactId: existing.contactId },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      await ctx.db.contact.update({
        where: { id: existing.contactId },
        data: { lastInteractionAt: latestInteraction?.date ?? null },
      });

      return { success: true };
    }),

  // ============================================================================
  // SPECIALIZED QUERIES
  // ============================================================================

  /**
   * Get chronological timeline for a contact (last 50 interactions)
   */
  getTimeline: protectedProcedure
    .input(z.object({
      contactId: UuidSchema,
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      // Validate contact exists
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.contactId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          companyId: true,
          companyRef: {
            select: { id: true, name: true },
          },
          title: true,
          avatarUrl: true,
        },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const interactions = await ctx.db.interaction.findMany({
        where: { contactId: input.contactId },
        orderBy: { date: 'desc' },
        take: input.limit,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      return {
        contact,
        interactions,
        total: interactions.length,
      };
    }),

  /**
   * Get recent interactions across all contacts (for dashboard)
   */
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(20),
      type: z.array(InteractionTypeSchema).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.InteractionWhereInput = {};

      if (input.type?.length) {
        where.type = { in: input.type };
      }

      const interactions = await ctx.db.interaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: input.limit,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              companyId: true,
              companyRef: {
                select: { id: true, name: true },
              },
              avatarUrl: true,
            },
          },
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return interactions;
    }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get interaction statistics for a contact
   */
  getContactStats: protectedProcedure
    .input(z.object({ contactId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const [
        total,
        byType,
        lastInteraction,
        firstInteraction,
        thisMonth,
      ] = await Promise.all([
        ctx.db.interaction.count({
          where: { contactId: input.contactId },
        }),
        ctx.db.interaction.groupBy({
          by: ['type'],
          where: { contactId: input.contactId },
          _count: true,
        }),
        ctx.db.interaction.findFirst({
          where: { contactId: input.contactId },
          orderBy: { date: 'desc' },
          select: { date: true, type: true, subject: true },
        }),
        ctx.db.interaction.findFirst({
          where: { contactId: input.contactId },
          orderBy: { date: 'asc' },
          select: { date: true },
        }),
        ctx.db.interaction.count({
          where: {
            contactId: input.contactId,
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      return {
        total,
        byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
        lastInteraction,
        firstInteraction: firstInteraction?.date ?? null,
        thisMonth,
        averagePerMonth: firstInteraction
          ? total / Math.max(1, Math.ceil(
              (Date.now() - firstInteraction.date.getTime()) / (1000 * 60 * 60 * 24 * 30)
            ))
          : 0,
      };
    }),

  /**
   * Get overall interaction statistics (for dashboard)
   */
  getOverallStats: protectedProcedure
    .input(z.object({
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.InteractionWhereInput = {};

      if (input.dateFrom || input.dateTo) {
        where.date = {
          ...(input.dateFrom && { gte: input.dateFrom }),
          ...(input.dateTo && { lte: input.dateTo }),
        };
      }

      const [total, byType, byDay] = await Promise.all([
        ctx.db.interaction.count({ where }),
        ctx.db.interaction.groupBy({
          by: ['type'],
          where,
          _count: true,
        }),
        // Group by day for trend analysis (last 30 days)
        ctx.db.$queryRaw<Array<{ date: string; count: bigint }>>`
          SELECT DATE(date) as date, COUNT(*) as count
          FROM interactions
          WHERE date >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(date)
          ORDER BY date DESC
        `.catch(() => []), // Fallback if raw query fails
      ]);

      return {
        total,
        byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
        dailyTrend: byDay.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
      };
    }),
});
