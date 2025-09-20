# Golden Horse Accounting System - Test Suite

This directory contains comprehensive tests for the Golden Horse accounting system enhancement project.

## Test Structure

```
tests/
├── models/                     # Unit tests for database models
│   ├── InvoicePayment.test.js
│   └── AccountProvision.test.js
├── services/                   # Unit tests for services
│   └── balanceUpdateService.test.js
├── integration/                # API integration tests
│   └── financial.test.js
├── e2e/                       # End-to-end workflow tests
│   └── accounting-workflow.test.js
├── business-logic/            # Business rule validation tests
│   └── accounting-rules.test.js
├── setup.js                   # Global test setup and utilities
└── README.md                  # This file
```

## Test Categories

### 1. Unit Tests (`tests/models/` & `tests/services/`)

**Purpose**: Test individual components in isolation

**Coverage**:
- Database model validations and associations
- Service class methods and business logic
- Static methods and instance methods
- Error handling and edge cases

**Key Test Files**:
- `InvoicePayment.test.js`: Tests FIFO settlement logic, allocation validation
- `AccountProvision.test.js`: Tests provision calculations and automation
- `balanceUpdateService.test.js`: Tests real-time balance updates and WebSocket integration

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test API endpoints and their interactions with the database

**Coverage**:
- REST API endpoints for financial operations
- Authentication and authorization
- Request/response validation
- Database transactions and rollbacks
- Real-time balance API endpoints
- Financial reporting endpoints

**Key Test Files**:
- `financial.test.js`: Comprehensive API testing for vouchers, accounts, and reports

### 3. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test complete business workflows from start to finish

**Coverage**:
- Complete sales and collection workflows
- FIFO invoice settlement processes
- Trial balance generation after transactions
- Real-time balance updates during operations
- Data integrity during failed transactions

**Key Test Files**:
- `accounting-workflow.test.js`: Full accounting cycle testing

### 4. Business Logic Tests (`tests/business-logic/`)

**Purpose**: Validate accounting rules and business compliance

**Coverage**:
- Double-entry bookkeeping rules
- Account balance calculation rules (by account type)
- Invoice settlement business rules
- Trial balance validation
- Data integrity constraints
- Accounting standards compliance

**Key Test Files**:
- `accounting-rules.test.js`: Core accounting principles validation

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Business logic tests only
npm run test:business
```

### Specific Test Suites
```bash
# Model tests
npm run test:models

# Service tests
npm run test:services

# Financial API tests
npm run test:financial

# Accounting rules tests
npm run test:accounting
```

### Development Testing
```bash
# Watch mode for development
npm run test:watch

# Verbose output for debugging
npm run test:verbose

# Coverage report
npm run test:coverage
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: Node.js
- **Test Timeout**: 30 seconds
- **Coverage Threshold**: 70% for all metrics
- **Test Projects**: Organized by test category
- **Module Mapping**: Supports absolute imports

### Test Setup (`tests/setup.js`)
- **Database**: SQLite in-memory for fast testing
- **WebSocket Mocking**: Global `io` mock for real-time features
- **Test Utilities**: Helper functions for creating test data
- **Custom Matchers**: Accounting-specific Jest matchers

## Test Utilities

The global `testUtils` object provides helpful functions:

```javascript
// Create test data
const user = await testUtils.createTestUser();
const account = await testUtils.createTestAccount();
const customer = await testUtils.createTestCustomer();

// Generate JWT tokens
const token = await testUtils.generateTestToken(user);

// Utility functions
await testUtils.wait(100); // Wait for async operations
const uuid = testUtils.isValidUUID(someId);
const mockRedis = testUtils.mockRedis();
```

## Custom Jest Matchers

### `toBeCloseTo(expected, precision)`
For floating-point number comparisons:
```javascript
expect(balance).toBeCloseTo(1000.50, 2);
```

### `toHaveAccountingFields(fields)`
Validates required accounting object fields:
```javascript
expect(receipt).toHaveAccountingFields(['receiptNo', 'amount']);
```

### `toBeBalanced()`
Validates journal entries are balanced:
```javascript
expect(journalEntry).toBeBalanced();
```

## Test Data Patterns

### Consistent Test Data
- **Users**: Admin role with predictable credentials
- **Accounts**: Standard chart of accounts (Cash, Revenue, Expense, etc.)
- **Customers**: Basic customer with account linking
- **Amounts**: Round numbers for easy validation (500.00, 1000.00)

### Test Isolation
- Each test starts with a clean database
- Transactions are rolled back on failure
- Mocks are cleared between tests
- Global state is reset

## Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Exclusions
- Migration files
- Seeder files
- Configuration files
- Server startup files

## Best Practices

### Test Organization
1. **Describe blocks**: Group related tests logically
2. **Test names**: Use descriptive names explaining the scenario
3. **Setup/Teardown**: Use `beforeEach`/`afterEach` for test isolation
4. **Async/Await**: Consistent async handling

### Test Data
1. **Realistic data**: Use business-appropriate test values
2. **Edge cases**: Test boundary conditions and error scenarios
3. **Clean state**: Each test should start with known state
4. **Deterministic**: Tests should produce consistent results

### Assertions
1. **Specific assertions**: Test exact values, not just truthiness
2. **Multiple assertions**: Verify all relevant aspects
3. **Error testing**: Verify error messages and types
4. **Business rules**: Validate accounting principles

## Debugging Tests

### Common Issues
1. **Database connection**: Check test database configuration
2. **Async operations**: Ensure proper `await` usage
3. **Mock cleanup**: Clear mocks between tests
4. **Test isolation**: Verify tests don't depend on each other

### Debugging Commands
```bash
# Run single test file
npm test -- tests/models/InvoicePayment.test.js

# Run with verbose output
npm run test:verbose

# Run specific test by name
npm test -- --testNamePattern="should create InvoicePayment"
```

## Continuous Integration

### Pre-commit Hooks
- Run linting
- Run unit tests
- Check coverage thresholds

### CI Pipeline
1. Install dependencies
2. Run all test suites
3. Generate coverage report
4. Validate business logic compliance
5. Check for test failures

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Cover all scenarios** (happy path, edge cases, errors)
3. **Update documentation** if adding new test utilities
4. **Maintain coverage** above threshold requirements
5. **Follow naming conventions** for test files and descriptions

## Test Environment Variables

```bash
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
DB_DIALECT=sqlite
DB_STORAGE=:memory:
TEST_VERBOSE=false  # Set to true for detailed output
```

## Troubleshooting

### Common Test Failures
1. **Database sync issues**: Check model definitions and associations
2. **Timeout errors**: Increase Jest timeout for slow operations
3. **Mock issues**: Verify WebSocket and external service mocks
4. **Balance calculations**: Check accounting logic and precision

### Performance Issues
1. **Slow tests**: Use in-memory database for faster execution
2. **Memory leaks**: Ensure proper cleanup in teardown
3. **Parallel execution**: Jest runs tests in parallel by default

For more specific help, check individual test files for detailed examples and patterns.
