import models from '../models/index.js';
import TransactionManager from '../utils/transactionManager.js';
import cacheManager, { cacheKeys } from '../utils/cacheManager.js';
import { ValidationAppError, DatabaseError } from '../middleware/enhancedErrorHandler.js';

const { Account, GLEntry } = models;

/**
 * Account Service Layer
 * Handles all account-related business logic
 */
class AccountService {

  /**
   * Get accounts with caching and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Accounts data
   */
  static async getAccounts(params = {}) {
    try {
      const cacheKey = cacheKeys.accounts(params);
      
      // Try to get from cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { page = 1, limit = 50, search, type, isActive = true } = params;
      const offset = (page - 1) * limit;

      // Build where clause
      let whereClause = { isActive };
      
      if (search) {
        whereClause[models.sequelize.Op.or] = [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { nameEn: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      if (type) {
        whereClause.type = type;
      }

      // Execute query
      const { count, rows } = await Account.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['code', 'ASC']],
        include: [
          {
            model: Account,
            as: 'parent',
            attributes: ['id', 'code', 'name']
          },
          {
            model: Account,
            as: 'children',
            attributes: ['id', 'code', 'name', 'balance']
          }
        ]
      });

      const result = {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };

      // Cache the result for 5 minutes
      await cacheManager.set(cacheKey, result, 300);

      return result;

    } catch (error) {
      throw new DatabaseError('Failed to fetch accounts', error, 'getAccounts');
    }
  }

  /**
   * Get single account by ID with caching
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Account data
   */
  static async getAccountById(accountId) {
    try {
      const cacheKey = cacheKeys.account(accountId);
      
      // Try cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const account = await Account.findByPk(accountId, {
        include: [
          {
            model: Account,
            as: 'parent',
            attributes: ['id', 'code', 'name']
          },
          {
            model: Account,
            as: 'children',
            attributes: ['id', 'code', 'name', 'balance']
          }
        ]
      });

      if (!account) {
        throw new ValidationAppError('الحساب غير موجود', null, 'accountId');
      }

      // Cache for 10 minutes
      await cacheManager.set(cacheKey, account, 600);

