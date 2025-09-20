import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Add Net Income to Equity - Closing Entry Script
 * Creates closing entries to transfer net income to retained earnings
 */

console.log('💰 إضافة صافي الدخل لحقوق الملكية');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(60));

async function addNetIncomeToEquity() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // 1. Calculate current net income
    console.log('\n📊 1. حساب صافي الدخل الحالي...');
    const netIncome = await calculateNetIncome();
    
    // 2. Find or create retained earnings account
    console.log('\n🏦 2. البحث عن حساب الأرباح المحتجزة أو إنشاؤه...');
    const retainedEarningsAccount = await findOrCreateRetainedEarningsAccount();
    
    // 3. Create closing entries
    console.log('\n📝 3. إنشاء قيود الإقفال...');
    await createClosingEntries(netIncome, retainedEarningsAccount);
    
    // 4. Update account balances
    console.log('\n🔄 4. تحديث أرصدة الحسابات...');
    await updateAccountBalances(netIncome, retainedEarningsAccount);
    
    // 5. Verify balance sheet equation
    console.log('\n⚖️ 5. التحقق من معادلة الميزانية...');
    await verifyBalanceSheetEquation();

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
    // Get revenue and expense accounts
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

    if (netIncome === 0) {
      console.log('   ⚠️ صافي الدخل يساوي صفر - لا حاجة لقيود إقفال');
      return 0;
    }

    return netIncome;

  } catch (error) {
    console.log(`   ❌ خطأ في حساب صافي الدخل: ${error.message}`);
    throw error;
  }
}

async function findOrCreateRetainedEarningsAccount() {
  try {
    // First, try to find existing retained earnings account
    const [existingAccount] = await sequelize.query(`
      SELECT id, code, name, balance
      FROM accounts
      WHERE (
        name ILIKE '%أرباح محتجزة%' OR 
        name ILIKE '%retained earnings%' OR
        name ILIKE '%أرباح مرحلة%' OR
        code LIKE '3.2%' OR
        code = '3-2'
      ) AND type = 'equity' AND "isActive" = true
      LIMIT 1
    `);

    if (existingAccount.length > 0) {
      const account = existingAccount[0];
      console.log(`   ✅ تم العثور على حساب الأرباح المحتجزة: ${account.code} - ${account.name}`);
      console.log(`   💰 الرصيد الحالي: ${parseFloat(account.balance || 0).toFixed(2)} د.ل`);
      return account;
    }

    // If not found, create new retained earnings account
    console.log('   🆕 إنشاء حساب أرباح محتجزة جديد...');

    // Find next available code in equity section
    const [maxCode] = await sequelize.query(`
      SELECT code
      FROM accounts
      WHERE type = 'equity' AND code LIKE '3.%'
      ORDER BY code DESC
      LIMIT 1
    `);

    let newCode = '3.2';
    if (maxCode.length > 0) {
      const lastCode = maxCode[0].code;
      const parts = lastCode.split('.');
      if (parts.length >= 2) {
        const nextNum = parseInt(parts[1]) + 1;
        newCode = `3.${nextNum}`;
      }
    }

    const [newAccount] = await sequelize.query(`
      INSERT INTO accounts (
        id, code, name, "nameEn", type, "rootType", "reportType", 
        "accountCategory", "parentId", level, "isGroup", "isActive", 
        "freezeAccount", balance, currency, description, "accountType", 
        nature, "isSystemAccount", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        '${newCode}',
        'الأرباح المحتجزة',
        'Retained Earnings',
        'equity',
        'equity',
        'balance_sheet',
        'equity',
        (SELECT id FROM accounts WHERE code = '3' LIMIT 1),
        2,
        false,
        true,
        false,
        0.00,
        'LYD',
        'حساب الأرباح المحتجزة - يحتوي على صافي الدخل المتراكم',
        'equity',
        'credit',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, code, name, balance
    `);

    const account = newAccount[0];
    console.log(`   ✅ تم إنشاء حساب الأرباح المحتجزة: ${account.code} - ${account.name}`);
    return account;

  } catch (error) {
    console.log(`   ❌ خطأ في إنشاء حساب الأرباح المحتجزة: ${error.message}`);
    throw error;
  }
}

