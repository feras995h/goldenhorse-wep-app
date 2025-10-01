/**
 * Database Structure Checker - فحص بنية قاعدة البيانات
 * فحص شامل بدون أي تعديلات
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkDatabase() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Golden Horse - Database Structure Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // 1. فحص الجداول الرئيسية
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 الجداول الرئيسية:\n');

    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN (
        'accounts', 'account_mappings', 'customers', 'suppliers',
        'sales_invoices', 'gl_entries', 'journal_entries', 'journal_entry_details'
      )
      ORDER BY table_name
    `);

    console.table(tables.rows);

    // 2. فحص بنية جدول accounts
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 بنية جدول accounts:\n');

    const accountsStructure = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position
    `);

    console.table(accountsStructure.rows);

    // 3. فحص بنية جدول account_mappings
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 بنية جدول account_mappings:\n');

    const mappingsStructure = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'account_mappings'
      ORDER BY ordinal_position
    `);

    console.table(mappingsStructure.rows);

    // 4. فحص الأعمدة المطلوبة (NOT NULL) في account_mappings
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  الأعمدة المطلوبة (NOT NULL) في account_mappings:\n');

    const requiredColumns = await client.query(`
      SELECT 
        column_name,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'account_mappings'
      AND is_nullable = 'NO'
      ORDER BY ordinal_position
    `);

    console.table(requiredColumns.rows);

    // 5. فحص ENUM types
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ENUM Types:\n');

    const enums = await client.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE 'enum_%'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    enums.rows.forEach(row => {
      console.log(`${row.enum_name}:`);
      row.values.forEach(v => console.log(`  - ${v}`));
      console.log('');
    });

    // 6. فحص الحسابات الموجودة
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 الحسابات الموجودة:\n');

    const accountsCount = await client.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_count
      FROM accounts
      GROUP BY type
      ORDER BY type
    `);

    console.table(accountsCount.rows);

    // 7. فحص الحسابات الأساسية المطلوبة
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 الحسابات الأساسية المطلوبة:\n');

    const requiredAccounts = await client.query(`
      SELECT 
        code,
        name,
        type,
        "rootType",
        "reportType",
        "isActive"
      FROM accounts
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    if (requiredAccounts.rows.length > 0) {
      console.table(requiredAccounts.rows);
      console.log(`✅ تم العثور على ${requiredAccounts.rows.length}/7 حسابات أساسية\n`);
    } else {
      console.log('❌ لم يتم العثور على أي حسابات أساسية!\n');
    }

    // 8. فحص AccountMappings
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 AccountMappings الموجودة:\n');

    const mappings = await client.query(`
      SELECT 
        id,
        "isActive",
        description,
        "createdAt"
      FROM account_mappings
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    if (mappings.rows.length > 0) {
      console.table(mappings.rows);
      
      const activeMapping = await client.query(`
        SELECT COUNT(*) as count FROM account_mappings WHERE "isActive" = true
      `);
      console.log(`✅ AccountMappings نشطة: ${activeMapping.rows[0].count}\n`);
    } else {
      console.log('❌ لا توجد AccountMappings!\n');
    }

    // 9. إحصائيات عامة
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 إحصائيات عامة:\n');

    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM accounts) as total_accounts,
        (SELECT COUNT(*) FROM accounts WHERE "isActive" = true) as active_accounts,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (SELECT COUNT(*) FROM sales_invoices) as total_invoices,
        (SELECT COUNT(*) FROM gl_entries) as total_gl_entries,
        (SELECT COUNT(*) FROM journal_entries) as total_journal_entries,
        (SELECT COUNT(*) FROM account_mappings) as total_mappings,
        (SELECT COUNT(*) FROM account_mappings WHERE "isActive" = true) as active_mappings
    `);

    console.table(stats.rows);

    // 10. فحص Foreign Keys
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 Foreign Keys في account_mappings:\n');

    const foreignKeys = await client.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'account_mappings'
    `);

    if (foreignKeys.rows.length > 0) {
      console.table(foreignKeys.rows);
    } else {
      console.log('لا توجد Foreign Keys\n');
    }

    // 11. ملخص التقرير
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ملخص التقرير:\n');

    const summary = {
      tables_found: tables.rows.length,
      accounts_total: stats.rows[0].total_accounts,
      accounts_active: stats.rows[0].active_accounts,
      required_accounts_found: requiredAccounts.rows.length,
      required_accounts_missing: 7 - requiredAccounts.rows.length,
      account_mappings_total: stats.rows[0].total_mappings,
      account_mappings_active: stats.rows[0].active_mappings,
      gl_entries: stats.rows[0].total_gl_entries,
      journal_entries: stats.rows[0].total_journal_entries,
      invoices: stats.rows[0].total_invoices
    };

    console.table([summary]);

    // التوصيات
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 التوصيات:\n');

    if (requiredAccounts.rows.length < 7) {
      console.log(`⚠️  ينقص ${7 - requiredAccounts.rows.length} حساب أساسي`);
      console.log('   → شغل: npm run ultimate-fix\n');
    } else {
      console.log('✅ جميع الحسابات الأساسية موجودة\n');
    }

    if (stats.rows[0].active_mappings === '0') {
      console.log('⚠️  لا يوجد AccountMapping نشط');
      console.log('   → سيتم إنشاؤه تلقائياً عند تشغيل السيرفر\n');
    } else {
      console.log('✅ يوجد AccountMapping نشط\n');
    }

    if (stats.rows[0].total_gl_entries === '0') {
      console.log('ℹ️  لا توجد قيود محاسبية بعد');
      console.log('   → طبيعي إذا كان النظام جديد\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error('\nالتفاصيل:', error);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال\n');
  }
}

checkDatabase();
