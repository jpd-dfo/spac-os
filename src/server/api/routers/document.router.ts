/**
 * SPAC OS - Document Router
 * Document management and version control
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  getSignedUrl as getSupabaseSignedUrl,
  isSupabaseConfigured,
  DOCUMENTS_BUCKET,
} from '@/lib/supabase';
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
      latestOnly: z.boolean().optional().default(true),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, targetId, type, status, category, search, latestOnly, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.DocumentWhereInput = { deletedAt: null };

      // Only show latest versions by default
      if (latestOnly) {
        where.isLatest = true;
      }

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
        data: {
          ...input as any,
          version: 1,
          isLatest: true,
        },
        include: {
          spac: true,
          target: true,
        },
      });

      return document;
    }),

  /**
   * Upload a new version of an existing document
   * Detects if a document with the same name exists for the entity and creates a new version
   */
  uploadNewVersion: orgAuditedProcedure
    .input(z.object({
      name: z.string(),
      spacId: UuidSchema.optional(),
      targetId: UuidSchema.optional(),
      type: DocumentTypeSchema.optional(),
      category: z.string().optional(),
      status: DocumentStatusSchema.optional(),
      fileUrl: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, spacId, targetId, ...rest } = input;

      // Find existing document with the same name for this entity
      const existingDocument = await ctx.db.document.findFirst({
        where: {
          name,
          spacId: spacId || null,
          targetId: targetId || null,
          isLatest: true,
          deletedAt: null,
        },
        orderBy: { version: 'desc' },
      });

      if (existingDocument) {
        // Mark existing as not latest
        await ctx.db.document.update({
          where: { id: existingDocument.id },
          data: { isLatest: false },
        });

        // Create new version
        const newVersion = await ctx.db.document.create({
          data: {
            name,
            spacId,
            targetId,
            ...rest as any,
            version: existingDocument.version + 1,
            parentId: existingDocument.parentId || existingDocument.id,
            isLatest: true,
          },
          include: {
            spac: true,
            target: true,
          },
        });

        return newVersion;
      }

      // No existing document - create as version 1
      const document = await ctx.db.document.create({
        data: {
          name,
          spacId,
          targetId,
          ...rest as any,
          version: 1,
          isLatest: true,
        },
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
  // VERSIONING
  // ============================================================================

  /**
   * Get version history for a document
   */
  getVersionHistory: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      // First get the document to find its parent chain
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      // Get the root document ID (either parentId or self if no parent)
      const rootId = document.parentId || document.id;

      // Get all versions that share the same parent (or are the parent)
      const versions = await ctx.db.document.findMany({
        where: {
          OR: [
            { id: rootId },
            { parentId: rootId },
          ],
          deletedAt: null,
        },
        orderBy: { version: 'desc' },
        include: {
          spac: { select: { id: true, name: true } },
          target: { select: { id: true, name: true } },
        },
      });

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

  // ============================================================================
  // STORAGE
  // ============================================================================

  /**
   * Generate a signed URL for downloading a document
   * The URL expires after the specified duration (default: 1 hour)
   */
  getSignedUrl: protectedProcedure
    .input(z.object({
      id: UuidSchema,
      expiresIn: z.number().int().min(60).max(604800).default(3600), // 1 min to 7 days
    }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        select: { id: true, name: true, fileUrl: true },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      if (!document.fileUrl) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document has no file attached' });
      }

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        // Return the fileUrl as-is if Supabase is not configured
        return {
          url: document.fileUrl,
          expiresAt: null,
        };
      }

      // Extract the storage path from the fileUrl
      // The fileUrl format is: documents/{path}
      const storagePath = document.fileUrl.startsWith(`${DOCUMENTS_BUCKET}/`)
        ? document.fileUrl.substring(`${DOCUMENTS_BUCKET}/`.length)
        : document.fileUrl;

      const { url, error } = await getSupabaseSignedUrl(storagePath, input.expiresIn);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate signed URL',
        });
      }

      return {
        url,
        expiresAt: new Date(Date.now() + input.expiresIn * 1000),
      };
    }),

  /**
   * Get download URL for a document (alias for getSignedUrl for convenience)
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        select: { id: true, name: true, fileUrl: true, mimeType: true },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      if (!document.fileUrl) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document has no file attached' });
      }

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return {
          url: document.fileUrl,
          fileName: document.name,
          mimeType: document.mimeType,
        };
      }

      // Extract the storage path from the fileUrl
      const storagePath = document.fileUrl.startsWith(`${DOCUMENTS_BUCKET}/`)
        ? document.fileUrl.substring(`${DOCUMENTS_BUCKET}/`.length)
        : document.fileUrl;

      const { url, error } = await getSupabaseSignedUrl(storagePath, 3600);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate download URL',
        });
      }

      return {
        url,
        fileName: document.name,
        mimeType: document.mimeType,
      };
    }),

  // ============================================================================
  // ANALYSIS CACHE
  // ============================================================================

  /**
   * Get cached analysis risk levels for multiple documents
   * Used to display risk badges on document cards
   */
  getCachedAnalysisRiskLevels: protectedProcedure
    .input(z.object({
      documentIds: z.array(UuidSchema),
    }))
    .query(async ({ ctx, input }) => {
      if (input.documentIds.length === 0) {
        return {};
      }

      try {
        // Get the most recent analysis for each document
        const analyses = await ctx.db.documentAnalysis.findMany({
          where: {
            documentId: { in: input.documentIds },
          },
          select: {
            documentId: true,
            riskLevel: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Create a map of document IDs to risk levels (only keep the most recent for each doc)
        const riskLevelMap: Record<string, string> = {};
        for (const analysis of analyses) {
          // Only add if not already in map (since we ordered by desc, first is most recent)
          if (!riskLevelMap[analysis.documentId] && analysis.riskLevel) {
            riskLevelMap[analysis.documentId] = analysis.riskLevel;
          }
        }

        return riskLevelMap;
      } catch {
        // If DocumentAnalysis table doesn't exist, return empty map
        return {};
      }
    }),
});
