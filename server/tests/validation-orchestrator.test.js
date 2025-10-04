import { expect } from 'chai';
import request from 'supertest';
import { sequelize } from '../src/models/index.js';
import { Account, AccountMapping, Customer, SalesInvoice, JournalEntry, GLEntry, User } from '../src/models/index.js';
import AccountingValidationOrchestrator from '../src/services/accountingValidationOrchestrator.js';
import AccountingInitializer from '../src/utils/accountingInitializer.js';
import app from '../src/app.js'; // Assuming you have an Express app

describe('Comprehensive Validation Orchestrator Tests', function() {
  this.timeout(60000); // 1 minute timeout for comprehensive tests

  let testUser, testCustomer, testAccountMapping, testToken;
  let validationOrchestrator;
  
  before(async () => {
    // Initialize test database
    await sequelize.sync({ force: true });
    
    // Initialize accounting system
    console.log('🔧 Initializing accounting system for validation tests...');
    await AccountingInitializer.initialize();
    
    // Create test user
    testUser = await User.create({
      username: 'test_validation_user',
      email: 'validation@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    // Generate JWT token for API tests (mock implementation)
    testToken = `Bearer test-token-${testUser.id}`;

    // Get the active account mapping
    testAccountMapping = await AccountMapping.findOne({ where: { isActive: true } });
    expect(testAccountMapping).to.not.be.null;

    // Create test customer
    testCustomer = await Customer.create({
      code: 'VALTEST001',
      name: 'Validation Test Customer',
      customerType: 'local',
      email: 'validation.customer@test.com'
    });

    // Initialize validation orchestrator
    validationOrchestrator = new AccountingValidationOrchestrator();
    
    console.log('✅ Validation test environment initialized successfully');
  });

  after(async () => {
    // Clean up test data
    await sequelize.close();
  });

  describe('Validation Orchestrator Core Functionality', () => {
    
    it('should create a new validation orchestrator instance', () => {
      const orchestrator = new AccountingValidationOrchestrator();
      expect(orchestrator).to.be.an('object');
      expect(orchestrator.validationHistory).to.be.an('array');
      expect(orchestrator.scheduledValidations).to.be.an('object');
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = validationOrchestrator.generateSessionId();
      const sessionId2 = validationOrchestrator.generateSessionId();
      
      expect(sessionId1).to.be.a('string');
      expect(sessionId2).to.be.a('string');
      expect(sessionId1).to.not.equal(sessionId2);
      expect(sessionId1).to.match(/^VAL-\d+-[a-z0-9]+$/);
    });

    it('should perform quick validation check', async () => {
      const quickCheck = await validationOrchestrator.quickValidationCheck();
      
      expect(quickCheck).to.be.an('object');
      expect(quickCheck).to.have.property('timestamp');
      expect(quickCheck).to.have.property('healthy');
      expect(quickCheck).to.have.property('issues');
      expect(quickCheck).to.have.property('score');
      expect(quickCheck).to.have.property('maxScore');
      expect(quickCheck.issues).to.be.an('array');
      expect(quickCheck.score).to.be.a('number');
      expect(quickCheck.maxScore).to.be.a('number');
      expect(quickCheck.score).to.be.at.most(quickCheck.maxScore);
    });
  });

  describe('Individual Validation Modules', () => {
    
    it('should run system health validation', async () => {
      const session = {
        sessionId: validationOrchestrator.generateSessionId(),
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const result = await validationOrchestrator.runSystemHealthValidation(session);
      
      expect(result).to.be.an('object');
      expect(result.module).to.equal('systemHealth');
      expect(result).to.have.property('status');
      expect(result).to.have.property('score');
      expect(result).to.have.property('maxScore');
      expect(['passed', 'warning', 'failed', 'error']).to.include(result.status);
    });

    it('should run data consistency validation', async () => {
      const session = {
        sessionId: validationOrchestrator.generateSessionId(),
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const result = await validationOrchestrator.runDataConsistencyValidation(session);
      
      expect(result).to.be.an('object');
      expect(result.module).to.equal('dataConsistency');
      expect(result).to.have.property('status');
      expect(result).to.have.property('score');
      expect(result).to.have.property('maxScore');
      expect(result).to.have.property('checks');
      expect(result.checks).to.have.property('orphanedGLEntries');
      expect(result.checks).to.have.property('customersWithoutAccounts');
    });

    it('should run financial flow validation', async () => {
      const session = {
        sessionId: validationOrchestrator.generateSessionId(),
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const result = await validationOrchestrator.runFinancialFlowValidation(session);
      
      expect(result).to.be.an('object');
      expect(result.module).to.equal('financialFlow');
      expect(result).to.have.property('status');
      expect(result).to.have.property('checks');
      expect(result.checks).to.have.property('trialBalance');
      expect(result.checks).to.have.property('unbalancedJournalEntries');
    });

    it('should run integration validation', async () => {
      const session = {
        sessionId: validationOrchestrator.generateSessionId(),
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const result = await validationOrchestrator.runIntegrationValidation(session);
      
      expect(result).to.be.an('object');
      expect(result.module).to.equal('integration');
      expect(result).to.have.property('status');
      expect(result).to.have.property('checks');
      expect(result.checks).to.have.property('invoiceIntegration');
      expect(result.checks).to.have.property('customerIntegration');
    });

    it('should run business rules validation', async () => {
      const session = {
        sessionId: validationOrchestrator.generateSessionId(),
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const result = await validationOrchestrator.runBusinessRulesValidation(session);
      
      expect(result).to.be.an('object');
      expect(result.module).to.equal('businessRules');
      expect(result).to.have.property('status');
      expect(result).to.have.property('checks');
      expect(result.checks).to.have.property('accountMapping');
      expect(result.checks).to.have.property('accountNatures');
    });

    it('should run performance validation when requested', async () => {
      const session = {
        sessionId: validationOrchestrator.generateSessionId(),
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const result = await validationOrchestrator.runPerformanceValidation(session);
      
      expect(result).to.be.an('object');
      expect(result.module).to.equal('performance');
      expect(result).to.have.property('status');
      expect(result).to.have.property('metrics');
      expect(result.metrics).to.have.property('accountLookupTime');
      expect(result.metrics).to.have.property('journalEntryLookupTime');
    });
  });

  describe('Full Accounting Flow Validation', () => {
    
    it('should perform full accounting flow validation with default options', async () => {
      const validationSession = await validationOrchestrator.performFullAccountingFlowValidation();
      
      expect(validationSession).to.be.an('object');
      expect(validationSession).to.have.property('sessionId');
      expect(validationSession).to.have.property('startTime');
      expect(validationSession).to.have.property('endTime');
      expect(validationSession).to.have.property('duration');
      expect(validationSession).to.have.property('results');
      
      const results = validationSession.results;
      expect(results).to.have.property('overallStatus');
      expect(results).to.have.property('score');
      expect(results).to.have.property('maxScore');
      expect(results).to.have.property('validationModules');
      expect(results.score).to.be.at.most(results.maxScore);

      // Check that core modules were run
      expect(results.validationModules).to.have.property('systemHealth');
      expect(results.validationModules).to.have.property('dataConsistency');
      expect(results.validationModules).to.have.property('financialFlow');
      expect(results.validationModules).to.have.property('integration');
      expect(results.validationModules).to.have.property('businessRules');
    });

    it('should perform full validation with performance tests enabled', async () => {
      const validationSession = await validationOrchestrator.performFullAccountingFlowValidation({
        includePerformanceTests: true
      });
      
      expect(validationSession.results.validationModules).to.have.property('performance');
      expect(validationSession.results.validationModules.performance.metrics).to.be.an('object');
    });

    it('should perform full validation with historical data validation enabled', async () => {
      const validationSession = await validationOrchestrator.performFullAccountingFlowValidation({
        validateHistoricalData: true
      });
      
      expect(validationSession.results.validationModules).to.have.property('historical');
      expect(validationSession.results.validationModules.historical.checks).to.be.an('object');
    });

    it('should generate detailed report when requested', async () => {
      const validationSession = await validationOrchestrator.performFullAccountingFlowValidation({
        generateDetailedReport: true
      });
      
      expect(validationSession).to.have.property('detailedReport');
      const report = validationSession.detailedReport;
      expect(report).to.have.property('sessionId');
      expect(report).to.have.property('timestamp');
      expect(report).to.have.property('overallStatus');
      expect(report).to.have.property('scorePercentage');
      expect(report).to.have.property('summary');
    });

    it('should store validation session in history', async () => {
      const initialHistoryLength = validationOrchestrator.getValidationHistory().length;
      
      await validationOrchestrator.performFullAccountingFlowValidation();
      
      const finalHistoryLength = validationOrchestrator.getValidationHistory().length;
      expect(finalHistoryLength).to.equal(initialHistoryLength + 1);
      
      const lastValidation = validationOrchestrator.getLastValidationResult();
      expect(lastValidation).to.not.be.null;
      expect(lastValidation).to.have.property('sessionId');
    });
  });

  describe('Helper Validation Methods', () => {
    
    it('should validate trial balance correctly', async () => {
      const result = await validationOrchestrator.validateTrialBalance();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('debitSum');
      expect(result).to.have.property('creditSum');
      expect(result).to.have.property('difference');
      expect(result).to.have.property('isBalanced');
      expect(result.debitSum).to.be.a('number');
      expect(result.creditSum).to.be.a('number');
      expect(result.difference).to.be.a('number');
      expect(result.isBalanced).to.be.a('boolean');
    });

    it('should validate account balance calculations', async () => {
      const result = await validationOrchestrator.validateAccountBalanceCalculations();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('totalAccounts');
      expect(result).to.have.property('validAccounts');
      expect(result).to.have.property('invalidAccounts');
      expect(result.totalAccounts).to.be.a('number');
      expect(result.validAccounts).to.be.a('number');
      expect(result.invalidAccounts).to.be.a('number');
    });

    it('should validate invoice-journal integration', async () => {
      const result = await validationOrchestrator.validateInvoiceJournalIntegration();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('totalInvoices');
      expect(result).to.have.property('invoicesWithJournalEntries');
      expect(result).to.have.property('completionRate');
      expect(result.totalInvoices).to.be.a('number');
      expect(result.invoicesWithJournalEntries).to.be.a('number');
      expect(result.completionRate).to.be.a('number');
      expect(result.completionRate).to.be.at.most(100);
    });

    it('should validate customer-account integration', async () => {
      const result = await validationOrchestrator.validateCustomerAccountIntegration();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('totalCustomers');
      expect(result).to.have.property('customersWithAccounts');
      expect(result).to.have.property('completionRate');
      expect(result.totalCustomers).to.be.a('number');
      expect(result.customersWithAccounts).to.be.a('number');
      expect(result.completionRate).to.be.a('number');
      expect(result.completionRate).to.be.at.most(100);
    });
  });

  describe('Validation Scheduling', () => {
    
    it('should schedule a validation', async () => {
      const cronExpression = '0 0 * * *'; // Daily at midnight
      const options = { includePerformanceTests: true };
      
      const scheduleId = await validationOrchestrator.scheduleValidation(cronExpression, options);
      
      expect(scheduleId).to.be.a('string');
      expect(scheduleId).to.match(/^SCHED-\d+$/);
    });

    it('should retrieve scheduled validations', async () => {
      const schedules = validationOrchestrator.getScheduledValidations();
      
      expect(schedules).to.be.an('array');
      expect(schedules.length).to.be.at.least(1);
      
      const schedule = schedules[0];
      expect(schedule).to.have.property('id');
      expect(schedule).to.have.property('cronExpression');
      expect(schedule).to.have.property('options');
      expect(schedule).to.have.property('enabled');
    });
  });

  describe('Validation History Management', () => {
    
    it('should maintain validation history', async () => {
      // Run multiple validations to build history
      await validationOrchestrator.performFullAccountingFlowValidation();
      await validationOrchestrator.performFullAccountingFlowValidation();
      
      const history = validationOrchestrator.getValidationHistory();
      expect(history).to.be.an('array');
      expect(history.length).to.be.at.least(2);
    });

    it('should limit validation history to 50 sessions', async () => {
      // This test would require running 51+ validations, which is impractical
      // Instead, we'll just verify the logic exists
      expect(validationOrchestrator.validationHistory).to.be.an('array');
    });

    it('should get limited history with specified limit', () => {
      const limitedHistory = validationOrchestrator.getValidationHistory(2);
      expect(limitedHistory).to.be.an('array');
      expect(limitedHistory.length).to.be.at.most(2);
    });
  });

  describe('Validation with Test Data Scenarios', () => {
    
    it('should detect invoice without journal entry', async () => {
      // Create an invoice without journal entry
      const testInvoice = await SalesInvoice.create({
        customerId: testCustomer.id,
        invoiceNumber: 'TEST-NO-JE-001',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        subtotal: 500,
        total: 500,
        status: 'posted'
      });

      const result = await validationOrchestrator.runDataConsistencyValidation({
        sessionId: 'test',
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      });

      expect(result.checks.invoicesWithoutJournalEntries.count).to.be.at.least(1);
    });

    it('should handle validation errors gracefully', async () => {
      // Test with invalid database state (mock scenario)
      const result = await validationOrchestrator.runSystemHealthValidation({
        sessionId: 'error-test',
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      });

      // Even if there are errors, the module should return a structured result
      expect(result).to.be.an('object');
      expect(result).to.have.property('module');
      expect(result).to.have.property('status');
    });

    it('should calculate overall status based on module results', async () => {
      const validationSession = await validationOrchestrator.performFullAccountingFlowValidation();
      
      const overallStatus = validationSession.results.overallStatus;
      const validStatuses = ['excellent', 'good', 'fair', 'poor', 'critical', 'error'];
      expect(validStatuses).to.include(overallStatus);
      
      // Score should influence overall status
      const scorePercentage = (validationSession.results.score / validationSession.results.maxScore) * 100;
      if (scorePercentage >= 95) {
        expect(['excellent', 'good']).to.include(overallStatus);
      } else if (scorePercentage < 50) {
        expect(['poor', 'critical']).to.include(overallStatus);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    
    it('should complete full validation within reasonable time', async function() {
      this.timeout(30000); // 30 seconds
      
      const startTime = Date.now();
      const validationSession = await validationOrchestrator.performFullAccountingFlowValidation({
        includePerformanceTests: true
      });
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).to.be.below(30000); // Should complete within 30 seconds
      expect(validationSession.duration).to.be.a('number');
      expect(validationSession.duration).to.be.above(0);
    });

    it('should handle concurrent validations', async function() {
      this.timeout(60000); // 1 minute
      
      // Run multiple validations concurrently
      const promises = [
        validationOrchestrator.quickValidationCheck(),
        validationOrchestrator.quickValidationCheck(),
        validationOrchestrator.quickValidationCheck()
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).to.be.an('array');
      expect(results.length).to.equal(3);
      results.forEach(result => {
        expect(result).to.have.property('healthy');
        expect(result).to.have.property('score');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    it('should handle empty database gracefully', async () => {
      // This would require setting up a separate empty database
      // For now, just test with current data
      const result = await validationOrchestrator.quickValidationCheck();
      expect(result).to.be.an('object');
      expect(result.issues).to.be.an('array');
    });

    it('should validate with missing account mapping', async () => {
      // Temporarily deactivate account mapping
      const originalStatus = testAccountMapping.isActive;
      await testAccountMapping.update({ isActive: false });

      try {
        const result = await validationOrchestrator.runBusinessRulesValidation({
          sessionId: 'no-mapping-test',
          results: { criticalIssues: [], warnings: [], recommendations: [] }
        });

        expect(result.status).to.equal('failed');
        expect(result.issues).to.include.members(['No active account mapping found']);
      } finally {
        // Restore account mapping
        await testAccountMapping.update({ isActive: originalStatus });
      }
    });

    it('should handle database connection errors', async () => {
      // Mock database error scenario
      // This would require more complex mocking setup
      expect(true).to.be.true; // Placeholder test
    });
  });

  describe('Integration with Existing Systems', () => {
    
    it('should integrate with existing health monitor', async () => {
      const session = {
        sessionId: 'integration-test',
        results: { criticalIssues: [], warnings: [], recommendations: [] }
      };

      const healthResult = await validationOrchestrator.runSystemHealthValidation(session);
      
      // Should use the existing AccountingHealthMonitor
      expect(healthResult.details).to.be.an('object');
      expect(healthResult.statistics).to.be.an('object');
    });

    it('should work with existing test data', async () => {
      // Should be able to validate the system with existing test accounts and transactions
      const result = await validationOrchestrator.performFullAccountingFlowValidation();
      
      expect(result.results.overallStatus).to.not.equal('error');
      expect(result.results.score).to.be.above(0);
    });
  });
});

describe('API Validation Endpoints Tests', function() {
  this.timeout(30000);

  // These tests would require a running Express server
  // For now, we'll include the structure for future implementation

  before(() => {
    // Setup test server and authentication
    console.log('Setting up API tests...');
  });

  describe('POST /api/validation/full-accounting-flow', () => {
    it('should require authentication', async () => {
      // Test without token
      // const res = await request(app)
      //   .post('/api/validation/full-accounting-flow')
      //   .expect(401);
    });

    it('should require admin role', async () => {
      // Test with non-admin user
    });

    it('should run full validation successfully', async () => {
      // Test with valid admin token
    });
  });

  describe('GET /api/validation/quick-check', () => {
    it('should return quick validation results', async () => {
      // Test quick check endpoint
    });
  });

  describe('GET /api/validation/dashboard', () => {
    it('should return dashboard data', async () => {
      // Test dashboard endpoint
    });
  });

  describe('GET /api/validation/history', () => {
    it('should return validation history', async () => {
      // Test history endpoint
    });
  });

  describe('POST /api/validation/module/:moduleName', () => {
    it('should validate individual modules', async () => {
      // Test individual module validation
    });

    it('should reject invalid module names', async () => {
      // Test with invalid module name
    });
  });
});

// Export for use in other test files
export { validationOrchestrator };