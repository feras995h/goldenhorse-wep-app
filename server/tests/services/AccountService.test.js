import AccountService from '../../src/services/AccountService.js';
import { ValidationAppError, DatabaseError } from '../../src/middleware/enhancedErrorHandler.js';

describe('AccountService', () => {
  
  describe('createAccount', () => {
    it('should create a new account successfully', async () => {
      const accountData = {
        code: 'ACC001',
        name: 'Test Account',
        type: 'asset',
        accountType: 'main',
        nature: 'debit',
        level: 1,
        isGroup: false,
        currency: 'LYD'
      };

      const account = await AccountService.createAccount(accountData);

      expect(account).toBeDefined();
      expect(account.code).toBe(accountData.code);
      expect(account.name).toBe(accountData.name);
      expect(account.type).toBe(accountData.type);
      expect(account.balance).toBe('0.00');
      expect(account.isActive).toBe(true);
    });

    it('should throw ValidationAppError for missing required fields', async () => {
      const accountData = {
        name: 'Test Account'
        // Missing required fields
      };

      await expect(AccountService.createAccount(accountData))
        .rejects
        .toThrow(ValidationAppError);
    });

    it('should throw ValidationAppError for duplicate code', async () => {
      const accountData = {
        code: 'ACC001',
        name: 'Test Account',
        type: 'asset',
        accountType: 'main',
        nature: 'debit'
      };

      // Create first account
      await AccountService.createAccount(accountData);

      // Try to create duplicate
      await expect(AccountService.createAccount(accountData))
        .rejects
        .toThrow(ValidationAppError);
    });

    it('should validate parent account exists and is a group', async () => {
      // Create parent account (not a group)
      const parentAccount = await testUtils.createTestAccount({
        code: 'PARENT001',
        name: 'Parent Account',
        isGroup: false
      });

      const accountData = {
        code: 'CHILD001',
        name: 'Child Account',
        type: 'asset',
        accountType: 'sub',
        nature: 'debit',
        parentId: parentAccount.id
      };

      await expect(AccountService.createAccount(accountData))
        .rejects
        .toThrow(ValidationAppError);
    });

    it('should set correct level based on parent', async () => {
      // Create parent group account
      const parentAccount = await testUtils.createTestAccount({
        code: 'PARENT001',
        name: 'Parent Account',
        isGroup: true,
        level: 1
      });

      const accountData = {
        code: 'CHILD001',
        name: 'Child Account',
        type: 'asset',
        accountType: 'sub',
        nature: 'debit',
        parentId: parentAccount.id
      };

      const account = await AccountService.createAccount(accountData);

      expect(account.level).toBe(2);
      expect(account.parentId).toBe(parentAccount.id);
    });
  });

  describe('getAccounts', () => {
    beforeEach(async () => {
      // Create test accounts
      await testUtils.createTestAccount({
        code: 'ACC001',
        name: 'Asset Account',
        type: 'asset'
      });
      
      await testUtils.createTestAccount({
        code: 'ACC002',
        name: 'Liability Account',
        type: 'liability'
      });
      
      await testUtils.createTestAccount({
        code: 'ACC003',
        name: 'Inactive Account',
        type: 'asset',
        isActive: false
      });
    });

    it('should return paginated accounts', async () => {
      const result = await AccountService.getAccounts({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(2); // Only active accounts
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by type', async () => {
      const result = await AccountService.getAccounts({ type: 'asset' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('asset');
    });

    it('should search by name and code', async () => {
      const result = await AccountService.getAccounts({ search: 'Asset' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Asset');
    });

    it('should include inactive accounts when specified', async () => {
      const result = await AccountService.getAccounts({ isActive: false });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isActive).toBe(false);
    });
  });

  describe('getAccountById', () => {
    it('should return account by ID', async () => {
      const testAccount = await testUtils.createTestAccount();
      
      const account = await AccountService.getAccountById(testAccount.id);

      expect(account).toBeDefined();
      expect(account.id).toBe(testAccount.id);
      expect(account.code).toBe(testAccount.code);
    });

    it('should throw ValidationAppError for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(AccountService.getAccountById(fakeId))
        .rejects
        .toThrow(ValidationAppError);
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      const testAccount = await testUtils.createTestAccount();
      
      const updateData = {
        name: 'Updated Account Name',
        description: 'Updated description'
      };

      const updatedAccount = await AccountService.updateAccount(testAccount.id, updateData);

      expect(updatedAccount.name).toBe(updateData.name);
      expect(updatedAccount.description).toBe(updateData.description);
    });

    it('should throw ValidationAppError for duplicate code', async () => {
      const account1 = await testUtils.createTestAccount({ code: 'ACC001' });
      const account2 = await testUtils.createTestAccount({ code: 'ACC002' });

      await expect(AccountService.updateAccount(account2.id, { code: 'ACC001' }))
        .rejects
        .toThrow(ValidationAppError);
    });

    it('should prevent circular parent reference', async () => {
      const testAccount = await testUtils.createTestAccount();

      await expect(AccountService.updateAccount(testAccount.id, { parentId: testAccount.id }))
        .rejects
        .toThrow(ValidationAppError);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      const testAccount = await testUtils.createTestAccount();

      const result = await AccountService.deleteAccount(testAccount.id);

      expect(result).toBe(true);
    });

    it('should throw ValidationAppError for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(AccountService.deleteAccount(fakeId))
        .rejects
        .toThrow(ValidationAppError);
    });

    it('should prevent deletion of account with children', async () => {
      const parentAccount = await testUtils.createTestAccount({
        code: 'PARENT001',
        isGroup: true
      });
      
      await testUtils.createTestAccount({
        code: 'CHILD001',
        parentId: parentAccount.id
      });

      await expect(AccountService.deleteAccount(parentAccount.id))
        .rejects
        .toThrow(ValidationAppError);
    });

    it('should prevent deletion of account with non-zero balance', async () => {
      const testAccount = await testUtils.createTestAccount({
        balance: 100.00
      });

      await expect(AccountService.deleteAccount(testAccount.id))
        .rejects
        .toThrow(ValidationAppError);
    });
  });

  describe('getAccountHierarchy', () => {
    beforeEach(async () => {
      // Create hierarchical accounts
      const parent = await testUtils.createTestAccount({
        code: 'PARENT',
        name: 'Parent Account',
        isGroup: true,
        level: 1
      });

      await testUtils.createTestAccount({
        code: 'CHILD1',
        name: 'Child Account 1',
        parentId: parent.id,
        level: 2
      });

      await testUtils.createTestAccount({
        code: 'CHILD2',
        name: 'Child Account 2',
        parentId: parent.id,
        level: 2
      });
    });

    it('should return hierarchical account tree', async () => {
      const tree = await AccountService.getAccountHierarchy();

      expect(tree).toBeInstanceOf(Array);
      expect(tree).toHaveLength(1); // One root account
      expect(tree[0].children).toHaveLength(2); // Two child accounts
    });
  });

  describe('buildAccountTree', () => {
    it('should build correct tree structure', async () => {
      const accounts = [
        { id: '1', code: 'P1', name: 'Parent 1', parentId: null, toJSON: () => ({ id: '1', code: 'P1', name: 'Parent 1', parentId: null }) },
        { id: '2', code: 'C1', name: 'Child 1', parentId: '1', toJSON: () => ({ id: '2', code: 'C1', name: 'Child 1', parentId: '1' }) },
        { id: '3', code: 'C2', name: 'Child 2', parentId: '1', toJSON: () => ({ id: '3', code: 'C2', name: 'Child 2', parentId: '1' }) }
      ];

      const tree = AccountService.buildAccountTree(accounts);

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].code).toBe('C1');
      expect(tree[0].children[1].code).toBe('C2');
    });
  });
});
