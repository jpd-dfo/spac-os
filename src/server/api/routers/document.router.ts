/**
 * SPAC OS - Document Router
 * Document management and version control
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  DocumentCreateSchema,
  DocumentUpdateSchema,
  UuidSchema,
  PaginationSchema,
  DocumentTypeSchema,
  DocumentStatusSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

export const documentRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          target: { select: { id: true, name: true } },
          filings: {
            include: { filing: { select: { id: true, type: true, title: true } } },
          },
        },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      return document;
    }),

  list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      targetId: UuidSchema.optional(),
      type: z.array(DocumentTypeSchema).optional(),
      status: z.array(DocumentStatusSchema).optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, targetId, type, status, category, search, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.DocumentWhereInput = { deletedAt: null };

      if (spacId) {where.spacId = spacId;}
      if (targetId) {where.targetId = targetId;}
      if (type?.length) {where.type = { in: type as any };}
      if (status?.length) {where.status = { in: status as any };}
      if (category) {where.category = category;}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.document.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
            target: { select: { id: true, name: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.document.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  create: orgAuditedProcedure
    .input(DocumentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.create({
        data: input as any,
        include: {
          spac: true,
          target: true,
        },
      });

      return document;
    }),

  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: DocumentUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.document.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      const document = await ctx.db.document.update({
        where: { id: input.id },
        data: input.data as any,
        include: { spac: true, target: true },
      });

      return document;
    }),

  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.document.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      await ctx.db.document.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  // ============================================================================
  // STATUS & WORKFLOW
  // ============================================================================

  /**
   * Update document status
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: DocumentStatusSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      const updated = await ctx.db.document.update({
        where: { id: input.id },
        data: { status: input.status as any },
      });

      return updated;
    }),

  /**
   * Attach document to filing
   */
  attachToFiling: orgAuditedProcedure
    .input(z.object({
      documentId: UuidSchema,
      filingId: UuidSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.filingDocument.upsert({
        where: {
          filingId_documentId: {
            filingId: input.filingId,
            documentId: input.documentId,
          },
        },
        create: {
          filingId: input.filingId,
          documentId: input.documentId,
        },
        update: {},
      });

      return { success: true };
    }),

  /**
   * Detach document from filing
   */
  detachFromFiling: orgAuditedProcedure
    .input(z.object({
      documentId: UuidSchema,
      filingId: UuidSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.filingDocument.delete({
        where: {
          filingId_documentId: {
            filingId: input.filingId,
            documentId: input.documentId,
          },
        },
      });

      return { success: true };
    }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get document statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      targetId: UuidSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.DocumentWhereInput = { deletedAt: null };
      if (input.spacId) {where.spacId = input.spacId;}
      if (input.targetId) {where.targetId = input.targetId;}

      const [total, byType, byStatus, totalSize, recentUploads] = await Promise.all([
        ctx.db.document.count({ where }),
        ctx.db.document.groupBy({
          by: ['type'],
          where,
          _count: true,
        }),
        ctx.db.document.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        ctx.db.document.aggregate({
          where,
          _sum: { fileSize: true },
        }),
        ctx.db.document.count({
          where: {
            ...where,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      return {
        total,
        byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        totalSizeBytes: totalSize._sum.fileSize || 0,
        recentUploads,
      };
    }),

  /**
   * Get recent documents
   */
  getRecent: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.DocumentWhereInput = { deletedAt: null };
      if (input.spacId) {where.spacId = input.spacId;}

      return ctx.db.document.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  /**
   * Search documents by content (if available)
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(2),
      spacId: UuidSchema.optional(),
      type: z.array(DocumentTypeSchema).optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.DocumentWhereInput = {
        deletedAt: null,
        OR: [
          { name: { contains: input.query, mode: 'insensitive' } },
        ],
      };

      if (input.spacId) {where.spacId = input.spacId;}
      if (input.type?.length) {where.type = { in: input.type as any };}

      return ctx.db.document.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit,
      });
    }),
});
