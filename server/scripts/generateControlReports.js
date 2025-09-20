#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';

// تحميل متغيرات البيئة
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function generateControlReports() {
  console.log('📊 بدء إنشاء تقارير التحقق والمراجعة...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    const reports = {};
    const reportDate = new Date().toISOString().split('T')[0];

    // 1. تقرير ميزان المراجعة
    console.log('\n⚖️ إنشاء تقرير ميزان المراجعة...');
    
    const [trialBalance] = await sequelize.query(`
      SELECT 
        a.code,
        a.name,
        a.type,
        a.level,
        COALESCE(SUM(jed.debit), 0) as total_debit,
        COALESCE(SUM(jed.credit), 0) as total_credit,
        a.balance as current_balance,
        c.symbol as currency_symbol
      FROM accounts a
      LEFT JOIN journal_entry_details jed ON a.id = jed."accountId"
      LEFT JOIN journal_entries je ON jed."journalEntryId" = je.id AND je.status = 'posted'
      LEFT JOIN currencies c ON a."currencyId" = c.id
      WHERE a."isActive" = TRUE
      GROUP BY a.id, a.code, a.name, a.type, a.level, a.balance, c.symbol
      ORDER BY a.code
    `);

    const totalDebits = trialBalance.reduce((sum, acc) => sum + parseFloat(acc.total_debit || 0), 0);
    const totalCredits = trialBalance.reduce((sum, acc) => sum + parseFloat(acc.total_credit || 0), 0);
    const balanceDifference = totalDebits - totalCredits;

    reports.trialBalance = {
      title: 'ميزان المراجعة',
      date: reportDate,
      accounts: trialBalance,
      summary: {
        totalDebits: totalDebits.toFixed(2),
        totalCredits: totalCredits.toFixed(2),
        difference: balanceDifference.toFixed(2),
        isBalanced: Math.abs(balanceDifference) < 0.01
      }
    };

    // 2. تقرير المعادلة المحاسبية
    console.log('\n🧮 إنشاء تقرير المعادلة المحاسبية...');
    
    const [accountingEquation] = await sequelize.query(`
      SELECT 
        account_type,
        SUM(balance) as total_balance
      FROM (
        SELECT 
          CASE 
            WHEN type = 'asset' THEN 'assets'
            WHEN type = 'liability' THEN 'liabilities'
            WHEN type = 'equity' THEN 'equity'
            WHEN type = 'revenue' THEN 'revenue'
            WHEN type = 'expense' THEN 'expense'
            ELSE 'other'
          END as account_type,
          balance
        FROM accounts 
        WHERE "isActive" = TRUE
      ) grouped_accounts
      GROUP BY account_type
      ORDER BY account_type
    `);

    const assets = accountingEquation.find(eq => eq.account_type === 'assets')?.total_balance || 0;
    const liabilities = accountingEquation.find(eq => eq.account_type === 'liabilities')?.total_balance || 0;
    const equity = accountingEquation.find(eq => eq.account_type === 'equity')?.total_balance || 0;
    const revenue = accountingEquation.find(eq => eq.account_type === 'revenue')?.total_balance || 0;
    const expense = accountingEquation.find(eq => eq.account_type === 'expense')?.total_balance || 0;

    const equationBalance = parseFloat(assets) - (parseFloat(liabilities) + parseFloat(equity) + parseFloat(revenue) - parseFloat(expense));

    reports.accountingEquation = {
      title: 'المعادلة المحاسبية',
      date: reportDate,
      components: {
        assets: parseFloat(assets).toFixed(2),
        liabilities: parseFloat(liabilities).toFixed(2),
        equity: parseFloat(equity).toFixed(2),
        revenue: parseFloat(revenue).toFixed(2),
        expense: parseFloat(expense).toFixed(2)
      },
      equation: {
        leftSide: parseFloat(assets).toFixed(2),
        rightSide: (parseFloat(liabilities) + parseFloat(equity) + parseFloat(revenue) - parseFloat(expense)).toFixed(2),
        difference: equationBalance.toFixed(2),
        isBalanced: Math.abs(equationBalance) < 0.01
      }
    };

    // 3. تقرير القيود غير المتوازنة
    console.log('\n⚠️ فحص القيود غير المتوازنة...');
    
    const [unbalancedEntries] = await sequelize.query(`
      SELECT 
        je.id,
        je."entryNumber",
        je.date,
        je.description,
        je.status,
        je."totalDebit",
        je."totalCredit",
        ABS(je."totalDebit" - je."totalCredit") as difference
      FROM journal_entries je
      WHERE ABS(je."totalDebit" - je."totalCredit") > 0.01
      ORDER BY je.date DESC, je."entryNumber"
    `);

    reports.unbalancedEntries = {
      title: 'القيود غير المتوازنة',
      date: reportDate,
      count: unbalancedEntries.length,
      entries: unbalancedEntries,
      totalDifference: unbalancedEntries.reduce((sum, entry) => sum + parseFloat(entry.difference), 0).toFixed(2)
    };

    // 4. تقرير الحسابات ذات الأرصدة المخالفة للطبيعة
    console.log('\n🔍 فحص الأرصدة المخالفة للطبيعة...');
    
    const [abnormalBalances] = await sequelize.query(`
      SELECT 
        a.code,
        a.name,
        a.type,
        a.balance,
        CASE 
          WHEN a.type IN ('asset', 'expense') AND a.balance < 0 THEN 'رصيد دائن في حساب مدين'
          WHEN a.type IN ('liability', 'equity', 'revenue') AND a.balance < 0 THEN 'رصيد مدين في حساب دائن'
          ELSE 'طبيعي'
        END as balance_nature_issue
      FROM accounts a
      WHERE a."isActive" = TRUE
        AND (
          (a.type IN ('asset', 'expense') AND a.balance < -0.01) OR
          (a.type IN ('liability', 'equity', 'revenue') AND a.balance < -0.01)
        )
      ORDER BY a.code
    `);

    reports.abnormalBalances = {
      title: 'الأرصدة المخالفة للطبيعة',
      date: reportDate,
      count: abnormalBalances.length,
      accounts: abnormalBalances
    };

    // 5. تقرير الفواتير غير المرتبطة بحسابات
    console.log('\n📄 فحص الفواتير غير المرتبطة...');

    const [unlinkedInvoices] = await sequelize.query(`
      SELECT
        i.id,
        i."invoiceNumber",
        i.date,
        i.total,
        i.status,
        c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i."customerId" = c.id
      WHERE i.status IN ('paid', 'partially_paid', 'unpaid')
        AND i."accountId" IS NULL
      ORDER BY i.date DESC
    `);

    reports.unlinkedInvoices = {
      title: 'الفواتير غير المرتبطة بحسابات',
      date: reportDate,
      count: unlinkedInvoices.length,
      invoices: unlinkedInvoices,
      totalAmount: unlinkedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0).toFixed(2)
    };

    // 6. تقرير العملاء بدون حسابات
    console.log('\n👥 فحص العملاء بدون حسابات...');
    
    const [customersWithoutAccounts] = await sequelize.query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(i.id) as invoice_count,
        COALESCE(SUM(i.total), 0) as total_invoices
      FROM customers c
      LEFT JOIN invoices i ON c.id = i."customerId"
      WHERE c."accountId" IS NULL
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY total_invoices DESC
    `);

    reports.customersWithoutAccounts = {
      title: 'العملاء بدون حسابات',
      date: reportDate,
      count: customersWithoutAccounts.length,
      customers: customersWithoutAccounts
    };

    // 7. تقرير الأصول الثابتة بدون إهلاك
    console.log('\n🏢 فحص الأصول الثابتة...');
    
    const [assetsWithoutDepreciation] = await sequelize.query(`
      SELECT 
        fa.id,
        fa.name,
        fa."assetNumber",
        fa."purchaseCost",
        fa."purchaseDate",
        fa.status,
        COUNT(ds.id) as depreciation_schedules_count
      FROM fixed_assets fa
      LEFT JOIN depreciation_schedules ds ON fa.id = ds."fixedAssetId"
      WHERE fa.status = 'active'
        AND fa."purchaseCost" > 0
      GROUP BY fa.id, fa.name, fa."assetNumber", fa."purchaseCost", fa."purchaseDate", fa.status
      HAVING COUNT(ds.id) = 0
      ORDER BY fa."purchaseDate" DESC
    `);

    reports.assetsWithoutDepreciation = {
      title: 'الأصول الثابتة بدون جدولة إهلاك',
      date: reportDate,
      count: assetsWithoutDepreciation.length,
      assets: assetsWithoutDepreciation,
      totalValue: assetsWithoutDepreciation.reduce((sum, asset) => sum + parseFloat(asset.purchaseCost || 0), 0).toFixed(2)
    };

    // 8. تقرير أسعار الصرف المفقودة
    console.log('\n💱 فحص أسعار الصرف...');
    
    const [missingExchangeRates] = await sequelize.query(`
      SELECT DISTINCT
        c1.code as from_currency,
        c1.name as from_currency_name,
        c2.code as to_currency,
        c2.name as to_currency_name
      FROM currencies c1
      CROSS JOIN currencies c2
      WHERE c1.id != c2.id
        AND c1."isActive" = TRUE
        AND c2."isActive" = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM exchange_rates er
          WHERE er."fromCurrencyId" = c1.id
            AND er."toCurrencyId" = c2.id
            AND er."effectiveDate" = CURRENT_DATE
            AND er."isActive" = TRUE
        )
      ORDER BY c1.code, c2.code
    `);

    reports.missingExchangeRates = {
      title: 'أسعار الصرف المفقودة لليوم الحالي',
      date: reportDate,
      count: missingExchangeRates.length,
      rates: missingExchangeRates
    };

    // 9. تقرير الفترات المحاسبية
    console.log('\n📅 فحص الفترات المحاسبية...');
    
    const [accountingPeriods] = await sequelize.query(`
      SELECT 
        ap.year,
        ap.month,
        ap.status,
        ap."closedAt",
        ap."closedBy",
        COUNT(je.id) as entries_count,
        COALESCE(SUM(je."totalDebit"), 0) as total_debits
      FROM accounting_periods ap
      LEFT JOIN journal_entries je ON 
        EXTRACT(YEAR FROM je.date) = ap.year AND 
        EXTRACT(MONTH FROM je.date) = ap.month
      GROUP BY ap.year, ap.month, ap.status, ap."closedAt", ap."closedBy"
      ORDER BY ap.year DESC, ap.month DESC
      LIMIT 12
    `);

    reports.accountingPeriods = {
      title: 'حالة الفترات المحاسبية',
      date: reportDate,
      periods: accountingPeriods
    };

    // 10. ملخص التقرير العام
    const totalIssues = 
      unbalancedEntries.length +
      abnormalBalances.length +
      unlinkedInvoices.length +
      customersWithoutAccounts.length +
      assetsWithoutDepreciation.length +
      missingExchangeRates.length;

    reports.summary = {
      title: 'ملخص التقرير العام',
      date: reportDate,
      systemHealth: {
        trialBalanceStatus: reports.trialBalance.summary.isBalanced ? 'متوازن' : 'غير متوازن',
        accountingEquationStatus: reports.accountingEquation.equation.isBalanced ? 'متوازن' : 'غير متوازن',
        totalIssuesFound: totalIssues,
        overallStatus: totalIssues === 0 && reports.trialBalance.summary.isBalanced && reports.accountingEquation.equation.isBalanced ? 'ممتاز' : 'يحتاج مراجعة'
      },
      issuesSummary: {
        unbalancedEntries: unbalancedEntries.length,
        abnormalBalances: abnormalBalances.length,
        unlinkedInvoices: unlinkedInvoices.length,
        customersWithoutAccounts: customersWithoutAccounts.length,
        assetsWithoutDepreciation: assetsWithoutDepreciation.length,
        missingExchangeRates: missingExchangeRates.length
      }
    };

    // حفظ التقرير في ملف
    const reportFileName = `control-reports-${reportDate}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(reports, null, 2), 'utf8');

    console.log('\n🎉 تم إنشاء تقارير التحقق والمراجعة بنجاح!');
    console.log(`📄 تم حفظ التقرير في: ${reportFileName}`);
    
    // عرض ملخص سريع
    console.log('\n📋 ملخص سريع:');
    console.log(`⚖️ ميزان المراجعة: ${reports.trialBalance.summary.isBalanced ? '✅ متوازن' : '❌ غير متوازن'}`);
    console.log(`🧮 المعادلة المحاسبية: ${reports.accountingEquation.equation.isBalanced ? '✅ متوازنة' : '❌ غير متوازنة'}`);
    console.log(`⚠️ القيود غير المتوازنة: ${unbalancedEntries.length}`);
    console.log(`🔍 الأرصدة المخالفة: ${abnormalBalances.length}`);
    console.log(`📄 الفواتير غير المرتبطة: ${unlinkedInvoices.length}`);
    console.log(`👥 العملاء بدون حسابات: ${customersWithoutAccounts.length}`);
    console.log(`🏢 الأصول بدون إهلاك: ${assetsWithoutDepreciation.length}`);
    console.log(`💱 أسعار الصرف المفقودة: ${missingExchangeRates.length}`);
    console.log(`\n🎯 الحالة العامة: ${reports.summary.systemHealth.overallStatus}`);

    return reports;

  } catch (error) {
    console.error('❌ خطأ في إنشاء تقارير التحقق:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل إنشاء التقارير
generateControlReports()
  .then(() => {
    console.log('\n🎉 انتهى إنشاء تقارير التحقق والمراجعة بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل إنشاء تقارير التحقق:', error);
    process.exit(1);
  });
