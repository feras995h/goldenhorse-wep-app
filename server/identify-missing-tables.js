import { Sequelize } from 'sequelize';
import config from './src/config/database.cjs';

async function identifyMissingTables() {
  const sequelize = new Sequelize(config.production);
  
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');

    // Get current tables
    const [currentTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'SequelizeMeta'
      ORDER BY table_name
    `);

    const existingTables = currentTables.map(row => row.table_name);
    console.log('📊 الجداول الحالية:', existingTables.length);
    existingTables.forEach((table, i) => console.log(`${i + 1}. ${table}`));

    // Expected tables based on models (converting from model names to table names)
    const expectedTables = [
      'users', 'roles', 'accounts', 'gl_entries', 'journal_entries', 
      'journal_entry_details', 'customers', 'suppliers', 'employees', 
      'payroll_entries', 'employee_advances', 'invoices', 'payments', 
      'receipts', 'fixed_assets', 'settings', 'notifications', 'shipments', 
      'shipment_movements', 'warehouse_release_orders', 'shipping_invoices', 
      'sales_invoices', 'sales_invoice_items', 'invoice_payments', 
      'invoice_receipts', 'sales_returns', 'sales_invoice_payments', 
      'receipt_vouchers', 'payment_vouchers', 'purchase_invoices', 
      'warehouse', 'stock_movements', 'audit_logs', 'accounting_periods', 
      'account_provisions', 'account_mappings', 'company_logo', 
      'purchase_invoice_payments'
    ];

    console.log('\n📋 الجداول المتوقعة:', expectedTables.length);
    expectedTables.forEach((table, i) => console.log(`${i + 1}. ${table}`));

    // Find missing tables
    const missingTables = expectedTables.filter(table => 
      !existingTables.includes(table)
    );

    console.log('\n❌ الجداول المفقودة:', missingTables.length);
    missingTables.forEach((table, i) => console.log(`${i + 1}. ${table}`));

    // Find extra tables
    const extraTables = existingTables.filter(table => 
      !expectedTables.includes(table)
    );

    console.log('\n⚠️ الجداول الإضافية:', extraTables.length);
    extraTables.forEach((table, i) => console.log(`${i + 1}. ${table}`));

    // Check for possible additional system tables that might be needed
    console.log('\n🔍 التحقق من الجداول الإضافية المحتملة...');
    
    // Common system tables that might be needed
    const commonSystemTables = [
      'migrations', 'migrations_lock', 'sessions', 'permissions', 
      'role_permissions', 'user_roles', 'password_resets', 
      'api_tokens', 'audit_trail', 'system_logs', 'error_logs',
      'file_uploads', 'attachments', 'documents', 'notifications_queue',
      'background_jobs', 'scheduled_tasks', 'system_settings',
      'company_info', 'branches', 'departments', 'job_titles',
      'tax_rates', 'currency_rates', 'payment_methods',
      'shipping_methods', 'product_categories', 'products',
      'inventory_items', 'warehouse_locations', 'stock_adjustments'
    ];

    const potentialAdditionalTables = commonSystemTables.filter(table => 
      !existingTables.includes(table) && !expectedTables.includes(table)
    );

    console.log('💡 جداول نظام محتملة إضافية:', potentialAdditionalTables.length);
    potentialAdditionalTables.forEach((table, i) => console.log(`${i + 1}. ${table}`));

    console.log(`\n📊 المجموع الكلي:`);
    console.log(`- الجداول الحالية: ${existingTables.length}`);
    console.log(`- الجداول المتوقعة: ${expectedTables.length}`);
    console.log(`- الجداول المفقودة: ${missingTables.length}`);
    console.log(`- الجداول الإضافية: ${extraTables.length}`);
    
    if (missingTables.length === 0) {
      console.log('\n✅ جميع الجداول المتوقعة موجودة!');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

identifyMissingTables();