/**
 * SPAC OS - Activity Router
 * Manages the activity feed/timeline for organizations and contacts
 * Sprint 10 - PE Firm Management
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema } from '@/schemas';

import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const ActivityTypeSchema = z.enum([
  'EMAIL_SENT',
  'EMAIL_RECEIVED',
  'MEETING_SCHEDULED',
  'MEETING_COMPLETED',
  'CALL_MADE',
  'CALL_RECEIVED',
  'NOTE_ADDED',
  'DEAL_DISCUSSED',
  'DOCUMENT_SHARED',
  'CONTACT_ADDED',
  'RELATIONSHIP_UPDATED',
]);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const ActivityCreateSchema = z.object({
  organizationId: UuidSchema.optional().nullable(),
  contactId: UuidSchema.optional().nullable(),
  type: ActivityTypeSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  sourceType: z.string().max(50).optional().nullable(),
  sourceId: z.string().max(255).optional().nullable(),
});

// ============================================================================
// ACTIVITY ROUTER
// ============================================================================

export const activityRouter = createTRPCRouter({
  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  /**
   * Get activities for an organization with pagination
   */
  listByOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: UuidSchema,
        type: ActivityTypeSchema.optional(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(), // Activity ID for cursor-based pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const { organizationId, type, limit, cursor } = input;

      // Verify organization exists
      const organization = await ctx.db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      const where: Prisma.ActivityFeedWhereInput = {
        organizationId,
      };

      // Filter by type if provided
      if (type) {
        where.type = type;
      }

      // Cursor-based pagination
      const cursorObj = cursor ? { id: cursor } : undefined;

      const activities = await ctx.db.activityFeed.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              logoUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Take one extra to determine if there are more
        cursor: cursorObj,
        skip: cursor ? 1 : 0, // Skip the cursor itself
      });

      // Determine if there are more results
      let nextCursor: string | undefined;
      if (activities.length > limit) {
        const nextItem = activities.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
      }

      return {
        items: activities,
        nextCursor,
        hasMore: !!nextCursor,
      };
    }),

  /**
   * Get activities for a contact
   */
  listByContact: protectedProcedure
    .input(
      z.object({
        contactId: UuidSchema,
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { contactId, limit } = input;

      // Verify contact exists
      const contact = await ctx.db.contact.findUnique({
        where: { id: contactId },
        select: { id: true },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const activities = await ctx.db.activityFeed.findMany({
        where: { contactId },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              logoUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return {
        items: activities,
        total: activities.length,
      };
    }),

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  /**
   * Log a new activity
   */
  create: protectedProcedure
    .input(ActivityCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, contactId, type, title, description, metadata, sourceType, sourceId } = input;

      // Validate that at least one of organizationId or contactId is provided
      if (!organizationId && !contactId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either organizationId or contactId must be provided',
        });
      }

      // Verify organization exists if provided
      if (organizationId) {
        const organization = await ctx.db.organization.findUnique({
          where: { id: organizationId },
          select: { id: true },
        });

        if (!organization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Organization not found',
          });
        }
      }

      // Verify contact exists if provided
      if (contactId) {
        const contact = await ctx.db.contact.findUnique({
          where: { id: contactId },
          select: { id: true },
        });

        if (!contact) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact not found',
          });
        }
      }

      // Get the user ID from context
      const userId = ctx.user?.id;

      // Find the database user by Clerk ID
      let dbUserId: string | undefined;
      if (userId) {
        const dbUser = await ctx.db.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        dbUserId = dbUser?.id;
      }

      const activity = await ctx.db.activityFeed.create({
        data: {
          organizationId: organizationId ?? undefined,
          contactId: contactId ?? undefined,
          userId: dbUserId,
          type,
          title,
          description,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          sourceType,
          sourceId,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              logoUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return activity;
    }),
});
