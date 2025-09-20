import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import financialRoutes from '../../src/routes/financial.js';
import models from '../../src/models/index.js';

const app = express();
app.use(express.json());
app.use('/api/financial', financialRoutes);

const { User, Account } = models;

describe('Fixed Assets Create Integration', () => {
  let authToken;
  let finUser;
  let categoryAccount;

  beforeEach(async () => {
    finUser = await User.create({
      username: 'fin_assets_user',
      name: 'Financial User',
      email: 'fin.assets@test.com',
      password: 'hashedpassword',
      role: 'financial',
      isActive: true
    });

    authToken = await global.testUtils.generateTestToken(finUser);

    // Create a category account to use for fixed asset
    categoryAccount = await Account.create({
      code: '1.2.99',
      name: 'اختبارات فئة الأصول',
      nameEn: 'Fixed Assets Test Category',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      parentId: null,
      level: 2,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      accountType: 'sub',
      description: 'فئة للأصول الثابتة للاختبار',
      isSystemAccount: false,
      isMonitored: true
    });
  });

  test('POST /api/financial/fixed-assets creates asset and returns 201', async () => {
    const payload = {
      assetNumber: 'FA-TEST-0001',
      name: 'حاسوب مكتبي',
      nameEn: 'Desktop Computer',
      categoryAccountId: categoryAccount.id,
      purchaseDate: new Date().toISOString().slice(0,10),
      purchaseCost: 2500.00,
      currency: 'LYD',
      depreciationMethod: 'straight_line',
      usefulLife: 5,
      salvageValue: 0,
      location: 'المكتب الرئيسي'
    };

    const res = await request(app)
      .post('/api/financial/fixed-assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data.assetNumber).toBe(payload.assetNumber);
    expect(res.body.data.name).toBe(payload.name);
  });
});

