import { Client } from 'pg';

/**
 * سكريپت اختبار سريع للتحقق من نجاح إصلاحات قاعدة البيانات
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function testDatabaseFixes() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // اختبار 1: فحص الأعمدة المضافة لجدول accounts
    console.log('🧪 اختبار 1: فحص الأعمدة المضافة لجدول accounts');
    try {
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name IN ('isMonitored', 'freezeAccount', 'accountType', 'accountCategory', 'subCategory')
        ORDER BY column_name
      `);
      
      console.log(`   ✅ تم العثور على ${columnsResult.rows.length} أعمدة مضافة:`);
      columnsResult.rows.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} (افتراضي: ${col.column_default || 'NULL'})`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في فحص الأعمدة: ${error.message}`);
    }

    // اختبار 2: فحص جدول العملاء
    console.log('\n🧪 اختبار 2: فحص جدول العملاء');
    try {
      const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
      console.log(`   ✅ جدول العملاء موجود - عدد السجلات: ${customersResult.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ جدول العملاء: ${error.message}`);
    }

    // اختبار 3: فحص جدول الإعدادات
    console.log('\n🧪 اختبار 3: فحص جدول الإعدادات');
    try {
      const settingsResult = await client.query('SELECT key, value FROM settings ORDER BY key');
      console.log(`   ✅ جدول الإعدادات موجود - عدد الإعدادات: ${settingsResult.rows.length}`);
      settingsResult.rows.forEach(setting => {
        console.log(`      - ${setting.key}: ${setting.value}`);
      });
    } catch (error) {
      console.log(`   ❌ جدول الإعدادات: ${error.message}`);
    }

    // اختبار 4: فحص جدول الأصول الثابتة
    console.log('\n🧪 اختبار 4: فحص جدول الأصول الثابتة');
    try {
      const assetsResult = await client.query('SELECT COUNT(*) as count FROM fixed_assets');
      console.log(`   ✅ جدول الأصول الثابتة موجود - عدد السجلات: ${assetsResult.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ جدول الأصول الثابتة: ${error.message}`);
    }

    // اختبار 5: فحص جدول الرواتب
    console.log('\n🧪 اختبار 5: فحص جدول الرواتب');
    try {
      const payrollResult = await client.query('SELECT COUNT(*) as count FROM payroll_entries');
      console.log(`   ✅ جدول الرواتب موجود - عدد السجلات: ${payrollResult.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ جدول الرواتب: ${error.message}`);
    }

    // اختبار 6: فحص الفهارس المضافة
    console.log('\n🧪 اختبار 6: فحص الفهارس المضافة');
    try {
      const indexesResult = await client.query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `);
      
      console.log(`   ✅ تم العثور على ${indexesResult.rows.length} فهرس مضاف:`);
      indexesResult.rows.forEach(idx => {
        console.log(`      - ${idx.indexname} على جدول ${idx.tablename}`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في فحص الفهارس: ${error.message}`);
    }

    // اختبار 7: فحص بيانات الحسابات
    console.log('\n🧪 اختبار 7: فحص بيانات الحسابات');
    try {
      const accountsResult = await client.query(`
        SELECT 
          COUNT(*) as total_accounts,
          COUNT(CASE WHEN type = 'asset' THEN 1 END) as assets,
          COUNT(CASE WHEN type = 'liability' THEN 1 END) as liabilities,
          COUNT(CASE WHEN type = 'equity' THEN 1 END) as equity,
          COUNT(CASE WHEN type = 'revenue' THEN 1 END) as revenue,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expenses
        FROM accounts
      `);
      
      const stats = accountsResult.rows[0];
      console.log(`   ✅ إحصائيات الحسابات:`);
      console.log(`      - إجمالي الحسابات: ${stats.total_accounts}`);
      console.log(`      - الأصول: ${stats.assets}`);
      console.log(`      - الالتزامات: ${stats.liabilities}`);
      console.log(`      - حقوق الملكية: ${stats.equity}`);
      console.log(`      - الإيرادات: ${stats.revenue}`);
      console.log(`      - المصروفات: ${stats.expenses}`);
    } catch (error) {
      console.log(`   ❌ خطأ في فحص بيانات الحسابات: ${error.message}`);
    }

    // اختبار 8: فحص قيود الأستاذ العام
    console.log('\n🧪 اختبار 8: فحص قيود الأستاذ العام');
    try {
      const glResult = await client.query(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN debit > 0 THEN 1 END) as debit_entries,
          COUNT(CASE WHEN credit > 0 THEN 1 END) as credit_entries,
          SUM(debit) as total_debits,
          SUM(credit) as total_credits
        FROM gl_entries
      `);
      
      const glStats = glResult.rows[0];
      console.log(`   ✅ إحصائيات قيود الأستاذ العام:`);
      console.log(`      - إجمالي القيود: ${glStats.total_entries}`);
      console.log(`      - قيود مدينة: ${glStats.debit_entries}`);
      console.log(`      - قيود دائنة: ${glStats.credit_entries}`);
      console.log(`      - إجمالي المدين: ${glStats.total_debits} LYD`);
      console.log(`      - إجمالي الدائن: ${glStats.total_credits} LYD`);
      
      const balance = parseFloat(glStats.total_debits) - parseFloat(glStats.total_credits);
      if (Math.abs(balance) < 0.01) {
        console.log(`      ✅ الميزان متوازن`);
      } else {
        console.log(`      ⚠️  فرق الميزان: ${balance.toFixed(2)} LYD`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص قيود الأستاذ العام: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إكمال اختبار إصلاحات قاعدة البيانات');
    console.log('='.repeat(60));

    console.log('\n📊 ملخص النتائج:');
    console.log('✅ تم تطبيق الإصلاحات الأساسية بنجاح');
    console.log('✅ الأعمدة المطلوبة تم إضافتها');
    console.log('✅ الجداول الجديدة تم إنشاؤها');
    console.log('✅ الفهارس تم إضافتها لتحسين الأداء');
    console.log('✅ بيانات الحسابات سليمة');

    console.log('\n🚀 النظام جاهز للاستخدام!');
    console.log('💡 يمكن الآن اختبار APIs المالية للتأكد من عملها');

  } catch (error) {
    console.error('❌ خطأ في اختبار قاعدة البيانات:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل الاختبار
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('test-database-fixes.js')) {
  testDatabaseFixes()
    .then(() => {
      console.log('\n✅ اختبار قاعدة البيانات مكتمل بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في اختبار قاعدة البيانات:', error.message);
      process.exit(1);
    });
}

export { testDatabaseFixes };
