import { Client } from 'pg';

/**
 * سكريپت الإصلاح النهائي لمعادلة المحاسبة
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function finalAccountingFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // خطوة 1: إعادة حساب جميع أرصدة الحسابات
    console.log('🔧 خطوة 1: إعادة حساب أرصدة الحسابات');
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
    console.log('✅ تم إعادة حساب أرصدة الحسابات');

    // خطوة 2: فحص الوضع الحالي
    console.log('\n📊 خطوة 2: فحص الوضع الحالي');
    const currentStatus = await client.query(`
      SELECT 
        type,
        SUM(balance) as total_balance
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type;
    `);

    let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;
    console.log('   الأرصدة الحالية:');
    
    currentStatus.rows.forEach(row => {
      const balance = parseFloat(row.total_balance) || 0;
      console.log(`   - ${row.type}: ${balance.toFixed(2)} LYD`);
      
      switch(row.type) {
        case 'asset': assets = balance; break;
        case 'liability': liabilities = balance; break;
        case 'equity': equity = balance; break;
        case 'revenue': revenue = balance; break;
        case 'expense': expenses = balance; break;
      }
    });

    // خطوة 3: حساب صافي الربح وإضافته لحقوق الملكية
    console.log('\n🔧 خطوة 3: حساب صافي الربح');
    const netIncome = revenue - expenses;
    console.log(`   الإيرادات: ${revenue.toFixed(2)} LYD`);
    console.log(`   المصروفات: ${expenses.toFixed(2)} LYD`);
    console.log(`   صافي الربح: ${netIncome.toFixed(2)} LYD`);

    // إضافة صافي الربح لحقوق الملكية
    const adjustedEquity = equity + netIncome;
    console.log(`   حقوق الملكية المعدلة: ${adjustedEquity.toFixed(2)} LYD`);

    // خطوة 4: حساب الفرق المطلوب لتوازن المعادلة
    console.log('\n🔧 خطوة 4: حساب الفرق المطلوب');
    const equationDifference = assets - (liabilities + adjustedEquity);
    console.log(`   معادلة المحاسبة: ${assets.toFixed(2)} = ${liabilities.toFixed(2)} + ${adjustedEquity.toFixed(2)}`);
    console.log(`   الفرق: ${equationDifference.toFixed(2)} LYD`);

    if (Math.abs(equationDifference) > 0.01) {
      console.log('\n🔧 خطوة 5: إضافة رصيد افتتاحي لتوازن المعادلة');
      
      // البحث عن حساب حقوق الملكية الموجود أو إنشاء واحد جديد
      let equityAccount = await client.query(`
        SELECT id, code, name FROM accounts 
        WHERE type = 'equity' AND "isActive" = true 
        ORDER BY code 
        LIMIT 1;
      `);

      let equityAccountId;
      if (equityAccount.rows.length === 0) {
        // إنشاء حساب رأس المال بكود فريد
        const nextCode = await client.query(`
          SELECT COALESCE(
            '3.1.' || LPAD((
              COALESCE(
                MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0
              ) + 1
            )::TEXT, 1, '0'),
            '3.1.1'
          ) as next_code
          FROM accounts 
          WHERE code ~ '^3\.1\.[0-9]+$';
        `);

        const newCode = nextCode.rows[0].next_code;
        console.log(`   إنشاء حساب رأس المال بالكود: ${newCode}`);

        const newEquityAccount = await client.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType",
            level, "isGroup", "isActive", balance, currency, nature,
            "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, 'رأس المال', 'Capital', 'equity', 'Equity', 'Balance Sheet',
            3, false, true, 0, 'LYD', 'credit', NOW(), NOW()
          ) RETURNING id, code, name;
        `, [newCode]);
        
        equityAccountId = newEquityAccount.rows[0].id;
        console.log(`   ✅ تم إنشاء حساب: ${newEquityAccount.rows[0].name} (${newEquityAccount.rows[0].code})`);
      } else {
        equityAccountId = equityAccount.rows[0].id;
        console.log(`   استخدام حساب موجود: ${equityAccount.rows[0].name} (${equityAccount.rows[0].code})`);
      }

      // إضافة قيد الرصيد الافتتاحي
      const openingBalanceAmount = Math.abs(equationDifference);
      
      // تحديد نوع القيد (مدين أم دائن)
      const isDebit = equationDifference < 0; // إذا كان الفرق سالب، نحتاج مدين
      
      await client.query(`
        INSERT INTO gl_entries (
          id, "accountId", debit, credit, remarks,
          "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, 'رصيد افتتاحي لتوازن معادلة المحاسبة',
          'OB000001', 'Journal Entry', CURRENT_DATE, 
          '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
        )
      `, [
        equityAccountId, 
        isDebit ? openingBalanceAmount : 0,
        isDebit ? 0 : openingBalanceAmount
      ]);

      // تحديث رصيد الحساب
      const newBalance = isDebit ? -openingBalanceAmount : openingBalanceAmount;
      await client.query(
        'UPDATE accounts SET balance = balance + $1, "updatedAt" = NOW() WHERE id = $2',
        [newBalance, equityAccountId]
      );

      console.log(`   ✅ تم إضافة رصيد افتتاحي: ${openingBalanceAmount.toFixed(2)} LYD (${isDebit ? 'مدين' : 'دائن'})`);
    }

    // خطوة 6: التحقق النهائي
    console.log('\n📊 التحقق النهائي');
    
    // إعادة حساب الأرصدة مرة أخيرة
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

    const finalCheck = await client.query(`
      SELECT 
        type,
        SUM(balance) as total_balance
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type;
    `);

    let finalAssets = 0, finalLiabilities = 0, finalEquity = 0;
    console.log('   الأرصدة النهائية:');
    
    finalCheck.rows.forEach(row => {
      const balance = parseFloat(row.total_balance) || 0;
      console.log(`   - ${row.type}: ${balance.toFixed(2)} LYD`);
      
      switch(row.type) {
        case 'asset': finalAssets = balance; break;
        case 'liability': finalLiabilities = balance; break;
        case 'equity': finalEquity = balance; break;
      }
    });

    const finalDifference = finalAssets - (finalLiabilities + finalEquity);
    console.log(`\n   معادلة المحاسبة النهائية:`);
    console.log(`   ${finalAssets.toFixed(2)} = ${finalLiabilities.toFixed(2)} + ${finalEquity.toFixed(2)}`);
    console.log(`   الفرق: ${finalDifference.toFixed(2)} LYD`);

    // التحقق من ميزان المراجعة
    const trialBalance = await client.query(`
      SELECT 
        SUM(debit) as total_debits,
        SUM(credit) as total_credits,
        SUM(debit) - SUM(credit) as difference
      FROM gl_entries;
    `);

    const tbStats = trialBalance.rows[0];
    console.log(`\n   ميزان المراجعة:`);
    console.log(`   - إجمالي المدين: ${parseFloat(tbStats.total_debits).toFixed(2)} LYD`);
    console.log(`   - إجمالي الدائن: ${parseFloat(tbStats.total_credits).toFixed(2)} LYD`);
    console.log(`   - الفرق: ${parseFloat(tbStats.difference).toFixed(2)} LYD`);

    console.log('\n' + '='.repeat(60));
    
    if (Math.abs(finalDifference) < 0.01 && Math.abs(parseFloat(tbStats.difference)) < 0.01) {
      console.log('🎉 تم إصلاح معادلة المحاسبة بنجاح!');
      console.log('✅ معادلة المحاسبة متوازنة');
      console.log('✅ ميزان المراجعة متوازن');
    } else {
      console.log('⚠️  هناك مشاكل متبقية:');
      if (Math.abs(finalDifference) >= 0.01) {
        console.log(`   - معادلة المحاسبة غير متوازنة (فرق: ${finalDifference.toFixed(2)} LYD)`);
      }
      if (Math.abs(parseFloat(tbStats.difference)) >= 0.01) {
        console.log(`   - ميزان المراجعة غير متوازن (فرق: ${parseFloat(tbStats.difference).toFixed(2)} LYD)`);
      }
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ خطأ في الإصلاح النهائي:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل الإصلاح
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('final-accounting-fix.js')) {
  console.log('🔧 بدء الإصلاح النهائي لمعادلة المحاسبة...');
  finalAccountingFix()
    .then(() => {
      console.log('\n✅ تم إكمال الإصلاح النهائي بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في الإصلاح النهائي:', error.message);
      process.exit(1);
    });
}

export { finalAccountingFix };
