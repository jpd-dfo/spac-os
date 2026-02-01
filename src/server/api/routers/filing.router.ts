/**
 * SPAC OS - Filing Router
 * SEC filing management and tracking
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';
import {
  FilingCreateSchema,
  FilingUpdateSchema,
  UuidSchema,
  PaginationSchema,
  FilingTypeSchema,
  FilingStatusSchema,
} from '@/schemas';

export const filingRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const filing = await ctx.db.filing.findUnique({
        where: { id: input.id },
        include: {
          spac: {
            select: { id: true, name: true, ticker: true, cik: true },
          },
          parentFiling: {
            select: { id: true, type: true, filedDate: true, accessionNumber: true },
          },
          amendments: {
            orderBy: { amendmentNumber: 'asc' },
            select: { id: true, amendmentNumber: true, filedDate: true, status: true },
          },
          documents: {
            include: { document: true },
          },
          secComments: {
            orderBy: { commentNumber: 'asc' },
          },
          tasks: {
            where: { deletedAt: null, status: { not: 'COMPLETED' } },
            orderBy: { dueDate: 'asc' },
          },
          comments: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!filing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      return filing;
    }),

  list: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      type: z.array(FilingTypeSchema).optional(),
      status: z.array(FilingStatusSchema).optional(),
      filedAfter: z.coerce.date().optional(),
      filedBefore: z.coerce.date().optional(),
      search: z.string().optional(),
      ...PaginationSchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { spacId, type, status, filedAfter, filedBefore, search, page, pageSize, sortBy, sortOrder } = input;

      const where: any = {};

      if (spacId) where.spacId = spacId;
      if (type?.length) where.type = { in: type };
      if (status?.length) where.status = { in: status };
      if (filedAfter) where.filedDate = { ...where.filedDate, gte: filedAfter };
      if (filedBefore) where.filedDate = { ...where.filedDate, lte: filedBefore };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { accessionNumber: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.filing.findMany({
          where,
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
            _count: { select: { secComments: true, documents: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { filedDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.filing.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  create: orgAuditedProcedure
    .input(FilingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const spac = await ctx.db.spac.findUnique({
        where: { id: input.spacId },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      // Set CIK from SPAC if not provided
      const cik = input.cik || spac.cik;

      const filing = await ctx.db.filing.create({
        data: {
          ...input,
          cik,
        },
        include: {
          spac: true,
        },
      });

      return filing;
    }),

  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: FilingUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.filing.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      const filing = await ctx.db.filing.update({
        where: { id: input.id },
        data: input.data,
        include: {
          spac: true,
          secComments: true,
        },
      });

      return filing;
    }),

  delete: orgAuditedProcedure
    .input(z.object({ id: UuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.filing.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      // Only allow deletion of draft filings
      if (existing.status !== 'DRAFTING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft filings can be deleted',
        });
      }

      await ctx.db.filing.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ============================================================================
  // SPECIALIZED OPERATIONS
  // ============================================================================

  /**
   * Update filing status with workflow validation
   */
  updateStatus: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      status: FilingStatusSchema,
      filedDate: z.coerce.date().optional(),
      effectiveDate: z.coerce.date().optional(),
      accessionNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const filing = await ctx.db.filing.findUnique({
        where: { id: input.id },
      });

      if (!filing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        DRAFTING: ['INTERNAL_REVIEW'],
        INTERNAL_REVIEW: ['LEGAL_REVIEW', 'DRAFTING'],
        LEGAL_REVIEW: ['BOARD_APPROVAL', 'INTERNAL_REVIEW'],
        BOARD_APPROVAL: ['FILED', 'LEGAL_REVIEW'],
        FILED: ['SEC_COMMENT', 'EFFECTIVE'],
        SEC_COMMENT: ['RESPONSE_FILED'],
        RESPONSE_FILED: ['AMENDED', 'EFFECTIVE', 'SEC_COMMENT'],
        AMENDED: ['SEC_COMMENT', 'EFFECTIVE'],
        EFFECTIVE: [],
        WITHDRAWN: [],
      };

      if (!validTransitions[filing.status]?.includes(input.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot transition from ${filing.status} to ${input.status}`,
        });
      }

      const updateData: any = { status: input.status };

      if (input.status === 'FILED') {
        updateData.filedDate = input.filedDate || new Date();
        if (input.accessionNumber) updateData.accessionNumber = input.accessionNumber;
      }

      if (input.status === 'EFFECTIVE') {
        updateData.effectiveDate = input.effectiveDate || new Date();
      }

      const updated = await ctx.db.filing.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  /**
   * Create filing amendment
   */
  createAmendment: orgAuditedProcedure
    .input(z.object({
      parentFilingId: UuidSchema,
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const parentFiling = await ctx.db.filing.findUnique({
        where: { id: input.parentFilingId },
        include: {
          amendments: {
            orderBy: { amendmentNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (!parentFiling) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parent filing not found',
        });
      }

      const nextAmendmentNumber =
        parentFiling.amendments.length > 0
          ? parentFiling.amendments[0].amendmentNumber + 1
          : 1;

      const amendment = await ctx.db.filing.create({
        data: {
          spacId: parentFiling.spacId,
          type: parentFiling.type,
          status: 'DRAFTING',
          title: `${parentFiling.title || parentFiling.type} - Amendment ${nextAmendmentNumber}`,
          description: input.description,
          cik: parentFiling.cik,
          fileNumber: parentFiling.fileNumber,
          amendmentNumber: nextAmendmentNumber,
          parentFilingId: input.parentFilingId,
        },
        include: {
          spac: true,
          parentFiling: true,
        },
      });

      return amendment;
    }),

  /**
   * Add SEC comment
   */
  addSecComment: orgAuditedProcedure
    .input(z.object({
      filingId: UuidSchema,
      commentNumber: z.number().int().positive(),
      commentText: z.string().min(1),
      receivedDate: z.coerce.date(),
      dueDate: z.coerce.date().optional(),
      category: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const filing = await ctx.db.filing.findUnique({
        where: { id: input.filingId },
      });

      if (!filing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      const comment = await ctx.db.secComment.create({
        data: {
          spacId: filing.spacId,
          filingId: input.filingId,
          commentNumber: input.commentNumber,
          commentText: input.commentText,
          receivedDate: input.receivedDate,
          dueDate: input.dueDate,
          category: input.category,
        },
      });

      // Update filing SEC comment count
      await ctx.db.filing.update({
        where: { id: input.filingId },
        data: {
          secCommentCount: { increment: 1 },
          secCommentDate: input.receivedDate,
        },
      });

      return comment;
    }),

  /**
   * Respond to SEC comment
   */
  respondToSecComment: orgAuditedProcedure
    .input(z.object({
      commentId: UuidSchema,
      responseText: z.string().min(1),
      responseDate: z.coerce.date().optional(),
      isResolved: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.secComment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SEC comment not found',
        });
      }

      const updated = await ctx.db.secComment.update({
        where: { id: input.commentId },
        data: {
          responseText: input.responseText,
          responseDate: input.responseDate || new Date(),
          isResolved: input.isResolved,
          resolvedDate: input.isResolved ? new Date() : null,
        },
      });

      return updated;
    }),

  /**
   * Get filing timeline
   */
  getTimeline: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const filing = await ctx.db.filing.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          type: true,
          status: true,
          filedDate: true,
          effectiveDate: true,
          internalReviewDate: true,
          externalReviewDate: true,
          secCommentDate: true,
          responseDate: true,
          createdAt: true,
          amendments: {
            select: {
              id: true,
              amendmentNumber: true,
              filedDate: true,
              effectiveDate: true,
              status: true,
            },
            orderBy: { amendmentNumber: 'asc' },
          },
          secComments: {
            select: {
              id: true,
              commentNumber: true,
              receivedDate: true,
              responseDate: true,
              isResolved: true,
            },
            orderBy: { receivedDate: 'asc' },
          },
        },
      });

      if (!filing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      // Build timeline events
      const events: Array<{
        date: Date;
        type: string;
        title: string;
        description?: string;
      }> = [];

      events.push({
        date: filing.createdAt,
        type: 'created',
        title: 'Filing Created',
      });

      if (filing.internalReviewDate) {
        events.push({
          date: filing.internalReviewDate,
          type: 'internal_review',
          title: 'Internal Review Started',
        });
      }

      if (filing.externalReviewDate) {
        events.push({
          date: filing.externalReviewDate,
          type: 'external_review',
          title: 'External Review Started',
        });
      }

      if (filing.filedDate) {
        events.push({
          date: filing.filedDate,
          type: 'filed',
          title: 'Filed with SEC',
        });
      }

      for (const comment of filing.secComments) {
        events.push({
          date: comment.receivedDate,
          type: 'sec_comment',
          title: `SEC Comment #${comment.commentNumber} Received`,
        });
        if (comment.responseDate) {
          events.push({
            date: comment.responseDate,
            type: 'response',
            title: `Response to Comment #${comment.commentNumber}`,
          });
        }
      }

      for (const amendment of filing.amendments) {
        if (amendment.filedDate) {
          events.push({
            date: amendment.filedDate,
            type: 'amendment',
            title: `Amendment ${amendment.amendmentNumber} Filed`,
          });
        }
      }

      if (filing.effectiveDate) {
        events.push({
          date: filing.effectiveDate,
          type: 'effective',
          title: 'Filing Effective',
        });
      }

      // Sort by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      return events;
    }),

  /**
   * Get filings statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ spacId: UuidSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.spacId) where.spacId = input.spacId;

      const [total, byType, byStatus, avgReviewTime] = await Promise.all([
        ctx.db.filing.count({ where }),
        ctx.db.filing.groupBy({
          by: ['type'],
          where,
          _count: true,
        }),
        ctx.db.filing.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        // Calculate average time from filing to effective
        ctx.db.filing.findMany({
          where: {
            ...where,
            filedDate: { not: null },
            effectiveDate: { not: null },
          },
          select: {
            filedDate: true,
            effectiveDate: true,
          },
        }).then((filings) => {
          if (filings.length === 0) return null;
          const totalDays = filings.reduce((sum, f) => {
            const days = Math.floor(
              (f.effectiveDate!.getTime() - f.filedDate!.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0);
          return totalDays / filings.length;
        }),
      ]);

      return {
        total,
        byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        averageReviewDays: avgReviewTime,
      };
    }),
});
