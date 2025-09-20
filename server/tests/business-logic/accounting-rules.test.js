import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { sequelize } from '../../src/models/index.js';
import { 
  Account, JournalEntry, JournalEntryLine, Receipt, Payment, 
  Invoice, InvoicePayment, InvoiceReceipt, User, Customer 
} from '../../src/models/index.js';
import balanceUpdateService from '../../src/services/balanceUpdateService.js';

describe('Accounting Business Logic Validation', () => {
  let testUser, testCustomer;
  let cashAccount, revenueAccount, expenseAccount, liabilityAccount, equityAccount;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    // Create test customer
    testCustomer = await Customer.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '1234567890'
    });

    // Create chart of accounts
    cashAccount = await Account.create({
      code: 'CASH001',
      name: 'Cash Account',
      type: 'asset',
      level: 1,
      isGroup: false,
      balance: 0.00
    });

    revenueAccount = await Account.create({
      code: 'REV001',
      name: 'Revenue Account',
      type: 'revenue',
      level: 1,
      isGroup: false,
      balance: 0.00
    });

    expenseAccount = await Account.create({
      code: 'EXP001',
      name: 'Expense Account',
      type: 'expense',
      level: 1,
      isGroup: false,
      balance: 0.00
    });

    liabilityAccount = await Account.create({
      code: 'LIB001',
      name: 'Liability Account',
      type: 'liability',
      level: 1,
      isGroup: false,
      balance: 0.00
    });

    equityAccount = await Account.create({
      code: 'EQ001',
      name: 'Equity Account',
      type: 'equity',
      level: 1,
      isGroup: false,
      balance: 0.00
    });
  });

  afterEach(async () => {
    // Clean up test data
    await JournalEntryLine.destroy({ where: {} });
    await JournalEntry.destroy({ where: {} });
    await InvoicePayment.destroy({ where: {} });
    await InvoiceReceipt.destroy({ where: {} });
    await Receipt.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Invoice.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Double-Entry Bookkeeping Rules', () => {
    test('should enforce equal debits and credits in journal entries', async () => {
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-001',
        date: new Date(),
        description: 'Test entry',
        status: 'draft',
        createdBy: testUser.id
      });

      // Create balanced journal entry lines
      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 1000.00,
        credit: 0.00,
        description: 'Cash debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: revenueAccount.id,
        debit: 0.00,
        credit: 1000.00,
        description: 'Revenue credit'
      });

      // Validate the entry is balanced
      const lines = await JournalEntryLine.findAll({
        where: { journalEntryId: journalEntry.id }
      });

      const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debit), 0);
      const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.credit), 0);

      expect(totalDebits).toBe(totalCredits);
      expect(totalDebits).toBe(1000.00);
    });

    test('should reject unbalanced journal entries when posting', async () => {
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-002',
        date: new Date(),
        description: 'Unbalanced entry',
        status: 'draft',
        createdBy: testUser.id
      });

      // Create unbalanced journal entry lines
      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 1000.00,
        credit: 0.00,
        description: 'Cash debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: revenueAccount.id,
        debit: 0.00,
        credit: 800.00, // Unbalanced!
        description: 'Revenue credit'
      });

      // Attempt to post the entry should fail
      await expect(journalEntry.update({ status: 'posted' })).rejects.toThrow();
    });
  });

  describe('Account Balance Calculation Rules', () => {
    test('should calculate asset account balances correctly (debit increases)', async () => {
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-003',
        date: new Date(),
        description: 'Asset test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 1500.00,
        credit: 0.00,
        description: 'Cash increase'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 0.00,
        credit: 500.00,
        description: 'Cash decrease'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: revenueAccount.id,
        debit: 0.00,
        credit: 1000.00,
        description: 'Balancing credit'
      });

      const calculatedBalance = await balanceUpdateService.calculateAccountBalance(cashAccount.id);
      
      // Asset account: debit increases, credit decreases
      expect(calculatedBalance).toBe(1000.00); // 1500 - 500
    });

    test('should calculate liability account balances correctly (credit increases)', async () => {
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-004',
        date: new Date(),
        description: 'Liability test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: liabilityAccount.id,
        debit: 200.00,
        credit: 0.00,
        description: 'Liability decrease'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: liabilityAccount.id,
        debit: 0.00,
        credit: 800.00,
        description: 'Liability increase'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 600.00,
        credit: 0.00,
        description: 'Balancing debit'
      });

      const calculatedBalance = await balanceUpdateService.calculateAccountBalance(liabilityAccount.id);
      
      // Liability account: credit increases, debit decreases
      expect(calculatedBalance).toBe(600.00); // 800 - 200
    });

    test('should calculate revenue account balances correctly (credit increases)', async () => {
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-005',
        date: new Date(),
        description: 'Revenue test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: revenueAccount.id,
        debit: 100.00,
        credit: 0.00,
        description: 'Revenue reversal'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: revenueAccount.id,
        debit: 0.00,
        credit: 1200.00,
        description: 'Revenue recognition'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 1100.00,
        credit: 0.00,
        description: 'Balancing debit'
      });

      const calculatedBalance = await balanceUpdateService.calculateAccountBalance(revenueAccount.id);
      
      // Revenue account: credit increases, debit decreases
      expect(calculatedBalance).toBe(1100.00); // 1200 - 100
    });

    test('should calculate expense account balances correctly (debit increases)', async () => {
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-006',
        date: new Date(),
        description: 'Expense test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: expenseAccount.id,
        debit: 750.00,
        credit: 0.00,
        description: 'Expense recognition'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: expenseAccount.id,
        debit: 0.00,
        credit: 50.00,
        description: 'Expense reversal'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 0.00,
        credit: 700.00,
        description: 'Balancing credit'
      });

      const calculatedBalance = await balanceUpdateService.calculateAccountBalance(expenseAccount.id);
      
      // Expense account: debit increases, credit decreases
      expect(calculatedBalance).toBe(700.00); // 750 - 50
    });
  });

  describe('Invoice Settlement Rules', () => {
    test('should enforce FIFO settlement order', async () => {
      // Create invoices with different dates
      const oldInvoice = await Invoice.create({
        invoiceNumber: 'INV-001',
        customerId: testCustomer.id,
        accountId: cashAccount.id,
        date: new Date('2024-01-01'),
        dueDate: new Date('2024-01-31'),
        total: 500.00,
        paidAmount: 0.00,
        outstandingAmount: 500.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      const newInvoice = await Invoice.create({
        invoiceNumber: 'INV-002',
        customerId: testCustomer.id,
        accountId: cashAccount.id,
        date: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        total: 800.00,
        paidAmount: 0.00,
        outstandingAmount: 800.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      const payment = await Payment.create({
        paymentNumber: 'PAY-001',
        accountId: cashAccount.id,
        customerId: testCustomer.id,
        date: new Date(),
        amount: 1000.00,
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      // Allocate payment using FIFO
      const result = await InvoicePayment.allocatePaymentFIFO(
        payment.id,
        testCustomer.id,
        testUser.id
      );

      expect(result.allocations).toHaveLength(2);

      // First allocation should be to older invoice (full amount)
      const firstAllocation = result.allocations.find(a => a.invoiceId === oldInvoice.id);
      expect(parseFloat(firstAllocation.allocatedAmount)).toBe(500.00);

      // Second allocation should be to newer invoice (remaining amount)
      const secondAllocation = result.allocations.find(a => a.invoiceId === newInvoice.id);
      expect(parseFloat(secondAllocation.allocatedAmount)).toBe(500.00);

      // Verify invoice statuses
      await oldInvoice.reload();
      await newInvoice.reload();

      expect(oldInvoice.status).toBe('paid');
      expect(parseFloat(oldInvoice.outstandingAmount)).toBe(0.00);

      expect(newInvoice.status).toBe('partially_paid');
      expect(parseFloat(newInvoice.outstandingAmount)).toBe(300.00);
    });

    test('should prevent over-allocation of payments to invoices', async () => {
      const invoice = await Invoice.create({
        invoiceNumber: 'INV-003',
        customerId: testCustomer.id,
        accountId: cashAccount.id,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        total: 500.00,
        paidAmount: 0.00,
        outstandingAmount: 500.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      const payment = await Payment.create({
        paymentNumber: 'PAY-002',
        accountId: cashAccount.id,
        customerId: testCustomer.id,
        date: new Date(),
        amount: 300.00,
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      // Attempt to over-allocate
      await expect(InvoicePayment.create({
        invoiceId: invoice.id,
        paymentId: payment.id,
        allocatedAmount: 600.00, // More than both invoice total and payment amount
        allocationDate: new Date(),
        createdBy: testUser.id
      })).rejects.toThrow();
    });

    test('should update invoice status correctly based on payments', async () => {
      const invoice = await Invoice.create({
        invoiceNumber: 'INV-004',
        customerId: testCustomer.id,
        accountId: cashAccount.id,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        total: 1000.00,
        paidAmount: 0.00,
        outstandingAmount: 1000.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      // Partial payment
      const partialPayment = await Payment.create({
        paymentNumber: 'PAY-003',
        accountId: cashAccount.id,
        customerId: testCustomer.id,
        date: new Date(),
        amount: 400.00,
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      await InvoicePayment.create({
        invoiceId: invoice.id,
        paymentId: partialPayment.id,
        allocatedAmount: 400.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      });

      await invoice.reload();
      expect(invoice.status).toBe('partially_paid');
      expect(parseFloat(invoice.paidAmount)).toBe(400.00);
      expect(parseFloat(invoice.outstandingAmount)).toBe(600.00);

      // Full payment
      const remainingPayment = await Payment.create({
        paymentNumber: 'PAY-004',
        accountId: cashAccount.id,
        customerId: testCustomer.id,
        date: new Date(),
        amount: 600.00,
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      await InvoicePayment.create({
        invoiceId: invoice.id,
        paymentId: remainingPayment.id,
        allocatedAmount: 600.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      });

      await invoice.reload();
      expect(invoice.status).toBe('paid');
      expect(parseFloat(invoice.paidAmount)).toBe(1000.00);
      expect(parseFloat(invoice.outstandingAmount)).toBe(0.00);
    });
  });

  describe('Trial Balance Validation Rules', () => {
    test('should ensure trial balance is balanced', async () => {
      // Create balanced journal entries
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-007',
        date: new Date(),
        description: 'Trial balance test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: cashAccount.id,
        debit: 2000.00,
        credit: 0.00,
        description: 'Cash debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: expenseAccount.id,
        debit: 800.00,
        credit: 0.00,
        description: 'Expense debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: revenueAccount.id,
        debit: 0.00,
        credit: 1500.00,
        description: 'Revenue credit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: liabilityAccount.id,
        debit: 0.00,
        credit: 1300.00,
        description: 'Liability credit'
      });

      // Update account balances
      await balanceUpdateService.updateAccountBalance(cashAccount.id, 'test');
      await balanceUpdateService.updateAccountBalance(expenseAccount.id, 'test');
      await balanceUpdateService.updateAccountBalance(revenueAccount.id, 'test');
      await balanceUpdateService.updateAccountBalance(liabilityAccount.id, 'test');

      // Calculate trial balance totals
      const accounts = await Account.findAll();
      let totalDebits = 0;
      let totalCredits = 0;

      accounts.forEach(account => {
        const balance = parseFloat(account.balance);
        switch (account.type) {
          case 'asset':
          case 'expense':
            if (balance >= 0) {
              totalDebits += balance;
            } else {
              totalCredits += Math.abs(balance);
            }
            break;
          case 'liability':
          case 'equity':
          case 'revenue':
            if (balance >= 0) {
              totalCredits += balance;
            } else {
              totalDebits += Math.abs(balance);
            }
            break;
        }
      });

      // Trial balance should be balanced
      expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
    });
  });

  describe('Data Integrity Rules', () => {
    test('should maintain referential integrity', async () => {
      const receipt = await Receipt.create({
        receiptNo: 'REC-001',
        accountId: cashAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 500.00,
        receiptDate: new Date(),
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      // Should not be able to delete account that has transactions
      await expect(Account.destroy({
        where: { id: cashAccount.id }
      })).rejects.toThrow();

      // Should not be able to delete customer that has receipts
      await expect(Customer.destroy({
        where: { id: testCustomer.id }
      })).rejects.toThrow();
    });

    test('should enforce required field validations', async () => {
      // Receipt without required fields should fail
      await expect(Receipt.create({
        receiptNo: 'REC-002',
        // Missing accountId, amount, receiptDate
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      })).rejects.toThrow();

      // Journal entry without required fields should fail
      await expect(JournalEntry.create({
        // Missing entryNumber, date, description
        status: 'draft',
        createdBy: testUser.id
      })).rejects.toThrow();
    });

    test('should enforce business rule constraints', async () => {
      // Negative amounts should be rejected
      await expect(Receipt.create({
        receiptNo: 'REC-003',
        accountId: cashAccount.id,
        amount: -100.00, // Negative amount
        receiptDate: new Date(),
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      })).rejects.toThrow();

      // Invalid account types should be rejected
      await expect(Account.create({
        code: 'INVALID001',
        name: 'Invalid Account',
        type: 'invalid_type', // Invalid type
        level: 1,
        isGroup: false,
        balance: 0.00
      })).rejects.toThrow();
    });
  });
});
