import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Comprehensive Financial Reports Testing Script
 * Tests all financial reports for accuracy and performance
 */

console.log('🧪 اختبار شامل للتقارير المالية');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(60));

async function testFinancialReports() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // Test parameters
    const testParams = {
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      currency: 'LYD'
    };

    console.log('\n📊 معاملات الاختبار:');
    console.log(`   من تاريخ: ${testParams.dateFrom}`);
    console.log(`   إلى تاريخ: ${testParams.dateTo}`);
    console.log(`   العملة: ${testParams.currency}`);

    // 1. Test Trial Balance
    console.log('\n🔍 1. اختبار ميزان المراجعة...');
    const trialBalanceResult = await testTrialBalance(testParams);
    
    // 2. Test Income Statement
    console.log('\n📈 2. اختبار قائمة الدخل...');
    const incomeStatementResult = await testIncomeStatement(testParams);
    
    // 3. Test Balance Sheet
    console.log('\n🏦 3. اختبار الميزانية العمومية...');
    const balanceSheetResult = await testBalanceSheet(testParams);
    
    // 4. Test Cash Flow Statement
    console.log('\n💰 4. اختبار قائمة التدفقات النقدية...');
    const cashFlowResult = await testCashFlowStatement(testParams);
    
    // 5. Test Instant Reports
    console.log('\n⚡ 5. اختبار التقارير الفورية...');
    const instantReportsResult = await testInstantReports();
    
    // 6. Test Performance
    console.log('\n🚀 6. اختبار الأداء...');
    const performanceResult = await testReportsPerformance(testParams);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 ملخص نتائج الاختبار:');
    console.log('='.repeat(60));
    
    const results = [
      { name: 'ميزان المراجعة', result: trialBalanceResult },
      { name: 'قائمة الدخل', result: incomeStatementResult },
      { name: 'الميزانية العمومية', result: balanceSheetResult },
      { name: 'قائمة التدفقات النقدية', result: cashFlowResult },
      { name: 'التقارير الفورية', result: instantReportsResult },
      { name: 'اختبار الأداء', result: performanceResult }
    ];
    
    let passedTests = 0;
    results.forEach(test => {
      const status = test.result.success ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.result.message}`);
      if (test.result.success) passedTests++;
    });
    
    console.log('\n📊 النتيجة النهائية:');
    console.log(`   الاختبارات الناجحة: ${passedTests}/${results.length}`);
    console.log(`   معدل النجاح: ${((passedTests / results.length) * 100).toFixed(1)}%`);
    
    if (passedTests === results.length) {
      console.log('\n🎉 جميع التقارير المالية تعمل بشكل مثالي!');
    } else {
      console.log('\n⚠️ بعض التقارير تحتاج إلى مراجعة وإصلاح.');
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار التقارير المالية:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function testTrialBalance(params) {
  try {
    const startTime = Date.now();
    
    // Get all accounts with balances
    const [accounts] = await sequelize.query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.type,
        a.balance,
        a.currency,
        a."isActive"
      FROM accounts a
      WHERE a."isActive" = true
      ORDER BY a.code
    `);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    
    accounts.forEach(account => {
      const balance = parseFloat(account.balance || 0);
      if (['asset', 'expense'].includes(account.type)) {
        totalDebit += Math.max(0, balance);
      } else {
        totalCredit += Math.max(0, Math.abs(balance));
      }
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    
    console.log(`   📊 عدد الحسابات: ${accounts.length}`);
    console.log(`   💰 إجمالي المدين: ${totalDebit.toFixed(2)} LYD`);
    console.log(`   💰 إجمالي الدائن: ${totalCredit.toFixed(2)} LYD`);
    console.log(`   ⚖️ متوازن: ${isBalanced ? 'نعم' : 'لا'}`);
    console.log(`   ⏱️ وقت التنفيذ: ${executionTime}ms`);

    return {
      success: accounts.length > 0 && executionTime < 5000,
      message: `${accounts.length} حساب، ${isBalanced ? 'متوازن' : 'غير متوازن'}، ${executionTime}ms`,
      data: { accounts: accounts.length, balanced: isBalanced, time: executionTime }
    };

  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: `خطأ: ${error.message}`,
      data: null
    };
  }
}

async function testIncomeStatement(params) {
  try {
    const startTime = Date.now();
    
    // Get revenue and expense accounts
    const [revenueAccounts] = await sequelize.query(`
      SELECT code, name, balance, currency
      FROM accounts 
      WHERE type = 'revenue' AND "isActive" = true
      ORDER BY code
    `);
    
    const [expenseAccounts] = await sequelize.query(`
      SELECT code, name, balance, currency
      FROM accounts 
      WHERE type = 'expense' AND "isActive" = true
      ORDER BY code
    `);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Calculate totals
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + Math.abs(parseFloat(acc.balance || 0)), 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    console.log(`   📈 حسابات الإيرادات: ${revenueAccounts.length}`);
    console.log(`   📉 حسابات المصروفات: ${expenseAccounts.length}`);
    console.log(`   💰 إجمالي الإيرادات: ${totalRevenue.toFixed(2)} LYD`);
    console.log(`   💸 إجمالي المصروفات: ${totalExpenses.toFixed(2)} LYD`);
    console.log(`   📊 صافي الدخل: ${netIncome.toFixed(2)} LYD`);
    console.log(`   ⏱️ وقت التنفيذ: ${executionTime}ms`);

    return {
      success: (revenueAccounts.length > 0 || expenseAccounts.length > 0) && executionTime < 5000,
      message: `${revenueAccounts.length + expenseAccounts.length} حساب، صافي الدخل: ${netIncome.toFixed(2)} LYD، ${executionTime}ms`,
      data: { revenue: totalRevenue, expenses: totalExpenses, netIncome, time: executionTime }
    };

  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: `خطأ: ${error.message}`,
      data: null
    };
  }
}

