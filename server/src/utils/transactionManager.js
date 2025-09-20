import { sequelize } from '../models/index.js';

/**
 * Transaction Manager for handling database transactions
 * Provides utilities for safe database operations with rollback capabilities
 */
class TransactionManager {
  
  /**
   * Execute a function within a database transaction
   * @param {Function} operation - Async function to execute within transaction
   * @param {Object} options - Transaction options
   * @returns {Promise} - Result of the operation or error
   */
  static async executeInTransaction(operation, options = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: options.isolationLevel || sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      ...options
    });

    try {
      console.log('🔄 Starting database transaction...');

      // Execute the operation with transaction
      const result = await operation(transaction);

      // Commit transaction
      await transaction.commit();
      console.log('✅ Transaction committed successfully');

      return { success: true, data: result };

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error.message);

      return {
        success: false,
        error: error.message,
        code: error.code || 'TRANSACTION_FAILED'
      };
    }
  }

  /**
   * Execute a financial transaction with proper locking and rollback
   * @param {Function} operation - The operation to execute within transaction
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} Transaction result
   */
  static async executeFinancialTransaction(operation, options = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      ...options
    });

    try {
      console.log(`🔄 Starting financial transaction: ${options.description || 'Unknown'}`);

      const result = await operation(transaction);

      await transaction.commit();
      console.log(`✅ Financial transaction completed successfully`);

      return {
        success: true,
        data: result,
        transactionId: transaction.id
      };

    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Financial transaction failed and rolled back:`, error.message);

      throw {
        success: false,
        error: error.message,
        code: 'TRANSACTION_FAILED',
        originalError: error
      };
    }
  }
  
  /**
   * Update account balance safely with locking
   * @param {string} accountId - Account ID
   * @param {number} amount - Amount to add/subtract
   * @param {string} description - Description of the operation
   * @returns {Promise<Object>} Updated account
   */
  static async updateAccountBalance(accountId, amount, description = 'Balance Update') {
    return await this.executeFinancialTransaction(async (transaction) => {
      const { Account } = await import('../models/index.js');

      const account = await Account.findByPk(accountId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!account) {
        throw new Error(`الحساب غير موجود: ${accountId}`);
      }

      if (account.freezeAccount) {
        throw new Error(`الحساب مجمد: ${account.name}`);
      }

      const oldBalance = parseFloat(account.balance);
      const newBalance = oldBalance + amount;

      await account.update({
        balance: newBalance,
        updatedAt: new Date()
      }, { transaction });

      console.log(`💰 Account ${account.code} balance updated: ${oldBalance} → ${newBalance}`);

      return account;

    }, { description });
  }

  /**
   * Execute multiple operations in a single transaction
   * @param {Array} operations - Array of async functions
   * @param {Object} options - Transaction options
   * @returns {Promise} - Results array or error
   */
  static async executeMultipleInTransaction(operations, options = {}) {
    return this.executeInTransaction(async (transaction) => {
      const results = [];
      
      for (let i = 0; i < operations.length; i++) {
        console.log(`🔄 Executing operation ${i + 1}/${operations.length}...`);
        const result = await operations[i](transaction);
        results.push(result);
      }
      
      return results;
    }, options);
  }
  
  /**
   * Create account with transaction safety
   * @param {Object} accountData - Account data
   * @param {Object} models - Database models
   * @returns {Promise} - Created account or error
   */
  static async createAccountSafely(accountData, models) {
    return this.executeInTransaction(async (transaction) => {
      const { Account } = models;
      
      // Check for duplicate account code
      const existingAccount = await Account.findOne({
        where: { code: accountData.code },
        transaction
      });
      
      if (existingAccount) {
        throw new Error(`Account with code '${accountData.code}' already exists`);
      }
      
      // Validate parent account if specified
      if (accountData.parentId) {
        const parentAccount = await Account.findByPk(accountData.parentId, { transaction });
        if (!parentAccount) {
          throw new Error(`Parent account with ID '${accountData.parentId}' not found`);
        }

        // Auto-convert parent to group if it's not already
        if (!parentAccount.isGroup) {
          await parentAccount.update({ isGroup: true }, { transaction });
          console.log(`✅ Parent account '${parentAccount.code}' converted to group automatically`);
        }
      }
      
      // Create the account
      const newAccount = await Account.create(accountData, { transaction });
      
      console.log(`✅ Account '${newAccount.code}' created successfully`);
      return newAccount;
    });
  }
  
  /**
   * Create journal entry with transaction safety
   * @param {Object} entryData - Journal entry data
   * @param {Object} models - Database models
   * @returns {Promise} - Created journal entry or error
   */
  static async createJournalEntrySafely(entryData, models) {
    return this.executeInTransaction(async (transaction) => {
      const { JournalEntry, JournalEntryDetail, Account, GLEntry } = models;
      
      // Validate that debits equal credits
      const totalDebits = entryData.details.reduce((sum, detail) => sum + (detail.debit || 0), 0);
      const totalCredits = entryData.details.reduce((sum, detail) => sum + (detail.credit || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Journal entry is not balanced: debits must equal credits');
      }
      
      // Validate all accounts exist and are active
      for (const detail of entryData.details) {
        const account = await Account.findByPk(detail.accountId, { transaction });
        if (!account) {
          throw new Error(`Account with ID '${detail.accountId}' not found`);
        }
        if (!account.isActive) {
          throw new Error(`Account '${account.name}' is not active`);
        }
        if (account.isGroup) {
          throw new Error(`Cannot post to group account '${account.name}'`);
        }
      }
      
      // Create journal entry header
      const journalEntry = await JournalEntry.create({
        date: entryData.date,
        description: entryData.description,
        reference: entryData.reference,
        type: entryData.type || 'general',
        status: 'draft',
        totalDebit: totalDebits,
        totalCredit: totalCredits,
        currency: entryData.currency || 'LYD',
        exchangeRate: entryData.exchangeRate || 1
      }, { transaction });
      
      // Create journal entry details
      const details = [];
      for (const detailData of entryData.details) {
        const detail = await JournalEntryDetail.create({
          journalEntryId: journalEntry.id,
          accountId: detailData.accountId,
          description: detailData.description,
          debit: detailData.debit || 0,
          credit: detailData.credit || 0,
          currency: detailData.currency || 'LYD',
          exchangeRate: detailData.exchangeRate || 1
        }, { transaction });
        
        details.push(detail);
      }
      
      console.log(`✅ Journal entry created with ${details.length} details`);
      
      return {
        journalEntry,
        details
      };
    });
  }
  
  /**
   * Update account balances safely
   * @param {Array} balanceUpdates - Array of {accountId, debit, credit}
   * @param {Object} models - Database models
   * @returns {Promise} - Update results or error
   */
  static async updateAccountBalancesSafely(balanceUpdates, models) {
    return this.executeInTransaction(async (transaction) => {
      const { Account } = models;
      const updatedAccounts = [];
      
      for (const update of balanceUpdates) {
        const account = await Account.findByPk(update.accountId, { 
          transaction,
          lock: transaction.LOCK.UPDATE // Lock the row for update
        });
        
        if (!account) {
          throw new Error(`Account with ID '${update.accountId}' not found`);
        }
        
        // Calculate new balance based on account type
        let newBalance = parseFloat(account.balance) || 0;
        
        if (account.isDebitBalance()) {
          newBalance += (update.debit || 0) - (update.credit || 0);
        } else {
          newBalance += (update.credit || 0) - (update.debit || 0);
        }
        
        // Update account balance
        await account.update({ balance: newBalance }, { transaction });
        
        updatedAccounts.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          oldBalance: account.balance,
          newBalance: newBalance,
          debit: update.debit || 0,
          credit: update.credit || 0
        });
      }
      
      console.log(`✅ Updated balances for ${updatedAccounts.length} accounts`);
      return updatedAccounts;
    });
  }
  
  /**
   * Safely delete account with validation
   * @param {string} accountId - Account ID to delete
   * @param {Object} models - Database models
   * @returns {Promise} - Deletion result or error
   */
  static async deleteAccountSafely(accountId, models) {
    return this.executeInTransaction(async (transaction) => {
      const { Account, GLEntry, JournalEntryDetail } = models;
      
      const account = await Account.findByPk(accountId, { transaction });
      if (!account) {
        throw new Error('Account not found');
      }
      
      // Check for child accounts
      const childAccounts = await Account.findAll({
        where: { parentId: accountId },
        transaction
      });
      
      if (childAccounts.length > 0) {
        throw new Error(`Cannot delete account '${account.name}' - it has ${childAccounts.length} child accounts`);
      }
      
      // Check for GL entries
      const glEntries = await GLEntry.findAll({
        where: { account: accountId },
        transaction
      });
      
      if (glEntries.length > 0) {
        throw new Error(`Cannot delete account '${account.name}' - it has ${glEntries.length} GL entries`);
      }
      
      // Check for journal entry details
      const journalDetails = await JournalEntryDetail.findAll({
        where: { accountId: accountId },
        transaction
      });
      
      if (journalDetails.length > 0) {
        throw new Error(`Cannot delete account '${account.name}' - it has ${journalDetails.length} journal entry details`);
      }
      
      // Safe to delete
      await account.destroy({ transaction });
      
      console.log(`✅ Account '${account.name}' deleted successfully`);
      return { deleted: true, accountName: account.name };
    });
  }
}

export default TransactionManager;
