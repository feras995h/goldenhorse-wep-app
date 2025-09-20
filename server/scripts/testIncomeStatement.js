#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

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

async function testIncomeStatement() {
  console.log('💰 اختبار قائمة الدخل بالتفصيل...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص حسابات الإيرادات والمصروفات
    console.log('\n📊 فحص حسابات الإيرادات والمصروفات...');
    
    const [accounts] = await sequelize.query(`
      SELECT 
        code,
        name,
        type,
        COALESCE(balance, 0) as balance,
        currency
      FROM accounts 
      WHERE "isActive" = true 
      AND type IN ('revenue', 'expense')
      ORDER BY type, code
    `);
    
    console.log('الحسابات الموجودة:');
    console.log('الكود | الاسم | النوع | الرصيد | العملة');
    console.log('-----|------|------|-------|-------');
    
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    accounts.forEach(account => {
      const balance = parseFloat(account.balance) || 0;
      console.log(`${account.code} | ${account.name.substring(0, 20)} | ${account.type} | ${balance.toFixed(2)} | ${account.currency}`);
      
      if (account.type === 'revenue') {
        // الإيرادات لها طبيعة دائنة، لذا الرصيد الموجب يعني إيراد
        totalRevenue += Math.abs(balance);
      } else if (account.type === 'expense') {
        // المصروفات لها طبيعة مدينة، لذا الرصيد الموجب يعني مصروف
        totalExpenses += Math.abs(balance);
      }
    });
    
    console.log('-----|------|------|-------|-------');
    console.log(`إجمالي الإيرادات: ${totalRevenue.toFixed(2)} LYD`);
    console.log(`إجمالي المصروفات: ${totalExpenses.toFixed(2)} LYD`);
    
    const netIncome = totalRevenue - totalExpenses;
    console.log(`صافي الدخل: ${netIncome.toFixed(2)} LYD`);

    // 2. فحص القيود المرتبطة بالإيرادات والمصروفات
    console.log('\n📋 فحص القيود المرتبطة...');
    
    const [journalDetails] = await sequelize.query(`
      SELECT 
        a.code,
        a.name,
        a.type,
        jed.debit,
        jed.credit,
        je.date,
        je.description
      FROM journal_entry_details jed
      JOIN accounts a ON jed."accountId" = a.id
      JOIN journal_entries je ON jed."journalEntryId" = je.id
      WHERE a.type IN ('revenue', 'expense')
      AND je.status = 'posted'
      ORDER BY je.date DESC, a.type, a.code
    `);
    
    console.log('\nتفاصيل القيود:');
    console.log('التاريخ | الكود | الحساب | المدين | الدائن | الوصف');
    console.log('-------|------|--------|-------|-------|-------');
    
    let journalRevenue = 0;
    let journalExpenses = 0;
    
    journalDetails.forEach(detail => {
      const debit = parseFloat(detail.debit) || 0;
      const credit = parseFloat(detail.credit) || 0;
      
      console.log(`${detail.date} | ${detail.code} | ${detail.name.substring(0, 15)} | ${debit.toFixed(2)} | ${credit.toFixed(2)} | ${detail.description?.substring(0, 20) || ''}`);
      
      if (detail.type === 'revenue') {
        // الإيرادات: الدائن يزيد الإيراد، المدين ينقصه
        journalRevenue += credit - debit;
      } else if (detail.type === 'expense') {
        // المصروفات: المدين يزيد المصروف، الدائن ينقصه
        journalExpenses += debit - credit;
      }
    });
    
    console.log('-------|------|--------|-------|-------|-------');
    console.log(`إجمالي الإيرادات من القيود: ${journalRevenue.toFixed(2)} LYD`);
    console.log(`إجمالي المصروفات من القيود: ${journalExpenses.toFixed(2)} LYD`);
    
    const journalNetIncome = journalRevenue - journalExpenses;
    console.log(`صافي الدخل من القيود: ${journalNetIncome.toFixed(2)} LYD`);

    // 3. مقارنة النتائج
    console.log('\n🔍 مقارنة النتائج...');
    
    const revenueDiff = Math.abs(totalRevenue - journalRevenue);
    const expensesDiff = Math.abs(totalExpenses - journalExpenses);
    const netIncomeDiff = Math.abs(netIncome - journalNetIncome);
    
    console.log(`فرق الإيرادات: ${revenueDiff.toFixed(2)} LYD ${revenueDiff < 0.01 ? '✅' : '❌'}`);
    console.log(`فرق المصروفات: ${expensesDiff.toFixed(2)} LYD ${expensesDiff < 0.01 ? '✅' : '❌'}`);
    console.log(`فرق صافي الدخل: ${netIncomeDiff.toFixed(2)} LYD ${netIncomeDiff < 0.01 ? '✅' : '❌'}`);

    // 4. إنشاء قائمة دخل صحيحة
    console.log('\n📈 قائمة الدخل الصحيحة:');
    console.log('=====================================');
    console.log('           قائمة الدخل');
    console.log(`     للفترة من 2025-01-01 إلى ${new Date().toISOString().split('T')[0]}`);
    console.log('=====================================');
    console.log('');
    console.log('الإيرادات:');
    
    // عرض تفاصيل الإيرادات
    const revenueAccounts = accounts.filter(a => a.type === 'revenue');
    revenueAccounts.forEach(account => {
      const balance = parseFloat(account.balance) || 0;
      if (Math.abs(balance) > 0.01) {
        console.log(`  ${account.name}: ${Math.abs(balance).toFixed(2)} LYD`);
      }
    });
    console.log(`  إجمالي الإيرادات: ${totalRevenue.toFixed(2)} LYD`);
    console.log('');
    
    console.log('المصروفات:');
    // عرض تفاصيل المصروفات
    const expenseAccounts = accounts.filter(a => a.type === 'expense');
    expenseAccounts.forEach(account => {
      const balance = parseFloat(account.balance) || 0;
      if (Math.abs(balance) > 0.01) {
        console.log(`  ${account.name}: ${Math.abs(balance).toFixed(2)} LYD`);
      }
    });
    console.log(`  إجمالي المصروفات: ${totalExpenses.toFixed(2)} LYD`);
    console.log('');
    
    console.log('=====================================');
    console.log(`صافي الدخل: ${netIncome.toFixed(2)} LYD`);
    console.log('=====================================');

    // 5. التحقق من صحة البيانات
    console.log('\n✅ التحقق من صحة البيانات:');
    
    const checks = [
      {
        name: 'وجود حسابات إيرادات',
        result: revenueAccounts.length > 0,
        value: `${revenueAccounts.length} حساب`
      },
      {
        name: 'وجود حسابات مصروفات',
        result: expenseAccounts.length > 0,
        value: `${expenseAccounts.length} حساب`
      },
      {
        name: 'صافي الدخل رقم صحيح',
        result: !isNaN(netIncome) && isFinite(netIncome),
        value: `${netIncome.toFixed(2)} LYD`
      },
      {
        name: 'توافق أرصدة الحسابات مع القيود',
        result: revenueDiff < 0.01 && expensesDiff < 0.01,
        value: `فرق ${Math.max(revenueDiff, expensesDiff).toFixed(2)}`
      }
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.name}: ${check.result ? '✅' : '❌'} (${check.value})`);
    });
    
    const passedChecks = checks.filter(c => c.result).length;
    console.log(`\n🎯 النتيجة: ${passedChecks}/${checks.length} فحص نجح`);
    
    if (passedChecks === checks.length) {
      console.log('🎉 قائمة الدخل تعمل بشكل صحيح!');
      console.log(`💰 صافي الدخل النهائي: ${netIncome.toFixed(2)} LYD`);
    } else {
      console.log('⚠️ قائمة الدخل تحتاج مراجعة');
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار قائمة الدخل:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل اختبار قائمة الدخل
testIncomeStatement()
  .then(() => {
    console.log('\n✅ انتهى اختبار قائمة الدخل');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل اختبار قائمة الدخل:', error);
    process.exit(1);
  });