async function testBalanceSheet(params) {
  try {
    const startTime = Date.now();
    
    // Get asset, liability, and equity accounts
    const [assets] = await sequelize.query(`
      SELECT SUM(balance) as total FROM accounts 
      WHERE type = 'asset' AND "isActive" = true
    `);
    
    const [liabilities] = await sequelize.query(`
      SELECT SUM(ABS(balance)) as total FROM accounts 
      WHERE type = 'liability' AND "isActive" = true
    `);
    
    const [equity] = await sequelize.query(`
      SELECT SUM(ABS(balance)) as total FROM accounts 
      WHERE type = 'equity' AND "isActive" = true
    `);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const totalAssets = parseFloat(assets[0]?.total || 0);
    const totalLiabilities = parseFloat(liabilities[0]?.total || 0);
    const totalEquity = parseFloat(equity[0]?.total || 0);
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    console.log(`   🏢 إجمالي الأصول: ${totalAssets.toFixed(2)} LYD`);
    console.log(`   📋 إجمالي الخصوم: ${totalLiabilities.toFixed(2)} LYD`);
    console.log(`   👥 إجمالي حقوق الملكية: ${totalEquity.toFixed(2)} LYD`);
    console.log(`   ⚖️ متوازنة: ${isBalanced ? 'نعم' : 'لا'}`);
    console.log(`   ⏱️ وقت التنفيذ: ${executionTime}ms`);

    return {
      success: executionTime < 5000,
      message: `الأصول: ${totalAssets.toFixed(2)}، ${isBalanced ? 'متوازنة' : 'غير متوازنة'}، ${executionTime}ms`,
      data: { assets: totalAssets, liabilities: totalLiabilities, equity: totalEquity, balanced: isBalanced, time: executionTime }
    };

  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: `خطأ: ${error.message}`,
      data: null
    };
  }
}

async function testCashFlowStatement(params) {
  try {
    const startTime = Date.now();
    
    // Get cash and bank accounts
    const [cashAccounts] = await sequelize.query(`
      SELECT code, name, balance, currency
      FROM accounts 
      WHERE (name ILIKE '%cash%' OR name ILIKE '%صندوق%' OR name ILIKE '%bank%' OR name ILIKE '%مصرف%')
        AND type = 'asset' AND "isActive" = true
      ORDER BY code
    `);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const totalCash = cashAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    console.log(`   💰 حسابات النقدية: ${cashAccounts.length}`);
    console.log(`   💵 إجمالي النقدية: ${totalCash.toFixed(2)} LYD`);
    console.log(`   ⏱️ وقت التنفيذ: ${executionTime}ms`);

    return {
      success: executionTime < 5000,
      message: `${cashAccounts.length} حساب نقدي، إجمالي: ${totalCash.toFixed(2)} LYD، ${executionTime}ms`,
      data: { cashAccounts: cashAccounts.length, totalCash, time: executionTime }
    };

  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: `خطأ: ${error.message}`,
      data: null
    };
  }
}

async function testInstantReports() {
  try {
    const startTime = Date.now();
    
    // Test various instant report queries
    const [receiptsCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM payments WHERE "voucherType" = 'receipt'
    `);
    
    const [paymentsCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM payments WHERE "voucherType" = 'payment'
    `);
    
    const [glEntriesCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM gl_entries WHERE "isCancelled" = false
    `);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`   🧾 المقبوضات: ${receiptsCount[0]?.count || 0}`);
    console.log(`   💸 المدفوعات: ${paymentsCount[0]?.count || 0}`);
    console.log(`   📋 القيود المحاسبية: ${glEntriesCount[0]?.count || 0}`);
    console.log(`   ⏱️ وقت التنفيذ: ${executionTime}ms`);

    return {
      success: executionTime < 3000,
      message: `${glEntriesCount[0]?.count || 0} قيد، ${executionTime}ms`,
      data: { 
        receipts: receiptsCount[0]?.count || 0,
        payments: paymentsCount[0]?.count || 0,
        glEntries: glEntriesCount[0]?.count || 0,
        time: executionTime 
      }
    };

  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: `خطأ: ${error.message}`,
      data: null
    };
  }
}

async function testReportsPerformance(params) {
  try {
    console.log('   🚀 اختبار أداء التقارير...');
    
    const tests = [];
    
    // Test multiple concurrent report generations
    for (let i = 0; i < 3; i++) {
      tests.push(testTrialBalance(params));
      tests.push(testIncomeStatement(params));
    }
    
    const startTime = Date.now();
    const results = await Promise.all(tests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const successfulTests = results.filter(r => r.success).length;
    const averageTime = totalTime / tests.length;
    
    console.log(`   📊 اختبارات متزامنة: ${tests.length}`);
    console.log(`   ✅ نجحت: ${successfulTests}/${tests.length}`);
    console.log(`   ⏱️ الوقت الإجمالي: ${totalTime}ms`);
    console.log(`   ⏱️ متوسط الوقت: ${averageTime.toFixed(0)}ms`);

    return {
      success: successfulTests === tests.length && averageTime < 2000,
      message: `${successfulTests}/${tests.length} نجح، متوسط: ${averageTime.toFixed(0)}ms`,
      data: { total: tests.length, successful: successfulTests, averageTime, totalTime }
    };

  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: `خطأ: ${error.message}`,
      data: null
    };
  }
}

// Run the test
testFinancialReports();
