import express from 'express';
import { Account, AccountMapping, JournalEntry, GLEntry, Customer } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import AccountingHealthMonitor from '../services/accountingHealthMonitor.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * نظام مراقبة وإدارة المحرك المحاسبي المتقدم
 * Enhanced Financial API Routes
 */

// ==================== HEALTH MONITORING ENDPOINTS ====================

/**
 * GET /api/enhanced-financial/system-health
 * فحص سريع لصحة النظام المحاسبي
 */
router.get('/system-health', authenticateToken, async (req, res) => {
  try {
    console.log('🩺 Quick health check requested by:', req.user.username);
    
    const healthCheck = await AccountingHealthMonitor.quickHealthCheck();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        status: healthCheck.healthy ? 'healthy' : 'unhealthy',
        healthy: healthCheck.healthy,
        issues: healthCheck.issues,
        lastCheck: healthCheck.timestamp
      }
    });
  } catch (error) {
    console.error('Error during system health check:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking system health',
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-financial/comprehensive-health
 * فحص شامل ومفصل لصحة النظام المحاسبي
 */
router.get('/comprehensive-health', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Comprehensive health check requested by:', req.user.username);
    
    const healthReport = await AccountingHealthMonitor.performComprehensiveHealthCheck();
    
    res.json({
      success: true,
      data: healthReport
    });
  } catch (error) {
    console.error('Error during comprehensive health check:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing comprehensive health check',
      error: error.message
    });
  }
});

// ==================== SYSTEM INITIALIZATION ENDPOINTS ====================

/**
 * POST /api/enhanced-financial/initialize-system
 * تهيئة النظام المحاسبي تلقائياً
 * Note: This endpoint is deprecated. Use create-all-tables.js script instead.
 */
router.post('/initialize-system', authenticateToken, async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'هذه الوظيفة لم تعد متاحة. استخدم سكريبت create-all-tables.js لإنشاء قاعدة البيانات',
    deprecated: true,
    alternative: 'Run: node create-all-tables.js'
  });
});

// ==================== ADVANCED ACCOUNT MAPPING ENDPOINTS ====================

/**
 * GET /api/enhanced-financial/account-mapping
 * الحصول على Account Mapping النشط مع تفاصيل محسنة
 */
