import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { sequelize } from '../../src/models/index.js';
import { Account, JournalEntry, JournalEntryLine, User } from '../../src/models/index.js';
import balanceUpdateService from '../../src/services/balanceUpdateService.js';

// Mock global.io for WebSocket testing
global.io = {
  emit: jest.fn(),
  to: jest.fn(() => ({
    emit: jest.fn()
  }))
};

describe('BalanceUpdateService', () => {
  let testUser, testAccount, testParentAccount, testChildAccount;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();

    // Create test data
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    testParentAccount = await Account.create({
      code: 'PARENT001',
      name: 'Parent Account',
      type: 'asset',
      level: 1,
      isGroup: true,
      balance: 0.00
    });

    testAccount = await Account.create({
      code: 'TEST001',
      name: 'Test Account',
      type: 'asset',
      level: 2,
      isGroup: false,
      parentId: testParentAccount.id,
      balance: 1000.00
    });

    testChildAccount = await Account.create({
      code: 'CHILD001',
      name: 'Child Account',
      type: 'asset',
      level: 2,
      isGroup: false,
      parentId: testParentAccount.id,
      balance: 500.00
    });
  });

  afterEach(async () => {
    // Clean up test data
    await JournalEntryLine.destroy({ where: {} });
    await JournalEntry.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Balance Calculation', () => {
    test('should calculate account balance from journal entries correctly', async () => {
      // Create journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-001',
        date: new Date(),
        description: 'Test entry',
        status: 'posted',
        createdBy: testUser.id
      });

      // Create journal entry lines
      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: testAccount.id,
        debit: 500.00,
        credit: 0.00,
        description: 'Test debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: testAccount.id,
        debit: 0.00,
        credit: 200.00,
        description: 'Test credit'
      });

      const calculatedBalance = await balanceUpdateService.calculateAccountBalance(testAccount.id);
      
      // For asset account: debit increases, credit decreases
      expect(calculatedBalance).toBe(300.00); // 500 - 200
    });

    test('should calculate liability account balance correctly', async () => {
      const liabilityAccount = await Account.create({
        code: 'LIB001',
        name: 'Liability Account',
        type: 'liability',
        level: 1,
        isGroup: false,
        balance: 0.00
      });

      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-002',
        date: new Date(),
        description: 'Liability test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: liabilityAccount.id,
        debit: 100.00,
        credit: 0.00,
        description: 'Liability debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: liabilityAccount.id,
        debit: 0.00,
        credit: 300.00,
        description: 'Liability credit'
      });

      const calculatedBalance = await balanceUpdateService.calculateAccountBalance(liabilityAccount.id);
      
      // For liability account: credit increases, debit decreases
      expect(calculatedBalance).toBe(200.00); // 300 - 100
    });
  });

  describe('Balance Updates', () => {
    test('should queue balance update correctly', async () => {
      const initialQueueLength = balanceUpdateService.updateQueue.length;
      
      balanceUpdateService.queueBalanceUpdate(testAccount.id, 'test_update', {
        testData: 'test'
      });

      expect(balanceUpdateService.updateQueue.length).toBe(initialQueueLength + 1);
      
      const queuedUpdate = balanceUpdateService.updateQueue[balanceUpdateService.updateQueue.length - 1];
      expect(queuedUpdate.accountId).toBe(testAccount.id);
      expect(queuedUpdate.reason).toBe('test_update');
      expect(queuedUpdate.metadata.testData).toBe('test');
    });

    test('should update account balance and emit WebSocket event', async () => {
      // Create journal entry to change balance
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-003',
        date: new Date(),
        description: 'Balance update test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: testAccount.id,
        debit: 200.00,
        credit: 0.00,
        description: 'Additional debit'
      });

      const oldBalance = parseFloat(testAccount.balance);
      
      await balanceUpdateService.updateAccountBalance(testAccount.id, 'test_update', {
        testData: 'test'
      });

      // Check account balance was updated
      await testAccount.reload();
      const newBalance = parseFloat(testAccount.balance);
      expect(newBalance).toBe(200.00); // Only the journal entry amount

      // Check WebSocket emission
      expect(global.io.emit).toHaveBeenCalledWith('balance_updated', expect.objectContaining({
        accountId: testAccount.id,
        accountCode: testAccount.code,
        accountName: testAccount.name,
        oldBalance,
        newBalance,
        reason: 'test_update'
      }));
    });

    test('should update parent account balances recursively', async () => {
      // Update child account balance
      await testChildAccount.update({ balance: 800.00 });
      
      await balanceUpdateService.updateParentAccountBalances(testParentAccount.id);

      // Check parent balance was updated to sum of children
      await testParentAccount.reload();
      const parentBalance = parseFloat(testParentAccount.balance);
      
      // Parent should have sum of test account (1000) + child account (800)
      expect(parentBalance).toBe(1800.00);
    });
  });

  describe('Real-time Balance', () => {
    test('should get real-time balance information', async () => {
      const balanceInfo = await balanceUpdateService.getRealTimeBalance(testAccount.id);

      expect(balanceInfo).toBeDefined();
      expect(balanceInfo.accountId).toBe(testAccount.id);
      expect(balanceInfo.accountCode).toBe(testAccount.code);
      expect(balanceInfo.accountName).toBe(testAccount.name);
      expect(balanceInfo.storedBalance).toBe(1000.00);
      expect(balanceInfo.calculatedBalance).toBe(0.00); // No journal entries yet
      expect(balanceInfo.isInSync).toBe(false); // Different values
    });

    test('should indicate when balance is in sync', async () => {
      // Create journal entry that matches stored balance
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-004',
        date: new Date(),
        description: 'Sync test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: testAccount.id,
        debit: 1000.00,
        credit: 0.00,
        description: 'Matching balance'
      });

      const balanceInfo = await balanceUpdateService.getRealTimeBalance(testAccount.id);

      expect(balanceInfo.isInSync).toBe(true);
      expect(balanceInfo.storedBalance).toBe(balanceInfo.calculatedBalance);
    });
  });

  describe('Full Recalculation', () => {
    test('should recalculate all account balances', async () => {
      // Create journal entries for multiple accounts
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE-005',
        date: new Date(),
        description: 'Full recalc test',
        status: 'posted',
        createdBy: testUser.id
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: testAccount.id,
        debit: 2000.00,
        credit: 0.00,
        description: 'Test account debit'
      });

      await JournalEntryLine.create({
        journalEntryId: journalEntry.id,
        accountId: testChildAccount.id,
        debit: 1500.00,
        credit: 0.00,
        description: 'Child account debit'
      });

      const result = await balanceUpdateService.recalculateAllBalances();

      expect(result.success).toBe(true);
      expect(result.updatedAccounts).toBeGreaterThan(0);

      // Check that balances were updated
      await testAccount.reload();
      await testChildAccount.reload();
      
      expect(parseFloat(testAccount.balance)).toBe(2000.00);
      expect(parseFloat(testChildAccount.balance)).toBe(1500.00);
    });
  });

  describe('Queue Processing', () => {
    test('should process queue without duplicates', async () => {
      // Add multiple updates for same account
      balanceUpdateService.queueBalanceUpdate(testAccount.id, 'update1');
      balanceUpdateService.queueBalanceUpdate(testAccount.id, 'update2');
      balanceUpdateService.queueBalanceUpdate(testChildAccount.id, 'update3');

      const initialQueueLength = balanceUpdateService.updateQueue.length;
      expect(initialQueueLength).toBe(3);

      await balanceUpdateService.processQueue();

      // Queue should be empty after processing
      expect(balanceUpdateService.updateQueue.length).toBe(0);
    });

    test('should handle multiple account updates efficiently', async () => {
      const accountIds = [testAccount.id, testChildAccount.id];
      
      await balanceUpdateService.updateMultipleAccountBalances(
        accountIds, 
        'bulk_update', 
        { batchId: 'test-batch' }
      );

      // Should queue updates for all accounts
      expect(balanceUpdateService.updateQueue.length).toBeGreaterThanOrEqual(2);
      
      // Process the queue
      await balanceUpdateService.processQueue();
      
      // Queue should be empty
      expect(balanceUpdateService.updateQueue.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent account gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const balance = await balanceUpdateService.calculateAccountBalance(nonExistentId);
      expect(balance).toBe(0);
    });

    test('should handle invalid account ID in getRealTimeBalance', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        balanceUpdateService.getRealTimeBalance(nonExistentId)
      ).rejects.toThrow('Account not found');
    });
  });
});
