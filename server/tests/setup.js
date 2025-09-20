import { sequelize } from '../src/models/index.js';
import { jest } from '@jest/globals';

// Mock global WebSocket for tests
global.io = {
  emit: jest.fn(),
  to: jest.fn(() => ({
    emit: jest.fn()
  }))
};

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

  // Use SQLite in-memory database for tests
  process.env.DB_DIALECT = 'sqlite';
  process.env.DB_STORAGE = ':memory:';
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Test database connected');
    
    // Sync database schema
    await sequelize.sync({ force: true });
    console.log('✅ Test database schema synced');
    
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
  }
});

// Clean database between tests
beforeEach(async () => {
  try {
    // Truncate all tables
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  } catch (error) {
    console.warn('⚠️  Failed to truncate tables:', error.message);
  }
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const { User } = await import('../src/models/index.js');
    return await User.create({
      username: 'testuser',
      password: 'testpassword',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      isActive: true,
      ...userData
    });
  },
  
  // Create test account
  createTestAccount: async (accountData = {}) => {
    const { Account } = await import('../src/models/index.js');
    return await Account.create({
      code: 'TEST001',
      name: 'Test Account',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      accountType: 'main',
      nature: 'debit',
      level: 1,
      isGroup: false,
      isActive: true,
      balance: 0.00,
      currency: 'LYD',
      ...accountData
    });
  },
  
  // Create test customer
  createTestCustomer: async (customerData = {}) => {
    const { Customer } = await import('../src/models/index.js');
    return await Customer.create({
      code: 'CUST001',
      name: 'Test Customer',
      type: 'individual',
      email: 'customer@example.com',
      phone: '123456789',
      isActive: true,
      balance: 0.00,
      creditLimit: 1000.00,
      creditUsed: 0.00,
      currency: 'LYD',
      ...customerData
    });
  },
  
  // Generate JWT token for testing
  generateTestToken: async (user) => {
    const jwt = await import('jsonwebtoken');
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        type: 'access'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
        issuer: 'golden-horse-api',
        audience: 'golden-horse-client'
      }
    );
  },
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock Redis for testing
  mockRedis: () => {
    const mockRedis = {
      connected: false,
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true),
      keys: jest.fn().mockResolvedValue([]),
      exists: jest.fn().mockResolvedValue(false),
      ping: jest.fn().mockRejectedValue(new Error('Redis not available')),
      quit: jest.fn().mockResolvedValue(true)
    };
    
    return mockRedis;
  }
};

// Suppress console logs during tests unless explicitly needed
if (process.env.TEST_VERBOSE !== 'true') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // Keep console.error for debugging
}

// Set longer timeout for database operations
jest.setTimeout(30000);