router.get('/account-mapping', authenticateToken, async (req, res) => {
  try {
    const activeMapping = await AccountMapping.findOne({
      where: { isActive: true },
      include: [
        { association: 'salesRevenueAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'accountsReceivableAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'salesTaxAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'discountAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'shippingRevenueAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'customsClearanceAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'storageAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] },
        { association: 'insuranceAccountDetails', attributes: ['id', 'code', 'name', 'balance', 'currency'] }
      ]
    });

    if (!activeMapping) {
      return res.status(404).json({
        success: false,
        message: 'لا يوجد Account Mapping نشط'
      });
    }

    // Enhanced validation
    try {
      activeMapping.validateMapping();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Account Mapping غير صالح',
        error: validationError.message,
        data: activeMapping
      });
    }

    res.json({
      success: true,
      data: {
        ...activeMapping.toJSON(),
        validationStatus: 'valid',
        lastValidated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching account mapping:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب Account Mapping',
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-financial/account-mapping/validate
 * التحقق من صحة Account Mapping
 */
router.post('/account-mapping/validate', authenticateToken, async (req, res) => {
  try {
    const activeMapping = await AccountMapping.getActiveMapping();
    
    if (!activeMapping) {
      return res.status(404).json({
        success: false,
        message: 'لا يوجد Account Mapping للتحقق منه'
      });
    }

    const validationResult = {
      isValid: true,
      issues: [],
      warnings: [],
      accountsStatus: {}
    };

    try {
      activeMapping.validateMapping();
    } catch (validationError) {
      validationResult.isValid = false;
      validationResult.issues.push(validationError.message);
    }

    // Check individual accounts
    const accountFields = [
      'salesRevenueAccount',
      'accountsReceivableAccount', 
      'salesTaxAccount',
      'discountAccount',
      'shippingRevenueAccount'
    ];

    for (const field of accountFields) {
      const accountId = activeMapping[field];
      if (accountId) {
        const account = await Account.findByPk(accountId);
        validationResult.accountsStatus[field] = {
          accountId,
          exists: !!account,
          active: account ? account.isActive : false,
          code: account ? account.code : null,
          name: account ? account.name : null
        };

        if (!account) {
          validationResult.issues.push(`Account ${field} not found`);
          validationResult.isValid = false;
        } else if (!account.isActive) {
          validationResult.warnings.push(`Account ${field} is inactive`);
        }
      } else {
        validationResult.accountsStatus[field] = { missing: true };
        if (['salesRevenueAccount', 'accountsReceivableAccount', 'salesTaxAccount'].includes(field)) {
          validationResult.issues.push(`Required account ${field} is not configured`);
          validationResult.isValid = false;
        }
      }
    }

    res.json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    console.error('Error validating account mapping:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من Account Mapping',
      error: error.message
    });
  }
});

// ==================== ADVANCED JOURNAL ENTRIES ENDPOINTS ====================

/**
 * GET /api/enhanced-financial/journal-entries/unbalanced
 * البحث عن القيود غير المتوازنة
 */
router.get('/journal-entries/unbalanced', authenticateToken, async (req, res) => {
  try {
    const unbalancedEntries = await JournalEntry.findAll({
      where: {
        [Op.or]: [
          { totalDebit: { [Op.ne]: Account.sequelize.col('totalCredit') } },
          { totalDebit: { [Op.is]: null } },
          { totalCredit: { [Op.is]: null } }
        ]
      },
      attributes: ['id', 'entryNumber', 'date', 'description', 'totalDebit', 'totalCredit', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    const summary = {
      count: unbalancedEntries.length,
      totalDebitMismatch: 0,
      totalCreditMismatch: 0
    };

    unbalancedEntries.forEach(entry => {
      const debit = parseFloat(entry.totalDebit || 0);
      const credit = parseFloat(entry.totalCredit || 0);
      const difference = Math.abs(debit - credit);
      
      if (debit > credit) {
        summary.totalDebitMismatch += difference;
      } else {
        summary.totalCreditMismatch += difference;
      }
    });

    res.json({
      success: true,
      data: {
        entries: unbalancedEntries,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching unbalanced journal entries:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في البحث عن القيود غير المتوازنة',
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-financial/journal-entries/:id/balance
 * إصلاح قيد محاسبي غير متوازن
 */
router.post('/journal-entries/:id/balance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const journalEntry = await JournalEntry.findByPk(id);
    
    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        message: 'القيد المحاسبي غير موجود'
      });
    }

    // Get journal entry details
    const details = await Account.sequelize.models.JournalEntryDetail.findAll({
      where: { journalEntryId: id }
    });

    const totalDebits = details.reduce((sum, detail) => sum + parseFloat(detail.debit || 0), 0);
    const totalCredits = details.reduce((sum, detail) => sum + parseFloat(detail.credit || 0), 0);

    // Update journal entry totals
    await journalEntry.update({
      totalDebit: totalDebits,
      totalCredit: totalCredits,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'تم إصلاح توازن القيد المحاسبي',
      data: {
        entryId: id,
        oldTotalDebit: journalEntry.totalDebit,
        oldTotalCredit: journalEntry.totalCredit,
        newTotalDebit: totalDebits,
        newTotalCredit: totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) <= 0.01
      }
    });
  } catch (error) {
    console.error('Error balancing journal entry:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إصلاح القيد المحاسبي',
      error: error.message
    });
  }
});

// ==================== CUSTOMER ACCOUNTS MANAGEMENT ====================

/**
 * GET /api/enhanced-financial/customers/without-accounts
 * العملاء الذين لا يملكون حسابات
 */
router.get('/customers/without-accounts', authenticateToken, async (req, res) => {
  try {
    const customersWithoutAccounts = await Customer.findAll({
      where: {
        isActive: true,
        accountId: { [Op.is]: null }
      },
      attributes: ['id', 'code', 'name', 'customerType', 'email', 'phone', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        count: customersWithoutAccounts.length,
        customers: customersWithoutAccounts
      }
    });
  } catch (error) {
    console.error('Error fetching customers without accounts:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في البحث عن العملاء بدون حسابات',
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-financial/customers/:id/create-account
 * إنشاء حساب للعميل يدوياً
 */
router.post('/customers/:id/create-account', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'العميل غير موجود'
      });
    }

    if (customer.accountId) {
      return res.status(400).json({
        success: false,
        message: 'العميل يملك حساب بالفعل'
      });
    }

    // Use the enhanced ensureAccount method
    const account = await customer.ensureAccount();
    
    res.json({
      success: true,
      message: 'تم إنشاء حساب العميل بنجاح',
      data: {
        customerId: customer.id,
        customerCode: customer.code,
        customerName: customer.name,
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name
      }
    });
  } catch (error) {
    console.error('Error creating customer account:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء حساب العميل',
      error: error.message
    });
  }
});

// ==================== ADVANCED REPORTING ENDPOINTS ====================

/**
 * GET /api/enhanced-financial/trial-balance
 * ميزان المراجعة المحسن
 */
router.get('/trial-balance', authenticateToken, async (req, res) => {
  try {
    const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;

    const accounts = await Account.findAll({
      where: { isActive: true },
      attributes: ['id', 'code', 'name', 'nameEn', 'type', 'nature', 'balance', 'currency'],
      order: [['code', 'ASC']]
    });

    const trialBalance = {
      asOfDate,
      accounts: [],
      totals: {
        totalDebitBalances: 0,
        totalCreditBalances: 0,
        difference: 0
      },
      summary: {
        totalAccounts: accounts.length,
        accountsByType: {},
        balancesByType: {}
      }
    };

    accounts.forEach(account => {
      const balance = parseFloat(account.balance || 0);
      
      const accountData = {
        id: account.id,
        code: account.code,
        name: account.name,
        nameEn: account.nameEn,
        type: account.type,
        nature: account.nature,
        balance: balance,
        debitBalance: (account.nature === 'debit' && balance > 0) ? balance : 0,
        creditBalance: (account.nature === 'credit' && balance > 0) ? Math.abs(balance) : 0,
        currency: account.currency || 'LYD'
      };

      trialBalance.accounts.push(accountData);
      trialBalance.totals.totalDebitBalances += accountData.debitBalance;
      trialBalance.totals.totalCreditBalances += accountData.creditBalance;

      // Summary by type
      if (!trialBalance.summary.accountsByType[account.type]) {
        trialBalance.summary.accountsByType[account.type] = 0;
        trialBalance.summary.balancesByType[account.type] = 0;
      }
      trialBalance.summary.accountsByType[account.type]++;
      trialBalance.summary.balancesByType[account.type] += Math.abs(balance);
    });

    trialBalance.totals.difference = Math.abs(
      trialBalance.totals.totalDebitBalances - trialBalance.totals.totalCreditBalances
    );

    trialBalance.isBalanced = trialBalance.totals.difference <= 0.01;

    res.json({
      success: true,
      data: trialBalance
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء ميزان المراجعة',
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-financial/accounting-statistics
 * إحصائيات محاسبية شاملة
 */
router.get('/accounting-statistics', authenticateToken, async (req, res) => {
  try {
    const statistics = await AccountingHealthMonitor.gatherStatistics();

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        ...statistics
      }
    });
  } catch (error) {
    console.error('Error gathering accounting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جمع الإحصائيات المحاسبية',
      error: error.message
    });
  }
});

// ==================== SYSTEM MAINTENANCE ENDPOINTS ====================

/**
 * POST /api/enhanced-financial/maintenance/recalculate-balances
 * إعادة حساب أرصدة الحسابات من القيود
 */
router.post('/maintenance/recalculate-balances', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Balance recalculation requested by:', req.user.username);

    const { accountIds } = req.body; // Optional: specific accounts to recalculate
    
    let whereClause = { isActive: true };
    if (accountIds && accountIds.length > 0) {
      whereClause.id = { [Op.in]: accountIds };
    }

    const accounts = await Account.findAll({ where: whereClause });
    const results = [];

    for (const account of accounts) {
      // Calculate balance from GL entries
      const glDebitSum = await GLEntry.sum('debit', {
        where: { accountId: account.id, postingStatus: 'posted' }
      }) || 0;
      
      const glCreditSum = await GLEntry.sum('credit', {
        where: { accountId: account.id, postingStatus: 'posted' }
      }) || 0;

      let calculatedBalance;
      if (account.nature === 'debit') {
        calculatedBalance = glDebitSum - glCreditSum;
      } else {
        calculatedBalance = glCreditSum - glDebitSum;
      }

      const oldBalance = parseFloat(account.balance || 0);
      const difference = Math.abs(calculatedBalance - oldBalance);

      if (difference > 0.01) {
        await account.update({ 
          balance: calculatedBalance,
          lastRecalculationDate: new Date()
        });

        results.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          oldBalance,
          newBalance: calculatedBalance,
          difference,
          updated: true
        });
      } else {
        results.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          balance: oldBalance,
          difference: 0,
          updated: false
        });
      }
    }

    const updatedCount = results.filter(r => r.updated).length;

    res.json({
      success: true,
      message: `تم إعادة حساب ${updatedCount} حساب من أصل ${results.length}`,
      data: {
        totalAccounts: results.length,
        updatedAccounts: updatedCount,
        results: results.filter(r => r.updated) // Only return updated accounts
      }
    });
  } catch (error) {
    console.error('Error recalculating balances:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة حساب الأرصدة',
      error: error.message
    });
  }
});

export default router;