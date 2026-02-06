/**
 * SPAC OS - Filing Router
 * SEC filing management and tracking
 */

import { type Prisma, type FilingType as PrismaFilingType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  fetchCompanyFilings,
  mapFilingTypeToInternal,
  type EdgarFiling,
} from '@/lib/compliance/secEdgarClient';
import { logger } from '@/lib/logger';
import {
  FilingCreateSchema,
  FilingUpdateSchema,
  UuidSchema,
  PaginationSchema,
  FilingTypeSchema,
  FilingStatusSchema,
} from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

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

      const where: Prisma.FilingWhereInput = {};

      if (spacId) {where.spacId = spacId;}
      if (type?.length) {where.type = { in: type as any };}
      if (status?.length) {where.status = { in: status };}
      if (filedAfter || filedBefore) {
        where.filedDate = {
          ...(filedAfter && { gte: filedAfter }),
          ...(filedBefore && { lte: filedBefore }),
        };
      }

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
          ...input as any,
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
        data: input.data as any,
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

      const updateData: Prisma.FilingUpdateInput = { status: input.status };

      if (input.status === 'FILED') {
        updateData.filedDate = input.filedDate || new Date();
        if (input.accessionNumber) {updateData.accessionNumber = input.accessionNumber;}
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
          ? (parentFiling.amendments[0]?.amendmentNumber ?? 0) + 1
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
      const where: Prisma.FilingWhereInput = {};
      if (input.spacId) {where.spacId = input.spacId;}

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
          if (filings.length === 0) {return null;}
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

  // ============================================================================
  // SEC EDGAR INTEGRATION
  // ============================================================================

  /**
   * Get filings from SEC EDGAR API
   * Fetches filings directly from SEC EDGAR without syncing to database
   */
  getEdgarFilings: protectedProcedure
    .input(z.object({
      cik: z.string().min(1, 'CIK is required'),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      formTypes: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      const { cik, page, pageSize, formTypes } = input;

      try {
        const result = await fetchCompanyFilings(cik, {
          page,
          pageSize,
          formTypes,
        });

        return {
          filings: result.filings,
          totalFilings: result.totalFilings,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.totalFilings / result.pageSize),
          companyInfo: result.companyInfo,
        };
      } catch (error) {
        logger.error('Error fetching EDGAR filings:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch filings from SEC EDGAR',
          cause: error,
        });
      }
    }),

  /**
   * Sync filings from SEC EDGAR to database
   * Fetches filings from SEC and creates/updates them in the database
   */
  syncFilingsFromEdgar: orgAuditedProcedure
    .input(z.object({
      spacId: UuidSchema,
      formTypes: z.array(z.string()).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const { spacId, formTypes, limit } = input;

      // Get SPAC with CIK
      const spac = await ctx.db.spac.findUnique({
        where: { id: spacId },
        select: { id: true, cik: true, name: true, ticker: true },
      });

      if (!spac) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SPAC not found',
        });
      }

      if (!spac.cik) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'SPAC does not have a CIK number. Please add the CIK to sync filings from SEC EDGAR.',
        });
      }

      try {
        // Fetch filings from SEC EDGAR
        const result = await fetchCompanyFilings(spac.cik, {
          pageSize: limit,
          formTypes,
        });

        if (result.filings.length === 0) {
          return {
            synced: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            filings: [],
          };
        }

        // Get existing filings by accession number
        const existingFilings = await ctx.db.filing.findMany({
          where: {
            spacId,
            accessionNumber: {
              in: result.filings.map(f => f.accessionNumber),
            },
          },
          select: { id: true, accessionNumber: true },
        });

        const existingAccessionNumbers = new Set(
          existingFilings.map(f => f.accessionNumber).filter(Boolean)
        );

        // Process filings
        const created: string[] = [];
        const updated: string[] = [];
        const skipped: string[] = [];

        for (const edgarFiling of result.filings) {
          const accessionNumber = edgarFiling.accessionNumber;

          if (existingAccessionNumbers.has(accessionNumber)) {
            // Update existing filing
            const existing = existingFilings.find(f => f.accessionNumber === accessionNumber);
            if (existing) {
              await ctx.db.filing.update({
                where: { id: existing.id },
                data: {
                  filedDate: new Date(edgarFiling.filingDate),
                  edgarUrl: edgarFiling.documentUrls[0]?.documentUrl || null,
                  fileNumber: edgarFiling.fileNumber || null,
                },
              });
              updated.push(accessionNumber);
            }
          } else {
            // Create new filing
            const filingType = mapFilingTypeToInternal(edgarFiling.filingType);

            // Check if the filing type is valid for the Prisma schema
            const validFilingTypes: PrismaFilingType[] = [
              'S1', 'S4', 'F1', 'F4', 'DEFA14A', 'DEFM14A', 'PRER14A', 'PREM14A',
              'SC_TO', 'FORM_8K', 'FORM_10K', 'FORM_10Q', 'FORM_425', 'SUPER_8K',
              'REGISTRATION', 'PROXY', 'PROSPECTUS', 'OTHER'
            ];

            const prismaFilingType = validFilingTypes.includes(filingType as PrismaFilingType)
              ? (filingType as PrismaFilingType)
              : 'OTHER';

            try {
              await ctx.db.filing.create({
                data: {
                  spacId,
                  type: prismaFilingType,
                  status: 'FILED',
                  title: `${edgarFiling.filingType} - ${edgarFiling.primaryDocDescription || 'SEC Filing'}`,
                  description: edgarFiling.primaryDocDescription || null,
                  cik: spac.cik,
                  accessionNumber,
                  fileNumber: edgarFiling.fileNumber || null,
                  edgarUrl: edgarFiling.documentUrls[0]?.documentUrl || null,
                  filedDate: new Date(edgarFiling.filingDate),
                },
              });
              created.push(accessionNumber);
            } catch (createError) {
              logger.error(`Failed to create filing ${accessionNumber}:`, createError);
              skipped.push(accessionNumber);
            }
          }
        }

        // Get the synced filings
        const syncedFilings = await ctx.db.filing.findMany({
          where: {
            spacId,
            accessionNumber: {
              in: [...created, ...updated],
            },
          },
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: { filedDate: 'desc' },
        });

        return {
          synced: created.length + updated.length,
          created: created.length,
          updated: updated.length,
          skipped: skipped.length,
          filings: syncedFilings,
        };
      } catch (error) {
        logger.error('Error syncing EDGAR filings:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync filings from SEC EDGAR',
          cause: error,
        });
      }
    }),

  /**
   * Get EDGAR filing details
   * Fetches detailed information about a specific filing from SEC EDGAR
   */
  getEdgarFilingDetails: protectedProcedure
    .input(z.object({
      cik: z.string().min(1, 'CIK is required'),
      accessionNumber: z.string().min(1, 'Accession number is required'),
    }))
    .query(async ({ input }) => {
      const { cik, accessionNumber } = input;

      try {
        const { fetchFilingDetails } = await import('@/lib/compliance/secEdgarClient');
        const filing = await fetchFilingDetails(cik, accessionNumber);

        if (!filing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Filing not found in SEC EDGAR',
          });
        }

        return filing;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error('Error fetching EDGAR filing details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch filing details from SEC EDGAR',
          cause: error,
        });
      }
    }),

  // ============================================================================
  // SPRINT 9 - WORKFLOW, REVIEWERS, CHECKLIST
  // ============================================================================

  /**
   * Get filing workflow steps
   */
  getWorkflow: protectedProcedure
    .input(z.object({ filingId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const steps = await ctx.db.filingWorkflowStep.findMany({
        where: { filingId: input.filingId },
        orderBy: { order: 'asc' },
      });
      return steps;
    }),

  /**
   * Update workflow step status
   */
  updateWorkflowStep: orgAuditedProcedure
    .input(z.object({
      stepId: UuidSchema,
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
      completedById: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const step = await ctx.db.filingWorkflowStep.update({
        where: { id: input.stepId },
        data: {
          status: input.status,
          completedAt: input.status === 'COMPLETED' ? new Date() : null,
          completedById: input.completedById,
        },
      });
      return step;
    }),

  /**
   * Get filing reviewers
   */
  getReviewers: protectedProcedure
    .input(z.object({ filingId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const reviewers = await ctx.db.filingReviewer.findMany({
        where: { filingId: input.filingId },
        orderBy: { createdAt: 'asc' },
      });
      return reviewers;
    }),

  /**
   * Add reviewer to filing
   */
  addReviewer: orgAuditedProcedure
    .input(z.object({
      filingId: UuidSchema,
      userId: z.string().optional(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(['primary', 'secondary', 'legal', 'external']),
    }))
    .mutation(async ({ ctx, input }) => {
      const reviewer = await ctx.db.filingReviewer.create({
        data: {
          filingId: input.filingId,
          userId: input.userId,
          name: input.name,
          email: input.email,
          role: input.role,
          status: 'PENDING',
        },
      });
      return reviewer;
    }),

  /**
   * Update reviewer status
   */
  updateReviewerStatus: orgAuditedProcedure
    .input(z.object({
      reviewerId: UuidSchema,
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
      comments: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reviewer = await ctx.db.filingReviewer.update({
        where: { id: input.reviewerId },
        data: {
          status: input.status,
          comments: input.comments,
          reviewedAt: input.status !== 'PENDING' ? new Date() : null,
        },
      });
      return reviewer;
    }),

  /**
   * Get filing checklist
   */
  getChecklist: protectedProcedure
    .input(z.object({ filingId: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.filingChecklist.findMany({
        where: { filingId: input.filingId },
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      });
      return items;
    }),

  /**
   * Update checklist item
   */
  updateChecklistItem: orgAuditedProcedure
    .input(z.object({
      itemId: UuidSchema,
      isCompleted: z.boolean(),
      completedBy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.filingChecklist.update({
        where: { id: input.itemId },
        data: {
          isCompleted: input.isCompleted,
          completedAt: input.isCompleted ? new Date() : null,
          completedBy: input.completedBy,
        },
      });
      return item;
    }),

  /**
   * Add checklist item
   */
  addChecklistItem: orgAuditedProcedure
    .input(z.object({
      filingId: UuidSchema,
      item: z.string().min(1),
      category: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.coerce.date().optional(),
      order: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const checklistItem = await ctx.db.filingChecklist.create({
        data: {
          filingId: input.filingId,
          item: input.item,
          category: input.category,
          description: input.description,
          dueDate: input.dueDate,
          order: input.order,
        },
      });
      return checklistItem;
    }),
});
