import GLEntryController from './glEntryController.js';
import models from '../models/index.js';

const { Account, GLEntry } = models;
const glController = new GLEntryController();

/**
 * Financial Reports Controller
 * Generates standard accounting reports following ERPNext patterns
 */
class FinancialReportsController {
  
  /**
   * Generate Trial Balance report
   * Shows all accounts with their debit and credit balances
   * @param {string} asOfDate - Date to generate report as of
   * @param {boolean} showZeroBalance - Include accounts with zero balance
   * @returns {Object} Trial balance data
   */
  async getTrialBalance(asOfDate = null, showZeroBalance = false) {
    try {
      const accounts = await Account.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']]
      });
      const glEntries = await GLEntry.findAll({
        where: { isCancelled: false }
      });
      
      if (!asOfDate) {
        asOfDate = new Date().toISOString().split('T')[0];
      }
      
      // Filter GL entries up to the specified date
      const relevantEntries = glEntries.filter(
        entry => entry.postingDate <= asOfDate && !entry.isCancelled
      );
      
      // Calculate balances for each account
      const accountBalances = new Map();
      
      // Initialize all ledger accounts
      const ledgerAccounts = accounts.filter(acc => !acc.isGroup);
      ledgerAccounts.forEach(account => {
        accountBalances.set(account.id, {
          account,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          balanceType: ''
        });
      });
      
      // Aggregate GL entries by account
      relevantEntries.forEach(entry => {
        if (accountBalances.has(entry.accountId)) {
          const accountData = accountBalances.get(entry.accountId);
          accountData.totalDebit += parseFloat(entry.debit || 0);
          accountData.totalCredit += parseFloat(entry.credit || 0);
        }
      });
      
      // Calculate net balances and determine debit/credit nature
      let totalDebits = 0;
      let totalCredits = 0;
      const trialBalanceData = [];
      
