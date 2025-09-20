#!/usr/bin/env node

import { Sequelize } from 'sequelize';
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

async function testFinancialReports() {
  console.log('🔍 اختبار التقارير المالية...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص البيانات الأساسية
    console.log('\n📊 فحص البيانات الأساسية...');
    
    // فحص الحسابات
    const [accounts] = await sequelize.query(`
      SELECT COUNT(*) as count, type 
      FROM accounts 
      WHERE "isActive" = true 
      GROUP BY type
    `);
    
    console.log('الحسابات الموجودة:');
    let totalAccounts = 0;
    accounts.forEach(acc => {
      console.log(`   ${acc.type}: ${acc.count} حساب`);
      totalAccounts += parseInt(acc.count);
    });
    console.log(`   إجمالي الحسابات: ${totalAccounts}`);
    
    // فحص القيود
    const [entries] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE status = 'posted'
    `);
    console.log(`📋 القيود المرحلة: ${entries[0].count}`);
    
    // فحص تفاصيل القيود
    const [details] = await sequelize.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(debit), 0) as total_debit, 
        COALESCE(SUM(credit), 0) as total_credit 
      FROM journal_entry_details
    `);
    
    console.log(`📝 تفاصيل القيود: ${details[0].count} سطر`);
    console.log(`💰 إجمالي المدين: ${parseFloat(details[0].total_debit).toFixed(2)} LYD`);
    console.log(`💰 إجمالي الدائن: ${parseFloat(details[0].total_credit).toFixed(2)} LYD`);
    
    const balance = parseFloat(details[0].total_debit) - parseFloat(details[0].total_credit);
    console.log(`⚖️ التوازن: ${balance.toFixed(2)} LYD ${balance === 0 ? '✅' : '❌'}`);

    // 2. اختبار ميزان المراجعة
    console.log('\n📈 اختبار ميزان المراجعة...');
    
    const [trialBalance] = await sequelize.query(`
      SELECT 
        a.code,
        a.name,
        a.type,
        a.nature,
        COALESCE(a.balance, 0) as balance,
        CASE 
          WHEN a.nature = 'debit' AND a.balance > 0 THEN a.balance
          WHEN a.nature = 'credit' AND a.balance < 0 THEN ABS(a.balance)
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN a.nature = 'credit' AND a.balance > 0 THEN a.balance
          WHEN a.nature = 'debit' AND a.balance < 0 THEN ABS(a.balance)
          ELSE 0
        END as credit_balance
      FROM accounts a
      WHERE a."isActive" = true
      AND a.balance != 0
      ORDER BY a.code
    `);
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    console.log('ميزان المراجعة:');
    console.log('الكود | الحساب | النوع | المدين | الدائن');
    console.log('-----|--------|------|-------|-------');
    
    trialBalance.forEach(account => {
      const debit = parseFloat(account.debit_balance);
      const credit = parseFloat(account.credit_balance);
      totalDebit += debit;
      totalCredit += credit;
      
      console.log(`${account.code} | ${account.name.substring(0, 15)} | ${account.type} | ${debit.toFixed(2)} | ${credit.toFixed(2)}`);
    });
    
    console.log('-----|--------|------|-------|-------');
    console.log(`الإجمالي | | | ${totalDebit.toFixed(2)} | ${totalCredit.toFixed(2)}`);
    
    const trialBalanceDiff = totalDebit - totalCredit;
    console.log(`⚖️ توازن ميزان المراجعة: ${trialBalanceDiff.toFixed(2)} ${trialBalanceDiff === 0 ? '✅' : '❌'}`);

    // 3. اختبار الميزانية العمومية
    console.log('\n🏛️ اختبار الميزانية العمومية...');
    
    const [balanceSheet] = await sequelize.query(`
      SELECT 
        type,
        SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as positive_balance,
        SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as negative_balance,
        SUM(balance) as net_balance
      FROM accounts 
      WHERE "isActive" = true 
      AND type IN ('asset', 'liability', 'equity')
      GROUP BY type
    `);
    
    console.log('الميزانية العمومية:');
    console.log('النوع | الرصيد الموجب | الرصيد السالب | الرصيد الصافي');
    console.log('-----|-------------|-------------|------------');
    
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    
    balanceSheet.forEach(item => {
      const netBalance = parseFloat(item.net_balance);
      console.log(`${item.type} | ${parseFloat(item.positive_balance).toFixed(2)} | ${parseFloat(item.negative_balance).toFixed(2)} | ${netBalance.toFixed(2)}`);
      
      if (item.type === 'asset') totalAssets = netBalance;
      else if (item.type === 'liability') totalLiabilities = netBalance;
      else if (item.type === 'equity') totalEquity = netBalance;
    });
    
    console.log('-----|-------------|-------------|------------');
    console.log(`إجمالي الأصول: ${totalAssets.toFixed(2)}`);
    console.log(`إجمالي الخصوم: ${totalLiabilities.toFixed(2)}`);
    console.log(`إجمالي حقوق الملكية: ${totalEquity.toFixed(2)}`);
    
    const balanceSheetEquation = totalAssets - (totalLiabilities + totalEquity);
    console.log(`⚖️ المعادلة المحاسبية: ${balanceSheetEquation.toFixed(2)} ${Math.abs(balanceSheetEquation) < 0.01 ? '✅' : '❌'}`);

    // 4. اختبار التقارير الفورية
    console.log('\n⚡ اختبار التقارير الفورية...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // المقبوضات اليوم
    const [todayReceipts] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM receipts
      WHERE DATE("createdAt") = '${today}'
    `);

    // المدفوعات اليوم
    const [todayPayments] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE DATE("createdAt") = '${today}'
    `);

    // القيود اليوم
    const [todayEntries] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE DATE("createdAt") = '${today}'
    `);
    
    console.log(`📅 تقرير اليوم (${today}):`);
    console.log(`   المقبوضات: ${parseFloat(todayReceipts[0].total).toFixed(2)} LYD`);
    console.log(`   المدفوعات: ${parseFloat(todayPayments[0].total).toFixed(2)} LYD`);
    console.log(`   القيود الجديدة: ${todayEntries[0].count}`);
    
    const netCashFlow = parseFloat(todayReceipts[0].total) - parseFloat(todayPayments[0].total);
    console.log(`   صافي التدفق النقدي: ${netCashFlow.toFixed(2)} LYD`);

    // 5. الملخص النهائي
    console.log('\n📋 ملخص اختبار التقارير:');
    
    const tests = [
      { name: 'اتصال قاعدة البيانات', status: '✅ نجح' },
      { name: 'البيانات الأساسية', status: totalAccounts > 0 ? '✅ نجح' : '❌ فشل' },
      { name: 'توازن القيود', status: balance === 0 ? '✅ نجح' : '❌ فشل' },
      { name: 'ميزان المراجعة', status: Math.abs(trialBalanceDiff) < 0.01 ? '✅ نجح' : '❌ فشل' },
      { name: 'الميزانية العمومية', status: Math.abs(balanceSheetEquation) < 0.01 ? '✅ نجح' : '❌ فشل' },
      { name: 'التقارير الفورية', status: '✅ نجح' }
    ];
    
    tests.forEach(test => {
      console.log(`   ${test.name}: ${test.status}`);
    });
    
    const passedTests = tests.filter(t => t.status.includes('✅')).length;
    console.log(`\n🎯 النتيجة: ${passedTests}/${tests.length} اختبار نجح`);
    
    if (passedTests === tests.length) {
      console.log('🎉 جميع التقارير تعمل بشكل صحيح!');
    } else {
      console.log('⚠️ بعض التقارير تحتاج مراجعة');
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار التقارير:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل اختبار التقارير
testFinancialReports()
  .then(() => {
    console.log('\n✅ انتهى اختبار التقارير');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل اختبار التقارير:', error);
    process.exit(1);
  });
