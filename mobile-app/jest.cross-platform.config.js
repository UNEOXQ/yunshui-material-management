module.exports = {
  ...require('./jest.config.js'),
  displayName: 'Cross-Platform Tests',
  testMatch: [
    '<rootDir>/src/__tests__/cross-platform/**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/hooks/useOrientation.ts',
    'src/hooks/useResponsive.ts',
    'src/utils/responsive.ts',
    'src/utils/gestures.ts',
    'src/screens/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage/cross-platform',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [
    '<rootDir>/src/test-utils/setupTests.ts',
    '<rootDir>/src/__tests__/cross-platform/setup.ts'
  ],
  testEnvironment: 'jsdom',
  verbose: true,
  // Increase timeout for cross-platform tests
  testTimeout: 15000,
  // Run tests in sequence to avoid conflicts
  maxWorkers: 1,
};