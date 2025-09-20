#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import fs from 'fs';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد الاتصال بقاعدة البيانات
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function quickAudit() {
  console.log('🔍 بدء التدقيق السريع...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    const results = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {}
    };

    // 1. فحص توازن ميزان المراجعة
    console.log('📊 فحص توازن ميزان المراجعة...');
    const [glTotals] = await sequelize.query(`
      SELECT 
        ROUND(SUM(debit), 2) as total_debit,
        ROUND(SUM(credit), 2) as total_credit,
        ROUND(SUM(debit) - SUM(credit), 2) as difference
      FROM gl_entries 
      WHERE "isCancelled" = false
    `);
    
    const glBalance = glTotals[0];
    results.summary.glBalance = glBalance;
    
    if (Math.abs(parseFloat(glBalance.difference)) > 0.01) {
      results.issues.push({
        type: 'GL_IMBALANCE',
        severity: 'HIGH',
        description: `ميزان المراجعة غير متوازن - الفرق: ${glBalance.difference}`,
        details: glBalance
      });
    }

    // 2. فحص القيود غير المتوازنة
    console.log('⚖️ فحص القيود غير المتوازنة...');
    const [unbalancedJEs] = await sequelize.query(`
      SELECT 
        je.id,
        je."entryNumber",
        je."totalDebit",
        je."totalCredit",
        ROUND(SUM(jed.debit), 2) as detail_debit,
        ROUND(SUM(jed.credit), 2) as detail_credit
      FROM journal_entries je
      LEFT JOIN journal_entry_details jed ON je.id = jed."journalEntryId"
      WHERE je.status = 'posted'
      GROUP BY je.id, je."entryNumber", je."totalDebit", je."totalCredit"
      HAVING 
        ABS(je."totalDebit" - je."totalCredit") > 0.01 OR
        ABS(SUM(jed.debit) - SUM(jed.credit)) > 0.01 OR
        ABS(je."totalDebit" - SUM(jed.debit)) > 0.01
    `);

    results.summary.unbalancedJournalEntries = unbalancedJEs.length;
    if (unbalancedJEs.length > 0) {
      results.issues.push({
        type: 'UNBALANCED_JOURNAL_ENTRIES',
        severity: 'HIGH',
        description: `${unbalancedJEs.length} قيد غير متوازن`,
        details: unbalancedJEs
      });
    }

    // 3. فحص الفواتير بدون قيود GL
    console.log('🧾 فحص الفواتير بدون قيود GL...');
    const [invoicesWithoutGL] = await sequelize.query(`
      SELECT i.id, i."invoiceNumber", i.status, i.total
      FROM invoices i
      LEFT JOIN gl_entries gl ON gl."voucherType" = 'Sales Invoice' AND gl."voucherNo" = i."invoiceNumber"
      WHERE i.status != 'cancelled' AND gl.id IS NULL
    `);

    results.summary.invoicesWithoutGL = invoicesWithoutGL.length;
    if (invoicesWithoutGL.length > 0) {
      results.issues.push({
        type: 'INVOICES_WITHOUT_GL',
        severity: 'MEDIUM',
        description: `${invoicesWithoutGL.length} فاتورة بدون قيود GL`,
        details: invoicesWithoutGL
      });
    }

    // 4. فحص المدفوعات بدون قيود GL
    console.log('💰 فحص المدفوعات بدون قيود GL...');
    const [paymentsWithoutGL] = await sequelize.query(`
      SELECT p.id, p."paymentNumber", p.status, p.amount
      FROM payments p
      LEFT JOIN gl_entries gl ON gl."voucherType" = 'Payment Entry' AND gl."voucherNo" = p."paymentNumber"
      WHERE p.status = 'completed' AND gl.id IS NULL
    `);

    results.summary.paymentsWithoutGL = paymentsWithoutGL.length;
    if (paymentsWithoutGL.length > 0) {
      results.issues.push({
        type: 'PAYMENTS_WITHOUT_GL',
        severity: 'MEDIUM',
        description: `${paymentsWithoutGL.length} مدفوعة بدون قيود GL`,
        details: paymentsWithoutGL
      });
    }

    // 5. فحص العملاء بدون حسابات
    console.log('👥 فحص العملاء بدون حسابات...');
    const [customersWithoutAccounts] = await sequelize.query(`
      SELECT id, name, code
      FROM customers
      WHERE "accountId" IS NULL AND "isActive" = true
    `);

    results.summary.customersWithoutAccounts = customersWithoutAccounts.length;
    if (customersWithoutAccounts.length > 0) {
      results.issues.push({
        type: 'CUSTOMERS_WITHOUT_ACCOUNTS',
        severity: 'MEDIUM',
        description: `${customersWithoutAccounts.length} عميل بدون حساب مرتبط`,
        details: customersWithoutAccounts
      });
    }

    // 6. فحص الحسابات غير النشطة ذات الأرصدة
    console.log('💼 فحص الحسابات غير النشطة ذات الأرصدة...');
    const [inactiveAccountsWithBalance] = await sequelize.query(`
      SELECT id, code, name, balance
      FROM accounts
      WHERE "isActive" = false AND ABS(balance) > 0.01
    `);

    results.summary.inactiveAccountsWithBalance = inactiveAccountsWithBalance.length;
    if (inactiveAccountsWithBalance.length > 0) {
      results.issues.push({
        type: 'INACTIVE_ACCOUNTS_WITH_BALANCE',
        severity: 'LOW',
        description: `${inactiveAccountsWithBalance.length} حساب غير نشط له رصيد`,
        details: inactiveAccountsWithBalance
      });
    }

    // طباعة النتائج
    console.log('\n📊 نتائج التدقيق السريع:');
    console.log('='.repeat(50));
    console.log(`إجمالي المشاكل المكتشفة: ${results.issues.length}`);
    
    if (results.issues.length > 0) {
      console.log('\n❌ المشاكل المكتشفة:');
      results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.description}`);
      });
    } else {
      console.log('\n✅ لم يتم العثور على مشاكل محاسبية!');
    }

    // حفظ التقرير
    const reportPath = 'quick-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 تم حفظ التقرير في: ${reportPath}`);

    return results;

  } catch (error) {
    console.error('❌ خطأ في التدقيق:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل التدقيق
quickAudit()
  .then(() => {
    console.log('\n✅ انتهى التدقيق السريع بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل التدقيق:', error);
    process.exit(1);
  });
