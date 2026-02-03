/**
 * SPAC OS - Note Router
 * CRUD operations for notes on targets and SPACs
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
} from '../trpc';

// Note schemas
const NoteCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  targetId: UuidSchema.optional().nullable(),
  spacId: UuidSchema.optional().nullable(),
  createdBy: z.string().optional().nullable(),
}).refine(
  (data) => data.targetId || data.spacId,
  { message: 'Note must be associated with a target or SPAC' }
);

const NoteUpdateSchema = z.object({
  content: z.string().min(1).max(10000),
});

const NoteFilterSchema = z.object({
  targetId: UuidSchema.optional(),
  spacId: UuidSchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const noteRouter = createTRPCRouter({
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get a single note by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.db.note.findUnique({
        where: { id: input.id },
        include: {
          target: {
            select: { id: true, name: true },
          },
          spac: {
            select: { id: true, name: true, ticker: true },
          },
        },
      });

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      return note;
    }),

  /**
   * List notes with filtering and pagination
   */
  list: protectedProcedure
    .input(NoteFilterSchema)
    .query(async ({ ctx, input }) => {
      const { targetId, spacId, page, pageSize } = input;

      const where: { targetId?: string; spacId?: string } = {};

      if (targetId) {
        where.targetId = targetId;
      }
      if (spacId) {
        where.spacId = spacId;
      }

      const [items, total] = await Promise.all([
        ctx.db.note.findMany({
          where,
          include: {
            target: {
              select: { id: true, name: true },
            },
            spac: {
              select: { id: true, name: true, ticker: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.note.count({ where }),
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
   * Create a new note
   */
  create: protectedProcedure
    .input(NoteCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate target exists if provided
      if (input.targetId) {
        const target = await ctx.db.target.findUnique({
          where: { id: input.targetId },
        });
        if (!target) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Target not found',
          });
        }
      }

      // Validate SPAC exists if provided
      if (input.spacId) {
        const spac = await ctx.db.spac.findUnique({
          where: { id: input.spacId },
        });
        if (!spac) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'SPAC not found',
          });
        }
      }

      const note = await ctx.db.note.create({
        data: {
          content: input.content,
          targetId: input.targetId || null,
          spacId: input.spacId || null,
          createdBy: input.createdBy || null,
        },
        include: {
          target: {
            select: { id: true, name: true },
          },
          spac: {
            select: { id: true, name: true, ticker: true },
          },
        },
      });

      return note;
    }),

  /**
   * Update a note
   */
  update: protectedProcedure
    .input(z.object({
      id: UuidSchema,
      data: NoteUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.note.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      const note = await ctx.db.note.update({
        where: { id: input.id },
        data: { content: input.data.content },
        include: {
          target: {
            select: { id: true, name: true },
          },
          spac: {
            select: { id: true, name: true, ticker: true },
          },
        },
      });

      return note;
    }),

  /**
   * Delete a note
   */
  delete: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.note.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      await ctx.db.note.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ============================================================================
  // SPECIALIZED QUERIES
  // ============================================================================

  /**
   * Get notes for a target
   */
  getByTarget: protectedProcedure
    .input(z.object({ targetId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const notes = await ctx.db.note.findMany({
        where: { targetId: input.targetId },
        orderBy: { createdAt: 'desc' },
      });

      return notes;
    }),

  /**
   * Get notes for a SPAC
   */
  getBySpac: protectedProcedure
    .input(z.object({ spacId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const notes = await ctx.db.note.findMany({
        where: { spacId: input.spacId },
        orderBy: { createdAt: 'desc' },
      });

      return notes;
    }),
});
