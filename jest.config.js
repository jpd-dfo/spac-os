/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',  // Exclude Playwright E2E tests
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  // Use node environment for server-side tests (tRPC routers)
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/src/server/',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/server/**/__tests__/**/*.test.{ts,tsx}'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Mock superjson and its dependencies for server tests
        '^superjson$': '<rootDir>/src/test/__mocks__/superjson.ts',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
    },
  ],
};

module.exports = config;
