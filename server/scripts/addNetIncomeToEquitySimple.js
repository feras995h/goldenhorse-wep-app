import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Add Net Income to Equity - Simple Version
 * Updates existing equity account with net income
 */

console.log('💰 إضافة صافي الدخل لحقوق الملكية (النسخة المبسطة)');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(60));

async function addNetIncomeToEquitySimple() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // 1. Calculate current net income
    console.log('\n📊 1. حساب صافي الدخل الحالي...');
    const netIncome = await calculateNetIncome();
    
    if (netIncome === 0) {
      console.log('⚠️ صافي الدخل يساوي صفر - لا حاجة لتحديث');
      return;
    }
    
    // 2. Find existing equity account
    console.log('\n🏦 2. البحث عن حساب حقوق الملكية...');
    const equityAccount = await findEquityAccount();
    
    // 3. Update equity account balance
    console.log('\n🔄 3. تحديث رصيد حقوق الملكية...');
    await updateEquityBalance(equityAccount, netIncome);
    
    // 4. Reset revenue and expense accounts
    console.log('\n🔄 4. إعادة تصفير حسابات الإيرادات والمصروفات...');
    await resetIncomeAccounts();
    
    // 5. Verify final balance
    console.log('\n⚖️ 5. التحقق من التوازن النهائي...');
    await verifyFinalBalance();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إضافة صافي الدخل لحقوق الملكية بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إضافة صافي الدخل:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function calculateNetIncome() {
  try {
    const [financialData] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type = 'revenue' THEN ABS(balance) ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses,
        COUNT(CASE WHEN type = 'revenue' THEN 1 END) as revenue_accounts,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_accounts
      FROM accounts
      WHERE type IN ('revenue', 'expense') AND "isActive" = true
    `);

    const data = financialData[0];
    const totalRevenue = parseFloat(data.total_revenue || 0);
    const totalExpenses = parseFloat(data.total_expenses || 0);
    const netIncome = totalRevenue - totalExpenses;

    console.log(`   💰 إجمالي الإيرادات: ${totalRevenue.toFixed(2)} د.ل (${data.revenue_accounts} حساب)`);
    console.log(`   💸 إجمالي المصروفات: ${totalExpenses.toFixed(2)} د.ل (${data.expense_accounts} حساب)`);
    console.log(`   📊 صافي الدخل: ${netIncome.toFixed(2)} د.ل`);

    return netIncome;

  } catch (error) {
    console.log(`   ❌ خطأ في حساب صافي الدخل: ${error.message}`);
    throw error;
  }
}

async function findEquityAccount() {
  try {
    // Find existing equity account
    const [equityAccounts] = await sequelize.query(`
      SELECT id, code, name, balance
      FROM accounts
      WHERE type = 'equity' AND "isActive" = true
      ORDER BY balance DESC
      LIMIT 1
    `);

    if (equityAccounts.length === 0) {
      throw new Error('لم يتم العثور على حساب حقوق ملكية');
    }

    const account = equityAccounts[0];
    console.log(`   ✅ تم العثور على حساب حقوق الملكية: ${account.code} - ${account.name}`);
    console.log(`   💰 الرصيد الحالي: ${parseFloat(account.balance || 0).toFixed(2)} د.ل`);
    
    return account;

  } catch (error) {
    console.log(`   ❌ خطأ في البحث عن حساب حقوق الملكية: ${error.message}`);
    throw error;
  }
}

async function updateEquityBalance(equityAccount, netIncome) {
  try {
    const currentBalance = parseFloat(equityAccount.balance || 0);
    const newBalance = currentBalance + netIncome;

    await sequelize.query(`
      UPDATE accounts 
      SET balance = ${newBalance}, "updatedAt" = NOW()
      WHERE id = '${equityAccount.id}'
    `);

    console.log(`   📊 الرصيد السابق: ${currentBalance.toFixed(2)} د.ل`);
    console.log(`   📈 صافي الدخل المضاف: ${netIncome.toFixed(2)} د.ل`);
    console.log(`   💰 الرصيد الجديد: ${newBalance.toFixed(2)} د.ل`);
    console.log(`   ✅ تم تحديث رصيد حقوق الملكية بنجاح`);

  } catch (error) {
    console.log(`   ❌ خطأ في تحديث رصيد حقوق الملكية: ${error.message}`);
    throw error;
  }
}

async function resetIncomeAccounts() {
  try {
    // Reset revenue accounts to zero
    const [revenueResult] = await sequelize.query(`
      UPDATE accounts 
      SET balance = 0, "updatedAt" = NOW()
      WHERE type = 'revenue' AND "isActive" = true
      RETURNING id
    `);
    console.log(`   📈 تم إعادة تصفير ${revenueResult.length} حساب إيرادات`);

    // Reset expense accounts to zero
    const [expenseResult] = await sequelize.query(`
      UPDATE accounts 
      SET balance = 0, "updatedAt" = NOW()
      WHERE type = 'expense' AND "isActive" = true
      RETURNING id
    `);
    console.log(`   📉 تم إعادة تصفير ${expenseResult.length} حساب مصروفات`);

    console.log('   ✅ تم إعادة تصفير جميع حسابات الإيرادات والمصروفات');

  } catch (error) {
    console.log(`   ❌ خطأ في إعادة تصفير الحسابات: ${error.message}`);
    throw error;
  }
}

async function verifyFinalBalance() {
  try {
    // Calculate totals after updates
    const [balanceData] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type = 'asset' THEN balance ELSE 0 END) as total_assets,
        SUM(CASE WHEN type = 'liability' THEN ABS(balance) ELSE 0 END) as total_liabilities,
        SUM(CASE WHEN type = 'equity' THEN ABS(balance) ELSE 0 END) as total_equity,
        SUM(CASE WHEN type = 'revenue' THEN ABS(balance) ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
      FROM accounts
      WHERE "isActive" = true
    `);

    const data = balanceData[0];
    const totalAssets = parseFloat(data.total_assets || 0);
    const totalLiabilities = parseFloat(data.total_liabilities || 0);
    const totalEquity = parseFloat(data.total_equity || 0);
    const totalRevenue = parseFloat(data.total_revenue || 0);
    const totalExpenses = parseFloat(data.total_expenses || 0);

    console.log('   📊 الميزانية النهائية:');
    console.log(`      🏢 إجمالي الأصول: ${totalAssets.toFixed(2)} د.ل`);
    console.log(`      📋 إجمالي الخصوم: ${totalLiabilities.toFixed(2)} د.ل`);
    console.log(`      👥 إجمالي حقوق الملكية: ${totalEquity.toFixed(2)} د.ل`);
    console.log(`      📈 إجمالي الإيرادات: ${totalRevenue.toFixed(2)} د.ل (يجب أن تكون 0)`);
    console.log(`      📉 إجمالي المصروفات: ${totalExpenses.toFixed(2)} د.ل (يجب أن تكون 0)`);

    // Check balance sheet equation: Assets = Liabilities + Equity
    const leftSide = totalAssets;
    const rightSide = totalLiabilities + totalEquity;
    const difference = Math.abs(leftSide - rightSide);
    const isBalanced = difference < 0.01;

    console.log(`\n   ⚖️ معادلة الميزانية:`);
    console.log(`      الأصول = الخصوم + حقوق الملكية`);
    console.log(`      ${leftSide.toFixed(2)} = ${totalLiabilities.toFixed(2)} + ${totalEquity.toFixed(2)}`);
    console.log(`      ${leftSide.toFixed(2)} = ${rightSide.toFixed(2)}`);
    console.log(`      الفرق: ${difference.toFixed(2)} د.ل`);
    console.log(`      متوازنة: ${isBalanced ? '✅ نعم' : '❌ لا'}`);

    // Check that revenue and expense accounts are closed
    const revenueExpenseClosed = totalRevenue === 0 && totalExpenses === 0;
    console.log(`   🔒 إقفال حسابات الإيرادات والمصروفات: ${revenueExpenseClosed ? '✅ مكتمل' : '❌ غير مكتمل'}`);

    if (isBalanced && revenueExpenseClosed) {
      console.log('\n   🎉 تم التحقق من صحة العمليات - الميزانية متوازنة والحسابات مقفلة!');
    } else {
      console.log('\n   ⚠️ هناك مشاكل في التوازن أو الإقفال تحتاج مراجعة');
    }

  } catch (error) {
    console.log(`   ❌ خطأ في التحقق من التوازن النهائي: ${error.message}`);
    throw error;
  }
}

// Run the script
addNetIncomeToEquitySimple();
