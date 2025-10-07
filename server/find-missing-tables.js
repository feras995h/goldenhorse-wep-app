import { Sequelize } from 'sequelize';
import config from './src/config/database.cjs';

const expectedModels = [
  'users', 'roles', 'accounts', 'gl_entries', 'gl_entry_details',
  'journal_entries', 'journal_entry_details', 'customers', 'suppliers',
  'employees', 'payroll_entries', 'employee_advances', 'invoices',
  'invoice_items', 'payments', 'receipts', 'fixed_assets', 'settings',
  'notifications', 'shipments', 'shipment_movements', 'warehouse_release_orders',
  'shipping_invoices', 'sales_invoices', 'sales_invoice_items',
  'invoice_payments', 'invoice_receipts', 'account_provisions',
  'account_mappings', 'company_logo', 'purchase_invoices',
  'purchase_invoice_payments', 'sales_invoice_payments', 'stock_movements',
  'audit_logs', 'accounting_periods', 'sales_returns',
  'receipt_vouchers', 'payment_vouchers', 'warehouse'
];

const tableNameMapping = {
  'users': 'users',
  'roles': 'roles', 
  'accounts': 'accounts',
  'gl_entries': 'gl_entries',
  'gl_entry_details': 'gl_entry_details',
  'journal_entries': 'journal_entries',
  'journal_entry_details': 'journal_entry_details',
  'customers': 'customers',
  'suppliers': 'suppliers',
  'employees': 'employees',
  'payroll_entries': 'payroll_entries',
  'employee_advances': 'employee_advances',
  'invoices': 'invoices',
  'invoice_items': 'invoice_items',
  'payments': 'payments',
  'receipts': 'receipts',
  'fixed_assets': 'fixed_assets',
  'settings': 'settings',
  'notifications': 'notifications',
  'shipments': 'shipments',
  'shipment_movements': 'shipment_movements',
  'warehouse_release_orders': 'warehouse_release_orders',
  'shipping_invoices': 'shipping_invoices',
  'sales_invoices': 'sales_invoices',
  'sales_invoice_items': 'sales_invoice_items',
  'invoice_payments': 'invoice_payments',
  'invoice_receipts': 'invoice_receipts',
  'account_provisions': 'account_provisions',
  'account_mappings': 'account_mappings',
  'company_logo': 'company_logo',
  'purchase_invoices': 'purchase_invoices',
  'purchase_invoice_payments': 'purchase_invoice_payments',
  'sales_invoice_payments': 'sales_invoice_payments',
  'stock_movements': 'stock_movements',
  'audit_logs': 'audit_logs',
  'accounting_periods': 'accounting_periods',
  'sales_returns': 'sales_returns',
  'receipt_vouchers': 'receipt_vouchers',
  'payment_vouchers': 'payment_vouchers',
  'warehouse': 'warehouse'
};

async function findMissingTables() {
  try {
    const env = (process.env.NODE_ENV || 'development').trim().replace(/^=+/, '');
    const dbConfig = config[env];

    if (!dbConfig) {
      console.error(`❌ Database configuration not found for environment: ${env}`);
      return;
    }

    let sequelize;
    if (dbConfig.url) {
      sequelize = new Sequelize(dbConfig.url, {
        dialect: 'postgres',
        logging: false
      });
    } else {
      sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
          host: dbConfig.host,
          port: dbConfig.port,
          dialect: dbConfig.dialect,
          logging: false
        }
      );
    }

    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Get existing tables
    const existingTables = await sequelize.getQueryInterface().showAllTables();
    const existingTableNames = existingTables.map(table => table.toLowerCase());

    console.log('\n📊 ANALYSIS:');
    console.log(`Expected models: ${expectedModels.length}`);
    console.log(`Existing tables: ${existingTableNames.length}`);

    // Find missing tables
    const missingTables = [];
    const existingExpectedTables = [];

    for (const expectedModel of expectedModels) {
      const tableName = tableNameMapping[expectedModel];
      if (!existingTableNames.includes(tableName)) {
        missingTables.push(expectedModel);
      } else {
        existingExpectedTables.push(expectedModel);
      }
    }

    // Find unexpected tables
    const unexpectedTables = existingTableNames.filter(table => 
      !Object.values(tableNameMapping).includes(table) && table !== 'sequelizemeta' && table !== 'migrations_log'
    );

    console.log('\n🔍 RESULTS:');
    console.log(`✅ Existing expected tables (${existingExpectedTables.length}):`);
    existingExpectedTables.forEach(table => console.log(`  - ${table}`));

    console.log(`\n❌ Missing tables (${missingTables.length}):`);
    missingTables.forEach(table => console.log(`  - ${table}`));

    if (unexpectedTables.length > 0) {
      console.log(`\n⚠️  Unexpected tables (${unexpectedTables.length}):`);
      unexpectedTables.forEach(table => console.log(`  - ${table}`));
    }

    console.log(`\n📈 SUMMARY:`);
    console.log(`Total expected: ${expectedModels.length}`);
    console.log(`Found: ${existingExpectedTables.length}`);
    console.log(`Missing: ${missingTables.length}`);
    console.log(`Unexpected: ${unexpectedTables.length}`);

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findMissingTables();