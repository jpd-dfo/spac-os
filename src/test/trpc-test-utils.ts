/**
 * tRPC Test Utilities
 * Helpers for testing tRPC routers with mocked context
 */

import type { Context } from '@/server/api/trpc';
import { createMockPrismaClient, type MockPrismaClient } from './prisma-mock';

export interface MockContext extends Omit<Context, 'db'> {
  db: MockPrismaClient;
}

// Test UUIDs for consistent usage across tests
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000100';
export const TEST_ORG_ID = '00000000-0000-0000-0000-000000000200';

/**
 * Create a mock tRPC context for testing
 */
export function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    db: createMockPrismaClient(),
    user: {
      id: TEST_USER_ID,
      email: 'test@example.com',
      organizationId: TEST_ORG_ID,
      role: 'user',
    },
    headers: new Headers(),
    ...overrides,
  };
}

/**
 * Create a mock context with an authenticated user
 */
export function createAuthenticatedContext(
  userId = TEST_USER_ID,
  organizationId = TEST_ORG_ID,
  overrides: Partial<MockContext> = {}
): MockContext {
  return createMockContext({
    user: {
      id: userId,
      email: 'test@example.com',
      organizationId,
      role: 'user',
    },
    ...overrides,
  });
}

/**
 * Create a mock context with an admin user
 */
export function createAdminContext(
  userId = 'admin-user-id',
  organizationId = 'test-org-id',
  overrides: Partial<MockContext> = {}
): MockContext {
  return createMockContext({
    user: {
      id: userId,
      email: 'admin@example.com',
      organizationId,
      role: 'admin',
    },
    ...overrides,
  });
}

/**
 * Create a mock context without authentication
 */
export function createUnauthenticatedContext(
  overrides: Partial<MockContext> = {}
): MockContext {
  return createMockContext({
    user: null,
    ...overrides,
  });
}

/**
 * Helper type for procedure caller
 */
export type ProcedureCaller<TInput, TOutput> = (
  input: TInput
) => Promise<TOutput>;