async function createClosingEntries(netIncome, retainedEarningsAccount) {
  try {
    if (netIncome === 0) {
      console.log('   ⚠️ لا حاجة لقيود إقفال - صافي الدخل يساوي صفر');
      return;
    }

    // Generate voucher number
    const voucherNo = `CE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const currentDate = new Date().toISOString().split('T')[0];

    console.log(`   📝 إنشاء قيد الإقفال رقم: ${voucherNo}`);

    // Create closing entries for revenue accounts
    const [revenueAccounts] = await sequelize.query(`
      SELECT id, code, name, balance
      FROM accounts
      WHERE type = 'revenue' AND "isActive" = true AND balance != 0
    `);

    console.log(`   📈 إقفال ${revenueAccounts.length} حساب إيرادات`);

    for (const account of revenueAccounts) {
      const balance = Math.abs(parseFloat(account.balance || 0));
      if (balance > 0) {
        // Debit revenue account (to close it)
        await sequelize.query(`
          INSERT INTO gl_entries (
            id, "postingDate", "accountId", debit, credit, 
            "voucherType", "voucherNo", remarks, currency, 
            "exchangeRate", "createdBy", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(), '${currentDate}', '${account.id}', ${balance}, 0,
            'Closing Entry', '${voucherNo}', 'إقفال حساب ${account.name}', 'LYD',
            1.0, 'system', NOW(), NOW()
          )
        `);
        console.log(`      📊 ${account.code}: ${balance.toFixed(2)} د.ل (مدين)`);
      }
    }

    // Create closing entries for expense accounts
    const [expenseAccounts] = await sequelize.query(`
      SELECT id, code, name, balance
      FROM accounts
      WHERE type = 'expense' AND "isActive" = true AND balance != 0
    `);

    console.log(`   📉 إقفال ${expenseAccounts.length} حساب مصروفات`);

    for (const account of expenseAccounts) {
      const balance = parseFloat(account.balance || 0);
      if (balance > 0) {
        // Credit expense account (to close it)
        await sequelize.query(`
          INSERT INTO gl_entries (
            id, "postingDate", "accountId", debit, credit, 
            "voucherType", "voucherNo", remarks, currency, 
            "exchangeRate", "createdBy", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(), '${currentDate}', '${account.id}', 0, ${balance},
            'Closing Entry', '${voucherNo}', 'إقفال حساب ${account.name}', 'LYD',
            1.0, 'system', NOW(), NOW()
          )
        `);
        console.log(`      📊 ${account.code}: ${balance.toFixed(2)} د.ل (دائن)`);
      }
    }

    // Create entry for retained earnings
    if (netIncome > 0) {
      // Credit retained earnings (increase equity)
      await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "accountId", debit, credit, 
          "voucherType", "voucherNo", remarks, currency, 
          "exchangeRate", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), '${currentDate}', '${retainedEarningsAccount.id}', 0, ${netIncome},
          'Closing Entry', '${voucherNo}', 'تحويل صافي الدخل للأرباح المحتجزة', 'LYD',
          1.0, 'system', NOW(), NOW()
        )
      `);
      console.log(`   💰 الأرباح المحتجزة: ${netIncome.toFixed(2)} د.ل (دائن)`);
    } else {
      // Debit retained earnings (decrease equity)
      await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "accountId", debit, credit, 
          "voucherType", "voucherNo", remarks, currency, 
          "exchangeRate", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), '${currentDate}', '${retainedEarningsAccount.id}', ${Math.abs(netIncome)}, 0,
          'Closing Entry', '${voucherNo}', 'تحويل صافي الخسارة من الأرباح المحتجزة', 'LYD',
          1.0, 'system', NOW(), NOW()
        )
      `);
      console.log(`   📉 الأرباح المحتجزة: ${Math.abs(netIncome).toFixed(2)} د.ل (مدين)`);
    }

    console.log(`   ✅ تم إنشاء قيد الإقفال بنجاح`);

  } catch (error) {
    console.log(`   ❌ خطأ في إنشاء قيود الإقفال: ${error.message}`);
    throw error;
  }
}

async function updateAccountBalances(netIncome, retainedEarningsAccount) {
  try {
    if (netIncome === 0) {
      console.log('   ⚠️ لا حاجة لتحديث الأرصدة - صافي الدخل يساوي صفر');
      return;
    }

    // Reset revenue accounts to zero
    await sequelize.query(`
      UPDATE accounts 
      SET balance = 0, "updatedAt" = NOW()
      WHERE type = 'revenue' AND "isActive" = true
    `);
    console.log('   📈 تم إعادة تصفير أرصدة حسابات الإيرادات');

    // Reset expense accounts to zero
    await sequelize.query(`
      UPDATE accounts 
      SET balance = 0, "updatedAt" = NOW()
      WHERE type = 'expense' AND "isActive" = true
    `);
    console.log('   📉 تم إعادة تصفير أرصدة حسابات المصروفات');

    // Update retained earnings account
    const newRetainedEarningsBalance = parseFloat(retainedEarningsAccount.balance || 0) + netIncome;
    await sequelize.query(`
      UPDATE accounts 
      SET balance = ${newRetainedEarningsBalance}, "updatedAt" = NOW()
      WHERE id = '${retainedEarningsAccount.id}'
    `);
    console.log(`   💰 تم تحديث رصيد الأرباح المحتجزة: ${newRetainedEarningsBalance.toFixed(2)} د.ل`);

    console.log('   ✅ تم تحديث جميع أرصدة الحسابات بنجاح');

  } catch (error) {
    console.log(`   ❌ خطأ في تحديث أرصدة الحسابات: ${error.message}`);
    throw error;
  }
}

async function verifyBalanceSheetEquation() {
  try {
    // Calculate totals after closing entries
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

    console.log('   📊 الميزانية بعد قيود الإقفال:');
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
    console.log(`   ❌ خطأ في التحقق من معادلة الميزانية: ${error.message}`);
    throw error;
  }
}

// Run the script
addNetIncomeToEquity();
