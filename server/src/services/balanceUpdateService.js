import models from '../models/index.js';
import { Op } from 'sequelize';

const { Account, JournalEntry, JournalEntryDetail } = models;

class BalanceUpdateService {
  constructor() {
    this.updateQueue = [];
    this.isProcessing = false;
  }

  /**
   * Queue account balance update
   * @param {string} accountId - Account ID to update
   * @param {string} reason - Reason for update (e.g., 'journal_entry', 'voucher')
   * @param {Object} metadata - Additional metadata
   */
  queueBalanceUpdate(accountId, reason = 'manual', metadata = {}) {
    this.updateQueue.push({
      accountId,
      reason,
      metadata,
      timestamp: new Date()
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the balance update queue
   */
  async processQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Group updates by account to avoid duplicate processing
      const accountUpdates = new Map();
      
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift();
        if (!accountUpdates.has(update.accountId)) {
          accountUpdates.set(update.accountId, update);
        }
      }

      // Process each account update
      for (const [accountId, update] of accountUpdates) {
        await this.updateAccountBalance(accountId, update.reason, update.metadata);
      }
    } catch (error) {
      console.error('Error processing balance update queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update account balance and notify clients
   * @param {string} accountId - Account ID
   * @param {string} reason - Update reason
   * @param {Object} metadata - Additional metadata
   */
  async updateAccountBalance(accountId, reason, metadata) {
    try {
      const account = await Account.findByPk(accountId);
      if (!account) {
        console.error(`Account not found: ${accountId}`);
        return;
      }

      // Calculate new balance from journal entries
      const newBalance = await this.calculateAccountBalance(accountId);
      const oldBalance = parseFloat(account.balance || 0);

      // Update account balance if changed
      if (Math.abs(newBalance - oldBalance) > 0.01) {
        await account.update({ 
          balance: newBalance,
          lastBalanceUpdate: new Date()
        });

        // Emit real-time update to connected clients
        this.emitBalanceUpdate(account, oldBalance, newBalance, reason, metadata);

        // Update parent account balances if this is a sub-account
        if (account.parentId) {
          await this.updateParentAccountBalances(account.parentId);
        }

        console.log(`Balance updated for account ${account.code}: ${oldBalance} -> ${newBalance}`);
      }
    } catch (error) {
      console.error(`Error updating balance for account ${accountId}:`, error);
    }
  }

  /**
   * Calculate account balance from journal entries
   * @param {string} accountId - Account ID
   * @returns {number} Calculated balance
   */
  async calculateAccountBalance(accountId) {
    try {
      const account = await Account.findByPk(accountId);
      if (!account) return 0;

      // Get all journal entry lines for this account
      const journalLines = await JournalEntryDetail.findAll({
        where: { accountId },
        include: [{
          model: JournalEntry,
          as: 'journalEntry',
          where: { status: 'posted' }
        }]
      });

      let balance = 0;

      // Calculate balance based on account type
      for (const line of journalLines) {
        const debit = parseFloat(line.debit || 0);
        const credit = parseFloat(line.credit || 0);

        // Normal balance calculation based on account type
        switch (account.type) {
          case 'asset':
          case 'expense':
            balance += debit - credit;
            break;
          case 'liability':
          case 'equity':
          case 'revenue':
            balance += credit - debit;
            break;
          default:
            balance += debit - credit;
        }
      }

      return balance;
    } catch (error) {
      console.error(`Error calculating balance for account ${accountId}:`, error);
      return 0;
    }
  }

  /**
   * Update parent account balances recursively
   * @param {string} parentId - Parent account ID
   */
  async updateParentAccountBalances(parentId) {
    try {
      const parentAccount = await Account.findByPk(parentId);
      if (!parentAccount || !parentAccount.isGroup) return;

      // Get all child accounts
      const childAccounts = await Account.findAll({
        where: { parentId }
      });

      // Calculate total balance from children
      let totalBalance = 0;
      for (const child of childAccounts) {
        totalBalance += parseFloat(child.balance || 0);
      }

      const oldBalance = parseFloat(parentAccount.balance || 0);

      // Update parent balance if changed
      if (Math.abs(totalBalance - oldBalance) > 0.01) {
        await parentAccount.update({ 
          balance: totalBalance,
          lastBalanceUpdate: new Date()
        });

        // Emit update for parent account
        this.emitBalanceUpdate(parentAccount, oldBalance, totalBalance, 'child_update');

        // Continue up the hierarchy
        if (parentAccount.parentId) {
          await this.updateParentAccountBalances(parentAccount.parentId);
        }
      }
    } catch (error) {
      console.error(`Error updating parent account balance ${parentId}:`, error);
    }
  }

  /**
   * Emit balance update to connected clients via WebSocket
   * @param {Object} account - Account object
   * @param {number} oldBalance - Previous balance
   * @param {number} newBalance - New balance
   * @param {string} reason - Update reason
   * @param {Object} metadata - Additional metadata
   */
  emitBalanceUpdate(account, oldBalance, newBalance, reason, metadata = {}) {
    const updateData = {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      oldBalance,
      newBalance,
      difference: newBalance - oldBalance,
      currency: account.currency || 'LYD',
      reason,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Emit to all connected clients via WebSocket service
    if (global.io) {
      global.io.emit('balance_updated', updateData);

      // Emit to specific account room if clients are subscribed
      global.io.to(`account_${account.id}`).emit('account_balance_updated', updateData);
    }
  }

  /**
   * Update balances for multiple accounts
   * @param {string[]} accountIds - Array of account IDs
   * @param {string} reason - Update reason
   * @param {Object} metadata - Additional metadata
   */
  async updateMultipleAccountBalances(accountIds, reason = 'bulk_update', metadata = {}) {
    for (const accountId of accountIds) {
      this.queueBalanceUpdate(accountId, reason, metadata);
    }
  }

  /**
   * Recalculate all account balances (maintenance function)
   */
  async recalculateAllBalances() {
    try {
      console.log('Starting full balance recalculation...');
      
      const accounts = await Account.findAll({
        where: { isGroup: false } // Only leaf accounts
      });

      let updated = 0;
      for (const account of accounts) {
        const calculatedBalance = await this.calculateAccountBalance(account.id);
        const currentBalance = parseFloat(account.balance || 0);

        if (Math.abs(calculatedBalance - currentBalance) > 0.01) {
          await account.update({ 
            balance: calculatedBalance,
            lastBalanceUpdate: new Date()
          });
          updated++;
        }
      }

      // Update parent account balances
      const parentAccounts = await Account.findAll({
        where: { isGroup: true },
        order: [['level', 'DESC']] // Start from deepest level
      });

      for (const parent of parentAccounts) {
        await this.updateParentAccountBalances(parent.id);
      }

      console.log(`Balance recalculation completed. Updated ${updated} accounts.`);
      return { success: true, updatedAccounts: updated };
    } catch (error) {
      console.error('Error in full balance recalculation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get real-time balance for an account
   * @param {string} accountId - Account ID
   * @returns {Object} Account balance information
   */
  async getRealTimeBalance(accountId) {
    try {
      const account = await Account.findByPk(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const calculatedBalance = await this.calculateAccountBalance(accountId);
      const storedBalance = parseFloat(account.balance || 0);

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        storedBalance,
        calculatedBalance,
        isInSync: Math.abs(calculatedBalance - storedBalance) < 0.01,
        currency: account.currency || 'LYD',
        lastUpdate: account.lastBalanceUpdate,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting real-time balance for ${accountId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const balanceUpdateService = new BalanceUpdateService();

export default balanceUpdateService;
