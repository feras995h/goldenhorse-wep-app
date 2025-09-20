import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app.js';
import { sequelize } from '../../src/models/index.js';
import { User, Account, Customer, Receipt, Payment, Invoice } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

describe('Financial API Integration Tests', () => {
  let authToken, testUser, testAccount, testCustomer;

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
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'financial_manager'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test account
    testAccount = await Account.create({
      code: 'TEST001',
      name: 'Test Account',
      type: 'asset',
      level: 1,
      isGroup: false,
      balance: 1000.00
    });

    // Create test customer
    testCustomer = await Customer.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '1234567890'
    });
  });

  afterEach(async () => {
    // Clean up test data
    await Receipt.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Invoice.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Receipt Voucher API', () => {
    test('POST /api/financial/vouchers/receipts should create receipt voucher', async () => {
      const receiptData = {
        accountId: testAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 500.00,
        receiptDate: new Date().toISOString(),
        paymentMethod: 'cash',
        referenceNo: 'REF-001',
        remarks: 'Test receipt',
        currency: 'LYD',
        exchangeRate: 1.0
      };

      const response = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receiptData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.receiptNo).toMatch(/^REC-\d{6}$/);
      expect(parseFloat(response.body.data.amount)).toBe(500.00);
      expect(response.body.data.accountId).toBe(testAccount.id);
    });

    test('POST /api/financial/vouchers/receipts should fail without required fields', async () => {
      const incompleteData = {
        amount: 500.00
        // Missing accountId and receiptDate
      };

      const response = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('مطلوبة');
    });

    test('GET /api/financial/vouchers/receipts should return receipts list', async () => {
      // Create test receipt
      await Receipt.create({
        receiptNo: 'REC-000001',
        accountId: testAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 300.00,
        receiptDate: new Date(),
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      const response = await request(app)
        .get('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.receipts).toHaveLength(1);
      expect(response.body.data.receipts[0].receiptNo).toBe('REC-000001');
    });
  });

  describe('Payment Voucher API', () => {
    test('POST /api/financial/vouchers/payments should create payment voucher', async () => {
      const paymentData = {
        accountId: testAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 750.00,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        referenceNo: 'PAY-001',
        bankAccount: 'Bank Account 123',
        notes: 'Test payment',
        currency: 'LYD',
        exchangeRate: 1.0
      };

      const response = await request(app)
        .post('/api/financial/vouchers/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.paymentNumber).toMatch(/^PAY-\d{6}$/);
      expect(parseFloat(response.body.data.amount)).toBe(750.00);
      expect(response.body.data.accountId).toBe(testAccount.id);
    });

    test('GET /api/financial/vouchers/payments should return payments list', async () => {
      // Create test payment
      await Payment.create({
        paymentNumber: 'PAY-000001',
        accountId: testAccount.id,
        partyType: 'customer',
        partyId: testCustomer.id,
        amount: 400.00,
        paymentDate: new Date(),
        paymentMethod: 'check',
        status: 'completed',
        createdBy: testUser.id
      });

      const response = await request(app)
        .get('/api/financial/vouchers/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].paymentNumber).toBe('PAY-000001');
    });
  });

  describe('Account Auto-complete API', () => {
    test('GET /api/financial/accounts/autocomplete should return matching accounts', async () => {
      // Create additional accounts
      await Account.create({
        code: 'CASH001',
        name: 'Cash Account',
        type: 'asset',
        level: 1,
        isGroup: false,
        balance: 2000.00
      });

      await Account.create({
        code: 'BANK001',
        name: 'Bank Account',
        type: 'asset',
        level: 1,
        isGroup: false,
        balance: 5000.00
      });

      const response = await request(app)
        .get('/api/financial/accounts/autocomplete')
        .query({ search: 'account' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts.length).toBeGreaterThan(0);
      
      // All returned accounts should contain 'account' in name
      response.body.data.accounts.forEach(account => {
        expect(account.name.toLowerCase()).toContain('account');
      });
    });

    test('GET /api/financial/accounts/autocomplete should filter by account type', async () => {
      // Create liability account
      await Account.create({
        code: 'LIB001',
        name: 'Liability Account',
        type: 'liability',
        level: 1,
        isGroup: false,
        balance: 1500.00
      });

      const response = await request(app)
        .get('/api/financial/accounts/autocomplete')
        .query({ type: 'asset' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All returned accounts should be asset type
      response.body.data.accounts.forEach(account => {
        expect(account.type).toBe('asset');
      });
    });
  });

  describe('Real-time Balance API', () => {
    test('GET /api/financial/accounts/:id/balance/realtime should return balance info', async () => {
      const response = await request(app)
        .get(`/api/financial/accounts/${testAccount.id}/balance/realtime`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accountId).toBe(testAccount.id);
      expect(response.body.data.accountCode).toBe(testAccount.code);
      expect(response.body.data.accountName).toBe(testAccount.name);
      expect(response.body.data.storedBalance).toBeDefined();
      expect(response.body.data.calculatedBalance).toBeDefined();
      expect(response.body.data.isInSync).toBeDefined();
    });

    test('POST /api/financial/accounts/balance/recalculate should trigger recalculation', async () => {
      const response = await request(app)
        .post('/api/financial/accounts/balance/recalculate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedAccounts).toBeDefined();
    });
  });

  describe('Trial Balance API', () => {
    test('GET /api/financial/reports/trial-balance should return trial balance', async () => {
      // Create additional accounts for better test
      await Account.create({
        code: 'REV001',
        name: 'Revenue Account',
        type: 'revenue',
        level: 1,
        isGroup: false,
        balance: 2000.00
      });

      await Account.create({
        code: 'EXP001',
        name: 'Expense Account',
        type: 'expense',
        level: 1,
        isGroup: false,
        balance: 800.00
      });

      const response = await request(app)
        .get('/api/financial/reports/trial-balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toBeDefined();
      expect(response.body.data.totals).toBeDefined();
      expect(response.body.data.totals.totalDebits).toBeDefined();
      expect(response.body.data.totals.totalCredits).toBeDefined();
      expect(response.body.data.totals.difference).toBeDefined();
    });

    test('GET /api/financial/reports/trial-balance should support date filtering', async () => {
      const asOfDate = '2024-12-31';
      
      const response = await request(app)
        .get('/api/financial/reports/trial-balance')
        .query({ asOfDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.asOfDate).toBe(asOfDate);
    });
  });

  describe('Income Statement API', () => {
    test('GET /api/financial/reports/income-statement should return income statement', async () => {
      // Create revenue and expense accounts
      await Account.create({
        code: 'REV001',
        name: 'Sales Revenue',
        type: 'revenue',
        level: 1,
        isGroup: false,
        balance: 5000.00
      });

      await Account.create({
        code: 'EXP001',
        name: 'Operating Expenses',
        type: 'expense',
        level: 1,
        isGroup: false,
        balance: 3000.00
      });

      const response = await request(app)
        .get('/api/financial/reports/income-statement')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toBeDefined();
      expect(response.body.data.totals).toBeDefined();
      expect(response.body.data.totals.totalRevenue).toBeDefined();
      expect(response.body.data.totals.totalExpenses).toBeDefined();
      expect(response.body.data.totals.netIncome).toBeDefined();
    });

    test('GET /api/financial/reports/income-statement should support date range', async () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-12-31';
      
      const response = await request(app)
        .get('/api/financial/reports/income-statement')
        .query({ fromDate, toDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period.fromDate).toBe(fromDate);
      expect(response.body.data.period.toDate).toBe(toDate);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/financial/vouchers/receipts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/financial/vouchers/receipts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject requests from unauthorized roles', async () => {
      // Create user with limited role
      const limitedUser = await User.create({
        name: 'Limited User',
        email: 'limited@example.com',
        password: 'hashedpassword',
        role: 'viewer'
      });

      const limitedToken = jwt.sign(
        { userId: limitedUser.id, role: limitedUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({
          accountId: testAccount.id,
          amount: 100.00,
          receiptDate: new Date().toISOString()
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Try to create receipt with non-existent account
      const receiptData = {
        accountId: '00000000-0000-0000-0000-000000000000',
        amount: 500.00,
        receiptDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receiptData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    test('should validate request data properly', async () => {
      const invalidData = {
        accountId: testAccount.id,
        amount: -100.00, // Negative amount should be invalid
        receiptDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/financial/vouchers/receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
