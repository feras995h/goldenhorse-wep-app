#!/usr/bin/env node

/**
 * فحص شامل للوظائف الأساسية - المرحلة 3
 * Golden Horse Shipping System - Comprehensive Functions Testing
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class ComprehensiveFunctionsTester {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.testResults = {
      fixedAssets: {},
      payments: {},
      receipts: {},
      reports: {},
      customers: {},
      invoices: {},
      accounting: {},
      dataIntegrity: {},
      businessLogic: {},
      issues: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async testFixedAssetsSystem() {
    console.log('\n🏢 المرحلة 1/7: فحص نظام الأصول الثابتة...');
    
    try {
      // فحص وجود جدول الأصول الثابتة
      const assetsTableCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'fixed_assets'
        );
      `);

      if (!assetsTableCheck.rows[0].exists) {
        this.testResults.issues.push({
          type: 'CRITICAL',
          category: 'MISSING_TABLE',
          description: 'جدول الأصول الثابتة غير موجود',
          impact: 'HIGH'
        });
        console.log('   ❌ جدول الأصول الثابتة غير موجود');
        return;
      }

      // فحص هيكل جدول الأصول الثابتة
      const assetsStructure = await this.client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'fixed_assets'
        ORDER BY ordinal_position
      `);

      const requiredColumns = ['id', 'name', 'category', 'purchasePrice', 'depreciationMethod'];
      const existingColumns = assetsStructure.rows.map(row => row.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        this.testResults.issues.push({
          type: 'HIGH',
          category: 'MISSING_COLUMNS',
          description: `أعمدة مفقودة في جدول الأصول الثابتة: ${missingColumns.join(', ')}`,
          impact: 'HIGH'
        });
      }

      // فحص فئات الأصول الثابتة
      const categoriesCount = await this.client.query(`
        SELECT COUNT(*) as count
        FROM accounts 
        WHERE type = 'asset' AND code LIKE '1.2.%' AND "isGroup" = false
      `);

      const categoriesAvailable = parseInt(categoriesCount.rows[0].count);

      // فحص بيانات الأصول الثابتة
      const assetsCount = await this.client.query('SELECT COUNT(*) as count FROM fixed_assets');
      const assetsData = parseInt(assetsCount.rows[0].count);

      this.testResults.fixedAssets = {
        tableExists: true,
        structureComplete: missingColumns.length === 0,
        categoriesAvailable: categoriesAvailable,
        assetsCount: assetsData,
        requiredColumns: requiredColumns.length,
        existingColumns: existingColumns.length,
        missingColumns: missingColumns,
        status: missingColumns.length === 0 && categoriesAvailable > 0 ? 'GOOD' : 'NEEDS_ATTENTION'
      };

      console.log(`   ✅ فئات الأصول المتاحة: ${categoriesAvailable}`);
      console.log(`   ✅ عدد الأصول المسجلة: ${assetsData}`);
      console.log(`   ${missingColumns.length === 0 ? '✅' : '⚠️'} هيكل الجدول: ${missingColumns.length === 0 ? 'مكتمل' : 'ناقص'}`);

    } catch (error) {
      console.error('   ❌ خطأ في فحص نظام الأصول الثابتة:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'FIXED_ASSETS_TEST',
        description: `فشل فحص الأصول الثابتة: ${error.message}`,
        impact: 'HIGH'
      });
    }
  }

  async testPaymentsSystem() {
    console.log('\n💳 المرحلة 2/7: فحص نظام المدفوعات...');
    
    try {
      // فحص جدول المدفوعات
      const paymentsStructure = await this.client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'payments'
        ORDER BY ordinal_position
      `);

      const requiredPaymentColumns = ['id', 'amount', 'currency', 'exchangeRate', 'paymentMethod', 'createdAt'];
      const existingPaymentColumns = paymentsStructure.rows.map(row => row.column_name);
      const missingPaymentColumns = requiredPaymentColumns.filter(col => !existingPaymentColumns.includes(col));

      // إحصائيات المدفوعات
      const paymentsStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_payments,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(DISTINCT currency) as currencies_used,
          COUNT(DISTINCT "paymentMethod") as payment_methods
        FROM payments
      `);

      // فحص المدفوعات الحديثة
      const recentPayments = await this.client.query(`
        SELECT COUNT(*) as recent_count
        FROM payments 
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
      `);

      this.testResults.payments = {
        structureComplete: missingPaymentColumns.length === 0,
        totalPayments: parseInt(paymentsStats.rows[0].total_payments),
        totalAmount: parseFloat(paymentsStats.rows[0].total_amount),
        currenciesUsed: parseInt(paymentsStats.rows[0].currencies_used),
        paymentMethods: parseInt(paymentsStats.rows[0].payment_methods),
        recentPayments: parseInt(recentPayments.rows[0].recent_count),
        missingColumns: missingPaymentColumns,
        status: missingPaymentColumns.length === 0 ? 'GOOD' : 'NEEDS_ATTENTION'
      };

      console.log(`   ✅ إجمالي المدفوعات: ${this.testResults.payments.totalPayments}`);
      console.log(`   ✅ إجمالي المبالغ: ${this.testResults.payments.totalAmount.toFixed(2)}`);
      console.log(`   ✅ العملات المستخدمة: ${this.testResults.payments.currenciesUsed}`);
      console.log(`   ✅ المدفوعات الحديثة (30 يوم): ${this.testResults.payments.recentPayments}`);

      if (missingPaymentColumns.length > 0) {
        this.testResults.issues.push({
          type: 'MEDIUM',
          category: 'MISSING_COLUMNS',
          description: `أعمدة مفقودة في جدول المدفوعات: ${missingPaymentColumns.join(', ')}`,
          impact: 'MEDIUM'
        });
      }

    } catch (error) {
      console.error('   ❌ خطأ في فحص نظام المدفوعات:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'PAYMENTS_TEST',
        description: `فشل فحص المدفوعات: ${error.message}`,
        impact: 'HIGH'
      });
    }
  }

  async testReceiptsSystem() {
    console.log('\n🧾 المرحلة 3/7: فحص نظام المقبوضات...');
    
    try {
      // فحص جدول المقبوضات
      const receiptsStructure = await this.client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'receipts'
        ORDER BY ordinal_position
      `);

      const requiredReceiptColumns = ['id', 'amount', 'currency', 'exchangeRate', 'receiptMethod', 'createdAt'];
      const existingReceiptColumns = receiptsStructure.rows.map(row => row.column_name);
      const missingReceiptColumns = requiredReceiptColumns.filter(col => !existingReceiptColumns.includes(col));

      // إحصائيات المقبوضات
      const receiptsStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_receipts,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(DISTINCT currency) as currencies_used
        FROM receipts
      `);

      this.testResults.receipts = {
        structureComplete: missingReceiptColumns.length === 0,
        totalReceipts: parseInt(receiptsStats.rows[0].total_receipts),
        totalAmount: parseFloat(receiptsStats.rows[0].total_amount),
        currenciesUsed: parseInt(receiptsStats.rows[0].currencies_used),
        missingColumns: missingReceiptColumns,
        status: missingReceiptColumns.length === 0 ? 'GOOD' : 'NEEDS_ATTENTION'
      };

      console.log(`   ✅ إجمالي المقبوضات: ${this.testResults.receipts.totalReceipts}`);
      console.log(`   ✅ إجمالي المبالغ: ${this.testResults.receipts.totalAmount.toFixed(2)}`);
      console.log(`   ✅ العملات المستخدمة: ${this.testResults.receipts.currenciesUsed}`);

      if (missingReceiptColumns.length > 0) {
        this.testResults.issues.push({
          type: 'MEDIUM',
          category: 'MISSING_COLUMNS',
          description: `أعمدة مفقودة في جدول المقبوضات: ${missingReceiptColumns.join(', ')}`,
          impact: 'MEDIUM'
        });
      }

    } catch (error) {
      console.error('   ❌ خطأ في فحص نظام المقبوضات:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'RECEIPTS_TEST',
        description: `فشل فحص المقبوضات: ${error.message}`,
        impact: 'HIGH'
      });
    }
  }

  async testReportsSystem() {
    console.log('\n📊 المرحلة 4/7: فحص نظام التقارير المالية...');
    
    try {
      // اختبار الميزانية العمومية
      const balanceSheetTest = await this.testBalanceSheet();
      
      // اختبار قائمة الدخل
      const incomeStatementTest = await this.testIncomeStatement();
      
      // اختبار ميزان المراجعة
      const trialBalanceTest = await this.testTrialBalance();

      this.testResults.reports = {
        balanceSheet: balanceSheetTest,
        incomeStatement: incomeStatementTest,
        trialBalance: trialBalanceTest,
        overallStatus: balanceSheetTest.success && incomeStatementTest.success && trialBalanceTest.success ? 'GOOD' : 'NEEDS_ATTENTION'
      };

      const successfulReports = [balanceSheetTest, incomeStatementTest, trialBalanceTest].filter(r => r.success).length;
      console.log(`   ✅ التقارير العاملة: ${successfulReports}/3`);

    } catch (error) {
      console.error('   ❌ خطأ في فحص نظام التقارير:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'REPORTS_TEST',
        description: `فشل فحص التقارير: ${error.message}`,
        impact: 'HIGH'
      });
    }
  }

  async testBalanceSheet() {
    try {
      const startTime = Date.now();
      
      // حساب الأصول
      const assetsQuery = await this.client.query(`
        SELECT COALESCE(SUM(balance), 0) as total_assets
        FROM accounts 
        WHERE type = 'asset' AND "isActive" = true
      `);
      
      // حساب الخصوم
      const liabilitiesQuery = await this.client.query(`
        SELECT COALESCE(SUM(balance), 0) as total_liabilities
        FROM accounts 
        WHERE type = 'liability' AND "isActive" = true
      `);
      
      // حساب حقوق الملكية
      const equityQuery = await this.client.query(`
        SELECT COALESCE(SUM(balance), 0) as total_equity
        FROM accounts 
        WHERE type = 'equity' AND "isActive" = true
      `);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const totalAssets = parseFloat(assetsQuery.rows[0].total_assets);
      const totalLiabilities = parseFloat(liabilitiesQuery.rows[0].total_liabilities);
      const totalEquity = parseFloat(equityQuery.rows[0].total_equity);
      
      const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

      return {
        success: true,
        responseTime,
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced,
        status: isBalanced ? 'BALANCED' : 'UNBALANCED'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'ERROR'
      };
    }
  }

  async testIncomeStatement() {
    try {
      const startTime = Date.now();
      
      // حساب الإيرادات
      const revenueQuery = await this.client.query(`
        SELECT COALESCE(SUM(balance), 0) as total_revenue
        FROM accounts 
        WHERE type = 'revenue' AND "isActive" = true
      `);
      
      // حساب المصروفات
      const expenseQuery = await this.client.query(`
        SELECT COALESCE(SUM(balance), 0) as total_expenses
        FROM accounts 
        WHERE type = 'expense' AND "isActive" = true
      `);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const totalRevenue = parseFloat(revenueQuery.rows[0].total_revenue);
      const totalExpenses = parseFloat(expenseQuery.rows[0].total_expenses);
      const netIncome = totalRevenue - totalExpenses;

      return {
        success: true,
        responseTime,
        totalRevenue,
        totalExpenses,
        netIncome,
        status: 'CALCULATED'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'ERROR'
      };
    }
  }

  async testTrialBalance() {
    try {
      const startTime = Date.now();
      
      const trialBalanceQuery = await this.client.query(`
        SELECT 
          type,
          COUNT(*) as account_count,
          COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as debit_total,
          COALESCE(SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END), 0) as credit_total
        FROM accounts 
        WHERE "isActive" = true
        GROUP BY type
        ORDER BY type
      `);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const trialBalanceData = trialBalanceQuery.rows;
      const totalDebits = trialBalanceData.reduce((sum, row) => sum + parseFloat(row.debit_total), 0);
      const totalCredits = trialBalanceData.reduce((sum, row) => sum + parseFloat(row.credit_total), 0);
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

      return {
        success: true,
        responseTime,
        trialBalanceData,
        totalDebits,
        totalCredits,
        isBalanced,
        status: isBalanced ? 'BALANCED' : 'UNBALANCED'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'ERROR'
      };
    }
  }

  async testCustomersSystem() {
    console.log('\n👥 المرحلة 5/7: فحص نظام إدارة العملاء...');
    
    try {
      // إحصائيات العملاء
      const customersStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_customers,
          COUNT(CASE WHEN "isActive" = false THEN 1 END) as inactive_customers
        FROM customers
      `);

      // العملاء مع أرصدة
      const customersWithBalances = await this.client.query(`
        SELECT COUNT(*) as customers_with_balances
        FROM customers 
        WHERE balance != 0
      `);

      this.testResults.customers = {
        totalCustomers: parseInt(customersStats.rows[0].total_customers),
        activeCustomers: parseInt(customersStats.rows[0].active_customers),
        inactiveCustomers: parseInt(customersStats.rows[0].inactive_customers),
        customersWithBalances: parseInt(customersWithBalances.rows[0].customers_with_balances),
        status: 'GOOD'
      };

      console.log(`   ✅ إجمالي العملاء: ${this.testResults.customers.totalCustomers}`);
      console.log(`   ✅ العملاء النشطون: ${this.testResults.customers.activeCustomers}`);
      console.log(`   ✅ العملاء مع أرصدة: ${this.testResults.customers.customersWithBalances}`);

    } catch (error) {
      console.error('   ❌ خطأ في فحص نظام العملاء:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'CUSTOMERS_TEST',
        description: `فشل فحص العملاء: ${error.message}`,
        impact: 'MEDIUM'
      });
    }
  }

  async testInvoicesSystem() {
    console.log('\n🧾 المرحلة 6/7: فحص نظام الفواتير...');
    
    try {
      // إحصائيات فواتير المبيعات
      const salesInvoicesStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM("totalAmount"), 0) as total_amount,
          COUNT(DISTINCT status) as status_types,
          COUNT(DISTINCT "customerId") as unique_customers
        FROM sales_invoices
      `);

      // إحصائيات فواتير الشحن
      const shippingInvoicesStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_shipping_invoices,
          COALESCE(SUM("totalAmount"), 0) as total_shipping_amount
        FROM shipping_invoices
      `);

      this.testResults.invoices = {
        salesInvoices: {
          total: parseInt(salesInvoicesStats.rows[0].total_invoices),
          totalAmount: parseFloat(salesInvoicesStats.rows[0].total_amount),
          statusTypes: parseInt(salesInvoicesStats.rows[0].status_types),
          uniqueCustomers: parseInt(salesInvoicesStats.rows[0].unique_customers)
        },
        shippingInvoices: {
          total: parseInt(shippingInvoicesStats.rows[0].total_shipping_invoices),
          totalAmount: parseFloat(shippingInvoicesStats.rows[0].total_shipping_amount)
        },
        status: 'GOOD'
      };

      console.log(`   ✅ فواتير المبيعات: ${this.testResults.invoices.salesInvoices.total}`);
      console.log(`   ✅ إجمالي مبيعات: ${this.testResults.invoices.salesInvoices.totalAmount.toFixed(2)}`);
      console.log(`   ✅ فواتير الشحن: ${this.testResults.invoices.shippingInvoices.total}`);
      console.log(`   ✅ إجمالي شحن: ${this.testResults.invoices.shippingInvoices.totalAmount.toFixed(2)}`);

    } catch (error) {
      console.error('   ❌ خطأ في فحص نظام الفواتير:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'INVOICES_TEST',
        description: `فشل فحص الفواتير: ${error.message}`,
        impact: 'MEDIUM'
      });
    }
  }

  async testAccountingLogic() {
    console.log('\n⚖️ المرحلة 7/7: فحص المنطق المحاسبي...');
    
    try {
      // فحص المعادلة المحاسبية
      const accountingEquation = await this.client.query(`
        SELECT 
          type,
          COALESCE(SUM(balance), 0) as total_balance
        FROM accounts 
        WHERE "isActive" = true
        GROUP BY type
      `);

      const balancesByType = {};
      accountingEquation.rows.forEach(row => {
        balancesByType[row.type] = parseFloat(row.total_balance);
      });

      const assets = balancesByType.asset || 0;
      const liabilities = balancesByType.liability || 0;
      const equity = balancesByType.equity || 0;
      const revenue = balancesByType.revenue || 0;
      const expense = balancesByType.expense || 0;

      const equationBalance = Math.abs(assets - (liabilities + equity));
      const isEquationBalanced = equationBalance < 0.01;

      // فحص القيود اليومية
      const journalEntriesCheck = await this.client.query(`
        SELECT COUNT(*) as total_entries
        FROM journal_entries
      `);

      this.testResults.accounting = {
        balancesByType,
        assets,
        liabilities,
        equity,
        revenue,
        expense,
        equationBalance,
        isEquationBalanced,
        journalEntries: parseInt(journalEntriesCheck.rows[0].total_entries),
        status: isEquationBalanced ? 'BALANCED' : 'UNBALANCED'
      };

      console.log(`   ✅ الأصول: ${assets.toFixed(2)}`);
      console.log(`   ✅ الخصوم: ${liabilities.toFixed(2)}`);
      console.log(`   ✅ حقوق الملكية: ${equity.toFixed(2)}`);
      console.log(`   ${isEquationBalanced ? '✅' : '❌'} المعادلة المحاسبية: ${isEquationBalanced ? 'متوازنة' : 'غير متوازنة'}`);
      console.log(`   ✅ القيود اليومية: ${this.testResults.accounting.journalEntries}`);

      if (!isEquationBalanced) {
        this.testResults.issues.push({
          type: 'CRITICAL',
          category: 'ACCOUNTING_IMBALANCE',
          description: `المعادلة المحاسبية غير متوازنة - الفرق: ${equationBalance.toFixed(2)}`,
          impact: 'CRITICAL'
        });
      }

    } catch (error) {
      console.error('   ❌ خطأ في فحص المنطق المحاسبي:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'ACCOUNTING_TEST',
        description: `فشل فحص المنطق المحاسبي: ${error.message}`,
        impact: 'HIGH'
      });
    }
  }

  async generateSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const functionalSystems = [
      this.testResults.fixedAssets,
      this.testResults.payments,
      this.testResults.receipts,
      this.testResults.reports,
      this.testResults.customers,
      this.testResults.invoices,
      this.testResults.accounting
    ];

    const workingSystems = functionalSystems.filter(system => 
      system && (system.status === 'GOOD' || system.status === 'BALANCED' || system.overallStatus === 'GOOD')
    ).length;

    this.testResults.summary = {
      testDate: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)} ثانية`,
      totalSystems: 7,
      workingSystems: workingSystems,
      systemsNeedingAttention: 7 - workingSystems,
      functionalityRate: Math.round((workingSystems / 7) * 100),
      totalIssues: this.testResults.issues.length,
      criticalIssues: this.testResults.issues.filter(i => i.type === 'CRITICAL').length,
      highIssues: this.testResults.issues.filter(i => i.impact === 'HIGH').length,
      mediumIssues: this.testResults.issues.filter(i => i.impact === 'MEDIUM').length,
      overallHealth: this.calculateOverallHealth()
    };
  }

  calculateOverallHealth() {
    const functionalityRate = this.testResults.summary.functionalityRate;
    const criticalIssues = this.testResults.summary.criticalIssues;
    const highIssues = this.testResults.summary.highIssues;

    if (criticalIssues > 0 || functionalityRate < 50) return 'CRITICAL';
    if (highIssues > 2 || functionalityRate < 70) return 'POOR';
    if (highIssues > 0 || functionalityRate < 85) return 'FAIR';
    if (functionalityRate < 95) return 'GOOD';
    return 'EXCELLENT';
  }

  async saveReport() {
    const reportData = {
      ...this.testResults,
      metadata: {
        testType: 'COMPREHENSIVE_FUNCTIONS_TESTING',
        version: '1.0',
        system: 'Golden Horse Shipping System',
        tester: 'Augment Agent',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      fs.writeFileSync('functions-testing-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n📄 تم حفظ تقرير اختبار الوظائف: functions-testing-report.json');
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير اختبار الوظائف:', error.message);
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runComprehensiveFunctionsTest() {
    console.log('🚀 بدء الفحص الشامل للوظائف الأساسية...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: فحص شامل لجميع الوظائف الأساسية للنظام');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.testFixedAssetsSystem();
      await this.testPaymentsSystem();
      await this.testReceiptsSystem();
      await this.testReportsSystem();
      await this.testCustomersSystem();
      await this.testInvoicesSystem();
      await this.testAccountingLogic();
      
      await this.generateSummary();
      await this.saveReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ خطأ عام في فحص الوظائف:', error.message);
      this.testResults.issues.push({
        type: 'ERROR',
        category: 'GENERAL_ERROR',
        description: `خطأ عام: ${error.message}`,
        impact: 'HIGH'
      });
      return this.testResults;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الفحص الشامل للوظائف
const tester = new ComprehensiveFunctionsTester();
tester.runComprehensiveFunctionsTest().then(results => {
  if (results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص نتائج فحص الوظائف الأساسية:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة الفحص: ${results.summary.duration}`);
    console.log(`📊 إجمالي الأنظمة: ${results.summary.totalSystems}`);
    console.log(`✅ الأنظمة العاملة: ${results.summary.workingSystems}`);
    console.log(`⚠️ الأنظمة تحتاج انتباه: ${results.summary.systemsNeedingAttention}`);
    console.log(`📈 معدل الوظائف العاملة: ${results.summary.functionalityRate}%`);
    console.log(`🚨 إجمالي المشاكل: ${results.summary.totalIssues}`);
    console.log(`   - حرجة: ${results.summary.criticalIssues}`);
    console.log(`   - عالية: ${results.summary.highIssues}`);
    console.log(`   - متوسطة: ${results.summary.mediumIssues}`);
    console.log(`🏥 الحالة العامة: ${results.summary.overallHealth}`);
    
    if (results.summary.overallHealth === 'EXCELLENT') {
      console.log('\n🎉 جميع الوظائف تعمل بشكل ممتاز!');
      process.exit(0);
    } else if (results.summary.criticalIssues > 0) {
      console.log('\n🚨 يوجد مشاكل حرجة في الوظائف!');
      process.exit(1);
    } else {
      console.log('\n⚠️ يوجد مشاكل تحتاج انتباه في الوظائف');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء فحص الوظائف الشامل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل فحص الوظائف الشامل:', error);
  process.exit(1);
});
