import { Client } from 'pg';

/**
 * سكريپت إصلاح معادلة المحاسبة
 * يصلح القيود غير المتوازنة والأرصدة الخاطئة
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function fixAccountingEquation() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // إصلاح 1: فحص القيد غير المتوازن JE000001
    console.log('🔧 إصلاح 1: فحص وإصلاح القيد غير المتوازن JE000001');
    const unbalancedEntry = await client.query(`
      SELECT
        id, "accountId", debit, credit, remarks,
        "voucherNo", "voucherType", "postingDate"
      FROM gl_entries
      WHERE "voucherNo" = 'JE000001'
      ORDER BY id;
    `);

    console.log(`   تفاصيل القيد JE000001 (${unbalancedEntry.rows.length} سطر):`);
    let totalDebit = 0, totalCredit = 0;
    
    for (const entry of unbalancedEntry.rows) {
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;
      totalDebit += debit;
      totalCredit += credit;
      
      // جلب اسم الحساب
      const accountResult = await client.query(
        'SELECT code, name FROM accounts WHERE id = $1',
        [entry.accountId]
      );
      const accountName = accountResult.rows[0]?.name || 'حساب غير معروف';
      
      console.log(`   - ${accountName}: مدين ${debit.toFixed(2)}, دائن ${credit.toFixed(2)}`);
      console.log(`     الوصف: ${entry.remarks || 'لا يوجد وصف'}`);
    }
    
    console.log(`   إجمالي المدين: ${totalDebit.toFixed(2)} LYD`);
    console.log(`   إجمالي الدائن: ${totalCredit.toFixed(2)} LYD`);
    console.log(`   الفرق: ${(totalDebit - totalCredit).toFixed(2)} LYD`);

    // إصلاح القيد إذا كان غير متوازن
    const difference = totalDebit - totalCredit;
    if (Math.abs(difference) > 0.01) {
      console.log('\n   🔧 إصلاح القيد غير المتوازن...');
      
      if (difference > 0) {
        // المدين أكبر من الدائن - نحتاج إضافة دائن
        console.log(`   إضافة ${Math.abs(difference).toFixed(2)} LYD إلى الجانب الدائن`);
        
        // إضافة قيد دائن لحساب حقوق الملكية
        const equityAccountResult = await client.query(
          "SELECT id FROM accounts WHERE type = 'equity' AND \"isActive\" = true LIMIT 1"
        );
        
        if (equityAccountResult.rows.length > 0) {
          await client.query(`
            INSERT INTO gl_entries (
              id, "accountId", debit, credit, remarks,
              "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
            ) VALUES (
              uuid_generate_v4(), $1, 0, $2, 'قيد تسوية لتوازن المعادلة المحاسبية',
              'JE000001', 'Journal Entry', CURRENT_DATE,
              '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
            )
          `, [equityAccountResult.rows[0].id, Math.abs(difference)]);
          
          console.log('   ✅ تم إضافة قيد تسوية دائن');
        }
      } else {
        // الدائن أكبر من المدين - نحتاج إضافة مدين
        console.log(`   إضافة ${Math.abs(difference).toFixed(2)} LYD إلى الجانب المدين`);
        
        // إضافة قيد مدين لحساب الأصول
        const assetAccountResult = await client.query(
          "SELECT id FROM accounts WHERE type = 'asset' AND \"isActive\" = true LIMIT 1"
        );
        
        if (assetAccountResult.rows.length > 0) {
          await client.query(`
            INSERT INTO gl_entries (
              id, "accountId", debit, credit, remarks,
              "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
            ) VALUES (
              uuid_generate_v4(), $1, $2, 0, 'قيد تسوية لتوازن المعادلة المحاسبية',
              'JE000001', 'Journal Entry', CURRENT_DATE,
              '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
            )
          `, [assetAccountResult.rows[0].id, Math.abs(difference)]);
          
          console.log('   ✅ تم إضافة قيد تسوية مدين');
        }
      }
    } else {
      console.log('   ✅ القيد متوازن بالفعل');
    }

    // إصلاح 2: تصحيح أرصدة الحسابات
    console.log('\n🔧 إصلاح 2: تصحيح أرصدة الحسابات');
    
    // إعادة حساب أرصدة جميع الحسابات من قيود الأستاذ العام
    console.log('   إعادة حساب أرصدة الحسابات من قيود الأستاذ العام...');
    
    const recalculateBalances = await client.query(`
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

    console.log(`   ✅ تم إعادة حساب أرصدة ${recalculateBalances.rowCount} حساب`);

    // إصلاح 3: إضافة أرصدة افتتاحية إذا لزم الأمر
    console.log('\n🔧 إصلاح 3: التحقق من الحاجة لأرصدة افتتاحية');
    
    // حساب إجمالي الأصول والالتزامات وحقوق الملكية بعد الإصلاح
    const balanceCheck = await client.query(`
      SELECT 
        type,
        SUM(balance) as total_balance
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type;
    `);

    let assets = 0, liabilities = 0, equity = 0;
    balanceCheck.rows.forEach(row => {
      const balance = parseFloat(row.total_balance) || 0;
      switch(row.type) {
        case 'asset': assets = balance; break;
        case 'liability': liabilities = balance; break;
        case 'equity': equity = balance; break;
      }
    });

    console.log(`   الأصول: ${assets.toFixed(2)} LYD`);
    console.log(`   الالتزامات: ${liabilities.toFixed(2)} LYD`);
    console.log(`   حقوق الملكية: ${equity.toFixed(2)} LYD`);

    const equationDifference = assets - (liabilities + equity);
    console.log(`   فرق معادلة المحاسبة: ${equationDifference.toFixed(2)} LYD`);

    if (Math.abs(equationDifference) > 0.01) {
      console.log('   🔧 إضافة رصيد افتتاحي لتوازن المعادلة...');
      
      // العثور على حساب رأس المال أو إنشاؤه
      let capitalAccountResult = await client.query(
        "SELECT id FROM accounts WHERE type = 'equity' AND name LIKE '%رأس المال%' LIMIT 1"
      );

      let capitalAccountId;
      if (capitalAccountResult.rows.length === 0) {
        // إنشاء حساب رأس المال
        const newCapitalAccount = await client.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType",
            level, "isGroup", "isActive", balance, currency, nature,
            "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), '3.1.1', 'رأس المال', 'Capital', 'equity', 'Equity', 'Balance Sheet',
            3, false, true, 0, 'LYD', 'credit', NOW(), NOW()
          ) RETURNING id;
        `);
        capitalAccountId = newCapitalAccount.rows[0].id;
        console.log('   ✅ تم إنشاء حساب رأس المال');
      } else {
        capitalAccountId = capitalAccountResult.rows[0].id;
      }

      // إضافة رصيد افتتاحي لرأس المال
      const openingBalanceAmount = Math.abs(equationDifference);
      await client.query(`
        INSERT INTO gl_entries (
          id, "accountId", debit, credit, remarks,
          "voucherNo", "voucherType", "postingDate", "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(), $1, 0, $2, 'رصيد افتتاحي لرأس المال',
          'OB000001', 'Journal Entry', CURRENT_DATE,
          '1c224ac0-643a-44b5-9f27-98a5cd998962', NOW(), NOW()
        )
      `, [capitalAccountId, openingBalanceAmount]);

      // تحديث رصيد حساب رأس المال
      await client.query(
        'UPDATE accounts SET balance = $1, "updatedAt" = NOW() WHERE id = $2',
        [openingBalanceAmount, capitalAccountId]
      );

      console.log(`   ✅ تم إضافة رصيد افتتاحي: ${openingBalanceAmount.toFixed(2)} LYD`);
    } else {
      console.log('   ✅ معادلة المحاسبة متوازنة');
    }

    // التحقق النهائي
    console.log('\n📊 التحقق النهائي من معادلة المحاسبة');
    
    const finalCheck = await client.query(`
      SELECT 
        type,
        COUNT(*) as count,
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
    console.log(`\n   معادلة المحاسبة: ${finalAssets.toFixed(2)} = ${finalLiabilities.toFixed(2)} + ${finalEquity.toFixed(2)}`);
    console.log(`   الفرق: ${finalDifference.toFixed(2)} LYD`);

    if (Math.abs(finalDifference) < 0.01) {
      console.log('   ✅ معادلة المحاسبة متوازنة بنجاح!');
    } else {
      console.log('   ❌ معادلة المحاسبة لا تزال غير متوازنة');
    }

    // التحقق من ميزان المراجعة
    const trialBalanceCheck = await client.query(`
      SELECT 
        SUM(debit) as total_debits,
        SUM(credit) as total_credits,
        SUM(debit) - SUM(credit) as difference
      FROM gl_entries;
    `);

    const tbStats = trialBalanceCheck.rows[0];
    console.log(`\n   ميزان المراجعة:`);
    console.log(`   - إجمالي المدين: ${parseFloat(tbStats.total_debits).toFixed(2)} LYD`);
    console.log(`   - إجمالي الدائن: ${parseFloat(tbStats.total_credits).toFixed(2)} LYD`);
    console.log(`   - الفرق: ${parseFloat(tbStats.difference).toFixed(2)} LYD`);

    if (Math.abs(parseFloat(tbStats.difference)) < 0.01) {
      console.log('   ✅ ميزان المراجعة متوازن!');
    } else {
      console.log('   ❌ ميزان المراجعة لا يزال غير متوازن');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إكمال إصلاح معادلة المحاسبة');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ خطأ في إصلاح معادلة المحاسبة:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل الإصلاح
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('fix-accounting-equation.js')) {
  console.log('🔧 بدء إصلاح معادلة المحاسبة...');
  fixAccountingEquation()
    .then(() => {
      console.log('\n✅ تم إكمال إصلاح معادلة المحاسبة بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في إصلاح معادلة المحاسبة:', error.message);
      process.exit(1);
    });
}

export { fixAccountingEquation };
