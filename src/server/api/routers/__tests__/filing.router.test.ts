/**
 * Filing Router Unit Tests
 * Tests for SEC filing management operations
 */

import { TRPCError } from '@trpc/server';

import { filingRouter } from '../filing.router';
import {
  createAuthenticatedContext,
  type MockContext,
} from '@/test/trpc-test-utils';
import { mockData } from '@/test/prisma-mock';

// Mock the logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the SEC EDGAR client
jest.mock('@/lib/compliance/secEdgarClient', () => ({
  fetchCompanyFilings: jest.fn(),
  fetchFilingDetails: jest.fn(),
  mapFilingTypeToInternal: jest.fn((type: string) => type),
}));

// Create caller factory for testing
const createCaller = (ctx: MockContext) => {
  return filingRouter.createCaller(ctx as any);
};

describe('filingRouter', () => {
  let ctx: MockContext;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    ctx = createAuthenticatedContext();
    caller = createCaller(ctx);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should return a filing when found', async () => {
      const mockFiling = mockData.filing({
        spac: mockData.spac(),
        parentFiling: null,
        amendments: [],
        documents: [],
        secComments: [],
        tasks: [],
        comments: [],
      });

      ctx.db.filing.findUnique.mockResolvedValue(mockFiling);

      const result = await caller.getById({ id: mockFiling.id });

      expect(result).toEqual(mockFiling);
      expect(ctx.db.filing.findUnique).toHaveBeenCalledWith({
        where: { id: mockFiling.id },
        include: expect.objectContaining({
          spac: expect.any(Object),
          parentFiling: expect.any(Object),
          amendments: expect.any(Object),
        }),
      });
    });

    it('should throw NOT_FOUND when filing does not exist', async () => {
      ctx.db.filing.findUnique.mockResolvedValue(null);

      await expect(
        caller.getById({ id: '00000000-0000-0000-0000-000000000001' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Filing not found',
      });
    });
  });

  describe('list', () => {
    it('should return paginated list of filings', async () => {
      const mockFilings = [
        mockData.filing({
          id: '00000000-0000-0000-0000-000000000001',
          spac: mockData.spac(),
          _count: { secComments: 0, documents: 0 },
        }),
        mockData.filing({
          id: '00000000-0000-0000-0000-000000000002',
          type: 'FORM_8K',
          spac: mockData.spac(),
          _count: { secComments: 2, documents: 1 },
        }),
      ];

      ctx.db.filing.findMany.mockResolvedValue(mockFilings);
      ctx.db.filing.count.mockResolvedValue(2);

      const result = await caller.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by spacId', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      ctx.db.filing.findMany.mockResolvedValue([]);
      ctx.db.filing.count.mockResolvedValue(0);

      await caller.list({ spacId, page: 1, pageSize: 10 });

      expect(ctx.db.filing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            spacId,
          }),
        })
      );
    });

    it('should filter by type', async () => {
      ctx.db.filing.findMany.mockResolvedValue([]);
      ctx.db.filing.count.mockResolvedValue(0);

      await caller.list({
        type: ['S1', 'FORM_8K'],
        page: 1,
        pageSize: 10,
      });

      expect(ctx.db.filing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['S1', 'FORM_8K'] },
          }),
        })
      );
    });

    it('should filter by status', async () => {
      ctx.db.filing.findMany.mockResolvedValue([]);
      ctx.db.filing.count.mockResolvedValue(0);

      await caller.list({
        status: ['DRAFTING', 'FILED'],
        page: 1,
        pageSize: 10,
      });

      expect(ctx.db.filing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['DRAFTING', 'FILED'] },
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const filedAfter = new Date('2024-01-01');
      const filedBefore = new Date('2024-12-31');

      ctx.db.filing.findMany.mockResolvedValue([]);
      ctx.db.filing.count.mockResolvedValue(0);

      await caller.list({
        filedAfter,
        filedBefore,
        page: 1,
        pageSize: 10,
      });

      expect(ctx.db.filing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            filedDate: {
              gte: filedAfter,
              lte: filedBefore,
            },
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      ctx.db.filing.findMany.mockResolvedValue([]);
      ctx.db.filing.count.mockResolvedValue(0);

      await caller.list({ search: 'test', page: 1, pageSize: 10 });

      expect(ctx.db.filing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { accessionNumber: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new filing', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const spac = mockData.spac({ id: spacId, cik: '0001234567' });
      const input = {
        spacId,
        type: 'S1' as const,
        status: 'DRAFTING' as const,
        title: 'S-1 Registration Statement',
      };

      const createdFiling = mockData.filing({
        ...input,
        cik: spac.cik,
        spac,
      });

      ctx.db.spac.findUnique.mockResolvedValue(spac);
      ctx.db.filing.create.mockResolvedValue(createdFiling);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.create(input);

      expect(result).toEqual(createdFiling);
      expect(ctx.db.filing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            spacId,
            type: 'S1',
            cik: '0001234567',
          }),
        })
      );
    });

    it('should throw NOT_FOUND when SPAC does not exist', async () => {
      ctx.db.spac.findUnique.mockResolvedValue(null);

      await expect(
        caller.create({
          spacId: '00000000-0000-0000-0000-000000000001',
          type: 'S1',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'SPAC not found',
      });
    });

    it('should use provided CIK over SPAC CIK', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const spac = mockData.spac({ id: spacId, cik: '0001234567' });
      const input = {
        spacId,
        type: 'S1' as const,
        cik: '0009999999', // Different CIK
      };

      const createdFiling = mockData.filing({
        ...input,
        spac,
      });

      ctx.db.spac.findUnique.mockResolvedValue(spac);
      ctx.db.filing.create.mockResolvedValue(createdFiling);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.create(input);

      expect(ctx.db.filing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cik: '0009999999',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing filing', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({ id: filingId, title: 'Old Title' });
      const updatedFiling = mockData.filing({
        id: filingId,
        title: 'Updated Title',
        spac: mockData.spac(),
        secComments: [],
      });

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);
      ctx.db.filing.update.mockResolvedValue(updatedFiling);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.update({
        id: filingId,
        data: { title: 'Updated Title' },
      });

      expect(result.title).toBe('Updated Title');
      expect(ctx.db.filing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: filingId },
          data: expect.objectContaining({ title: 'Updated Title' }),
        })
      );
    });

    it('should throw NOT_FOUND when filing does not exist', async () => {
      ctx.db.filing.findUnique.mockResolvedValue(null);

      await expect(
        caller.update({
          id: '00000000-0000-0000-0000-000000000001',
          data: { title: 'Updated Title' },
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Filing not found',
      });
    });
  });

  describe('delete', () => {
    it('should delete a draft filing', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({
        id: filingId,
        status: 'DRAFTING',
      });

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);
      ctx.db.filing.delete.mockResolvedValue(existingFiling);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.delete({ id: filingId });

      expect(result).toEqual({ success: true });
      expect(ctx.db.filing.delete).toHaveBeenCalledWith({
        where: { id: filingId },
      });
    });

    it('should throw NOT_FOUND when filing does not exist', async () => {
      ctx.db.filing.findUnique.mockResolvedValue(null);

      await expect(
        caller.delete({ id: '00000000-0000-0000-0000-000000000001' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Filing not found',
      });
    });

    it('should throw BAD_REQUEST when filing is not a draft', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({
        id: filingId,
        status: 'FILED',
      });

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);

      await expect(caller.delete({ id: filingId })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Only draft filings can be deleted',
      });
    });
  });

  describe('updateStatus', () => {
    it('should update filing status with valid transition', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({
        id: filingId,
        status: 'DRAFTING',
      });
      const updatedFiling = mockData.filing({
        id: filingId,
        status: 'INTERNAL_REVIEW',
      });

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);
      ctx.db.filing.update.mockResolvedValue(updatedFiling);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.updateStatus({
        id: filingId,
        status: 'INTERNAL_REVIEW',
      });

      expect(result.status).toBe('INTERNAL_REVIEW');
    });

    it('should throw BAD_REQUEST for invalid status transition', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({
        id: filingId,
        status: 'DRAFTING',
      });

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);

      await expect(
        caller.updateStatus({
          id: filingId,
          status: 'EFFECTIVE', // Invalid: cannot go from DRAFTING to EFFECTIVE
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Cannot transition from DRAFTING to EFFECTIVE',
      });
    });

    it('should set filedDate when transitioning to FILED', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({
        id: filingId,
        status: 'BOARD_APPROVAL',
      });
      const filedDate = new Date('2024-06-15');

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);
      ctx.db.filing.update.mockResolvedValue({
        ...existingFiling,
        status: 'FILED',
        filedDate,
      });
      ctx.db.auditLog.create.mockResolvedValue({});

      await caller.updateStatus({
        id: filingId,
        status: 'FILED',
        filedDate,
        accessionNumber: '0001234567-24-000001',
      });

      expect(ctx.db.filing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FILED',
            filedDate,
            accessionNumber: '0001234567-24-000001',
          }),
        })
      );
    });

    it('should set effectiveDate when transitioning to EFFECTIVE', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const existingFiling = mockData.filing({
        id: filingId,
        status: 'FILED',
      });
      const effectiveDate = new Date('2024-07-15');

      ctx.db.filing.findUnique.mockResolvedValue(existingFiling);
      ctx.db.filing.update.mockResolvedValue({
        ...existingFiling,
        status: 'EFFECTIVE',
        effectiveDate,
      });
      ctx.db.auditLog.create.mockResolvedValue({});

      await caller.updateStatus({
        id: filingId,
        status: 'EFFECTIVE',
        effectiveDate,
      });

      expect(ctx.db.filing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'EFFECTIVE',
            effectiveDate,
          }),
        })
      );
    });
  });

  describe('createAmendment', () => {
    it('should create filing amendment', async () => {
      const parentFilingId = '00000000-0000-0000-0000-000000000001';
      const parentFiling = mockData.filing({
        id: parentFilingId,
        type: 'S1',
        title: 'S-1 Registration Statement',
        amendments: [],
      });

      const amendment = mockData.filing({
        id: '00000000-0000-0000-0000-000000000002',
        type: 'S1',
        title: 'S-1 Registration Statement - Amendment 1',
        amendmentNumber: 1,
        parentFilingId,
        spac: mockData.spac(),
        parentFiling,
      });

      ctx.db.filing.findUnique.mockResolvedValue(parentFiling);
      ctx.db.filing.create.mockResolvedValue(amendment);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.createAmendment({
        parentFilingId,
        description: 'First amendment',
      });

      expect(result.amendmentNumber).toBe(1);
      expect(result.parentFilingId).toBe(parentFilingId);
      expect(ctx.db.filing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentFilingId,
            amendmentNumber: 1,
            status: 'DRAFTING',
          }),
        })
      );
    });

    it('should increment amendment number correctly', async () => {
      const parentFilingId = '00000000-0000-0000-0000-000000000001';
      const parentFiling = mockData.filing({
        id: parentFilingId,
        type: 'S1',
        amendments: [{ amendmentNumber: 2 }], // Already has 2 amendments
      });

      ctx.db.filing.findUnique.mockResolvedValue(parentFiling);
      ctx.db.filing.create.mockResolvedValue(
        mockData.filing({
          amendmentNumber: 3,
          parentFilingId,
          spac: mockData.spac(),
          parentFiling,
        })
      );
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.createAmendment({ parentFilingId });

      expect(ctx.db.filing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amendmentNumber: 3,
          }),
        })
      );
    });

    it('should throw NOT_FOUND when parent filing does not exist', async () => {
      ctx.db.filing.findUnique.mockResolvedValue(null);

      await expect(
        caller.createAmendment({
          parentFilingId: '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Parent filing not found',
      });
    });
  });

  describe('addSecComment', () => {
    it('should add SEC comment to filing', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const filing = mockData.filing({ id: filingId });
      const comment = mockData.secComment({
        filingId,
        commentNumber: 1,
        commentText: 'Please clarify the risk factors.',
      });

      ctx.db.filing.findUnique.mockResolvedValue(filing);
      ctx.db.secComment.create.mockResolvedValue(comment);
      ctx.db.filing.update.mockResolvedValue({
        ...filing,
        secCommentCount: 1,
      });
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.addSecComment({
        filingId,
        commentNumber: 1,
        commentText: 'Please clarify the risk factors.',
        receivedDate: new Date(),
      });

      expect(result.commentNumber).toBe(1);
      expect(ctx.db.filing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: filingId },
          data: expect.objectContaining({
            secCommentCount: { increment: 1 },
          }),
        })
      );
    });

    it('should throw NOT_FOUND when filing does not exist', async () => {
      ctx.db.filing.findUnique.mockResolvedValue(null);

      await expect(
        caller.addSecComment({
          filingId: '00000000-0000-0000-0000-000000000001',
          commentNumber: 1,
          commentText: 'Test comment',
          receivedDate: new Date(),
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Filing not found',
      });
    });
  });

  describe('respondToSecComment', () => {
    it('should respond to SEC comment', async () => {
      const commentId = '00000000-0000-0000-0000-000000000001';
      const comment = mockData.secComment({
        id: commentId,
        isResolved: false,
      });
      const updatedComment = {
        ...comment,
        responseText: 'We have updated the risk factors.',
        responseDate: new Date(),
        isResolved: true,
        resolvedDate: new Date(),
      };

      ctx.db.secComment.findUnique.mockResolvedValue(comment);
      ctx.db.secComment.update.mockResolvedValue(updatedComment);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.respondToSecComment({
        commentId,
        responseText: 'We have updated the risk factors.',
        isResolved: true,
      });

      expect(result.responseText).toBe('We have updated the risk factors.');
      expect(result.isResolved).toBe(true);
    });

    it('should throw NOT_FOUND when comment does not exist', async () => {
      ctx.db.secComment.findUnique.mockResolvedValue(null);

      await expect(
        caller.respondToSecComment({
          commentId: '00000000-0000-0000-0000-000000000001',
          responseText: 'Response',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'SEC comment not found',
      });
    });
  });

  describe('getTimeline', () => {
    it('should return filing timeline events', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const filing = {
        id: filingId,
        type: 'S1',
        status: 'EFFECTIVE',
        filedDate: new Date('2024-06-01'),
        effectiveDate: new Date('2024-07-01'),
        internalReviewDate: new Date('2024-05-01'),
        externalReviewDate: new Date('2024-05-15'),
        secCommentDate: null,
        responseDate: null,
        createdAt: new Date('2024-04-01'),
        amendments: [],
        secComments: [],
      };

      ctx.db.filing.findUnique.mockResolvedValue(filing);

      const result = await caller.getTimeline({ id: filingId });

      expect(result).toHaveLength(5); // created, internal_review, external_review, filed, effective
      expect(result[0].type).toBe('created');
      expect(result[result.length - 1].type).toBe('effective');
    });

    it('should include SEC comments in timeline', async () => {
      const filingId = '00000000-0000-0000-0000-000000000001';
      const filing = {
        id: filingId,
        type: 'S1',
        status: 'SEC_COMMENT',
        filedDate: new Date('2024-06-01'),
        effectiveDate: null,
        internalReviewDate: null,
        externalReviewDate: null,
        secCommentDate: new Date('2024-06-15'),
        responseDate: null,
        createdAt: new Date('2024-04-01'),
        amendments: [],
        secComments: [
          {
            id: 'comment-1',
            commentNumber: 1,
            receivedDate: new Date('2024-06-15'),
            responseDate: new Date('2024-06-20'),
            isResolved: true,
          },
        ],
      };

      ctx.db.filing.findUnique.mockResolvedValue(filing);

      const result = await caller.getTimeline({ id: filingId });

      const secCommentEvent = result.find((e) => e.type === 'sec_comment');
      const responseEvent = result.find((e) => e.type === 'response');

      expect(secCommentEvent).toBeDefined();
      expect(responseEvent).toBeDefined();
    });

    it('should throw NOT_FOUND when filing does not exist', async () => {
      ctx.db.filing.findUnique.mockResolvedValue(null);

      await expect(
        caller.getTimeline({ id: '00000000-0000-0000-0000-000000000001' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Filing not found',
      });
    });
  });

  describe('getStatistics', () => {
    it('should return filing statistics', async () => {
      ctx.db.filing.count.mockResolvedValue(15);
      ctx.db.filing.groupBy.mockResolvedValueOnce([
        { type: 'S1', _count: 5 },
        { type: 'FORM_8K', _count: 8 },
        { type: 'FORM_10K', _count: 2 },
      ]); // byType
      ctx.db.filing.groupBy.mockResolvedValueOnce([
        { status: 'DRAFTING', _count: 3 },
        { status: 'FILED', _count: 7 },
        { status: 'EFFECTIVE', _count: 5 },
      ]); // byStatus
      ctx.db.filing.findMany.mockResolvedValue([
        { filedDate: new Date('2024-01-01'), effectiveDate: new Date('2024-02-15') },
        { filedDate: new Date('2024-03-01'), effectiveDate: new Date('2024-04-01') },
      ]); // for avgReviewTime

      const result = await caller.getStatistics({});

      expect(result.total).toBe(15);
      expect(result.byType).toEqual({
        S1: 5,
        FORM_8K: 8,
        FORM_10K: 2,
      });
      expect(result.byStatus).toEqual({
        DRAFTING: 3,
        FILED: 7,
        EFFECTIVE: 5,
      });
      expect(result.averageReviewDays).toBeDefined();
    });

    it('should filter statistics by spacId', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      ctx.db.filing.count.mockResolvedValue(0);
      ctx.db.filing.groupBy.mockResolvedValue([]);
      ctx.db.filing.findMany.mockResolvedValue([]);

      await caller.getStatistics({ spacId });

      expect(ctx.db.filing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          spacId,
        }),
      });
    });
  });

  describe('Workflow operations', () => {
    describe('getWorkflow', () => {
      it('should return workflow steps for filing', async () => {
        const filingId = '00000000-0000-0000-0000-000000000001';
        const steps = [
          { id: 'step-1', filingId, name: 'Draft', order: 1, status: 'completed' },
          { id: 'step-2', filingId, name: 'Review', order: 2, status: 'in_progress' },
        ];

        ctx.db.filingWorkflowStep.findMany.mockResolvedValue(steps);

        const result = await caller.getWorkflow({ filingId });

        expect(result).toHaveLength(2);
        expect(ctx.db.filingWorkflowStep.findMany).toHaveBeenCalledWith({
          where: { filingId },
          orderBy: { order: 'asc' },
        });
      });
    });

    describe('updateWorkflowStep', () => {
      it('should update workflow step status', async () => {
        const stepId = '00000000-0000-0000-0000-000000000001';
        const updatedStep = {
          id: stepId,
          status: 'completed',
          completedAt: new Date(),
          completedById: 'user-1',
        };

        ctx.db.filingWorkflowStep.update.mockResolvedValue(updatedStep);
        ctx.db.auditLog.create.mockResolvedValue({});

        const result = await caller.updateWorkflowStep({
          stepId,
          status: 'completed',
          completedById: 'user-1',
        });

        expect(result.status).toBe('completed');
        expect(ctx.db.filingWorkflowStep.update).toHaveBeenCalledWith({
          where: { id: stepId },
          data: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date),
          }),
        });
      });
    });
  });

  describe('Reviewer operations', () => {
    describe('addReviewer', () => {
      it('should add reviewer to filing', async () => {
        const filingId = '00000000-0000-0000-0000-000000000001';
        const reviewer = {
          id: 'reviewer-1',
          filingId,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'legal',
          status: 'pending',
        };

        ctx.db.filingReviewer.create.mockResolvedValue(reviewer);
        ctx.db.auditLog.create.mockResolvedValue({});

        const result = await caller.addReviewer({
          filingId,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'legal',
        });

        expect(result.name).toBe('John Doe');
        expect(result.role).toBe('legal');
      });
    });

    describe('updateReviewerStatus', () => {
      it('should update reviewer status', async () => {
        const reviewerId = '00000000-0000-0000-0000-000000000001';
        const updatedReviewer = {
          id: reviewerId,
          status: 'approved',
          reviewedAt: new Date(),
          comments: 'Looks good',
        };

        ctx.db.filingReviewer.update.mockResolvedValue(updatedReviewer);
        ctx.db.auditLog.create.mockResolvedValue({});

        const result = await caller.updateReviewerStatus({
          reviewerId,
          status: 'approved',
          comments: 'Looks good',
        });

        expect(result.status).toBe('approved');
        expect(ctx.db.filingReviewer.update).toHaveBeenCalledWith({
          where: { id: reviewerId },
          data: expect.objectContaining({
            status: 'approved',
            reviewedAt: expect.any(Date),
          }),
        });
      });
    });
  });

  describe('Checklist operations', () => {
    describe('getChecklist', () => {
      it('should return checklist items for filing', async () => {
        const filingId = '00000000-0000-0000-0000-000000000001';
        const items = [
          { id: 'item-1', filingId, item: 'Review financials', isCompleted: true },
          { id: 'item-2', filingId, item: 'Legal sign-off', isCompleted: false },
        ];

        ctx.db.filingChecklist.findMany.mockResolvedValue(items);

        const result = await caller.getChecklist({ filingId });

        expect(result).toHaveLength(2);
      });
    });

    describe('addChecklistItem', () => {
      it('should add checklist item', async () => {
        const filingId = '00000000-0000-0000-0000-000000000001';
        const item = {
          id: 'item-1',
          filingId,
          item: 'New checklist item',
          category: 'Legal',
          isCompleted: false,
        };

        ctx.db.filingChecklist.create.mockResolvedValue(item);
        ctx.db.auditLog.create.mockResolvedValue({});

        const result = await caller.addChecklistItem({
          filingId,
          item: 'New checklist item',
          category: 'Legal',
        });

        expect(result.item).toBe('New checklist item');
      });
    });

    describe('updateChecklistItem', () => {
      it('should update checklist item completion status', async () => {
        const itemId = '00000000-0000-0000-0000-000000000001';
        const updatedItem = {
          id: itemId,
          isCompleted: true,
          completedAt: new Date(),
          completedBy: 'user-1',
        };

        ctx.db.filingChecklist.update.mockResolvedValue(updatedItem);
        ctx.db.auditLog.create.mockResolvedValue({});

        const result = await caller.updateChecklistItem({
          itemId,
          isCompleted: true,
          completedBy: 'user-1',
        });

        expect(result.isCompleted).toBe(true);
      });
    });
  });
});
