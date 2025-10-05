import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: false 
});

/**
 * التحقق من قاعدة البيانات والعثور على المشاكل
 */
async function verifyDatabase() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    // 1. عدد الجداول
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name NOT LIKE 'pg_%'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name;
    `);

    console.log(`📊 إجمالي الجداول: ${tables.length}\n`);
    console.log('📋 قائمة الجداول:');
    tables.forEach((t, i) => console.log(`   ${i+1}. ${t.table_name}`));
    console.log();

    // 2. فحص الجداول المطلوبة
    const requiredTables = [
      'users', 'customers', 'suppliers', 'accounts', 'account_mappings',
      'sales_invoices', 'sales_invoice_items', 'shipments', 'shipping_invoices',
      'receipt_vouchers', 'payment_vouchers', 'journal_entries', 'journal_entry_details',
      'notifications', 'fixed_assets', 'account_provisions', 'shipment_movements',
      'employees', 'employee_advances', 'payroll_entries',
      'purchase_invoices', 'purchase_invoice_payments', 'sales_returns',
      'receipts', 'payments', 'gl_entries', 'settings', 'roles',
      'audit_logs', 'accounting_periods', 'company_logo'
    ];

    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('❌ الجداول المفقودة:');
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log();
    } else {
      console.log('✅ جميع الجداول المطلوبة موجودة!\n');
    }

    // 3. فحص أعمدة جداول محددة
    console.log('🔍 فحص الأعمدة المهمة...\n');

    // فحص users
    const [usersCols] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log(`✅ جدول users (${usersCols.length} عمود):`);
    console.log(`   ${usersCols.map(c => c.column_name).join(', ')}\n`);

    // فحص sales_invoices
    const [salesInvoicesCols] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sales_invoices'
      ORDER BY ordinal_position;
    `);
    console.log(`✅ جدول sales_invoices (${salesInvoicesCols.length} عمود):`);
    console.log(`   ${salesInvoicesCols.map(c => c.column_name).join(', ')}\n`);

    // فحص accounting_periods
    if (existingTableNames.includes('accounting_periods')) {
      const [accountingPeriodsCols] = await sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'accounting_periods'
        ORDER BY ordinal_position;
      `);
      console.log(`✅ جدول accounting_periods (${accountingPeriodsCols.length} عمود):`);
      console.log(`   ${accountingPeriodsCols.map(c => c.column_name).join(', ')}\n`);
    }

    // 4. فحص Foreign Keys
    const [fks] = await sequelize.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `);

    console.log(`🔗 Foreign Keys: ${fks.length}\n`);

    await sequelize.close();
    console.log('✅ اكتمل الفحص بنجاح!');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    await sequelize.close();
    process.exit(1);
  }
}

verifyDatabase();
