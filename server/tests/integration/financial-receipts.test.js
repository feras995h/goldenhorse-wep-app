import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import financialRoutes from '../../src/routes/financial.js';
import { sequelize } from '../../src/models/index.js';
import models from '../../src/models/index.js';

// Minimal app
const app = express();
app.use(express.json());
app.use('/api/financial', financialRoutes);

const { User, Account, GLEntry, Receipt } = models;

describe('Financial Receipts Integration', () => {
  let authToken;
  let finUser;
  let cashAccount;
  let receivableAccount;

  beforeEach(async () => {
    finUser = await User.create({
      username: 'fin_tester',
      name: 'Financial Tester',
      email: 'fin@test.com',
      password: 'hashedpassword',
      role: 'financial',
      isActive: true
    });

    authToken = await global.testUtils.generateTestToken(finUser);

    // Accounts
    cashAccount = await Account.create({
      code: '111001',
      name: 'Cash صندوق',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      level: 1,
      isGroup: false,
      isActive: true,
      balance: 0
    });

    receivableAccount = await Account.create({
      code: '112001',
      name: 'Accounts Receivable الذمم المدينة',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      level: 1,
      isGroup: false,
      isActive: true,
      balance: 0
    });
  });

  test('POST /api/financial/vouchers/receipts requires counterAccountId and creates balanced GL', async () => {
    const payload = {
      accountId: receivableAccount.id,
      partyType: 'account',
      partyId: receivableAccount.id,
      amount: 175.5,
      receiptDate: new Date().toISOString().slice(0,10),
      paymentMethod: 'cash',
      counterAccountId: cashAccount.id,
      remarks: 'Test receipt'
    };

    const res = await request(app)
      .post('/api/financial/vouchers/receipts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    const receiptId = res.body.data?.id;
    expect(receiptId).toBeDefined();

    const receipt = await Receipt.findByPk(receiptId);
    expect(receipt).toBeTruthy();

    // Validate GL created and balanced using voucherNo
    const gls = await GLEntry.findAll({ where: { voucherNo: receipt.receiptNo } });
    expect(gls.length).toBe(2);
    const totalDebit = gls.reduce((s, g) => s + parseFloat(g.debit || 0), 0);
    const totalCredit = gls.reduce((s, g) => s + parseFloat(g.credit || 0), 0);
    expect(totalDebit).toBeCloseTo(totalCredit);
    expect(totalDebit).toBeCloseTo(parseFloat(receipt.amount));
  });
});

