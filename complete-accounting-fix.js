import { Client } from 'pg';

/**
 * الإصلاح الكامل والنهائي لمعادلة المحاسبة
 * يضيف صافي الربح لحقوق الملكية لتوازن المعادلة
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function completeAccountingFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // خطوة 1: حساب صافي الربح
    console.log('📊 خطوة 1: حساب صافي الربح');
    const profitLossCalc = await client.query(`
      SELECT 
        SUM(CASE WHEN type = 'revenue' THEN balance ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
      FROM accounts 
      WHERE type IN ('revenue', 'expense') AND "isActive" = true;
    `);

    const revenue = parseFloat(profitLossCalc.rows[0].total_revenue) || 0;
    const expenses = parseFloat(profitLossCalc.rows[0].total_expenses) || 0;
    const netIncome = revenue - expenses;

    console.log(`   الإيرادات: ${revenue.toFixed(2)} LYD`);
    console.log(`   المصروفات: ${expenses.toFixed(2)} LYD`);
    console.log(`   صافي الربح: ${netIncome.toFixed(2)} LYD`);

    if (Math.abs(netIncome) > 0.01) {
      console.log('\n🔧 خطوة 2: إضافة صافي الربح لحقوق الملكية');
      
      // البحث عن حساب الأرباح المحتجزة أو إنشاؤه
      let retainedEarningsAccount = await client.query(`
        SELECT id, code, name FROM accounts 
        WHERE (name LIKE '%أرباح محتجزة%' OR name LIKE '%retained%' OR code LIKE '3.2%')
        AND type = 'equity' AND "isActive" = true 
        LIMIT 1;
      `);

      let retainedEarningsId;
      if (retainedEarningsAccount.rows.length === 0) {
        // إنشاء حساب الأرباح المحتجزة
        const nextCode = await client.query(`
          SELECT COALESCE(
            '3.2.' || LPAD((
              COALESCE(
                MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0
              ) + 1
            )::TEXT, 1, '0'),
            '3.2.1'
          ) as next_code
          FROM accounts 
          WHERE code ~ '^3\.2\.[0-9]+$';
        `);

        const newCode = nextCode.rows[0].next_code;
        console.log(`   إنشاء حساب الأرباح المحتجزة بالكود: ${newCode}`);

        const newAccount = await client.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType",
            level, "isGroup", "isActive", balance, currency, nature,
            "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 
            'Equity', 'Balance Sheet', 3, false, true, 0, 'LYD', 'credit', NOW(), NOW()
          ) RETURNING id, code, name;
        `, [newCode]);
        
        retainedEarningsId = newAccount.rows[0].id;
        console.log(`   ✅ تم إنشاء حساب: ${newAccount.rows[0].name} (${newAccount.rows[0].code})`);
      } else {
        retainedEarningsId = retainedEarningsAccount.rows[0].id;
        console.log(`   استخدام حساب موجود: ${retainedEarningsAccount.rows[0].name}`);
      }

      // إضافة قيد لنقل صافي الربح لحقوق الملكية
      console.log('   إضافة قيد نقل صافي الربح...');
      
      if (netIncome > 0) {
        // ربح - نقل من الإيرادات والمصروفات للأرباح المحتجزة
        
        // إقفال حسابات الإيرادات (من دائن إلى مدين)
        const revenueAccounts = await client.query(`
          SELECT id, balance FROM accounts 
          WHERE type = 'revenue' AND "isActive" = true AND ABS(balance) > 0.01;
        `);

        for (const account of revenueAccounts.rows) {
          const balance = parseFloat(account.balance);
          if (Math.abs(balance) > 0.01) {
            await client.query(`
              INSERT INTO gl_entries (
                id, "accountId", debit, credit, remarks,
                "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
              ) VALUES (
                uuid_generate_v4(), $1, $2, 0, 'إقفال حساب الإيرادات',
                'CL000001', 'Journal Entry', CURRENT_DATE, 
                '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
              )
            `, [account.id, Math.abs(balance)]);
          }
        }

        // إقفال حسابات المصروفات (من مدين إلى دائن)
        const expenseAccounts = await client.query(`
          SELECT id, balance FROM accounts 
          WHERE type = 'expense' AND "isActive" = true AND ABS(balance) > 0.01;
        `);

        for (const account of expenseAccounts.rows) {
          const balance = parseFloat(account.balance);
          if (Math.abs(balance) > 0.01) {
            await client.query(`
              INSERT INTO gl_entries (
                id, "accountId", debit, credit, remarks,
                "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
              ) VALUES (
                uuid_generate_v4(), $1, 0, $2, 'إقفال حساب المصروفات',
                'CL000001', 'Journal Entry', CURRENT_DATE, 
                '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
              )
            `, [account.id, Math.abs(balance)]);
          }
        }

        // إضافة صافي الربح للأرباح المحتجزة (دائن)
        await client.query(`
          INSERT INTO gl_entries (
            id, "accountId", debit, credit, remarks,
            "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, 0, $2, 'نقل صافي الربح للأرباح المحتجزة',
            'CL000001', 'Journal Entry', CURRENT_DATE, 
            '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
          )
        `, [retainedEarningsId, netIncome]);

        console.log(`   ✅ تم نقل صافي الربح: ${netIncome.toFixed(2)} LYD`);
      }
    }

    // خطوة 3: إعادة حساب جميع الأرصدة
    console.log('\n🔧 خطوة 3: إعادة حساب جميع الأرصدة');
    await client.query(`
      UPDATE accounts 
      SET balance = COALESCE(calculated_balance.new_balance, 0),
          "updatedAt" = NOW()
      FROM (
        SELECT 
          "accountId",
          CASE 
            WHEN accounts.nature = 'debit' THEN SUM(gl_entries.debit) - SUM(gl_entries.credit)
            ELSE SUM(gl_entries.credit) - SUM(gl_entries.debit)
          END as new_balance
        FROM gl_entries
        JOIN accounts ON accounts.id = gl_entries."accountId"
        GROUP BY "accountId", accounts.nature
      ) as calculated_balance
      WHERE accounts.id = calculated_balance."accountId";
    `);
    console.log('✅ تم إعادة حساب جميع الأرصدة');

    // خطوة 4: التحقق النهائي الشامل
    console.log('\n📊 التحقق النهائي الشامل');
    
    const finalBalances = await client.query(`
      SELECT 
        type,
        COUNT(*) as account_count,
        SUM(balance) as total_balance
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type;
    `);

    let finalAssets = 0, finalLiabilities = 0, finalEquity = 0;
    let finalRevenue = 0, finalExpenses = 0;
    
    console.log('   الأرصدة النهائية بالتفصيل:');
    finalBalances.rows.forEach(row => {
      const balance = parseFloat(row.total_balance) || 0;
      console.log(`   - ${row.type}: ${row.account_count} حساب، إجمالي: ${balance.toFixed(2)} LYD`);
      
      switch(row.type) {
        case 'asset': finalAssets = balance; break;
        case 'liability': finalLiabilities = balance; break;
        case 'equity': finalEquity = balance; break;
        case 'revenue': finalRevenue = balance; break;
        case 'expense': finalExpenses = balance; break;
      }
    });

    // حساب معادلة المحاسبة
    const leftSide = finalAssets;
    const rightSide = finalLiabilities + finalEquity;
    const equationDifference = leftSide - rightSide;

    console.log(`\n   📊 معادلة المحاسبة:`);
    console.log(`   الأصول = الالتزامات + حقوق الملكية`);
    console.log(`   ${finalAssets.toFixed(2)} = ${finalLiabilities.toFixed(2)} + ${finalEquity.toFixed(2)}`);
    console.log(`   ${leftSide.toFixed(2)} = ${rightSide.toFixed(2)}`);
    console.log(`   الفرق: ${equationDifference.toFixed(2)} LYD`);

    // التحقق من ميزان المراجعة
    const trialBalance = await client.query(`
      SELECT 
        SUM(debit) as total_debits,
        SUM(credit) as total_credits,
        SUM(debit) - SUM(credit) as difference,
        COUNT(*) as total_entries
      FROM gl_entries;
    `);

    const tbStats = trialBalance.rows[0];
    console.log(`\n   📊 ميزان المراجعة:`);
    console.log(`   - عدد القيود: ${tbStats.total_entries}`);
    console.log(`   - إجمالي المدين: ${parseFloat(tbStats.total_debits).toFixed(2)} LYD`);
    console.log(`   - إجمالي الدائن: ${parseFloat(tbStats.total_credits).toFixed(2)} LYD`);
    console.log(`   - الفرق: ${parseFloat(tbStats.difference).toFixed(2)} LYD`);

    // النتيجة النهائية
    console.log('\n' + '='.repeat(70));
    
    const isEquationBalanced = Math.abs(equationDifference) < 0.01;
    const isTrialBalanceBalanced = Math.abs(parseFloat(tbStats.difference)) < 0.01;
    
    if (isEquationBalanced && isTrialBalanceBalanced) {
      console.log('🎉 تم إصلاح معادلة المحاسبة بنجاح تماماً!');
      console.log('✅ معادلة المحاسبة متوازنة بشكل مثالي');
      console.log('✅ ميزان المراجعة متوازن بشكل مثالي');
      console.log('✅ جميع القيود صحيحة ومتوازنة');
      console.log('✅ النظام المحاسبي سليم 100%');
    } else {
      console.log('⚠️  تحذير: هناك مشاكل متبقية:');
      if (!isEquationBalanced) {
        console.log(`   ❌ معادلة المحاسبة غير متوازنة (فرق: ${equationDifference.toFixed(2)} LYD)`);
      }
      if (!isTrialBalanceBalanced) {
        console.log(`   ❌ ميزان المراجعة غير متوازن (فرق: ${parseFloat(tbStats.difference).toFixed(2)} LYD)`);
      }
    }
    
    console.log('='.repeat(70));

    return {
      isEquationBalanced,
      isTrialBalanceBalanced,
      equationDifference,
      trialBalanceDifference: parseFloat(tbStats.difference),
      finalAssets,
      finalLiabilities,
      finalEquity
    };

  } catch (error) {
    console.error('❌ خطأ في الإصلاح الكامل:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل الإصلاح
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('complete-accounting-fix.js')) {
  console.log('🔧 بدء الإصلاح الكامل والنهائي لمعادلة المحاسبة...');
  completeAccountingFix()
    .then((result) => {
      if (result.isEquationBalanced && result.isTrialBalanceBalanced) {
        console.log('\n🎉 تم إكمال الإصلاح بنجاح تام - النظام المحاسبي سليم!');
        process.exit(0);
      } else {
        console.log('\n⚠️  تم إكمال الإصلاح مع وجود مشاكل متبقية');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 فشل في الإصلاح الكامل:', error.message);
      process.exit(1);
    });
}

export { completeAccountingFix };
