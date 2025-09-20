import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app.js';
import { sequelize } from '../../src/models/index.js';
import { 
  User, Account, Customer, Receipt, Payment, Invoice, 
  InvoicePayment, InvoiceReceipt, JournalEntry, JournalEntryLine 
} from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

describe('End-to-End Accounting Workflow Tests', () => {
  let authToken, testUser, cashAccount, revenueAccount, customerAccount, testCustomer;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Accounting Manager',
      email: 'accounting@example.com',
      password: 'hashedpassword',
      role: 'financial_manager'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

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
      name: 'Sales Revenue',
      type: 'revenue',
      level: 1,
      isGroup: false,
      balance: 0.00
    });

    customerAccount = await Account.create({
      code: 'AR001',
      name: 'Accounts Receivable',
      type: 'asset',
      level: 1,
      isGroup: false,
      balance: 0.00
    });

    // Create test customer
    testCustomer = await Customer.create({
      name: 'Test Customer Ltd',
      email: 'customer@example.com',
      phone: '1234567890',
      accountId: customerAccount.id
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

  describe('Complete Sales and Collection Workflow', () => {
    test('should handle complete sales invoice to cash collection workflow', async () => {
      // Step 1: Create a sales invoice
      const invoiceData = {
        customerId: testCustomer.id,
        accountId: customerAccount.id,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: 'Product A',
            quantity: 2,
            unitPrice: 500.00,
            total: 1000.00
          }
        ],
        subtotal: 1000.00,
        tax: 0.00,
        total: 1000.00,
        notes: 'Test sales invoice'
      };

      const invoiceResponse = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(201);

      const createdInvoice = invoiceResponse.body.data;
      expect(createdInvoice.invoiceNumber).toMatch(/^INV-\d+$/);
      expect(parseFloat(createdInvoice.total)).toBe(1000.00);
      expect(parseFloat(createdInvoice.outstandingAmount)).toBe(1000.00);

      // Step 2: Verify journal entry was created for the invoice
      const invoiceJournalEntries = await JournalEntry.findAll({
        where: { referenceType: 'invoice', referenceId: createdInvoice.id },
        include: [{ model: JournalEntryLine, as: 'lines' }]
      });

      expect(invoiceJournalEntries).toHaveLength(1);
      const invoiceJE = invoiceJournalEntries[0];
      expect(invoiceJE.lines).toHaveLength(2);

      // Check debit to AR and credit to Revenue
      const arLine = invoiceJE.lines.find(line => line.accountId === customerAccount.id);
      const revLine = invoiceJE.lines.find(line => line.accountId === revenueAccount.id);
      
      expect(parseFloat(arLine.debit)).toBe(1000.00);
      expect(parseFloat(arLine.credit)).toBe(0.00);
      expect(parseFloat(revLine.debit)).toBe(0.00);
      expect(parseFloat(revLine.credit)).toBe(1000.00);

      // Step 3: Create a receipt voucher for partial payment
      const receiptData = {
        accountId: cashAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 600.00,
        receiptDate: new Date().toISOString(),
        paymentMethod: 'cash',
        referenceNo: 'CASH-001',
        remarks: 'Partial payment for invoice',
        currency: 'LYD',
        exchangeRate: 1.0,
        invoiceAllocations: [
          {
            invoiceId: createdInvoice.id,
            amount: 600.00
          }
        ]
      };

      const receiptResponse = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receiptData)
        .expect(201);

      const createdReceipt = receiptResponse.body.data;
      expect(createdReceipt.receiptNo).toMatch(/^REC-\d{6}$/);
      expect(parseFloat(createdReceipt.amount)).toBe(600.00);

      // Step 4: Verify invoice allocation was created
      const invoiceAllocations = await InvoiceReceipt.findAll({
        where: { receiptId: createdReceipt.id }
      });

      expect(invoiceAllocations).toHaveLength(1);
      expect(parseFloat(invoiceAllocations[0].allocatedAmount)).toBe(600.00);

      // Step 5: Verify invoice outstanding amount was updated
      const updatedInvoice = await Invoice.findByPk(createdInvoice.id);
      expect(parseFloat(updatedInvoice.paidAmount)).toBe(600.00);
      expect(parseFloat(updatedInvoice.outstandingAmount)).toBe(400.00);
      expect(updatedInvoice.status).toBe('partially_paid');

      // Step 6: Verify journal entry was created for the receipt
      const receiptJournalEntries = await JournalEntry.findAll({
        where: { referenceType: 'receipt', referenceId: createdReceipt.id },
        include: [{ model: JournalEntryLine, as: 'lines' }]
      });

      expect(receiptJournalEntries).toHaveLength(1);
      const receiptJE = receiptJournalEntries[0];
      expect(receiptJE.lines).toHaveLength(2);

      // Check debit to Cash and credit to AR
      const cashLine = receiptJE.lines.find(line => line.accountId === cashAccount.id);
      const arCreditLine = receiptJE.lines.find(line => line.accountId === customerAccount.id);
      
      expect(parseFloat(cashLine.debit)).toBe(600.00);
      expect(parseFloat(cashLine.credit)).toBe(0.00);
      expect(parseFloat(arCreditLine.debit)).toBe(0.00);
      expect(parseFloat(arCreditLine.credit)).toBe(600.00);

      // Step 7: Create second receipt for remaining balance
      const finalReceiptData = {
        accountId: cashAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 400.00,
        receiptDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        referenceNo: 'BANK-001',
        bankAccount: 'Bank Account 123',
        remarks: 'Final payment for invoice',
        currency: 'LYD',
        exchangeRate: 1.0,
        invoiceAllocations: [
          {
            invoiceId: createdInvoice.id,
            amount: 400.00
          }
        ]
      };

      const finalReceiptResponse = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(finalReceiptData)
        .expect(201);

      // Step 8: Verify invoice is fully paid
      const fullyPaidInvoice = await Invoice.findByPk(createdInvoice.id);
      expect(parseFloat(fullyPaidInvoice.paidAmount)).toBe(1000.00);
      expect(parseFloat(fullyPaidInvoice.outstandingAmount)).toBe(0.00);
      expect(fullyPaidInvoice.status).toBe('paid');

      // Step 9: Verify account balances are correct
      const finalCashAccount = await Account.findByPk(cashAccount.id);
      const finalCustomerAccount = await Account.findByPk(customerAccount.id);
      const finalRevenueAccount = await Account.findByPk(revenueAccount.id);

      // Cash should have 1000 (600 + 400)
      expect(parseFloat(finalCashAccount.balance)).toBe(1000.00);
      // AR should have 0 (1000 - 600 - 400)
      expect(parseFloat(finalCustomerAccount.balance)).toBe(0.00);
      // Revenue should have 1000
      expect(parseFloat(finalRevenueAccount.balance)).toBe(1000.00);
    });
  });

  describe('FIFO Invoice Settlement Workflow', () => {
    test('should handle FIFO settlement of multiple invoices', async () => {
      // Create multiple invoices with different dates
      const invoice1Data = {
        customerId: testCustomer.id,
        accountId: customerAccount.id,
        date: new Date('2024-01-01').toISOString(),
        dueDate: new Date('2024-01-31').toISOString(),
        total: 500.00,
        notes: 'First invoice'
      };

      const invoice2Data = {
        customerId: testCustomer.id,
        accountId: customerAccount.id,
        date: new Date('2024-01-15').toISOString(),
        dueDate: new Date('2024-02-15').toISOString(),
        total: 800.00,
        notes: 'Second invoice'
      };

      const invoice1Response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoice1Data)
        .expect(201);

      const invoice2Response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoice2Data)
        .expect(201);

      const invoice1 = invoice1Response.body.data;
      const invoice2 = invoice2Response.body.data;

      // Create a receipt that covers both invoices partially
      const receiptData = {
        accountId: cashAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 1000.00,
        receiptDate: new Date().toISOString(),
        paymentMethod: 'cash',
        remarks: 'FIFO settlement test',
        currency: 'LYD',
        exchangeRate: 1.0
        // No specific invoice allocations - should use FIFO
      };

      const receiptResponse = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receiptData)
        .expect(201);

      const receipt = receiptResponse.body.data;

      // Verify FIFO allocation
      const allocations = await InvoiceReceipt.findAll({
        where: { receiptId: receipt.id },
        order: [['createdAt', 'ASC']]
      });

      expect(allocations).toHaveLength(2);

      // First allocation should fully pay invoice1 (older)
      expect(allocations[0].invoiceId).toBe(invoice1.id);
      expect(parseFloat(allocations[0].allocatedAmount)).toBe(500.00);

      // Second allocation should partially pay invoice2 (newer)
      expect(allocations[1].invoiceId).toBe(invoice2.id);
      expect(parseFloat(allocations[1].allocatedAmount)).toBe(500.00);

      // Verify invoice statuses
      const updatedInvoice1 = await Invoice.findByPk(invoice1.id);
      const updatedInvoice2 = await Invoice.findByPk(invoice2.id);

      expect(updatedInvoice1.status).toBe('paid');
      expect(parseFloat(updatedInvoice1.outstandingAmount)).toBe(0.00);

      expect(updatedInvoice2.status).toBe('partially_paid');
      expect(parseFloat(updatedInvoice2.outstandingAmount)).toBe(300.00);
    });
  });

  describe('Trial Balance and Financial Reporting Workflow', () => {
    test('should generate accurate trial balance after transactions', async () => {
      // Create some transactions
      await Receipt.create({
        receiptNo: 'REC-000001',
        accountId: cashAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 1500.00,
        receiptDate: new Date(),
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      await Payment.create({
        paymentNumber: 'PAY-000001',
        accountId: cashAccount.id,
        partyType: 'supplier',
        amount: 800.00,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: testUser.id
      });

      // Update account balances manually for this test
      await cashAccount.update({ balance: 700.00 }); // 1500 - 800
      await revenueAccount.update({ balance: 1500.00 });

      // Get trial balance
      const trialBalanceResponse = await request(app)
        .get('/api/financial/reports/trial-balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const trialBalance = trialBalanceResponse.body.data;

      expect(trialBalance.accounts.length).toBeGreaterThan(0);
      expect(trialBalance.totals).toBeDefined();
      expect(trialBalance.totals.totalDebits).toBeGreaterThan(0);
      expect(trialBalance.totals.totalCredits).toBeGreaterThan(0);

      // Find specific accounts in trial balance
      const cashAccountTB = trialBalance.accounts.find(acc => acc.id === cashAccount.id);
      const revenueAccountTB = trialBalance.accounts.find(acc => acc.id === revenueAccount.id);

      expect(cashAccountTB).toBeDefined();
      expect(parseFloat(cashAccountTB.debit)).toBe(700.00);
      expect(parseFloat(cashAccountTB.credit)).toBe(0.00);

      expect(revenueAccountTB).toBeDefined();
      expect(parseFloat(revenueAccountTB.debit)).toBe(0.00);
      expect(parseFloat(revenueAccountTB.credit)).toBe(1500.00);
    });
  });

  describe('Real-time Balance Updates Workflow', () => {
    test('should update balances in real-time after voucher creation', async () => {
      // Get initial balance
      const initialBalanceResponse = await request(app)
        .get(`/api/financial/accounts/${cashAccount.id}/balance/realtime`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialBalance = initialBalanceResponse.body.data;
      expect(parseFloat(initialBalance.storedBalance)).toBe(0.00);

      // Create a receipt
      const receiptData = {
        accountId: cashAccount.id,
        amount: 1000.00,
        receiptDate: new Date().toISOString(),
        paymentMethod: 'cash',
        currency: 'LYD',
        exchangeRate: 1.0
      };

      await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receiptData)
        .expect(201);

      // Wait a moment for balance update processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get updated balance
      const updatedBalanceResponse = await request(app)
        .get(`/api/financial/accounts/${cashAccount.id}/balance/realtime`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedBalance = updatedBalanceResponse.body.data;
      
      // Balance should be updated
      expect(parseFloat(updatedBalance.storedBalance)).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Data Integrity', () => {
    test('should maintain data integrity during failed transactions', async () => {
      // Attempt to create receipt with invalid data
      const invalidReceiptData = {
        accountId: 'invalid-account-id',
        amount: 500.00,
        receiptDate: new Date().toISOString()
      };

      await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidReceiptData)
        .expect(500);

      // Verify no partial data was created
      const receipts = await Receipt.findAll();
      expect(receipts).toHaveLength(0);

      const journalEntries = await JournalEntry.findAll();
      expect(journalEntries).toHaveLength(0);
    });

    test('should prevent over-allocation of receipts to invoices', async () => {
      // Create an invoice
      const invoiceData = {
        customerId: testCustomer.id,
        accountId: customerAccount.id,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        total: 500.00
      };

      const invoiceResponse = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(201);

      const invoice = invoiceResponse.body.data;

      // Attempt to create receipt with allocation exceeding invoice amount
      const receiptData = {
        accountId: cashAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 1000.00,
        receiptDate: new Date().toISOString(),
        paymentMethod: 'cash',
        currency: 'LYD',
        exchangeRate: 1.0,
        invoiceAllocations: [
          {
            invoiceId: invoice.id,
            amount: 600.00 // More than invoice total
          }
        ]
      };

      await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receiptData)
        .expect(400);

      // Verify invoice remains unchanged
      const unchangedInvoice = await Invoice.findByPk(invoice.id);
      expect(parseFloat(unchangedInvoice.outstandingAmount)).toBe(500.00);
    });
  });
});
