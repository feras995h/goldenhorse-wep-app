import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read JSON data
const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to write JSON data
const writeJsonFile = async (filename, data) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

/**
 * GL Entry Controller - Core double-entry bookkeeping engine
 * Based on ERPNext's accounting architecture
 */
class GLEntryController {
  
  /**
   * Create GL entries for a voucher (Journal Entry, Invoice, Payment, etc.)
   * @param {Array} glEntries - Array of GL entry objects
   * @param {Object} options - Additional options like validateOnly, updateBalances
   * @returns {Object} - Success/failure result with GL entry IDs
   */
  async createGLEntries(glEntries, options = {}) {
    const { validateOnly = false, updateBalances = true, userId } = options;
    
    try {
      // Validate GL entries first
      const validation = await this.validateGLEntries(glEntries);
      if (!validation.valid) {
        return { success: false, message: validation.message, errors: validation.errors };
      }
      
      if (validateOnly) {
        return { success: true, message: 'Validation passed', validated: true };
      }
      
      // Read existing GL entries
      const existingGLEntries = await readJsonFile('gl_entries.json');
      
      // Process and create GL entries
      const processedEntries = [];
      for (let entry of glEntries) {
        const glEntry = await this.processGLEntry(entry, userId);
        processedEntries.push(glEntry);
        existingGLEntries.push(glEntry);
      }
      
      // Save GL entries
      await writeJsonFile('gl_entries.json', existingGLEntries);
      
      // Update account balances if required
      if (updateBalances) {
        await this.updateAccountBalances(processedEntries);
      }
      
      return {
        success: true,
        message: 'GL entries created successfully',
        glEntries: processedEntries,
        glEntryIds: processedEntries.map(entry => entry.id)
      };
      
    } catch (error) {
      console.error('Error creating GL entries:', error);
      return {
        success: false,
        message: 'خطأ في إنشاء قيود دفتر الأستاذ العام',
        error: error.message
      };
    }
  }
  
  /**
   * Process a single GL entry with ERPNext-like structure
   */
  async processGLEntry(entry, userId) {
    const accounts = await readJsonFile('accounts.json');
    const account = accounts.find(acc => acc.id === entry.accountId);
    
    if (!account) {
      throw new Error(`Account with ID ${entry.accountId} not found`);
    }
    
    const glEntry = {
      id: uuidv4(),
      postingDate: entry.postingDate,
      transactionDate: entry.transactionDate || entry.postingDate,
      account: entry.accountId,
      accountCode: account.code,
      accountName: account.name,
      accountCurrency: account.currency,
      debit: parseFloat(entry.debit || 0),
      credit: parseFloat(entry.credit || 0),
      debitInAccountCurrency: parseFloat(entry.debit || 0),
      creditInAccountCurrency: parseFloat(entry.credit || 0),
      voucherType: entry.voucherType,
      voucherNo: entry.voucherNo,
      voucherDetailNo: entry.voucherDetailNo || null,
      against: entry.against || '',
      againstVoucherType: entry.againstVoucherType || null,
      againstVoucher: entry.againstVoucher || null,
      partyType: entry.partyType || null,
      party: entry.party || null,
      costCenter: entry.costCenter || null,
      project: entry.project || null,
      remarks: entry.remarks || '',
      isOpening: entry.isOpening || 'No',
      isAdvance: entry.isAdvance || 'No',
      isCancelled: false,
      fiscalYear: entry.fiscalYear || new Date().getFullYear().toString(),
      company: entry.company || 'منضومة وائل',
      financeBook: entry.financeBook || null,
      createdAt: new Date().toISOString(),
      createdBy: userId || 'system',
      dueDate: entry.dueDate || null
    };
    
    return glEntry;
  }
  
