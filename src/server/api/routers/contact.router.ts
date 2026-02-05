/**
 * SPAC OS - Contact Router
 * Full CRUD operations and CRM-specific procedures for contact management
 * Sprint 8 CRM Module
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ContactCreateSchema,
  ContactUpdateSchema,
  UuidSchema,
  PaginationSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const ContactStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
  'PROSPECT',
  'LEAD',
]);

const ContactTypeSchema = z.enum([
  'INVESTOR',
  'ADVISOR',
  'LEGAL',
  'BANKER',
  'TARGET_EXEC',
  'BOARD_MEMBER',
  'SPONSOR',
  'UNDERWRITER',
  'AUDITOR',
  'OTHER',
]);

const InteractionTypeSchema = z.enum([
  'EMAIL',
  'CALL',
  'MEETING',
  'NOTE',
  'TASK',
  'LINKEDIN',
  'OTHER',
]);

// Sprint 10 - New enums for contact organization relationships
const SeniorityLevelSchema = z.enum([
  'C_LEVEL',
  'PARTNER',
  'MANAGING_DIRECTOR',
  'VP',
  'DIRECTOR',
  'ASSOCIATE',
  'ANALYST',
]);

const RelationshipStrengthSchema = z.enum([
  'COLD',
  'WARM',
  'HOT',
  'ADVOCATE',
]);

// ============================================================================
// FILTER SCHEMA
// ============================================================================

const ContactFilterSchema = z.object({
  status: z.array(ContactStatusSchema).optional(),
  type: z.array(ContactTypeSchema).optional(),
  companyId: UuidSchema.optional(),
  search: z.string().optional(),
  isStarred: z.boolean().optional(),
  ownerId: UuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  relationshipScoreMin: z.number().int().min(0).max(100).optional(),
  relationshipScoreMax: z.number().int().min(0).max(100).optional(),
  ...PaginationSchema.shape,
});

// ============================================================================
// CONTACT ROUTER
// ============================================================================

export const contactRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get paginated list of contacts with filters
   */
  list: protectedProcedure
    .input(ContactFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        status,
        type,
        companyId,
        search,
        isStarred,
        ownerId,
        tags,
        relationshipScoreMin,
        relationshipScoreMax,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      const where: Prisma.ContactWhereInput = {};

      // Filter by status
      if (status?.length) {
        where.status = { in: status };
      }

      // Filter by type
      if (type?.length) {
        where.type = { in: type };
      }

      // Filter by company
      if (companyId) {
        where.companyId = companyId;
      }

      // Filter by starred status
      if (isStarred !== undefined) {
        where.isStarred = isStarred;
      }

      // Filter by owner
      if (ownerId) {
        where.ownerId = ownerId;
      }

      // Filter by tags (any match)
      if (tags?.length) {
        where.tags = { hasSome: tags };
      }

      // Filter by relationship score range
      if (relationshipScoreMin !== undefined || relationshipScoreMax !== undefined) {
        where.relationshipScore = {
          ...(relationshipScoreMin !== undefined && { gte: relationshipScoreMin }),
          ...(relationshipScoreMax !== undefined && { lte: relationshipScoreMax }),
        };
      }

      // Search across multiple fields
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.contact.findMany({
          where,
          include: {
            companyRef: {
              select: { id: true, name: true, industry: true, logoUrl: true },
            },
            owner: {
              select: { id: true, name: true, image: true },
            },
            _count: {
              select: {
                interactions: true,
                targets: true,
                contactNotes: true,
              },
            },
          },
          orderBy: sortBy
            ? { [sortBy]: sortOrder }
            : [{ isStarred: 'desc' }, { lastName: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.contact.count({ where }),
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
   * Get single contact by ID with all relations
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.id },
        include: {
          companyRef: true,
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          targets: {
            include: {
              target: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  stage: true,
                  industry: true,
                },
              },
            },
          },
          interactions: {
            orderBy: { date: 'desc' },
            take: 20,
            include: {
              createdBy: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          contactNotes: {
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: 10,
            include: {
              createdBy: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          meetings: {
            include: {
              meeting: {
                select: {
                  id: true,
                  title: true,
                  startTime: true,
                  endTime: true,
                  location: true,
                },
              },
            },
            orderBy: {
              meeting: { startTime: 'desc' },
            },
            take: 10,
          },
          _count: {
            select: {
              interactions: true,
              targets: true,
              contactNotes: true,
              meetings: true,
              emails: true,
            },
          },
        },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      return contact;
    }),

  /**
   * Create a new contact
   */
  create: orgAuditedProcedure
    .input(ContactCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate email if provided
      if (input.email) {
        const existingContact = await ctx.db.contact.findFirst({
          where: { email: input.email },
        });

        if (existingContact) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Contact with this email already exists',
          });
        }
      }

      // Use provided organizationId, fall back to user's organization from context
      const organizationId = input.organizationId ?? ctx.user?.organizationId ?? undefined;

      // Map schema fields to Prisma model
      const contact = await ctx.db.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          mobile: input.mobile,
          company: input.company,
          title: input.title,
          type: (input.type as Prisma.ContactCreateInput['type']) ?? 'OTHER',
          status: 'ACTIVE',
          linkedIn: input.linkedinUrl,
          address: input.address,
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          notes: input.notes,
          tags: input.tags ?? [],
          isStarred: false,
          relationshipScore: 0,
          ownerId: ctx.user?.id,
          organizationId,
        },
        include: {
          companyRef: true,
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return contact;
    }),

  /**
   * Update an existing contact
   */
  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: ContactUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contact.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Build update data with only provided fields
      const updateData: Prisma.ContactUpdateInput = {};

      if (input.data.firstName !== undefined) { updateData.firstName = input.data.firstName; }
      if (input.data.lastName !== undefined) { updateData.lastName = input.data.lastName; }
      if (input.data.email !== undefined) { updateData.email = input.data.email; }
      if (input.data.phone !== undefined) { updateData.phone = input.data.phone; }
      if (input.data.mobile !== undefined) { updateData.mobile = input.data.mobile; }
      if (input.data.company !== undefined) { updateData.company = input.data.company; }
      if (input.data.title !== undefined) { updateData.title = input.data.title; }
      if (input.data.type !== undefined) { updateData.type = input.data.type as Prisma.ContactUpdateInput['type']; }
      if (input.data.linkedinUrl !== undefined) { updateData.linkedIn = input.data.linkedinUrl; }
      if (input.data.address !== undefined) { updateData.address = input.data.address; }
      if (input.data.city !== undefined) { updateData.city = input.data.city; }
      if (input.data.state !== undefined) { updateData.state = input.data.state; }
      if (input.data.country !== undefined) { updateData.country = input.data.country; }
      if (input.data.postalCode !== undefined) { updateData.postalCode = input.data.postalCode; }
      if (input.data.notes !== undefined) { updateData.notes = input.data.notes; }
      if (input.data.tags !== undefined) { updateData.tags = input.data.tags; }

      const contact = await ctx.db.contact.update({
        where: { id: input.id },
        data: updateData,
        include: {
          companyRef: true,
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return contact;
    }),

  /**
   * Soft delete a contact (set status to ARCHIVED)
   */
  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contact.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      await ctx.db.contact.update({
        where: { id: input.id },
        data: { status: 'ARCHIVED' },
      });

      return { success: true };
    }),

  /**
   * Bulk archive multiple contacts
   */
  bulkDelete: orgAuditedProcedure
    .input(z.object({
      ids: z.array(UuidSchema).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.contact.updateMany({
        where: {
          id: { in: input.ids },
        },
        data: { status: 'ARCHIVED' },
      });

      return {
        success: true,
        archivedCount: result.count,
      };
    }),

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  /**
   * Full-text search across firstName, lastName, email, company name
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(50).default(20),
      includeArchived: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const { query, limit, includeArchived } = input;

      const where: Prisma.ContactWhereInput = {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          {
            companyRef: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      };

      if (!includeArchived) {
        where.status = { not: 'ARCHIVED' };
      }

      const contacts = await ctx.db.contact.findMany({
        where,
        include: {
          companyRef: {
            select: { id: true, name: true, logoUrl: true },
          },
        },
        orderBy: [
          { isStarred: 'desc' },
          { relationshipScore: 'desc' },
          { lastName: 'asc' },
        ],
        take: limit,
      });

      return contacts;
    }),

  /**
   * Get contacts by company ID
   */
  getByCompany: protectedProcedure
    .input(z.object({
      companyId: UuidSchema,
      includeArchived: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ContactWhereInput = {
        companyId: input.companyId,
      };

      if (!input.includeArchived) {
        where.status = { not: 'ARCHIVED' };
      }

      const contacts = await ctx.db.contact.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { interactions: true },
          },
        },
        orderBy: [
          { isStarred: 'desc' },
          { lastName: 'asc' },
        ],
      });

      return contacts;
    }),

  // ============================================================================
  // FAVORITES & SCORING
  // ============================================================================

  /**
   * Toggle isStarred boolean for a contact
   */
  toggleStar: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.id },
        select: { id: true, isStarred: true },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updated = await ctx.db.contact.update({
        where: { id: input.id },
        data: { isStarred: !contact.isStarred },
        select: {
          id: true,
          isStarred: true,
          firstName: true,
          lastName: true,
        },
      });

      return updated;
    }),

  /**
   * Update relationship score (0-100)
   */
  updateScore: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      score: z.number().int().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updated = await ctx.db.contact.update({
        where: { id: input.id },
        data: { relationshipScore: input.score },
        select: {
          id: true,
          relationshipScore: true,
          firstName: true,
          lastName: true,
        },
      });

      return updated;
    }),

  /**
   * Link contact to a target (create TargetContact junction record)
   */
  linkToTarget: orgAuditedProcedure
    .input(z.object({
      contactId: UuidSchema,
      targetId: UuidSchema,
      role: z.string().max(100).optional(),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { contactId, targetId, role, isPrimary } = input;

      // Verify contact exists
      const contact = await ctx.db.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Verify target exists
      const target = await ctx.db.target.findUnique({
        where: { id: targetId },
      });

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target not found',
        });
      }

      // If setting as primary, unset other primary contacts for this target
      if (isPrimary) {
        await ctx.db.targetContact.updateMany({
          where: {
            targetId,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      // Upsert the target-contact link
      const targetContact = await ctx.db.targetContact.upsert({
        where: {
          targetId_contactId: { targetId, contactId },
        },
        create: {
          targetId,
          contactId,
          role,
          isPrimary,
        },
        update: {
          role,
          isPrimary,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
          target: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return targetContact;
    }),

  /**
   * Unlink contact from a target
   */
  unlinkFromTarget: orgAuditedProcedure
    .input(z.object({
      contactId: UuidSchema,
      targetId: UuidSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { contactId, targetId } = input;

      try {
        await ctx.db.targetContact.delete({
          where: {
            targetId_contactId: { targetId, contactId },
          },
        });

        return { success: true };
      } catch {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact is not linked to this target',
        });
      }
    }),

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  /**
   * Add an interaction to a contact
   */
  addInteraction: orgAuditedProcedure
    .input(z.object({
      contactId: UuidSchema,
      type: InteractionTypeSchema,
      subject: z.string().max(255).optional(),
      description: z.string().optional(),
      date: z.coerce.date().optional(),
      duration: z.number().int().positive().optional(), // minutes
      outcome: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { contactId, type, subject, description, date, duration, outcome } = input;

      const contact = await ctx.db.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const interaction = await ctx.db.interaction.create({
        data: {
          contactId,
          type,
          subject,
          description,
          date: date ?? new Date(),
          duration,
          outcome,
          createdById: ctx.user?.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      // Update lastInteractionAt on contact
      await ctx.db.contact.update({
        where: { id: contactId },
        data: { lastInteractionAt: interaction.date },
      });

      return interaction;
    }),

  /**
   * Get interactions for a contact
   */
  getInteractions: protectedProcedure
    .input(z.object({
      contactId: UuidSchema,
      type: InteractionTypeSchema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { contactId, type, limit, offset } = input;

      const where: Prisma.InteractionWhereInput = {
        contactId,
      };

      if (type) {
        where.type = type;
      }

      const [interactions, total] = await Promise.all([
        ctx.db.interaction.findMany({
          where,
          include: {
            createdBy: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { date: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.db.interaction.count({ where }),
      ]);

      return {
        items: interactions,
        total,
        hasMore: offset + interactions.length < total,
      };
    }),

  // ============================================================================
  // NOTES
  // ============================================================================

  /**
   * Add a note to a contact
   */
  addNote: orgAuditedProcedure
    .input(z.object({
      contactId: UuidSchema,
      content: z.string().min(1),
      isPinned: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { contactId, content, isPinned } = input;

      const contact = await ctx.db.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const note = await ctx.db.contactNote.create({
        data: {
          contactId,
          content,
          isPinned,
          createdById: ctx.user?.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return note;
    }),

  /**
   * Update a contact note
   */
  updateNote: orgAuditedProcedure
    .input(z.object({
      noteId: UuidSchema,
      content: z.string().min(1).optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { noteId, content, isPinned } = input;

      const existing = await ctx.db.contactNote.findUnique({
        where: { id: noteId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      const note = await ctx.db.contactNote.update({
        where: { id: noteId },
        data: {
          ...(content !== undefined && { content }),
          ...(isPinned !== undefined && { isPinned }),
        },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return note;
    }),

  /**
   * Delete a contact note
   */
  deleteNote: orgAuditedProcedure
    .input(z.object({ noteId: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contactNote.findUnique({
        where: { id: input.noteId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      await ctx.db.contactNote.delete({
        where: { id: input.noteId },
      });

      return { success: true };
    }),

  // ============================================================================
  // STATUS & OWNERSHIP
  // ============================================================================

  /**
   * Update contact status
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: ContactStatusSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updated = await ctx.db.contact.update({
        where: { id: input.id },
        data: { status: input.status },
        select: {
          id: true,
          status: true,
          firstName: true,
          lastName: true,
        },
      });

      return updated;
    }),

  /**
   * Assign owner to contact
   */
  assignOwner: orgAuditedProcedure
    .input(z.object({
      contactId: UuidSchema,
      ownerId: UuidSchema.nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.contactId },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Verify new owner exists if provided
      if (input.ownerId) {
        const owner = await ctx.db.user.findUnique({
          where: { id: input.ownerId },
        });

        if (!owner) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
      }

      const updated = await ctx.db.contact.update({
        where: { id: input.contactId },
        data: { ownerId: input.ownerId },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return updated;
    }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get contact statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      ownerId: UuidSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ContactWhereInput = {};

      if (input.ownerId) {
        where.ownerId = input.ownerId;
      }

      const [
        total,
        byStatus,
        byType,
        starred,
        recentlyActive,
        avgScore,
      ] = await Promise.all([
        ctx.db.contact.count({ where }),
        ctx.db.contact.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        ctx.db.contact.groupBy({
          by: ['type'],
          where,
          _count: true,
        }),
        ctx.db.contact.count({
          where: { ...where, isStarred: true },
        }),
        ctx.db.contact.count({
          where: {
            ...where,
            lastInteractionAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        ctx.db.contact.aggregate({
          where: { ...where, status: { not: 'ARCHIVED' } },
          _avg: { relationshipScore: true },
        }),
      ]);

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
        starred,
        recentlyActive,
        averageRelationshipScore: avgScore._avg.relationshipScore ?? 0,
      };
    }),

  /**
   * Get top contacts by relationship score
   */
  getTopContacts: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(10),
      type: ContactTypeSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ContactWhereInput = {
        status: { not: 'ARCHIVED' },
      };

      if (input.type) {
        where.type = input.type;
      }

      const contacts = await ctx.db.contact.findMany({
        where,
        orderBy: { relationshipScore: 'desc' },
        take: input.limit,
        include: {
          companyRef: {
            select: { id: true, name: true, logoUrl: true },
          },
          _count: {
            select: { interactions: true },
          },
        },
      });

      return contacts;
    }),

  /**
   * Get contacts needing follow-up (no recent interaction)
   */
  getNeedingFollowUp: protectedProcedure
    .input(z.object({
      daysSinceInteraction: z.number().int().min(1).max(365).default(30),
      limit: z.number().int().min(1).max(100).default(20),
      ownerId: UuidSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const cutoffDate = new Date(
        Date.now() - input.daysSinceInteraction * 24 * 60 * 60 * 1000
      );

      const where: Prisma.ContactWhereInput = {
        status: 'ACTIVE',
        OR: [
          { lastInteractionAt: { lt: cutoffDate } },
          { lastInteractionAt: null },
        ],
      };

      if (input.ownerId) {
        where.ownerId = input.ownerId;
      }

      const contacts = await ctx.db.contact.findMany({
        where,
        orderBy: [
          { isStarred: 'desc' },
          { relationshipScore: 'desc' },
          { lastInteractionAt: 'asc' },
        ],
        take: input.limit,
        include: {
          companyRef: {
            select: { id: true, name: true },
          },
          owner: {
            select: { id: true, name: true },
          },
        },
      });

      return contacts;
    }),

  // ============================================================================
  // SPRINT 10 - ORGANIZATION RELATIONSHIPS
  // ============================================================================

  /**
   * Get all contacts at an organization with optional filters
   * Returns contacts ordered by name with basic contact info
   */
  listByOrganization: protectedProcedure
    .input(z.object({
      organizationId: UuidSchema,
      seniorityLevel: SeniorityLevelSchema.optional(),
      relationshipStrength: RelationshipStrengthSchema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId, seniorityLevel, relationshipStrength, limit } = input;

      const where: Prisma.ContactWhereInput = {
        organizationId,
        status: { not: 'ARCHIVED' },
      };

      if (seniorityLevel) {
        where.seniorityLevel = seniorityLevel;
      }

      if (relationshipStrength) {
        where.relationshipStrength = relationshipStrength;
      }

      const contacts = await ctx.db.contact.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          title: true,
          seniorityLevel: true,
          relationshipStrength: true,
          dealRoles: true,
          isStarred: true,
          lastInteractionAt: true,
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
        take: limit,
      });

      return contacts;
    }),

  /**
   * Quick update relationship strength for a contact
   * Sprint 10 - Simplified update for relationship tracking
   */
  updateRelationshipStrength: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      relationshipStrength: RelationshipStrengthSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, relationshipStrength } = input;

      const contact = await ctx.db.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updated = await ctx.db.contact.update({
        where: { id },
        data: { relationshipStrength },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          relationshipStrength: true,
          organizationId: true,
        },
      });

      return updated;
    }),
});
