/**
 * Prisma Mock Client for Testing
 * Provides a mock implementation of the Prisma client for unit tests
 */

import type { PrismaClient } from '@prisma/client';

type MockPrismaModel = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
  upsert: jest.Mock;
};

function createMockModel(): MockPrismaModel {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    upsert: jest.fn(),
  };
}

export type MockPrismaClient = {
  [K in keyof PrismaClient]: K extends `$${string}`
    ? jest.Mock
    : MockPrismaModel;
} & {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
  $transaction: jest.Mock;
};

/**
 * Create a mock Prisma client with all models mocked
 */
export function createMockPrismaClient(): MockPrismaClient {
  const mockClient: Record<string, unknown> = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn((callback: (tx: MockPrismaClient) => Promise<unknown>) => {
      // For transaction mocks, just execute the callback with the mock client
      return callback(mockClient as MockPrismaClient);
    }),
    // Add all the models used in the application
    organization: createMockModel(),
    organizationUser: createMockModel(),
    user: createMockModel(),
    spac: createMockModel(),
    sponsor: createMockModel(),
    spacSponsor: createMockModel(),
    target: createMockModel(),
    contact: createMockModel(),
    document: createMockModel(),
    filing: createMockModel(),
    filingDocument: createMockModel(),
    filingWorkflowStep: createMockModel(),
    filingReviewer: createMockModel(),
    filingChecklist: createMockModel(),
    transaction: createMockModel(),
    task: createMockModel(),
    milestone: createMockModel(),
    trustAccount: createMockModel(),
    capTableEntry: createMockModel(),
    warrant: createMockModel(),
    redemption: createMockModel(),
    pipeInvestor: createMockModel(),
    earnout: createMockModel(),
    complianceItem: createMockModel(),
    secComment: createMockModel(),
    boardMeeting: createMockModel(),
    conflict: createMockModel(),
    insiderTradingWindow: createMockModel(),
    comment: createMockModel(),
    notification: createMockModel(),
    webhook: createMockModel(),
    webhookDelivery: createMockModel(),
    apiKey: createMockModel(),
    auditLog: createMockModel(),
    spacFinancial: createMockModel(),
  };

  return mockClient as MockPrismaClient;
}

/**
 * Reset all mocks on a mock Prisma client
 */
export function resetMockPrismaClient(mockClient: MockPrismaClient): void {
  Object.values(mockClient).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      Object.values(value as Record<string, unknown>).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    } else if (typeof value === 'function' && 'mockReset' in value) {
      (value as jest.Mock).mockReset();
    }
  });
}

/**
 * Helper to create mock data for tests
 */
export const mockData = {
  uuid: () => '00000000-0000-0000-0000-000000000001',

  organization: (overrides = {}) => ({
    id: mockData.uuid(),
    name: 'Test Organization',
    slug: 'test-org',
    domain: null,
    logoUrl: null,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  user: (overrides = {}) => ({
    id: mockData.uuid(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    image: null,
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  spac: (overrides = {}) => ({
    id: mockData.uuid(),
    organizationId: mockData.uuid(),
    name: 'Test SPAC',
    ticker: 'TEST',
    cusip: null,
    isin: null,
    cik: '0001234567',
    status: 'SEARCHING',
    phase: 'TARGET_SEARCH',
    ipoDate: new Date('2024-01-01'),
    ipoSize: 200000000,
    ipoPrice: 10,
    unitPrice: 10,
    overallotment: null,
    underwriters: [],
    sharesOutstanding: 20000000,
    commonSharesOutstanding: null,
    founderSharesOutstanding: null,
    publicWarrantsOutstanding: null,
    privateWarrantsOutstanding: null,
    trustSize: null,
    trustAmount: 200000000,
    trustBalance: 200000000,
    trustPerShare: null,
    interestEarned: null,
    trustBank: null,
    deadline: new Date('2026-01-01'),
    deadlineDate: new Date('2026-01-01'),
    maxExtensions: 6,
    extensionsUsed: 0,
    extensionCount: 0,
    extensionMonths: 1,
    extensionContribution: null,
    extensionDeadline: null,
    redemptionRate: null,
    description: 'A test SPAC',
    investmentThesis: null,
    targetSectors: ['Technology'],
    targetIndustries: [],
    targetGeographies: ['North America'],
    targetSizeMin: null,
    targetSizeMax: null,
    exchange: 'NASDAQ',
    daAnnouncedDate: null,
    proxyFiledDate: null,
    voteDate: null,
    closingDate: null,
    notes: null,
    tags: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }),

  filing: (overrides = {}) => ({
    id: mockData.uuid(),
    spacId: mockData.uuid(),
    type: 'S1',
    status: 'DRAFTING',
    title: 'Test Filing',
    description: null,
    accessionNumber: null,
    fileNumber: null,
    cik: '0001234567',
    dueDate: null,
    filedDate: null,
    effectiveDate: null,
    edgarUrl: null,
    amendmentNumber: 0,
    parentFilingId: null,
    secCommentCount: 0,
    secCommentDate: null,
    responseDate: null,
    internalReviewDate: null,
    externalReviewDate: null,
    notes: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  secComment: (overrides = {}) => ({
    id: mockData.uuid(),
    spacId: mockData.uuid(),
    filingId: mockData.uuid(),
    commentNumber: 1,
    commentText: 'Test SEC comment',
    responseText: null,
    responseDate: null,
    receivedDate: new Date(),
    dueDate: null,
    isResolved: false,
    resolvedDate: null,
    category: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};
