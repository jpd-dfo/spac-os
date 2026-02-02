/**
 * SPAC OS - Document Router
 * Document management and version control
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';
import {
  DocumentCreateSchema,
  DocumentUpdateSchema,
  UuidSchema,
  PaginationSchema,
  DocumentTypeSchema,
  DocumentStatusSchema,
} from '@/schemas';

export const documentRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          target: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true, email: true } },
          parent: { select: { id: true, name: true, version: true } },
          versions: {
            orderBy: { version: 'desc' },
            select: { id: true, version: true, createdAt: true, uploadedBy: { select: { name: true } } },
          },
          filings: {
            include: { filing: { select: { id: true, type: true, title: true } } },
          },
          comments: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
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
      tags: z.array(z.string()).optional(),
      search: z.string().optional(),
      isLatest: z.boolean().optional(),
      uploadedById: UuidSchema.optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, targetId, type, status, category, tags, search, isLatest, uploadedById, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.DocumentWhereInput = { deletedAt: null };

      if (spacId) where.spacId = spacId;
      if (targetId) where.targetId = targetId;
      if (type?.length) where.type = { in: type };
      if (status?.length) where.status = { in: status };
      if (category) where.category = category;
      if (tags?.length) where.tags = { hasSome: tags };
      if (isLatest !== undefined) where.isLatest = isLatest;
      if (uploadedById) where.uploadedById = uploadedById;

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.document.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
            target: { select: { id: true, name: true } },
            uploadedBy: { select: { id: true, name: true } },
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
        data: input,
        include: {
          spac: true,
          target: true,
          uploadedBy: true,
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
        data: input.data,
        include: { spac: true, target: true, uploadedBy: true },
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
  // VERSION CONTROL
  // ============================================================================

  /**
   * Create a new version of a document
   */
  createVersion: orgAuditedProcedure
    .input(z.object({
      parentId: UuidSchema,
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      fileSize: z.number().int().positive(),
      filePath: z.string().min(1),
      storageKey: z.string().optional(),
      storageBucket: z.string().optional(),
      mimeType: z.string().optional(),
      checksum: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.db.document.findUnique({
        where: { id: input.parentId },
      });

      if (!parent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent document not found' });
      }

      // Set parent to not latest
      await ctx.db.document.update({
        where: { id: input.parentId },
        data: { isLatest: false },
      });

      // Create new version
      const newVersion = await ctx.db.document.create({
        data: {
          spacId: parent.spacId,
          targetId: parent.targetId,
          uploadedById: ctx.user!.id,
          name: parent.name,
          description: input.description || parent.description,
          type: parent.type,
          category: parent.category,
          status: 'DRAFT',
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          filePath: input.filePath,
          storageKey: input.storageKey,
          storageBucket: input.storageBucket,
          mimeType: input.mimeType,
          checksum: input.checksum,
          version: parent.version + 1,
          parentId: input.parentId,
          isLatest: true,
          isConfidential: parent.isConfidential,
          accessLevel: parent.accessLevel,
          confidentialityLevel: parent.confidentialityLevel,
          allowedUsers: parent.allowedUsers,
          allowedRoles: parent.allowedRoles,
          tags: parent.tags,
          metadata: parent.metadata,
        },
        include: {
          spac: true,
          target: true,
          uploadedBy: true,
          parent: true,
        },
      });

      return newVersion;
    }),

  /**
   * Get version history
   */
  getVersionHistory: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            include: {
              uploadedBy: { select: { id: true, name: true } },
            },
          },
          parent: {
            include: {
              versions: {
                orderBy: { version: 'desc' },
                include: {
                  uploadedBy: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      // Build full version history
      const versions = [
        document,
        ...document.versions,
        ...(document.parent ? [document.parent, ...document.parent.versions] : []),
      ].sort((a, b) => b.version - a.version);

      return versions;
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
        data: { status: input.status },
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
      role: z.string().max(100).optional(),
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
          role: input.role,
        },
        update: {
          role: input.role,
        },
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
  // ACCESS CONTROL
  // ============================================================================

  /**
   * Update document access
   */
  updateAccess: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      accessLevel: z.enum(['public', 'team', 'restricted']).optional(),
      allowedUsers: z.array(UuidSchema).optional(),
      allowedRoles: z.array(z.string()).optional(),
      isConfidential: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...accessData } = input;

      const document = await ctx.db.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      const updated = await ctx.db.document.update({
        where: { id },
        data: accessData,
      });

      return updated;
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
      if (input.spacId) where.spacId = input.spacId;
      if (input.targetId) where.targetId = input.targetId;

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
      const where: Prisma.DocumentWhereInput = { deletedAt: null, isLatest: true };
      if (input.spacId) where.spacId = input.spacId;

      return ctx.db.document.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          uploadedBy: { select: { id: true, name: true } },
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
          { description: { contains: input.query, mode: 'insensitive' } },
          { fileName: { contains: input.query, mode: 'insensitive' } },
          { tags: { has: input.query } },
        ],
      };

      if (input.spacId) where.spacId = input.spacId;
      if (input.type?.length) where.type = { in: input.type };

      return ctx.db.document.findMany({
        where,
        include: {
          spac: { select: { id: true, name: true, ticker: true } },
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit,
      });
    }),
});
