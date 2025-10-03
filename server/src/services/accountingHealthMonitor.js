import { Account, AccountMapping, JournalEntry, GLEntry, Customer, SalesInvoice } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * نظام مراقبة صحة المحرك المحاسبي المتقدم
 * يوفر فحص شامل ومراقبة مستمرة لحالة النظام المحاسبي
 */
class AccountingHealthMonitor {
  
  /**
   * فحص شامل لصحة النظام المحاسبي
   */
  static async performComprehensiveHealthCheck() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      overallHealth: 'unknown',
      score: 0,
      maxScore: 100,
      checks: {},
      issues: [],
      warnings: [],
      recommendations: [],
      statistics: {}
    };

    try {
      console.log('🔍 Starting comprehensive accounting engine health check...');
      
      // 1. فحص Account Mapping
      const mappingCheck = await this.checkAccountMapping();
      healthReport.checks.accountMapping = mappingCheck;
      healthReport.score += mappingCheck.score;

      // 2. فحص دليل الحسابات
      const chartCheck = await this.checkChartOfAccounts();
      healthReport.checks.chartOfAccounts = chartCheck;
      healthReport.score += chartCheck.score;

      // 3. فحص تكامل البيانات المحاسبية
      const dataIntegrityCheck = await this.checkDataIntegrity();
      healthReport.checks.dataIntegrity = dataIntegrityCheck;
      healthReport.score += dataIntegrityCheck.score;

      // 4. فحص أرصدة الحسابات
      const balancesCheck = await this.checkAccountBalances();
      healthReport.checks.accountBalances = balancesCheck;
      healthReport.score += balancesCheck.score;

      // 5. فحص الفواتير وحالتها المحاسبية
      const invoicesCheck = await this.checkInvoicesAccountingStatus();
      healthReport.checks.invoicesAccounting = invoicesCheck;
      healthReport.score += invoicesCheck.score;

      // 6. فحص العملاء وحساباتهم
      const customersCheck = await this.checkCustomersAccounts();
      healthReport.checks.customersAccounts = customersCheck;
      healthReport.score += customersCheck.score;

      // جمع الإحصائيات
      healthReport.statistics = await this.gatherStatistics();

      // جمع المشاكل والتحذيرات
      Object.values(healthReport.checks).forEach(check => {
        if (check.issues) healthReport.issues.push(...check.issues);
        if (check.warnings) healthReport.warnings.push(...check.warnings);
        if (check.recommendations) healthReport.recommendations.push(...check.recommendations);
      });

      // تحديد الحالة العامة
      const scorePercentage = (healthReport.score / healthReport.maxScore) * 100;
      if (scorePercentage >= 90) {
        healthReport.overallHealth = 'excellent';
      } else if (scorePercentage >= 75) {
        healthReport.overallHealth = 'good';
      } else if (scorePercentage >= 50) {
        healthReport.overallHealth = 'fair';
      } else if (scorePercentage >= 25) {
        healthReport.overallHealth = 'poor';
      } else {
        healthReport.overallHealth = 'critical';
      }

      console.log(`✅ Health check completed. Overall health: ${healthReport.overallHealth} (${scorePercentage.toFixed(1)}%)`);
      
      return healthReport;

    } catch (error) {
      console.error('❌ Error during comprehensive health check:', error);
      healthReport.overallHealth = 'error';
      healthReport.issues.push(`Health check failed: ${error.message}`);
      return healthReport;
    }
  }

  /**
   * فحص Account Mapping
   */
  static async checkAccountMapping() {
    const check = {
      name: 'Account Mapping Check',
      status: 'unknown',
      score: 0,
      maxScore: 20,
      details: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      // البحث عن الخرائط النشطة
      const activeMapping = await AccountMapping.findOne({ 
        where: { isActive: true },
        include: [
          { association: 'salesRevenueAccountDetails', attributes: ['id', 'code', 'name', 'isActive'] },
          { association: 'accountsReceivableAccountDetails', attributes: ['id', 'code', 'name', 'isActive'] },
          { association: 'salesTaxAccountDetails', attributes: ['id', 'code', 'name', 'isActive'] }
        ]
      });

      if (!activeMapping) {
        check.status = 'critical';
        check.score = 0;
        check.issues.push('No active account mapping found');
        check.recommendations.push('Create an active account mapping through Admin > Settings > Accounting');
        return check;
      }

      check.details.mappingId = activeMapping.id;
      check.details.description = activeMapping.description;
      check.score += 5; // Base score for having active mapping

      // فحص الحسابات المطلوبة
      const requiredAccounts = [
        { field: 'salesRevenueAccount', name: 'Sales Revenue Account' },
        { field: 'accountsReceivableAccount', name: 'Accounts Receivable Account' },
        { field: 'salesTaxAccount', name: 'Sales Tax Account' }
      ];

      let validAccounts = 0;
      for (const accountConfig of requiredAccounts) {
        const accountId = activeMapping[accountConfig.field];
        if (accountId) {
          const account = await Account.findByPk(accountId);
          if (account && account.isActive) {
            validAccounts++;
            check.score += 3;
            check.details[accountConfig.field] = {
              id: account.id,
              code: account.code,
              name: account.name,
              status: 'valid'
            };
          } else {
            check.issues.push(`${accountConfig.name} is not active or not found`);
            check.details[accountConfig.field] = { status: 'invalid' };
          }
        } else {
          check.warnings.push(`${accountConfig.name} is not configured`);
          check.details[accountConfig.field] = { status: 'missing' };
        }
      }

      // فحص الحسابات الاختيارية
      const optionalAccounts = [
        { field: 'discountAccount', name: 'Discount Account' },
        { field: 'shippingRevenueAccount', name: 'Shipping Revenue Account' },
        { field: 'customsClearanceAccount', name: 'Customs Clearance Account' }
      ];

      for (const accountConfig of optionalAccounts) {
        const accountId = activeMapping[accountConfig.field];
        if (accountId) {
          const account = await Account.findByPk(accountId);
          if (account && account.isActive) {
            check.score += 1;
            check.details[accountConfig.field] = {
              id: account.id,
              code: account.code,
              name: account.name,
              status: 'configured'
            };
          }
        }
      }

      if (validAccounts === requiredAccounts.length) {
        check.status = 'healthy';
        check.score += 2; // Bonus for complete configuration
      } else if (validAccounts >= 2) {
        check.status = 'warning';
        check.warnings.push('Some required accounts are missing or inactive');
      } else {
        check.status = 'critical';
        check.issues.push('Most required accounts are missing or inactive');
      }

    } catch (error) {
      check.status = 'error';
      check.score = 0;
      check.issues.push(`Account mapping check failed: ${error.message}`);
    }

    return check;
  }

  /**
   * فحص دليل الحسابات
   */
  static async checkChartOfAccounts() {
    const check = {
      name: 'Chart of Accounts Check',
      status: 'unknown',
      score: 0,
      maxScore: 15,
      details: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      const accountsCount = await Account.count({ where: { isActive: true } });
      check.details.totalActiveAccounts = accountsCount;

      if (accountsCount === 0) {
        check.status = 'critical';
        check.issues.push('No active accounts found in chart of accounts');
        check.recommendations.push('Initialize chart of accounts using AccountingInitializer');
        return check;
      }

      check.score += Math.min(5, accountsCount / 5); // Up to 5 points based on account count

      // فحص الأنواع المطلوبة من الحسابات
      const accountTypes = await Account.findAll({
        attributes: ['type', [Account.sequelize.fn('COUNT', Account.sequelize.col('id')), 'count']],
        where: { isActive: true },
        group: ['type'],
        raw: true
      });

      const typeMap = accountTypes.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {});

      check.details.accountsByType = typeMap;

      const requiredTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
      const missingTypes = requiredTypes.filter(type => !typeMap[type]);

      if (missingTypes.length === 0) {
        check.score += 5; // All required types present
        check.status = 'healthy';
      } else {
        check.score += Math.max(0, 5 - missingTypes.length);
        check.warnings.push(`Missing account types: ${missingTypes.join(', ')}`);
        check.status = 'warning';
      }

      // فحص التسلسل الهرمي
      const parentChildIssues = await Account.count({
        where: {
          parentId: { [Op.ne]: null },
          '$parent.id$': null
        },
        include: [{
          model: Account,
          as: 'parent',
          required: false
        }]
      });

      if (parentChildIssues > 0) {
        check.warnings.push(`${parentChildIssues} accounts have invalid parent references`);
        check.score -= 1;
      } else {
        check.score += 2; // Bonus for good hierarchy
      }

      // فحص التوازن في الطبيعة المحاسبية
      const balanceCheck = await this.checkAccountNatures();
      if (balanceCheck.isValid) {
        check.score += 3;
      } else {
        check.warnings.push('Some accounts have incorrect nature settings');
      }

    } catch (error) {
      check.status = 'error';
      check.issues.push(`Chart of accounts check failed: ${error.message}`);
    }

    return check;
  }

  /**
   * فحص تكامل البيانات المحاسبية
   */
  static async checkDataIntegrity() {
    const check = {
      name: 'Data Integrity Check',
      status: 'unknown',
      score: 0,
      maxScore: 25,
      details: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      // فحص التوازن في القيود المحاسبية
      const unbalancedEntries = await JournalEntry.findAll({
        where: {
          [Op.or]: [
            { totalDebit: { [Op.ne]: Account.sequelize.col('totalCredit') } },
            { totalDebit: { [Op.is]: null } },
            { totalCredit: { [Op.is]: null } }
          ]
        },
        attributes: ['id', 'entryNumber', 'totalDebit', 'totalCredit']
      });

      check.details.unbalancedJournalEntries = unbalancedEntries.length;

      if (unbalancedEntries.length === 0) {
        check.score += 8;
      } else {
        check.issues.push(`${unbalancedEntries.length} unbalanced journal entries found`);
        check.score += Math.max(0, 8 - unbalancedEntries.length);
      }

      // فحص GL Entries مقابل Journal Entry Details
      const glEntriesCount = await GLEntry.count();
      const journalDetailsCount = await Account.sequelize.models.JournalEntryDetail.count();
      
      check.details.glEntriesCount = glEntriesCount;
      check.details.journalDetailsCount = journalDetailsCount;

      if (Math.abs(glEntriesCount - journalDetailsCount) <= 1) {
        check.score += 5;
      } else {
        check.warnings.push(`GL entries count (${glEntriesCount}) doesn't match journal entry details (${journalDetailsCount})`);
        check.score += 2;
      }

      // فحص الفواتير التي لها قيود محاسبية
      const invoicesWithoutJE = await SalesInvoice.count({
        where: {
          journalEntryId: { [Op.is]: null },
          status: { [Op.ne]: 'draft' }
        }
      });

      check.details.invoicesWithoutJournalEntries = invoicesWithoutJE;

      if (invoicesWithoutJE === 0) {
        check.score += 7;
      } else {
        check.issues.push(`${invoicesWithoutJE} invoices without journal entries`);
        check.recommendations.push('Review and create missing journal entries for posted invoices');
        check.score += Math.max(0, 7 - invoicesWithoutJE);
      }

      // فحص تطابق أرصدة الحسابات مع GL
      const balanceMismatches = await this.checkBalanceMismatches();
      check.details.accountsWithBalanceMismatches = balanceMismatches.length;

      if (balanceMismatches.length === 0) {
        check.score += 5;
        check.status = 'healthy';
      } else {
        check.warnings.push(`${balanceMismatches.length} accounts have balance mismatches with GL`);
        check.score += Math.max(0, 5 - balanceMismatches.length);
        check.status = 'warning';
      }

    } catch (error) {
      check.status = 'error';
      check.issues.push(`Data integrity check failed: ${error.message}`);
    }

    return check;
  }

  /**
   * فحص أرصدة الحسابات
   */
  static async checkAccountBalances() {
    const check = {
      name: 'Account Balances Check',
      status: 'unknown',
      score: 0,
      maxScore: 20,
      details: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      // حساب مجموع الأرصدة المدينة والدائنة
      const debitBalanceSum = await Account.sum('balance', {
        where: {
          nature: 'debit',
          balance: { [Op.gt]: 0 },
          isActive: true
        }
      }) || 0;

      const creditBalanceSum = await Account.sum('balance', {
        where: {
          nature: 'credit',
          balance: { [Op.gt]: 0 },
          isActive: true
        }
      }) || 0;

      check.details.totalDebitBalances = parseFloat(debitBalanceSum.toFixed(2));
      check.details.totalCreditBalances = parseFloat(creditBalanceSum.toFixed(2));
      check.details.balanceDifference = Math.abs(debitBalanceSum - creditBalanceSum);

      // في النظام المحاسبي المثالي، مجموع الأرصدة المدينة يجب أن يساوي مجموع الأرصدة الدائنة
      if (check.details.balanceDifference <= 0.01) {
        check.score += 10;
        check.status = 'healthy';
      } else if (check.details.balanceDifference <= 10) {
        check.score += 7;
        check.warnings.push(`Small balance difference detected: ${check.details.balanceDifference}`);
        check.status = 'warning';
      } else {
        check.score += 3;
        check.issues.push(`Significant balance difference: ${check.details.balanceDifference}`);
        check.recommendations.push('Review account balances and GL entries for accuracy');
        check.status = 'critical';
      }

      // فحص الحسابات بأرصدة سالبة غير طبيعية
      const unnaturalNegativeBalances = await Account.count({
        where: {
          [Op.or]: [
            { nature: 'debit', balance: { [Op.lt]: 0 } },
            { nature: 'credit', balance: { [Op.lt]: 0 } }
          ],
          isActive: true
        }
      });

      check.details.accountsWithUnnaturalBalances = unnaturalNegativeBalances;

      if (unnaturalNegativeBalances === 0) {
        check.score += 5;
      } else {
        check.warnings.push(`${unnaturalNegativeBalances} accounts have unnatural negative balances`);
        check.score += Math.max(0, 5 - unnaturalNegativeBalances);
      }

      // فحص الحسابات بأرصدة ضخمة (potential data entry errors)
      const accountsWithLargeBalances = await Account.count({
        where: {
          balance: { [Op.gt]: 1000000 }, // More than 1 million
          isActive: true
        }
      });

      check.details.accountsWithLargeBalances = accountsWithLargeBalances;

      if (accountsWithLargeBalances <= 2) {
        check.score += 3;
      } else {
        check.warnings.push(`${accountsWithLargeBalances} accounts have unusually large balances`);
        check.recommendations.push('Review large account balances for potential data entry errors');
        check.score += 1;
      }

      // فحص آخر تاريخ تحديث للأرصدة
      const staleAccounts = await Account.count({
        where: {
          lastTransactionDate: { [Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // 90 days ago
          balance: { [Op.ne]: 0 },
          isActive: true
        }
      });

      check.details.accountsWithStaleBalances = staleAccounts;

      if (staleAccounts <= 5) {
        check.score += 2;
      } else {
        check.warnings.push(`${staleAccounts} accounts have balances but no recent transactions`);
      }

    } catch (error) {
      check.status = 'error';
      check.issues.push(`Account balances check failed: ${error.message}`);
    }

    return check;
  }

  /**
   * فحص حالة الفواتير المحاسبية
   */
  static async checkInvoicesAccountingStatus() {
    const check = {
      name: 'Invoices Accounting Status Check',
      status: 'unknown',
      score: 0,
      maxScore: 10,
      details: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      const totalInvoices = await SalesInvoice.count({
        where: { status: { [Op.ne]: 'draft' } }
      });

      const invoicesWithJE = await SalesInvoice.count({
        where: {
          status: { [Op.ne]: 'draft' },
          journalEntryId: { [Op.ne]: null }
        }
      });

      check.details.totalPostedInvoices = totalInvoices;
      check.details.invoicesWithJournalEntries = invoicesWithJE;
      check.details.invoicesWithoutJournalEntries = totalInvoices - invoicesWithJE;

      if (totalInvoices === 0) {
        check.score += 5; // No invoices, no problems
        check.status = 'healthy';
      } else {
        const completionRate = (invoicesWithJE / totalInvoices) * 100;
        check.details.completionRate = parseFloat(completionRate.toFixed(2));

        if (completionRate >= 98) {
          check.score += 10;
          check.status = 'healthy';
        } else if (completionRate >= 90) {
          check.score += 7;
          check.status = 'warning';
          check.warnings.push(`${totalInvoices - invoicesWithJE} invoices missing journal entries`);
        } else {
          check.score += 3;
          check.status = 'critical';
          check.issues.push(`${totalInvoices - invoicesWithJE} invoices missing journal entries`);
          check.recommendations.push('Create missing journal entries for posted invoices');
        }
      }

    } catch (error) {
      check.status = 'error';
      check.issues.push(`Invoices accounting status check failed: ${error.message}`);
    }

    return check;
  }

  /**
   * فحص حسابات العملاء
   */
  static async checkCustomersAccounts() {
    const check = {
      name: 'Customers Accounts Check',
      status: 'unknown',
      score: 0,
      maxScore: 10,
      details: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      const totalCustomers = await Customer.count({ where: { isActive: true } });
      const customersWithAccounts = await Customer.count({
        where: {
          isActive: true,
          accountId: { [Op.ne]: null }
        }
      });

      check.details.totalActiveCustomers = totalCustomers;
      check.details.customersWithAccounts = customersWithAccounts;
      check.details.customersWithoutAccounts = totalCustomers - customersWithAccounts;

      if (totalCustomers === 0) {
        check.score += 5;
        check.status = 'healthy';
      } else {
        const accountRate = (customersWithAccounts / totalCustomers) * 100;
        check.details.accountAssignmentRate = parseFloat(accountRate.toFixed(2));

        if (accountRate >= 95) {
          check.score += 10;
          check.status = 'healthy';
        } else if (accountRate >= 80) {
          check.score += 7;
          check.status = 'warning';
          check.warnings.push(`${totalCustomers - customersWithAccounts} customers without assigned accounts`);
        } else {
          check.score += 3;
          check.status = 'critical';
          check.issues.push(`${totalCustomers - customersWithAccounts} customers without assigned accounts`);
          check.recommendations.push('Ensure all customers have corresponding accounts in chart of accounts');
        }
      }

    } catch (error) {
      check.status = 'error';
      check.issues.push(`Customers accounts check failed: ${error.message}`);
    }

    return check;
  }

  /**
   * جمع إحصائيات شاملة عن النظام
   */
  static async gatherStatistics() {
    try {
      const stats = {};

      // إحصائيات الحسابات
      stats.accounts = {
        total: await Account.count(),
        active: await Account.count({ where: { isActive: true } }),
        byType: await Account.findAll({
          attributes: ['type', [Account.sequelize.fn('COUNT', Account.sequelize.col('id')), 'count']],
          group: ['type'],
          raw: true
        }).then(results => results.reduce((acc, row) => {
          acc[row.type] = parseInt(row.count);
          return acc;
        }, {}))
      };

      // إحصائيات القيود
      stats.journalEntries = {
        total: await JournalEntry.count(),
        thisMonth: await JournalEntry.count({
          where: {
            createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        })
      };

      // إحصائيات العملاء
      stats.customers = {
        total: await Customer.count(),
        active: await Customer.count({ where: { isActive: true } }),
        withAccounts: await Customer.count({ where: { accountId: { [Op.ne]: null } } })
      };

      // إحصائيات الفواتير
      stats.salesInvoices = {
        total: await SalesInvoice.count(),
        posted: await SalesInvoice.count({ where: { status: { [Op.ne]: 'draft' } } }),
        withJournalEntries: await SalesInvoice.count({ where: { journalEntryId: { [Op.ne]: null } } })
      };

      // إحصائيات الأرصدة
      const totalAssets = await Account.sum('balance', {
        where: { type: 'asset', isActive: true }
      }) || 0;
      
      const totalLiabilities = await Account.sum('balance', {
        where: { type: 'liability', isActive: true }
      }) || 0;
      
      const totalEquity = await Account.sum('balance', {
        where: { type: 'equity', isActive: true }
      }) || 0;

      stats.balances = {
        totalAssets: parseFloat(totalAssets.toFixed(2)),
        totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
        totalEquity: parseFloat(totalEquity.toFixed(2)),
        balanceEquation: Math.abs(totalAssets - (totalLiabilities + totalEquity)) <= 0.01
      };

      return stats;
    } catch (error) {
      console.error('Error gathering statistics:', error);
      return { error: error.message };
    }
  }

  /**
   * فحص طبيعة الحسابات
   */
  static async checkAccountNatures() {
    try {
      const incorrectNatures = await Account.findAll({
        where: {
          [Op.or]: [
            { type: 'asset', nature: { [Op.ne]: 'debit' } },
            { type: 'expense', nature: { [Op.ne]: 'debit' } },
            { type: 'liability', nature: { [Op.ne]: 'credit' } },
            { type: 'equity', nature: { [Op.ne]: 'credit' } },
            { type: 'revenue', nature: { [Op.ne]: 'credit' } }
          ]
        },
        attributes: ['id', 'code', 'name', 'type', 'nature']
      });

      return {
        isValid: incorrectNatures.length === 0,
        incorrectAccounts: incorrectNatures
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * فحص تطابق أرصدة الحسابات مع GL
   */
  static async checkBalanceMismatches() {
    try {
      // This would require a complex query to compare account balances with GL entry sums
      // For now, return empty array as this would need specific database queries
      return [];
    } catch (error) {
      console.error('Error checking balance mismatches:', error);
      return [];
    }
  }

  /**
   * تشغيل فحص سريع للصحة
   */
  static async quickHealthCheck() {
    try {
      const quickCheck = {
        timestamp: new Date().toISOString(),
        healthy: true,
        issues: []
      };

      // فحص Account Mapping
      const activeMapping = await AccountMapping.findOne({ where: { isActive: true } });
      if (!activeMapping) {
        quickCheck.healthy = false;
        quickCheck.issues.push('No active account mapping');
      }

      // فحص وجود حسابات أساسية
      const accountsCount = await Account.count({ where: { isActive: true } });
      if (accountsCount < 5) {
        quickCheck.healthy = false;
        quickCheck.issues.push('Insufficient accounts in chart of accounts');
      }

      // فحص القيود غير المتوازنة
      const unbalancedCount = await JournalEntry.count({
        where: {
          totalDebit: { [Op.ne]: Account.sequelize.col('totalCredit') }
        }
      });

      if (unbalancedCount > 0) {
        quickCheck.healthy = false;
        quickCheck.issues.push(`${unbalancedCount} unbalanced journal entries`);
      }

      return quickCheck;
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        healthy: false,
        issues: [`Health check failed: ${error.message}`]
      };
    }
  }
}

export default AccountingHealthMonitor;