      return account;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch account', error, 'getAccountById');
    }
  }

  /**
   * Create new account with validation
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created account
   */
  static async createAccount(accountData) {
    try {
      // Validate required fields
      const { code, name, type, accountType, nature } = accountData;
      
      if (!code || !name || !type || !accountType || !nature) {
        throw new ValidationAppError('البيانات المطلوبة مفقودة', {
          code: !code ? 'رمز الحساب مطلوب' : null,
          name: !name ? 'اسم الحساب مطلوب' : null,
          type: !type ? 'نوع الحساب مطلوب' : null,
          accountType: !accountType ? 'تصنيف الحساب مطلوب' : null,
          nature: !nature ? 'طبيعة الحساب مطلوبة' : null
        });
      }

      // Check if code already exists
      const existingAccount = await Account.findOne({ where: { code } });
      if (existingAccount) {
        throw new ValidationAppError('رمز الحساب موجود بالفعل', null, 'code');
      }

      // Validate parent account if provided
      if (accountData.parentId) {
        const parentAccount = await Account.findByPk(accountData.parentId);
        if (!parentAccount) {
          throw new ValidationAppError('الحساب الأب غير موجود', null, 'parentId');
        }

        // Auto-convert parent to group if it's not already
        if (!parentAccount.isGroup) {
          await parentAccount.update({ isGroup: true });
          console.log(`✅ Parent account '${parentAccount.code}' converted to group automatically`);
        }

        // Set level based on parent
        accountData.level = parentAccount.level + 1;
      }

      // Create account
      const account = await Account.create({
        ...accountData,
        balance: 0.00,
        isActive: true
      });

      // Invalidate related cache
      await cacheManager.invalidate(['accounts:*']);

      return account;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to create account', error, 'createAccount');
    }
  }

  /**
   * Update account with validation
   * @param {string} accountId - Account ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated account
   */
  static async updateAccount(accountId, updateData) {
    try {
      const account = await Account.findByPk(accountId);
      if (!account) {
        throw new ValidationAppError('الحساب غير موجود', null, 'accountId');
      }

      // Check if code is being changed and if it already exists
      if (updateData.code && updateData.code !== account.code) {
        const existingAccount = await Account.findOne({ 
          where: { 
            code: updateData.code,
            id: { [models.sequelize.Op.ne]: accountId }
          } 
        });
        
        if (existingAccount) {
          throw new ValidationAppError('رمز الحساب موجود بالفعل', null, 'code');
        }
      }

      // Validate parent account if being changed
      if (updateData.parentId && updateData.parentId !== account.parentId) {
        const parentAccount = await Account.findByPk(updateData.parentId);
        if (!parentAccount) {
          throw new ValidationAppError('الحساب الأب غير موجود', null, 'parentId');
        }

        // Auto-convert parent to group if it's not already
        if (!parentAccount.isGroup) {
          await parentAccount.update({ isGroup: true });
          console.log(`✅ Parent account '${parentAccount.code}' converted to group automatically`);
        }

        // Prevent circular reference
        if (updateData.parentId === accountId) {
          throw new ValidationAppError('لا يمكن أن يكون الحساب أب لنفسه', null, 'parentId');
        }

        // Update level based on new parent
        updateData.level = parentAccount.level + 1;
      }

      // Update account
      await account.update(updateData);

      // Invalidate cache
      await cacheManager.invalidate([
        `account:${accountId}`,
        'accounts:*'
      ]);

      return account;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to update account', error, 'updateAccount');
    }
  }

  /**
   * Delete account with validation
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteAccount(accountId) {
    try {
      const account = await Account.findByPk(accountId);
      if (!account) {
        throw new ValidationAppError('الحساب غير موجود', null, 'accountId');
      }

      // Check if account has children
      const childrenCount = await Account.count({ where: { parentId: accountId } });
      if (childrenCount > 0) {
        throw new ValidationAppError('لا يمكن حذف حساب له حسابات فرعية', null, 'accountId');
      }

      // Check if account has transactions
      const transactionCount = await GLEntry.count({ where: { accountId } });
      if (transactionCount > 0) {
        throw new ValidationAppError('لا يمكن حذف حساب له معاملات', null, 'accountId');
      }

      // Check if account has non-zero balance
      if (parseFloat(account.balance) !== 0) {
        throw new ValidationAppError('لا يمكن حذف حساب له رصيد', null, 'accountId');
      }

      // Delete account
      await account.destroy();

      // Invalidate cache
      await cacheManager.invalidate([
        `account:${accountId}`,
        'accounts:*'
      ]);

      return true;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete account', error, 'deleteAccount');
    }
  }

  /**
   * Get account hierarchy tree
   * @returns {Promise<Array>} Account tree
   */
  static async getAccountHierarchy() {
    try {
      const cacheKey = 'account_hierarchy';
      
      // Try cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get all accounts
      const accounts = await Account.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']]
      });

      // Build hierarchy tree
      const tree = this.buildAccountTree(accounts);

      // Cache for 15 minutes
      await cacheManager.set(cacheKey, tree, 900);

      return tree;

    } catch (error) {
      throw new DatabaseError('Failed to get account hierarchy', error, 'getAccountHierarchy');
    }
  }

  /**
   * Build account tree from flat array
   * @param {Array} accounts - Flat array of accounts
   * @param {string} parentId - Parent ID (null for root)
   * @returns {Array} Tree structure
   */
  static buildAccountTree(accounts, parentId = null) {
    const tree = [];
    
    for (const account of accounts) {
      if (account.parentId === parentId) {
        const children = this.buildAccountTree(accounts, account.id);
        tree.push({
          ...account.toJSON(),
          children
        });
      }
    }
    
    return tree;
  }

  /**
   * Get account balance history
   * @param {string} accountId - Account ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Balance history
   */
  static async getAccountBalanceHistory(accountId, params = {}) {
    try {
      const { dateFrom, dateTo, limit = 100 } = params;
      
      let whereClause = { accountId };
      
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt[models.sequelize.Op.gte] = new Date(dateFrom);
        if (dateTo) whereClause.createdAt[models.sequelize.Op.lte] = new Date(dateTo);
      }

      const entries = await GLEntry.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: models.JournalEntry,
            attributes: ['id', 'description', 'date', 'status']
          }
        ]
      });

      return entries;

    } catch (error) {
      throw new DatabaseError('Failed to get account balance history', error, 'getAccountBalanceHistory');
    }
  }
}

export default AccountService;
