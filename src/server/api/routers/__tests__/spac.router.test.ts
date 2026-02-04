/**
 * SPAC Router Unit Tests
 * Tests for the SPAC CRUD operations
 */

import { TRPCError } from '@trpc/server';

import { spacRouter } from '../spac.router';
import {
  createAuthenticatedContext,
  type MockContext,
  TEST_ORG_ID,
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

// Create caller factory for testing
const createCaller = (ctx: MockContext) => {
  // We need to cast to any because the mock context doesn't have all Prisma methods
  return spacRouter.createCaller(ctx as any);
};

describe('spacRouter', () => {
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
    it('should return a SPAC when found', async () => {
      const mockSpac = mockData.spac({
        organization: mockData.organization(),
        sponsors: [],
        targets: [],
        trustAccounts: [],
        documents: [],
        filings: [],
        tasks: [],
        financials: [],
        _count: {
          targets: 0,
          documents: 0,
          filings: 0,
          tasks: 0,
          milestones: 0,
        },
      });

      ctx.db.spac.findUnique.mockResolvedValue(mockSpac);

      const result = await caller.getById({ id: mockSpac.id });

      expect(result).toEqual(mockSpac);
      expect(ctx.db.spac.findUnique).toHaveBeenCalledWith({
        where: { id: mockSpac.id },
        include: expect.objectContaining({
          organization: true,
          sponsors: expect.any(Object),
        }),
      });
    });

    it('should throw NOT_FOUND when SPAC does not exist', async () => {
      ctx.db.spac.findUnique.mockResolvedValue(null);

      await expect(
        caller.getById({ id: '00000000-0000-0000-0000-000000000001' })
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.getById({ id: '00000000-0000-0000-0000-000000000001' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'SPAC not found',
      });
    });

    it('should throw on invalid UUID input', async () => {
      await expect(caller.getById({ id: 'invalid-uuid' })).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return paginated list of SPACs', async () => {
      const mockSpacs = [
        mockData.spac({
          id: '00000000-0000-0000-0000-000000000001',
          sponsors: [],
          trustAccounts: [],
          _count: { targets: 0, tasks: 0 },
        }),
        mockData.spac({
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Another SPAC',
          ticker: 'ANOT',
          sponsors: [],
          trustAccounts: [],
          _count: { targets: 0, tasks: 0 },
        }),
      ];

      ctx.db.spac.findMany.mockResolvedValue(mockSpacs);
      ctx.db.spac.count.mockResolvedValue(2);

      const result = await caller.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      ctx.db.spac.findMany.mockResolvedValue([]);
      ctx.db.spac.count.mockResolvedValue(0);

      await caller.list({ status: ['SEARCHING', 'LOI_SIGNED'], page: 1, pageSize: 10 });

      expect(ctx.db.spac.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['SEARCHING', 'LOI_SIGNED'] },
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      ctx.db.spac.findMany.mockResolvedValue([]);
      ctx.db.spac.count.mockResolvedValue(0);

      await caller.list({ search: 'test', page: 1, pageSize: 10 });

      expect(ctx.db.spac.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { ticker: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should filter by organizationId', async () => {
      const orgId = '00000000-0000-0000-0000-000000000001';
      ctx.db.spac.findMany.mockResolvedValue([]);
      ctx.db.spac.count.mockResolvedValue(0);

      await caller.list({ organizationId: orgId, page: 1, pageSize: 10 });

      expect(ctx.db.spac.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: orgId,
          }),
        })
      );
    });

    it('should apply sorting', async () => {
      ctx.db.spac.findMany.mockResolvedValue([]);
      ctx.db.spac.count.mockResolvedValue(0);

      await caller.list({
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(ctx.db.spac.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new SPAC', async () => {
      // Use the same organizationId as the authenticated user (TEST_ORG_ID is a valid UUID)
      const input = {
        organizationId: TEST_ORG_ID,
        name: 'New SPAC',
        ticker: 'NEWSPAC',
        status: 'SEARCHING' as const,
        phase: 'TARGET_SEARCH' as const,
      };

      const createdSpac = mockData.spac({
        ...input,
        organization: mockData.organization({ id: TEST_ORG_ID }),
      });

      ctx.db.spac.findUnique.mockResolvedValue(null); // No existing ticker
      ctx.db.spac.create.mockResolvedValue(createdSpac);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.create(input);

      expect(result).toEqual(createdSpac);
      expect(ctx.db.spac.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New SPAC',
            ticker: 'NEWSPAC',
          }),
        })
      );
    });

    it('should throw CONFLICT when ticker already exists', async () => {
      const existingSpac = mockData.spac({ ticker: 'EXIST' });
      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);

      // Use the same organizationId as the authenticated user (TEST_ORG_ID is a valid UUID)
      await expect(
        caller.create({
          organizationId: TEST_ORG_ID,
          name: 'New SPAC',
          ticker: 'EXIST',
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'A SPAC with this ticker already exists',
      });
    });

    it('should allow creation without ticker', async () => {
      // Use the same organizationId as the authenticated user (TEST_ORG_ID is a valid UUID)
      const input = {
        organizationId: TEST_ORG_ID,
        name: 'SPAC Without Ticker',
      };

      const createdSpac = mockData.spac({
        ...input,
        ticker: null,
        organization: mockData.organization({ id: TEST_ORG_ID }),
      });

      ctx.db.spac.create.mockResolvedValue(createdSpac);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.create(input);

      expect(result.name).toBe('SPAC Without Ticker');
      // Should not check for existing ticker when not provided
      expect(ctx.db.spac.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing SPAC', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({ id: spacId, name: 'Old Name' });
      const updatedSpac = mockData.spac({
        id: spacId,
        name: 'Updated Name',
        organization: mockData.organization(),
        sponsors: [],
      });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);
      ctx.db.spac.update.mockResolvedValue(updatedSpac);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.update({
        id: spacId,
        data: { name: 'Updated Name' },
      });

      expect(result.name).toBe('Updated Name');
      expect(ctx.db.spac.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: spacId },
          data: expect.objectContaining({ name: 'Updated Name' }),
        })
      );
    });

    it('should throw NOT_FOUND when SPAC does not exist', async () => {
      ctx.db.spac.findUnique.mockResolvedValue(null);

      await expect(
        caller.update({
          id: '00000000-0000-0000-0000-000000000001',
          data: { name: 'Updated Name' },
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'SPAC not found',
      });
    });

    it('should throw CONFLICT when updating to existing ticker', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({ id: spacId, ticker: 'OLD' });
      const anotherSpac = mockData.spac({
        id: '00000000-0000-0000-0000-000000000002',
        ticker: 'TAKEN',
      });

      ctx.db.spac.findUnique
        .mockResolvedValueOnce(existingSpac) // First call: check if SPAC exists
        .mockResolvedValueOnce(anotherSpac); // Second call: check if ticker exists

      await expect(
        caller.update({
          id: spacId,
          data: { ticker: 'TAKEN' },
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'A SPAC with this ticker already exists',
      });
    });

    it('should allow updating ticker to same value', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({ id: spacId, ticker: 'SAME' });
      const updatedSpac = mockData.spac({
        ...existingSpac,
        organization: mockData.organization(),
        sponsors: [],
      });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);
      ctx.db.spac.update.mockResolvedValue(updatedSpac);
      ctx.db.auditLog.create.mockResolvedValue({});

      // Updating to same ticker should not trigger conflict check
      const result = await caller.update({
        id: spacId,
        data: { ticker: 'SAME' },
      });

      expect(result.ticker).toBe('SAME');
    });
  });

  describe('delete', () => {
    it('should soft delete a SPAC', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({ id: spacId });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);
      ctx.db.spac.update.mockResolvedValue({
        ...existingSpac,
        deletedAt: new Date(),
      });
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.delete({ id: spacId });

      expect(result).toEqual({ success: true });
      expect(ctx.db.spac.update).toHaveBeenCalledWith({
        where: { id: spacId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NOT_FOUND when SPAC does not exist', async () => {
      ctx.db.spac.findUnique.mockResolvedValue(null);

      await expect(
        caller.delete({ id: '00000000-0000-0000-0000-000000000001' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'SPAC not found',
      });
    });
  });

  describe('getStatistics', () => {
    it('should return SPAC statistics', async () => {
      ctx.db.spac.count.mockResolvedValueOnce(10); // total
      ctx.db.spac.groupBy.mockResolvedValueOnce([
        { status: 'SEARCHING', _count: 5 },
        { status: 'LOI_SIGNED', _count: 3 },
        { status: 'COMPLETED', _count: 2 },
      ]); // byStatus
      ctx.db.spac.groupBy.mockResolvedValueOnce([
        { phase: 'TARGET_SEARCH', _count: 4 },
        { phase: 'DUE_DILIGENCE', _count: 6 },
      ]); // byPhase
      ctx.db.spac.aggregate.mockResolvedValue({
        _avg: { ipoSize: 200000000, trustBalance: 195000000 },
        _sum: { ipoSize: 2000000000, trustBalance: 1950000000 },
      });
      ctx.db.spac.count.mockResolvedValueOnce(2); // recentlyCreated

      const result = await caller.getStatistics({});

      expect(result.total).toBe(10);
      expect(result.byStatus).toEqual({
        SEARCHING: 5,
        LOI_SIGNED: 3,
        COMPLETED: 2,
      });
      expect(result.byPhase).toEqual({
        TARGET_SEARCH: 4,
        DUE_DILIGENCE: 6,
      });
    });

    it('should filter statistics by organizationId', async () => {
      const orgId = '00000000-0000-0000-0000-000000000001';
      ctx.db.spac.count.mockResolvedValue(0);
      ctx.db.spac.groupBy.mockResolvedValue([]);
      ctx.db.spac.aggregate.mockResolvedValue({
        _avg: { ipoSize: null, trustBalance: null },
        _sum: { ipoSize: null, trustBalance: null },
      });

      await caller.getStatistics({ organizationId: orgId });

      expect(ctx.db.spac.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: orgId,
        }),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update SPAC status with valid transition', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({ id: spacId, status: 'SEARCHING' });
      const updatedSpac = mockData.spac({ id: spacId, status: 'LOI_SIGNED' });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);
      ctx.db.spac.update.mockResolvedValue(updatedSpac);
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.updateStatus({
        id: spacId,
        status: 'LOI_SIGNED',
      });

      expect(result.status).toBe('LOI_SIGNED');
    });

    it('should throw BAD_REQUEST for invalid status transition', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({ id: spacId, status: 'SEARCHING' });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);

      await expect(
        caller.updateStatus({
          id: spacId,
          status: 'COMPLETED', // Invalid: cannot go from SEARCHING to COMPLETED
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Cannot transition from SEARCHING to COMPLETED',
      });
    });

    it('should throw NOT_FOUND when SPAC does not exist', async () => {
      ctx.db.spac.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateStatus({
          id: '00000000-0000-0000-0000-000000000001',
          status: 'LOI_SIGNED',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'SPAC not found',
      });
    });
  });

  describe('extendDeadline', () => {
    it('should extend deadline when allowed', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const deadline = new Date('2025-01-01');
      const existingSpac = mockData.spac({
        id: spacId,
        deadline,
        extensionsUsed: 0,
        maxExtensions: 6,
      });
      const expectedNewDeadline = new Date('2025-04-01');

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);
      ctx.db.spac.update.mockResolvedValue({
        ...existingSpac,
        deadline: expectedNewDeadline,
        extensionsUsed: 1,
      });
      ctx.db.auditLog.create.mockResolvedValue({});

      const result = await caller.extendDeadline({
        id: spacId,
        months: 3,
      });

      expect(ctx.db.spac.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: spacId },
          data: expect.objectContaining({
            extensionsUsed: { increment: 1 },
          }),
        })
      );
    });

    it('should throw BAD_REQUEST when no deadline is set', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({
        id: spacId,
        deadline: null,
      });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);

      await expect(
        caller.extendDeadline({
          id: spacId,
          months: 3,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'SPAC does not have a deadline set',
      });
    });

    it('should throw BAD_REQUEST when max extensions reached', async () => {
      const spacId = '00000000-0000-0000-0000-000000000001';
      const existingSpac = mockData.spac({
        id: spacId,
        deadline: new Date('2025-01-01'),
        extensionsUsed: 6,
        maxExtensions: 6,
      });

      ctx.db.spac.findUnique.mockResolvedValue(existingSpac);

      await expect(
        caller.extendDeadline({
          id: spacId,
          months: 1,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Maximum extensions already used',
      });
    });
  });
});
