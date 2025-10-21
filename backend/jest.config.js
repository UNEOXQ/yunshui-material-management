module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Add timeout and other settings to prevent hanging
  testTimeout: 10000, // 10 seconds timeout
  maxWorkers: 1, // Run tests sequentially to avoid resource conflicts
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Detect handles that prevent Jest from exiting
  clearMocks: true, // Clear mocks between tests
  resetMocks: true, // Reset mocks between tests
};