      accountBalances.forEach((data, accountId) => {
        const { account, totalDebit, totalCredit } = data;
        const netBalance = totalDebit - totalCredit;
        
        // Determine if balance is debit or credit based on account type
        let debitBalance = 0;
        let creditBalance = 0;
        
        if (['asset', 'expense'].includes(account.type)) {
          // Asset and Expense accounts: Normal debit balance
          if (netBalance >= 0) {
            debitBalance = netBalance;
          } else {
            creditBalance = Math.abs(netBalance);
          }
        } else {
          // Liability, Equity, Revenue accounts: Normal credit balance
          if (netBalance <= 0) {
            creditBalance = Math.abs(netBalance);
          } else {
            debitBalance = netBalance;
          }
        }
        
        data.balance = netBalance;
        data.debitBalance = debitBalance;
        data.creditBalance = creditBalance;
        
        // Include in report if has balance or showZeroBalance is true
        if (showZeroBalance || debitBalance !== 0 || creditBalance !== 0) {
          trialBalanceData.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountNameEn: account.nameEn,
            accountType: account.type,
            parentAccount: account.parentId,
            totalDebit,
            totalCredit,
            debitBalance,
            creditBalance
          });
          
          totalDebits += debitBalance;
          totalCredits += creditBalance;
        }
      });
      
      // Sort by account code
      trialBalanceData.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      
      return {
        success: true,
        reportType: 'Trial Balance',
        asOfDate,
        currency: 'LYD',
        data: trialBalanceData,
        totals: {
          totalDebits,
          totalCredits,
          difference: Math.abs(totalDebits - totalCredits),
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        },
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating trial balance:', error);
      return {
        success: false,
        message: '\u062e\u0637\u0623 \u0641\u064a \u0625\u0646\u0634\u0627\u0621 \u0645\u064a\u0632\u0627\u0646 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
        error: error.message
      };
    }
  }
  
  /**
   * Generate Balance Sheet
   * Shows Assets, Liabilities, and Equity as of a specific date
   * @param {string} asOfDate - Date to generate report as of
   * @returns {Object} Balance sheet data
   */
  async getBalanceSheet(asOfDate = null) {
    try {
      const accounts = await Account.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']]
      });
      
      if (!asOfDate) {
        asOfDate = new Date().toISOString().split('T')[0];
      }
      
      // Get account balances as of the specified date
      const accountBalances = await this.getAccountBalancesAsOf(asOfDate);
      
      // Group accounts by type
      const assetAccounts = [];
      const liabilityAccounts = [];
      const equityAccounts = [];
      
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      
      accounts.forEach(account => {
        const balance = accountBalances.get(account.id) || 0;
        
        // Only include accounts with non-zero balances or group accounts
        if (balance !== 0 || account.isGroup) {
          const accountData = {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountNameEn: account.nameEn,
            isGroup: account.isGroup,
            level: account.level,
            parentId: account.parentId,
            balance: balance
          };
          
          if (account.type === 'asset') {
            assetAccounts.push(accountData);
            if (!account.isGroup) totalAssets += balance;
          } else if (account.type === 'liability') {
            liabilityAccounts.push(accountData);
            if (!account.isGroup) totalLiabilities += Math.abs(balance);
          } else if (account.type === 'equity') {
            equityAccounts.push(accountData);
            if (!account.isGroup) totalEquity += Math.abs(balance);
          }
        }
      });
      
      // Calculate retained earnings (P&L impact)
      const plResult = await this.getProfitAndLoss(
        new Date(new Date(asOfDate).getFullYear(), 0, 1).toISOString().split('T')[0],
        asOfDate
      );
      
      const retainedEarnings = plResult.success ? plResult.netIncome : 0;
      totalEquity += retainedEarnings;
      
      // Add retained earnings to equity accounts if not zero
      if (retainedEarnings !== 0) {
        equityAccounts.push({
          accountId: 'retained_earnings',
          accountCode: '3900',
          accountName: '\u0627\u0644\u0623\u0631\u0628\u0627\u062d \u0627\u0644\u0645\u062d\u062a\u062c\u0632\u0629',
          accountNameEn: 'Retained Earnings',
          isGroup: false,
          level: 2,
          balance: retainedEarnings
        });
      }
      
      // Sort accounts by code within each type
      const sortByCode = (a, b) => a.accountCode.localeCompare(b.accountCode);
      assetAccounts.sort(sortByCode);
      liabilityAccounts.sort(sortByCode);
      equityAccounts.sort(sortByCode);
      
      return {
        success: true,
        reportType: 'Balance Sheet',
        asOfDate,
        currency: 'LYD',
        assets: {
          accounts: assetAccounts,
          total: totalAssets
        },
        liabilities: {
          accounts: liabilityAccounts,
          total: totalLiabilities
        },
        equity: {
          accounts: equityAccounts,
          total: totalEquity,
          retainedEarnings
        },
        totals: {
          totalAssets,
          totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
          difference: totalAssets - (totalLiabilities + totalEquity),
          isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        },
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      return {
        success: false,
        message: '\u062e\u0637\u0623 \u0641\u064a \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u0627\u0644\u0639\u0645\u0648\u0645\u064a\u0629',
        error: error.message
      };
    }
  }
  
  /**
   * Generate Profit and Loss Statement
   * Shows Revenue and Expenses for a period
   * @param {string} fromDate - Start date of period
   * @param {string} toDate - End date of period
   * @returns {Object} P&L statement data
   */
  async getProfitAndLoss(fromDate, toDate) {
    try {
      const accounts = await Account.findAll({
        where: { 
          isActive: true,
          type: { [models.sequelize.Op.in]: ['revenue', 'expense'] }
        },
        order: [['code', 'ASC']]
      });
      const glEntries = await GLEntry.findAll({
        where: { isCancelled: false }
      });
      
      if (!fromDate || !toDate) {
        // Default to current fiscal year
        const currentYear = new Date().getFullYear();
        fromDate = `${currentYear}-01-01`;
        toDate = `${currentYear}-12-31`;
      }
      
      // Filter GL entries for the period
      const relevantEntries = glEntries.filter(
        entry => entry.postingDate >= fromDate && 
                entry.postingDate <= toDate && 
                !entry.isCancelled
      );
      
      // Group accounts by type
      const revenueAccounts = [];
      const expenseAccounts = [];
      
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      // Calculate balances for revenue and expense accounts
      const accountBalances = new Map();
      
      // Initialize revenue and expense accounts
      accounts.filter(acc => ['revenue', 'income', 'expense'].includes(acc.type))
        .forEach(account => {
          accountBalances.set(account.id, {
            account,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0
          });
        });
      
      // Aggregate GL entries
      relevantEntries.forEach(entry => {
        if (accountBalances.has(entry.accountId)) {
          const accountData = accountBalances.get(entry.accountId);
          accountData.totalDebit += parseFloat(entry.debit || 0);
          accountData.totalCredit += parseFloat(entry.credit || 0);
        }
      });
      
      // Calculate net balances and categorize
      accountBalances.forEach((data, accountId) => {
        const { account, totalDebit, totalCredit } = data;
        
        // For P&L accounts, balance is credit - debit (normal for revenue)
        const netBalance = totalCredit - totalDebit;
        
        if (netBalance !== 0) {
          const accountData = {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountNameEn: account.nameEn,
            isGroup: account.isGroup,
            level: account.level,
            totalDebit,
            totalCredit,
            balance: Math.abs(netBalance)
          };
          
          if (['revenue', 'income'].includes(account.type)) {
            revenueAccounts.push(accountData);
            totalRevenue += Math.abs(netBalance);
          } else if (account.type === 'expense') {
            expenseAccounts.push(accountData);
            totalExpenses += Math.abs(netBalance);
          }
        }
      });
      
      // Sort accounts by code
      const sortByCode = (a, b) => a.accountCode.localeCompare(b.accountCode);
      revenueAccounts.sort(sortByCode);
      expenseAccounts.sort(sortByCode);
      
      const grossProfit = totalRevenue;
      const netIncome = totalRevenue - totalExpenses;
      
      return {
        success: true,
        reportType: 'Profit and Loss',
        fromDate,
        toDate,
        currency: 'LYD',
        revenue: {
          accounts: revenueAccounts,
          total: totalRevenue
        },
        expenses: {
          accounts: expenseAccounts,
          total: totalExpenses
        },
        profitMetrics: {
          grossProfit,
          totalRevenue,
          totalExpenses,
          netIncome,
          profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue * 100) : 0
        },
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating P&L statement:', error);
      return {
        success: false,
        message: '\u062e\u0637\u0623 \u0641\u064a \u0625\u0646\u0634\u0627\u0621 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062f\u062e\u0644',
        error: error.message
      };
    }
  }
  
  /**
   * Generate General Ledger report for specific account(s)
   * @param {Object} filters - Filters for the report
   * @returns {Object} General ledger data
   */
  async getGeneralLedgerReport(filters = {}) {
    try {
      const result = await glController.getGeneralLedger(filters);
      
      if (!result.success) {
        return result;
      }
      
      // Group entries by account if multiple accounts
      const entriesByAccount = new Map();
      
      result.entries.forEach(entry => {
        if (!entriesByAccount.has(entry.account)) {
          entriesByAccount.set(entry.account, {
            accountInfo: {
              accountId: entry.account,
              accountCode: entry.accountCode,
              accountName: entry.accountName
            },
            entries: [],
            openingBalance: 0,
            closingBalance: 0,
            totalDebit: 0,
            totalCredit: 0
          });
        }
        
        const accountData = entriesByAccount.get(entry.account);
        accountData.entries.push(entry);
        accountData.totalDebit += entry.debit;
        accountData.totalCredit += entry.credit;
        accountData.closingBalance = entry.runningBalance;
      });
      
      // Convert to array format
      const accountsData = Array.from(entriesByAccount.values());
      
      return {
        success: true,
        reportType: 'General Ledger',
        filters,
        currency: 'LYD',
        accounts: accountsData,
        totalEntries: result.totalEntries,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating general ledger report:', error);
      return {
        success: false,
        message: '\u062e\u0637\u0623 \u0641\u064a \u0625\u0646\u0634\u0627\u0621 \u062a\u0642\u0631\u064a\u0631 \u062f\u0641\u062a\u0631 \u0627\u0644\u0623\u0633\u062a\u0627\u0630 \u0627\u0644\u0639\u0627\u0645',
        error: error.message
      };
    }
  }
  
  /**
   * Generate Accounts Receivable Aging report
   * @param {string} asOfDate - Date to calculate aging as of
   * @returns {Object} Aging report data
   */
  async getAccountsReceivableAging(asOfDate = null) {
    try {
      const customers = await models.Customer.findAll({
        where: { isActive: true }
      });
      const glEntries = await GLEntry.findAll({
        where: { isCancelled: false }
      });
      
      if (!asOfDate) {
        asOfDate = new Date().toISOString().split('T')[0];
      }
      
      // Find receivable accounts
      const accounts = await Account.findAll({
        where: { isActive: true }
      });
      const receivableAccounts = accounts.filter(
        acc => acc.accountCategory === 'receivable' || acc.accountType === 'Receivable'
      );
      
      const agingData = [];
      
      // Calculate aging for each customer
      for (let customer of customers) {
        // Get customer GL entries
        const customerEntries = glEntries.filter(
          entry => entry.party === customer.id && 
                  entry.postingDate <= asOfDate && 
                  !entry.isCancelled
        );
        
        if (customerEntries.length > 0) {
          let totalOutstanding = 0;
          
          // Calculate outstanding by aging buckets
          const aging = {
            current: 0,      // 0-30 days
            days30: 0,       // 31-60 days
            days60: 0,       // 61-90 days
            days90: 0,       // 91-120 days
            days120Plus: 0   // 120+ days
          };
          
          customerEntries.forEach(entry => {
            const amount = entry.debit - entry.credit;
            totalOutstanding += amount;
            
            // Calculate days outstanding
            const entryDate = new Date(entry.postingDate);
            const asOfDateObj = new Date(asOfDate);
            const daysOutstanding = Math.floor((asOfDateObj - entryDate) / (1000 * 60 * 60 * 24));
            
            // Categorize by aging bucket
            if (daysOutstanding <= 30) {
              aging.current += amount;
            } else if (daysOutstanding <= 60) {
              aging.days30 += amount;
            } else if (daysOutstanding <= 90) {
              aging.days60 += amount;
            } else if (daysOutstanding <= 120) {
              aging.days90 += amount;
            } else {
              aging.days120Plus += amount;
            }
          });
          
          if (totalOutstanding > 0) {
            agingData.push({
              customerId: customer.id,
              customerCode: customer.code,
              customerName: customer.name,
              totalOutstanding,
              aging
            });
          }
        }
      }
      
      // Calculate totals
      const totals = agingData.reduce((acc, customer) => {
        acc.totalOutstanding += customer.totalOutstanding;
        acc.current += customer.aging.current;
        acc.days30 += customer.aging.days30;
        acc.days60 += customer.aging.days60;
        acc.days90 += customer.aging.days90;
        acc.days120Plus += customer.aging.days120Plus;
        return acc;
      }, {
        totalOutstanding: 0,
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        days120Plus: 0
      });
      
      return {
        success: true,
        reportType: 'Accounts Receivable Aging',
        asOfDate,
        currency: 'LYD',
        customers: agingData,
        totals,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating AR aging:', error);
      return {
        success: false,
        message: '\u062e\u0637\u0623 \u0641\u064a \u0625\u0646\u0634\u0627\u0621 \u062a\u0642\u0631\u064a\u0631 \u0623\u0639\u0645\u0627\u0631 \u0627\u0644\u0630\u0645\u0645 \u0627\u0644\u0645\u062f\u064a\u0646\u0629',
        error: error.message
      };
    }
  }
  
  /**
   * Helper method to get account balances as of a specific date
   * @param {string} asOfDate - Date to calculate balances as of
   * @returns {Map} Map of account ID to balance
   */
  async getAccountBalancesAsOf(asOfDate) {
    const glEntries = await GLEntry.findAll({
      where: { isCancelled: false }
    });
    const accounts = await Account.findAll({
      where: { isActive: true }
    });
    
    const accountBalances = new Map();
    
    // Initialize all accounts with zero balance
    accounts.forEach(account => {
      accountBalances.set(account.id, 0);
    });
    
    // Calculate balances from GL entries
    const relevantEntries = glEntries.filter(
      entry => entry.postingDate <= asOfDate && !entry.isCancelled
    );
    
    relevantEntries.forEach(entry => {
      const currentBalance = accountBalances.get(entry.accountId) || 0;
      const account = accounts.find(acc => acc.id === entry.accountId);
      
      if (account) {
        // Calculate balance based on account type
        if (['asset', 'expense'].includes(account.type)) {
          accountBalances.set(entry.accountId, currentBalance + parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0));
        } else {
          accountBalances.set(entry.accountId, currentBalance + parseFloat(entry.credit || 0) - parseFloat(entry.debit || 0));
        }
      }
    });
    
    return accountBalances;
  }
}

export default FinancialReportsController;
