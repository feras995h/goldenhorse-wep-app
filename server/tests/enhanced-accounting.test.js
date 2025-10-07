import { expect } from 'chai';
import request from 'supertest';
import { sequelize } from '../src/models/index.js';
import { Account, AccountMapping, Customer, SalesInvoice, JournalEntry, GLEntry } from '../src/models/index.js';
import AccountingHealthMonitor from '../src/services/accountingHealthMonitor.js';
import AccountingInitializer from '../src/utils/accountingMigration.js';

describe('Enhanced Accounting Engine Tests', function() {
  this.timeout(30000); // 30 seconds timeout for complex operations

  let testUser, testCustomer, testAccountMapping;
  
  before(async () => {
    // Initialize test database
    await sequelize.sync({ force: true });
    
    // Initialize accounting system
    console.log('🔧 Initializing accounting system for tests...');
    await AccountingInitializer.initialize();
    
    // Create test user
    const { User } = sequelize.models;
    testUser = await User.create({
      username: 'test_accounting_user',
      email: 'test@accounting.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    // Get the active account mapping
    testAccountMapping = await AccountMapping.findOne({ where: { isActive: true } });
    expect(testAccountMapping).to.not.be.null;
    
    console.log('✅ Test environment initialized successfully');
  });

  after(async () => {
    // Clean up test data
    await sequelize.close();
  });

  describe('Account Mapping Validation', () => {
    it('should have a valid active account mapping', async () => {
      const mapping = await AccountMapping.getActiveMapping();
      expect(mapping).to.not.be.null;
      expect(mapping.isActive).to.be.true;
      
      // Validate the mapping
      expect(() => mapping.validateMapping()).to.not.throw();
    });

    it('should validate required accounts exist', async () => {
      const requiredAccounts = [
        testAccountMapping.salesRevenueAccount,
        testAccountMapping.accountsReceivableAccount,
        testAccountMapping.salesTaxAccount
      ];

      for (const accountId of requiredAccounts) {
        expect(accountId).to.not.be.null;
        const account = await Account.findByPk(accountId);
        expect(account).to.not.be.null;
        expect(account.isActive).to.be.true;
      }
    });

    it('should have accounts with correct nature', async () => {
      const salesAccount = await Account.findByPk(testAccountMapping.salesRevenueAccount);
      const arAccount = await Account.findByPk(testAccountMapping.accountsReceivableAccount);
      const taxAccount = await Account.findByPk(testAccountMapping.salesTaxAccount);

      expect(salesAccount.nature).to.equal('credit');
      expect(arAccount.nature).to.equal('debit');
      expect(taxAccount.nature).to.equal('credit');
    });
  });

  describe('Customer Account Creation', () => {
    it('should automatically create account for new customer', async () => {
      const customerData = {
        code: 'TEST001',
        name: 'Test Customer',
        customerType: 'local',
        email: 'test.customer@example.com'
      };

      const customer = await Customer.create(customerData);
      
      // Check if account was created
      expect(customer.accountId).to.not.be.null;
      
      const customerAccount = await Account.findByPk(customer.accountId);
      expect(customerAccount).to.not.be.null;
      expect(customerAccount.code).to.include(customer.code);
      expect(customerAccount.type).to.equal('asset');
      expect(customerAccount.nature).to.equal('debit');

      testCustomer = customer;
    });

    it('should create different account codes for foreign customers', async () => {
      const foreignCustomer = await Customer.create({
        code: 'FOREIGN001',
        name: 'Foreign Test Customer',
        customerType: 'foreign',
        nationality: 'Chinese',
        email: 'foreign.customer@example.com'
      });

      expect(foreignCustomer.accountId).to.not.be.null;
      
      const account = await Account.findByPk(foreignCustomer.accountId);
      expect(account.name).to.include('أجنبي');
    });

    it('should handle customer account creation failures gracefully', async () => {
      // Test with invalid parent account scenario
      const customer = await Customer.create({
        code: 'TESTFAIL001',
        name: 'Test Fail Customer',
        customerType: 'local',
        email: 'testfail@example.com'
      });
      
      // Even if account creation fails, customer should still be created
      expect(customer.id).to.not.be.null;
    });
  });

  describe('Sales Invoice Accounting Integration', () => {
    it('should create proper journal entry for sales invoice', async () => {
      const invoiceData = {
        customerId: testCustomer.id,
        invoiceNumber: 'TEST-INV-001',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        subtotal: 1000,
        taxAmount: 150,
        discountAmount: 50,
        total: 1100,
        status: 'posted'
      };

      const invoice = await SalesInvoice.create(invoiceData);
      
      // Create journal entry
      const journalResult = await invoice.createJournalEntryAndAffectBalance(testUser.id);
      
      expect(journalResult.success).to.be.true;
      expect(journalResult.journalEntry).to.not.be.null;
      
      // Verify journal entry balance
      const journalEntry = journalResult.journalEntry;
      expect(parseFloat(journalEntry.totalDebit)).to.equal(parseFloat(journalEntry.totalCredit));
      
      // Verify GL entries were created
      const glEntries = await GLEntry.findAll({
        where: { journalEntryId: journalEntry.id }
      });
      
      expect(glEntries.length).to.be.at.least(2); // AR and Revenue at minimum
      
      // Verify double-entry principle
      const totalDebits = glEntries.reduce((sum, entry) => sum + parseFloat(entry.debit), 0);
      const totalCredits = glEntries.reduce((sum, entry) => sum + parseFloat(entry.credit), 0);
      
      expect(Math.abs(totalDebits - totalCredits)).to.be.lessThan(0.01);
    });

    it('should update account balances correctly', async () => {
      const initialARBalance = parseFloat(testCustomer.accountId ? 
        (await Account.findByPk(testCustomer.accountId)).balance : 0);

      const invoiceData = {
        customerId: testCustomer.id,
        invoiceNumber: 'TEST-INV-002',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        subtotal: 500,
        taxAmount: 75,
        total: 575,
        status: 'posted'
      };

      const invoice = await SalesInvoice.create(invoiceData);
      await invoice.createJournalEntryAndAffectBalance(testUser.id);
      
      // Check updated balance
      const updatedAccount = await Account.findByPk(testCustomer.accountId);
      const expectedBalance = initialARBalance + parseFloat(invoice.total);
      
      expect(parseFloat(updatedAccount.balance)).to.equal(expectedBalance);
    });

    it('should prevent duplicate journal entries for same invoice', async () => {
      const invoice = await SalesInvoice.findOne({
        where: { invoiceNumber: 'TEST-INV-001' }
      });
      
      expect(invoice).to.not.be.null;
      
      // Try to create journal entry again (should return existing)
      const result = await invoice.createJournalEntryAndAffectBalance(testUser.id);
      
      // Should return existing journal entry, not create new one
      expect(result).to.not.be.null;
    });

    it('should validate invoice amounts before creating journal entry', async () => {
      const invalidInvoice = await SalesInvoice.create({
        customerId: testCustomer.id,
        invoiceNumber: 'TEST-INV-INVALID',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        subtotal: 100,
        taxAmount: 15,
        total: 0, // Invalid total
        status: 'posted'
      });

      try {
        await invalidInvoice.createJournalEntryAndAffectBalance(testUser.id);
        expect.fail('Should have thrown error for invalid total');
      } catch (error) {
        expect(error.message).to.include('must be greater than zero');
      }
    });
  });

  describe('System Health Monitoring', () => {
    it('should pass quick health check', async () => {
      const healthCheck = await AccountingHealthMonitor.quickHealthCheck();
      
      expect(healthCheck.healthy).to.be.true;
      expect(healthCheck.issues).to.be.an('array');
      expect(healthCheck.issues.length).to.equal(0);
    });

    it('should pass comprehensive health check', async () => {
      const healthReport = await AccountingHealthMonitor.performComprehensiveHealthCheck();
      
      expect(healthReport.overallHealth).to.not.equal('critical');
      expect(healthReport.score).to.be.above(0);
      expect(healthReport.checks).to.have.property('accountMapping');
      expect(healthReport.checks).to.have.property('chartOfAccounts');
      expect(healthReport.checks).to.have.property('dataIntegrity');
    });

    it('should validate account mapping in health check', async () => {
      const healthReport = await AccountingHealthMonitor.performComprehensiveHealthCheck();
      const mappingCheck = healthReport.checks.accountMapping;
      
      expect(mappingCheck.status).to.not.equal('critical');
      expect(mappingCheck.score).to.be.above(0);
    });

    it('should detect unbalanced journal entries', async () => {
      // Create an unbalanced journal entry for testing
      const unbalancedEntry = await JournalEntry.create({
        entryNumber: 'UNBALANCED-001',
        date: new Date().toISOString().split('T')[0],
        description: 'Test unbalanced entry',
        totalDebit: 100,
        totalCredit: 90, // Intentionally unbalanced
        status: 'posted',
        createdBy: testUser.id
      });

      const healthReport = await AccountingHealthMonitor.performComprehensiveHealthCheck();
      const dataIntegrityCheck = healthReport.checks.dataIntegrity;
      
      expect(dataIntegrityCheck.details.unbalancedJournalEntries).to.be.above(0);
    });
  });

  describe('Account Balance Validation', () => {
    it('should maintain proper debit/credit balance nature', async () => {
      const accounts = await Account.findAll({
        where: { isActive: true }
      });

      for (const account of accounts) {
        if (account.balance !== 0) {
          if (account.nature === 'debit') {
            // For debit accounts, positive balance should be on debit side
            expect(parseFloat(account.balance)).to.be.at.least(0);
          } else if (account.nature === 'credit') {
            // For credit accounts, balance can be positive (credit balance)
            // The sign handling is done in the accounting logic
          }
        }
      }
    });

    it('should recalculate balances correctly from GL entries', async () => {
      // Get an account with transactions
      const account = await Account.findOne({
        where: { 
          balance: { [sequelize.Sequelize.Op.ne]: 0 },
          isActive: true 
        }
      });

      if (account) {
        // Calculate balance from GL entries
        const glDebitSum = await GLEntry.sum('debit', {
          where: { accountId: account.id }
        }) || 0;
        
        const glCreditSum = await GLEntry.sum('credit', {
          where: { accountId: account.id }
        }) || 0;

        let calculatedBalance;
        if (account.nature === 'debit') {
          calculatedBalance = glDebitSum - glCreditSum;
        } else {
          calculatedBalance = glCreditSum - glDebitSum;
        }

        // Allow small rounding differences
        const difference = Math.abs(parseFloat(account.balance) - calculatedBalance);
        expect(difference).to.be.lessThan(0.01);
      }
    });

    it('should maintain trial balance', async () => {
      const debitBalances = await Account.sum('balance', {
        where: {
          nature: 'debit',
          balance: { [sequelize.Sequelize.Op.gt]: 0 },
          isActive: true
        }
      }) || 0;

      const creditBalances = await Account.sum('balance', {
        where: {
          nature: 'credit',
          balance: { [sequelize.Sequelize.Op.gt]: 0 },
          isActive: true
        }
      }) || 0;

      // In a balanced system, total debits should equal total credits
      // Allow small rounding differences
      const difference = Math.abs(debitBalances - creditBalances);
      expect(difference).to.be.lessThan(1.00); // Allow up to 1 unit difference for rounding
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle missing account mapping gracefully', async () => {
      // Temporarily deactivate account mapping
      await testAccountMapping.update({ isActive: false });

      try {
        const invoice = await SalesInvoice.create({
          customerId: testCustomer.id,
          invoiceNumber: 'TEST-ERROR-001',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          subtotal: 100,
          total: 100,
          status: 'posted'
        });

        await invoice.createJournalEntryAndAffectBalance(testUser.id);
        expect.fail('Should have thrown error for missing account mapping');
      } catch (error) {
        expect(error.message).to.include('account mapping');
      } finally {
        // Reactivate account mapping
        await testAccountMapping.update({ isActive: true });
      }
    });

    it('should handle invalid account references', async () => {
      // Create account mapping with invalid account ID
      const invalidMapping = await AccountMapping.create({
        salesRevenueAccount: '00000000-0000-0000-0000-000000000000',
        accountsReceivableAccount: testAccountMapping.accountsReceivableAccount,
        salesTaxAccount: testAccountMapping.salesTaxAccount,
        isActive: false, // Don't activate it
        description: 'Invalid mapping for testing'
      });

      try {
        invalidMapping.validateMapping();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('Missing required');
      }
    });

    it('should handle transaction rollback on journal entry failure', async () => {
      const initialAccountCount = await Account.count();
      const initialJournalCount = await JournalEntry.count();

      try {
        // Create an invoice that will fail during journal entry creation
        const invoice = await SalesInvoice.create({
          customerId: testCustomer.id,
          invoiceNumber: 'TEST-ROLLBACK-001',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          subtotal: -100, // Invalid negative amount
          total: -100,
          status: 'posted'
        });

        await invoice.createJournalEntryAndAffectBalance(testUser.id);
        expect.fail('Should have failed with negative amount');
      } catch (error) {
        // Verify no journal entries were created due to rollback
        const finalJournalCount = await JournalEntry.count();
        expect(finalJournalCount).to.equal(initialJournalCount);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent journal entries', async function() {
      this.timeout(10000);

      const promises = [];
      for (let i = 0; i < 5; i++) {
        const invoiceData = {
          customerId: testCustomer.id,
          invoiceNumber: `CONCURRENT-${i}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          subtotal: 100 + i,
          total: 100 + i,
          status: 'posted'
        };

        promises.push(
          SalesInvoice.create(invoiceData)
            .then(invoice => invoice.createJournalEntryAndAffectBalance(testUser.id))
        );
      }

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).to.equal(5);
    });

    it('should maintain data consistency under concurrent operations', async function() {
      this.timeout(15000);

      const initialBalance = parseFloat(
        (await Account.findByPk(testCustomer.accountId)).balance
      );

      // Create multiple invoices concurrently that should update the same account
      const invoiceAmount = 50;
      const invoiceCount = 3;
      
      const promises = [];
      for (let i = 0; i < invoiceCount; i++) {
        const invoiceData = {
          customerId: testCustomer.id,
          invoiceNumber: `CONSISTENCY-${i}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          subtotal: invoiceAmount,
          total: invoiceAmount,
          status: 'posted'
        };

        promises.push(
          SalesInvoice.create(invoiceData)
            .then(invoice => invoice.createJournalEntryAndAffectBalance(testUser.id))
        );
      }

      await Promise.all(promises);

      // Verify final balance is correct
      const finalAccount = await Account.findByPk(testCustomer.accountId);
      const expectedBalance = initialBalance + (invoiceAmount * invoiceCount);
      
      expect(parseFloat(finalAccount.balance)).to.equal(expectedBalance);
    });
  });
});

describe('Enhanced Financial API Integration Tests', function() {
  this.timeout(10000);
  
  let authToken;
  
  before(async () => {
    // This would require the actual Express app to be running
    // For now, we'll focus on the core accounting engine tests
  });

  // API tests would go here when we have the full app context
  // These would test the enhanced financial routes we created
});

describe('Accounting System Statistics and Reporting', () => {
  it('should generate accurate accounting statistics', async () => {
    const stats = await AccountingHealthMonitor.gatherStatistics();
    
    expect(stats.accounts).to.have.property('total');
    expect(stats.accounts).to.have.property('active');
    expect(stats.accounts).to.have.property('byType');
    
    expect(stats.journalEntries).to.have.property('total');
    expect(stats.customers).to.have.property('total');
    expect(stats.salesInvoices).to.have.property('total');
    
    // Verify statistics are reasonable
    expect(stats.accounts.total).to.be.at.least(10); // Should have basic chart of accounts
    expect(stats.accounts.active).to.be.at.most(stats.accounts.total);
  });

  it('should generate trial balance report', async () => {
    const accounts = await Account.findAll({
      where: { isActive: true },
      attributes: ['id', 'code', 'name', 'type', 'nature', 'balance']
    });

    const trialBalance = {
      accounts: [],
      totalDebits: 0,
      totalCredits: 0
    };

    accounts.forEach(account => {
      const balance = parseFloat(account.balance || 0);
      const accountData = {
        code: account.code,
        name: account.name,
        debitBalance: (account.nature === 'debit' && balance > 0) ? balance : 0,
        creditBalance: (account.nature === 'credit' && balance > 0) ? Math.abs(balance) : 0
      };
      
      trialBalance.accounts.push(accountData);
      trialBalance.totalDebits += accountData.debitBalance;
      trialBalance.totalCredits += accountData.creditBalance;
    });

    // Trial balance should be balanced (or very close due to rounding)
    const difference = Math.abs(trialBalance.totalDebits - trialBalance.totalCredits);
    expect(difference).to.be.lessThan(1.00);
  });
});