import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { sequelize } from '../../src/models/index.js';
import { AccountProvision, Account, User } from '../../src/models/index.js';

describe('AccountProvision Model', () => {
  let testMainAccount, testProvisionAccount, testUser;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test data
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    testMainAccount = await Account.create({
      code: 'MAIN001',
      name: 'Main Account',
      type: 'asset',
      level: 1,
      isGroup: false,
      balance: 10000.00
    });

    testProvisionAccount = await Account.create({
      code: 'PROV001',
      name: 'Provision Account',
      type: 'liability',
      level: 1,
      isGroup: false,
      balance: 0.00
    });
  });

  afterEach(async () => {
    // Clean up test data
    await AccountProvision.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Model Creation', () => {
    test('should create AccountProvision with valid data', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'monthly',
        description: 'Monthly depreciation provision',
        createdBy: testUser.id
      });

      expect(provision).toBeDefined();
      expect(provision.mainAccountId).toBe(testMainAccount.id);
      expect(provision.provisionAccountId).toBe(testProvisionAccount.id);
      expect(provision.provisionType).toBe('depreciation');
      expect(parseFloat(provision.provisionRate)).toBe(10.0);
      expect(provision.calculationMethod).toBe('percentage');
    });

    test('should fail to create AccountProvision without required fields', async () => {
      await expect(AccountProvision.create({
        provisionRate: 10.0
      })).rejects.toThrow();
    });

    test('should create provision with fixed amount method', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'bad_debt',
        fixedAmount: 500.00,
        calculationMethod: 'fixed_amount',
        calculationFrequency: 'quarterly',
        description: 'Quarterly bad debt provision',
        createdBy: testUser.id
      });

      expect(provision).toBeDefined();
      expect(parseFloat(provision.fixedAmount)).toBe(500.00);
      expect(provision.calculationMethod).toBe('fixed_amount');
    });
  });

  describe('Model Associations', () => {
    test('should have correct associations with main account', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        createdBy: testUser.id
      });

      const mainAccount = await provision.getMainAccount();
      expect(mainAccount).toBeDefined();
      expect(mainAccount.id).toBe(testMainAccount.id);
    });

    test('should have correct associations with provision account', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        createdBy: testUser.id
      });

      const provisionAccount = await provision.getProvisionAccount();
      expect(provisionAccount).toBeDefined();
      expect(provisionAccount.id).toBe(testProvisionAccount.id);
    });

    test('should have correct associations with creator', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        createdBy: testUser.id
      });

      const creator = await provision.getCreator();
      expect(creator).toBeDefined();
      expect(creator.id).toBe(testUser.id);
    });
  });

  describe('Instance Methods', () => {
    test('calculateProvisionAmount should calculate percentage correctly', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        createdBy: testUser.id
      });

      const amount = await provision.calculateProvisionAmount();
      expect(amount).toBe(1000.00); // 10% of 10000.00
    });

    test('calculateProvisionAmount should return fixed amount correctly', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'bad_debt',
        fixedAmount: 750.00,
        calculationMethod: 'fixed_amount',
        createdBy: testUser.id
      });

      const amount = await provision.calculateProvisionAmount();
      expect(amount).toBe(750.00);
    });

    test('calculateProvisionAmount should return 0 for manual method', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'other',
        calculationMethod: 'manual',
        createdBy: testUser.id
      });

      const amount = await provision.calculateProvisionAmount();
      expect(amount).toBe(0);
    });

    test('updateProvision should create journal entry and update amounts', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 5.0,
        calculationMethod: 'percentage',
        createdBy: testUser.id
      });

      const result = await provision.updateProvision(testUser.id);

      expect(result).toBeDefined();
      expect(result.newAmount).toBe(500.00); // 5% of 10000.00
      expect(result.difference).toBe(500.00); // First time, so difference equals new amount

      // Check that provision was updated
      await provision.reload();
      expect(parseFloat(provision.currentAmount)).toBe(500.00);
      expect(provision.lastCalculationDate).toBeDefined();
    });

    test('isDue should return true when provision is due for calculation', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'monthly',
        lastCalculationDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), // 32 days ago
        createdBy: testUser.id
      });

      const isDue = provision.isDue();
      expect(isDue).toBe(true);
    });

    test('isDue should return false when provision is not due', async () => {
      const provision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'monthly',
        lastCalculationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        createdBy: testUser.id
      });

      const isDue = provision.isDue();
      expect(isDue).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('getDueProvisions should return provisions that are due', async () => {
      // Create due provision
      const dueProvision = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'monthly',
        lastCalculationDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), // 32 days ago
        createdBy: testUser.id
      });

      // Create another account for not due provision
      const anotherAccount = await Account.create({
        code: 'MAIN002',
        name: 'Another Account',
        type: 'asset',
        level: 1,
        isGroup: false,
        balance: 5000.00
      });

      // Create not due provision
      const notDueProvision = await AccountProvision.create({
        mainAccountId: anotherAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'monthly',
        lastCalculationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        createdBy: testUser.id
      });

      const dueProvisions = await AccountProvision.getDueProvisions();

      expect(dueProvisions).toHaveLength(1);
      expect(dueProvisions[0].id).toBe(dueProvision.id);
    });

    test('processAllDueProvisions should update all due provisions', async () => {
      // Create multiple due provisions
      const provision1 = await AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 5.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'monthly',
        lastCalculationDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
        createdBy: testUser.id
      });

      const anotherMainAccount = await Account.create({
        code: 'MAIN003',
        name: 'Another Main Account',
        type: 'asset',
        level: 1,
        isGroup: false,
        balance: 8000.00
      });

      const provision2 = await AccountProvision.create({
        mainAccountId: anotherMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'bad_debt',
        fixedAmount: 400.00,
        calculationMethod: 'fixed_amount',
        calculationFrequency: 'quarterly',
        lastCalculationDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
        createdBy: testUser.id
      });

      const result = await AccountProvision.processAllDueProvisions(testUser.id);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.totalAmount).toBe(900.00); // 500 (5% of 10000) + 400 (fixed)
    });
  });

  describe('Validation', () => {
    test('should validate provision rate is positive for percentage method', async () => {
      await expect(AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: -5.0,
        calculationMethod: 'percentage',
        createdBy: testUser.id
      })).rejects.toThrow();
    });

    test('should validate fixed amount is positive for fixed_amount method', async () => {
      await expect(AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'bad_debt',
        fixedAmount: -100.00,
        calculationMethod: 'fixed_amount',
        createdBy: testUser.id
      })).rejects.toThrow();
    });

    test('should validate calculation frequency is valid', async () => {
      await expect(AccountProvision.create({
        mainAccountId: testMainAccount.id,
        provisionAccountId: testProvisionAccount.id,
        provisionType: 'depreciation',
        provisionRate: 10.0,
        calculationMethod: 'percentage',
        calculationFrequency: 'invalid_frequency',
        createdBy: testUser.id
      })).rejects.toThrow();
    });
  });
});
