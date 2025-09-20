const enforceCoverage = process.env.ENFORCE_COVERAGE === 'true';
export default {
  // Test environment
  testEnvironment: 'node',
  
  // Transform ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: enforceCoverage,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/scripts/**'
  ],
  
  // Coverage thresholds (enforced only when ENFORCE_COVERAGE=true)
  coverageThreshold: enforceCoverage ? {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  } : {},
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Test suites
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['**/tests/models/**/*.test.js', '**/tests/services/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['**/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['**/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'Business Logic Tests',
      testMatch: ['**/tests/business-logic/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    }
  ]
};
