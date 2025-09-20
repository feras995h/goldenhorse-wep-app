import { Client } from 'pg';

/**
 * سكريپت تشخيص معادلة المحاسبة
 * يحلل الأرصدة والقيود لإيجاد سبب عدم التوازن
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function diagnoseAccountingEquation() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // تشخيص 1: تحليل الحسابات حسب النوع
    console.log('📊 تشخيص 1: تحليل الحسابات حسب النوع');
    const accountsAnalysis = await client.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(balance) as total_balance,
        AVG(balance) as avg_balance
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type;
    `);

    console.log('   الحسابات حسب النوع:');
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0, totalRevenue = 0, totalExpenses = 0;
    
    accountsAnalysis.rows.forEach(row => {
      const balance = parseFloat(row.total_balance) || 0;
      console.log(`   - ${row.type}: ${row.count} حساب، إجمالي: ${balance.toFixed(2)} LYD`);
      
      switch(row.type) {
        case 'asset': totalAssets = balance; break;
        case 'liability': totalLiabilities = balance; break;
        case 'equity': totalEquity = balance; break;
        case 'revenue': totalRevenue = balance; break;
        case 'expense': totalExpenses = balance; break;
      }
    });

    // تشخيص 2: معادلة المحاسبة
    console.log('\n📊 تشخيص 2: معادلة المحاسبة');
    const leftSide = totalAssets;
    const rightSide = totalLiabilities + totalEquity;
    const difference = leftSide - rightSide;
    
    console.log(`   الأصول: ${totalAssets.toFixed(2)} LYD`);
    console.log(`   الالتزامات: ${totalLiabilities.toFixed(2)} LYD`);
    console.log(`   حقوق الملكية: ${totalEquity.toFixed(2)} LYD`);
    console.log(`   الطرف الأيمن (الالتزامات + حقوق الملكية): ${rightSide.toFixed(2)} LYD`);
    console.log(`   الفرق: ${difference.toFixed(2)} LYD`);
    
    if (Math.abs(difference) < 0.01) {
      console.log('   ✅ معادلة المحاسبة متوازنة');
    } else {
      console.log('   ❌ معادلة المحاسبة غير متوازنة');
    }

    // تشخيص 3: تحليل قيود الأستاذ العام
    console.log('\n📊 تشخيص 3: تحليل قيود الأستاذ العام');
    const glAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(debit) as total_debits,
        SUM(credit) as total_credits,
        SUM(debit) - SUM(credit) as difference,
        COUNT(CASE WHEN debit > 0 THEN 1 END) as debit_entries,
        COUNT(CASE WHEN credit > 0 THEN 1 END) as credit_entries
      FROM gl_entries;
    `);

    const glStats = glAnalysis.rows[0];
    console.log(`   إجمالي القيود: ${glStats.total_entries}`);
    console.log(`   قيود مدينة: ${glStats.debit_entries}`);
    console.log(`   قيود دائنة: ${glStats.credit_entries}`);
    console.log(`   إجمالي المدين: ${parseFloat(glStats.total_debits).toFixed(2)} LYD`);
    console.log(`   إجمالي الدائن: ${parseFloat(glStats.total_credits).toFixed(2)} LYD`);
    console.log(`   فرق الميزان: ${parseFloat(glStats.difference).toFixed(2)} LYD`);

    if (Math.abs(parseFloat(glStats.difference)) < 0.01) {
      console.log('   ✅ ميزان المراجعة متوازن');
    } else {
      console.log('   ❌ ميزان المراجعة غير متوازن');
    }

    // تشخيص 4: القيود غير المتوازنة
    console.log('\n📊 تشخيص 4: البحث عن القيود غير المتوازنة');
    const unbalancedEntries = await client.query(`
      SELECT 
        "voucherNo",
        "voucherType",
        "postingDate",
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        SUM(debit) - SUM(credit) as difference
      FROM gl_entries
      GROUP BY "voucherNo", "voucherType", "postingDate"
      HAVING ABS(SUM(debit) - SUM(credit)) > 0.01
      ORDER BY ABS(SUM(debit) - SUM(credit)) DESC;
    `);

    if (unbalancedEntries.rows.length > 0) {
      console.log(`   ❌ تم العثور على ${unbalancedEntries.rows.length} قيد غير متوازن:`);
      unbalancedEntries.rows.forEach(entry => {
        console.log(`      - ${entry.voucherNo} (${entry.voucherType}): فرق ${parseFloat(entry.difference).toFixed(2)} LYD`);
      });
    } else {
      console.log('   ✅ جميع القيود متوازنة');
    }

    // تشخيص 5: الحسابات بأرصدة غير طبيعية
    console.log('\n📊 تشخيص 5: الحسابات بأرصدة غير طبيعية');
    const unnaturalBalances = await client.query(`
      SELECT code, name, type, nature, balance
      FROM accounts
      WHERE 
        (nature = 'debit' AND balance < 0) OR
        (nature = 'credit' AND balance > 0)
      ORDER BY ABS(balance) DESC;
    `);

    if (unnaturalBalances.rows.length > 0) {
      console.log(`   ⚠️  تم العثور على ${unnaturalBalances.rows.length} حساب برصيد غير طبيعي:`);
      unnaturalBalances.rows.forEach(account => {
        console.log(`      - ${account.code}: ${account.name} (${account.type})`);
        console.log(`        الطبيعة: ${account.nature}, الرصيد: ${parseFloat(account.balance).toFixed(2)} LYD`);
      });
    } else {
      console.log('   ✅ جميع الحسابات لها أرصدة طبيعية');
    }

    // تشخيص 6: الأرصدة الافتتاحية
    console.log('\n📊 تشخيص 6: الأرصدة الافتتاحية');
    const openingBalances = await client.query(`
      SELECT 
        COUNT(*) as count,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        SUM(debit) - SUM(credit) as difference
      FROM gl_entries
      WHERE "voucherType" = 'Opening Balance';
    `);

    const obStats = openingBalances.rows[0];
    if (parseInt(obStats.count) > 0) {
      console.log(`   📋 عدد قيود الأرصدة الافتتاحية: ${obStats.count}`);
      console.log(`   💰 إجمالي المدين: ${parseFloat(obStats.total_debit).toFixed(2)} LYD`);
      console.log(`   💰 إجمالي الدائن: ${parseFloat(obStats.total_credit).toFixed(2)} LYD`);
      console.log(`   📊 الفرق: ${parseFloat(obStats.difference).toFixed(2)} LYD`);
      
      if (Math.abs(parseFloat(obStats.difference)) < 0.01) {
        console.log('   ✅ الأرصدة الافتتاحية متوازنة');
      } else {
        console.log('   ❌ الأرصدة الافتتاحية غير متوازنة');
      }
    } else {
      console.log('   ⚠️  لا توجد أرصدة افتتاحية - قد تكون هذه المشكلة!');
    }

    // تشخيص 7: تفاصيل الحسابات الرئيسية
    console.log('\n📊 تشخيص 7: تفاصيل الحسابات الرئيسية');
    const mainAccounts = await client.query(`
      SELECT code, name, type, balance, nature
      FROM accounts
      WHERE level <= 2 AND "isActive" = true
      ORDER BY code;
    `);

    console.log('   الحسابات الرئيسية:');
    mainAccounts.rows.forEach(account => {
      const balance = parseFloat(account.balance) || 0;
      console.log(`   - ${account.code}: ${account.name}`);
      console.log(`     النوع: ${account.type}, الطبيعة: ${account.nature}, الرصيد: ${balance.toFixed(2)} LYD`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📋 ملخص التشخيص');
    console.log('='.repeat(80));

    // تحديد المشاكل
    const problems = [];
    const solutions = [];

    if (Math.abs(difference) >= 0.01) {
      problems.push(`معادلة المحاسبة غير متوازنة (فرق: ${difference.toFixed(2)} LYD)`);
      solutions.push('إضافة أرصدة افتتاحية صحيحة لتوازن المعادلة');
    }

    if (Math.abs(parseFloat(glStats.difference)) >= 0.01) {
      problems.push(`ميزان المراجعة غير متوازن (فرق: ${parseFloat(glStats.difference).toFixed(2)} LYD)`);
      solutions.push('تصحيح القيود غير المتوازنة');
    }

    if (unbalancedEntries.rows.length > 0) {
      problems.push(`${unbalancedEntries.rows.length} قيد غير متوازن`);
      solutions.push('تصحيح القيود المذكورة أعلاه');
    }

    if (parseInt(obStats.count) === 0) {
      problems.push('لا توجد أرصدة افتتاحية');
      solutions.push('إضافة الأرصدة الافتتاحية المطلوبة');
    }

    if (problems.length === 0) {
      console.log('✅ لم يتم العثور على مشاكل في معادلة المحاسبة');
    } else {
      console.log('❌ المشاكل المكتشفة:');
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });

      console.log('\n💡 الحلول المقترحة:');
      solutions.forEach((solution, index) => {
        console.log(`   ${index + 1}. ${solution}`);
      });
    }

  } catch (error) {
    console.error('❌ خطأ في تشخيص معادلة المحاسبة:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل التشخيص
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('diagnose-accounting-equation.js')) {
  console.log('🔍 بدء تشخيص معادلة المحاسبة...');
  diagnoseAccountingEquation()
    .then(() => {
      console.log('\n✅ تم إكمال تشخيص معادلة المحاسبة');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في تشخيص معادلة المحاسبة:', error.message);
      process.exit(1);
    });
}

export { diagnoseAccountingEquation };
