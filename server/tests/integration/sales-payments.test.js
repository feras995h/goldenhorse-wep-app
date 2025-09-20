import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { sequelize } from '../../src/models/index.js';
import models from '../../src/models/index.js';
import express from 'express';
import salesRoutes from '../../src/routes/sales.js';

// Build a minimal app for testing sales routes
const app = express();
app.use(express.json());
app.use('/api/sales', salesRoutes);

const { User, Account, Customer, Payment, GLEntry, JournalEntry, AccountMapping } = models;

describe('Sales Payments Integration', () => {
  let authToken;
  let testUser;
  let customer;
  let cashAccount;
  let receivableAccount;


  beforeEach(async () => {
    testUser = await User.create({
      username: 'sales_tester',
      name: 'Sales Tester',
      email: 'sales@test.com',
      password: 'hashedpassword',
      role: 'sales',
      isActive: true
    });

    authToken = await global.testUtils.generateTestToken(testUser);

    // Create a cash account for counter account detection
    cashAccount = await Account.create({
      code: '111001',
      name: 'Cash صندوق',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      level: 1,
      isGroup: false,
      balance: 0
    });

    // Create a receivables account and set mapping (in case customer account auto-create fails)
    receivableAccount = await Account.create({
      code: '112001',
      name: 'Accounts Receivable الذمم المدينة',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      level: 1,
      isGroup: false,
      balance: 0
    });

    await AccountMapping.create({
      accountsReceivableAccount: receivableAccount.id,
      isActive: true,
      description: 'Test Mapping'
    });

    customer = await Customer.create({
      code: 'CUST-A-001',
      name: 'Customer A',
      type: 'individual',
      isActive: true,
      email: 'cA@example.com',
      phone: '0910000000'
    });
  });

  afterEach(async () => {
    await GLEntry.destroy({ where: {} });
    await JournalEntry.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await AccountMapping.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  test('POST /api/sales/payments creates payment and GL within a transaction', async () => {
    const payload = {
      customerId: customer.id,
      amount: 250.00,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
      counterAccountId: cashAccount.id,
      description: 'Customer payment',
      reference: 'RCPT-001'
    };

    const res = await request(app)
      .post('/api/sales/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.payment).toBeDefined();
    expect(res.body.journalEntry).toBeDefined();

    const createdPayment = await Payment.findByPk(res.body.payment.id);
    expect(createdPayment.status).toBe('completed');

    const je = await JournalEntry.findByPk(res.body.journalEntry.id);
    expect(parseFloat(je.totalDebit)).toBeCloseTo(250.0);
    expect(parseFloat(je.totalCredit)).toBeCloseTo(250.0);

    const gls = await GLEntry.findAll({ where: { journalEntryId: je.id } });
    expect(gls).toHaveLength(2);
    const totalDebit = gls.reduce((s, g) => s + parseFloat(g.debit || 0), 0);
    const totalCredit = gls.reduce((s, g) => s + parseFloat(g.credit || 0), 0);
    expect(totalDebit).toBeCloseTo(totalCredit);
  });
});