  /**
   * Validate GL entries following ERPNext rules
   */
  async validateGLEntries(glEntries) {
    const errors = [];
    
    if (!glEntries || glEntries.length === 0) {
      return { valid: false, message: 'لا توجد قيود للمعالجة', errors: ['No GL entries provided'] };
    }
    
    // Check if entries are balanced (total debits = total credits)
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (let entry of glEntries) {
      // Validate required fields
      if (!entry.accountId) {
        errors.push('Account ID is required for all entries');
      }
      
      if (!entry.postingDate) {
        errors.push('Posting date is required for all entries');
      }
      
      if (!entry.voucherType || !entry.voucherNo) {
        errors.push('Voucher type and number are required');
      }
      
      const debit = parseFloat(entry.debit || 0);
      const credit = parseFloat(entry.credit || 0);
      
      // Check that either debit or credit is provided (but not both)
      if ((debit === 0 && credit === 0) || (debit > 0 && credit > 0)) {
        errors.push('Each entry must have either debit OR credit amount, not both or neither');
      }
      
      totalDebits += debit;
      totalCredits += credit;
      
      // Validate account exists and is ledger account
      const accounts = await readJsonFile('accounts.json');
      const account = accounts.find(acc => acc.id === entry.accountId);
      
      if (!account) {
        errors.push(`Account with ID ${entry.accountId} does not exist`);
      } else {
        // Check if account is a group account (cannot post to group accounts)
        if (account.isGroup) {
          errors.push(`Cannot post to group account: ${account.name} (${account.code})`);
        }
        
        // Check if account is active
        if (!account.isActive) {
          errors.push(`Account is inactive: ${account.name} (${account.code})`);
        }
        
        // Check if account is frozen
        if (account.freezeAccount) {
          errors.push(`Account is frozen: ${account.name} (${account.code})`);
        }
      }
    }
    
    // Check balance (debits must equal credits)
    const difference = Math.abs(totalDebits - totalCredits);
    if (difference > 0.01) { // Allow for minor rounding differences
      errors.push(`GL entries are not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
    }
    
    if (errors.length > 0) {
      return {
        valid: false,
        message: 'فشل في التحقق من صحة القيود',
        errors: errors
      };
    }
    
    return { valid: true, message: 'Validation passed' };
  }
  
  /**
   * Update account balances after GL entry creation
   */
  async updateAccountBalances(glEntries) {
    const accounts = await readJsonFile('accounts.json');
    const updatedAccounts = new Map();
    
    for (let glEntry of glEntries) {
      const accountId = glEntry.account;
      
      if (!updatedAccounts.has(accountId)) {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) {
          updatedAccounts.set(accountId, { ...account });
        }
      }
      
      const account = updatedAccounts.get(accountId);
      if (account) {
        // Update balance based on account type and debit/credit
        // Asset and Expense accounts: Debit increases, Credit decreases
        // Liability, Equity, and Revenue accounts: Credit increases, Debit decreases
        
        if (['asset', 'expense'].includes(account.type)) {
          account.balance += glEntry.debit - glEntry.credit;
        } else {
          account.balance += glEntry.credit - glEntry.debit;
        }
        
        account.updatedAt = new Date().toISOString();
      }
    }
    
    // Update accounts in the main array
    for (let [accountId, updatedAccount] of updatedAccounts) {
      const index = accounts.findIndex(acc => acc.id === accountId);
      if (index !== -1) {
        accounts[index] = updatedAccount;
      }
    }
    
    // Update parent account balances (hierarchical aggregation)
    await this.updateParentAccountBalances(accounts);
    
    // Save updated accounts
    await writeJsonFile('accounts.json', accounts);
  }
  
  /**
   * Update parent account balances (aggregate from children)
   */
  async updateParentAccountBalances(accounts) {
    // Process accounts level by level (bottom-up)
    const maxLevel = Math.max(...accounts.map(acc => acc.level));
    
    for (let level = maxLevel; level >= 1; level--) {
      const levelAccounts = accounts.filter(acc => acc.level === level);
      
      for (let account of levelAccounts) {
        if (account.parentId) {
          const parent = accounts.find(acc => acc.id === account.parentId);
          if (parent && parent.isGroup) {
            // For group accounts, balance is sum of all children
            const children = accounts.filter(acc => acc.parentId === parent.id);
            parent.balance = children.reduce((sum, child) => sum + child.balance, 0);
            parent.updatedAt = new Date().toISOString();
          }
        }
      }
    }
  }
  
  /**
   * Cancel GL entries (create reverse entries)
   */
  async cancelGLEntries(voucherType, voucherNo, userId) {
    try {
      const glEntries = await readJsonFile('gl_entries.json');
      
      // Find entries to cancel
      const entriesToCancel = glEntries.filter(
        entry => entry.voucherType === voucherType && 
                entry.voucherNo === voucherNo && 
                !entry.isCancelled
      );
      
      if (entriesToCancel.length === 0) {
        return { success: false, message: 'لم يتم العثور على قيود للإلغاء' };
      }
      
      // Create reverse entries
      const reverseEntries = entriesToCancel.map(entry => ({
        ...entry,
        id: uuidv4(),
        debit: entry.credit, // Reverse debit and credit
        credit: entry.debit,
        debitInAccountCurrency: entry.creditInAccountCurrency,
        creditInAccountCurrency: entry.debitInAccountCurrency,
        remarks: `Cancellation of ${entry.voucherType} ${entry.voucherNo}: ${entry.remarks}`,
        postingDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        createdBy: userId,
        isCancelled: false,
        againstVoucherType: entry.voucherType,
        againstVoucher: entry.voucherNo
      }));
      
      // Mark original entries as cancelled
      entriesToCancel.forEach(entry => {
        entry.isCancelled = true;
        entry.updatedAt = new Date().toISOString();
      });
      
      // Add reverse entries
      glEntries.push(...reverseEntries);
      
      // Save updated GL entries
      await writeJsonFile('gl_entries.json', glEntries);
      
      // Update account balances
      await this.updateAccountBalances(reverseEntries);
      
      return {
        success: true,
        message: 'تم إلغاء القيود بنجاح',
        cancelledEntries: entriesToCancel.length,
        reverseEntries: reverseEntries.length
      };
      
    } catch (error) {
      console.error('Error cancelling GL entries:', error);
      return {
        success: false,
        message: 'خطأ في إلغاء القيود',
        error: error.message
      };
    }
  }
  
  /**
   * Get General Ledger report for an account
   */
  async getGeneralLedger(filters = {}) {
    try {
      const glEntries = await readJsonFile('gl_entries.json');
      const accounts = await readJsonFile('accounts.json');
      
      let filteredEntries = glEntries.filter(entry => !entry.isCancelled);
      
      // Apply filters
      if (filters.accountId) {
        filteredEntries = filteredEntries.filter(entry => entry.account === filters.accountId);
      }
      
      if (filters.fromDate) {
        filteredEntries = filteredEntries.filter(entry => entry.postingDate >= filters.fromDate);
      }
      
      if (filters.toDate) {
        filteredEntries = filteredEntries.filter(entry => entry.postingDate <= filters.toDate);
      }
      
      if (filters.voucherType) {
        filteredEntries = filteredEntries.filter(entry => entry.voucherType === filters.voucherType);
      }
      
      if (filters.party) {
        filteredEntries = filteredEntries.filter(entry => entry.party === filters.party);
      }
      
      // Sort by posting date
      filteredEntries.sort((a, b) => new Date(a.postingDate) - new Date(b.postingDate));
      
      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = filteredEntries.map(entry => {
        const account = accounts.find(acc => acc.id === entry.account);
        
        // Calculate balance change based on account type
        let balanceChange = 0;
        if (['asset', 'expense'].includes(account.type)) {
          balanceChange = entry.debit - entry.credit;
        } else {
          balanceChange = entry.credit - entry.debit;
        }
        
        runningBalance += balanceChange;
        
        return {
          ...entry,
          balanceChange,
          runningBalance
        };
      });
      
      return {
        success: true,
        entries: entriesWithBalance,
        totalEntries: entriesWithBalance.length,
        finalBalance: runningBalance
      };
      
    } catch (error) {
      console.error('Error generating general ledger:', error);
      return {
        success: false,
        message: 'خطأ في إنشاء دفتر الأستاذ العام',
        error: error.message
      };
    }
  }
  
  /**
   * Get account balance as of a specific date
   */
  async getAccountBalance(accountId, asOfDate = null) {
    try {
      const glEntries = await readJsonFile('gl_entries.json');
      const accounts = await readJsonFile('accounts.json');
      
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        return { success: false, message: 'الحساب غير موجود' };
      }
      
      let relevantEntries = glEntries.filter(
        entry => entry.account === accountId && !entry.isCancelled
      );
      
      if (asOfDate) {
        relevantEntries = relevantEntries.filter(
          entry => entry.postingDate <= asOfDate
        );
      }
      
      let balance = 0;
      for (let entry of relevantEntries) {
        if (['asset', 'expense'].includes(account.type)) {
          balance += entry.debit - entry.credit;
        } else {
          balance += entry.credit - entry.debit;
        }
      }
      
      return {
        success: true,
        accountId,
        accountName: account.name,
        accountCode: account.code,
        balance,
        asOfDate: asOfDate || new Date().toISOString().split('T')[0]
      };
      
    } catch (error) {
      console.error('Error getting account balance:', error);
      return {
        success: false,
        message: 'خطأ في حساب الرصيد',
        error: error.message
      };
    }
  }
}

export default GLEntryController;
