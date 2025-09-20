import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🛒 Sales Dashboard Database Cleanup');
console.log('===================================');
console.log('Checking and cleaning sales-related data...');

// Production database connection
const databaseUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false,
    connectTimeout: 30000
  },
  pool: {
    max: 2,
    min: 0,
    acquire: 30000,
    idle: 30000
  }
});

async function cleanSalesDashboard() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\n');

    // 1. Check current sales data
    console.log('📊 Checking current sales data...');
    
    const salesTables = [
      'sales_invoices',
      'sales_invoice_items', 
      'sales_invoice_payments',
      'sales_returns',
      'customers',
      'shipments',
      'shipping_invoices',
      'warehouse_release_orders',
      'stock_movements',
      'receipts',
      'payments'
    ];

    let totalRecords = 0;
    const tableStats = {};

    for (const table of salesTables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`, { transaction });
        const count = parseInt(result[0].count);
        tableStats[table] = count;
        totalRecords += count;
        console.log(`  📋 ${table}: ${count} records`);
      } catch (error) {
        console.log(`  ❌ ${table}: Table not found or error`);
        tableStats[table] = 0;
      }
    }

    console.log(`\n📊 Total sales records found: ${totalRecords}\n`);

    if (totalRecords === 0) {
      console.log('✅ Sales dashboard is already clean - no data to remove');
      await transaction.commit();
      return;
    }

    // 2. Clean sales data specifically
    console.log('🧹 Cleaning sales dashboard data...');
    
    let cleanedCount = 0;
    
    // Clean in proper order to avoid foreign key constraints
    const cleanOrder = [
      'sales_invoice_items',      // Child table first
      'sales_invoice_payments',   // Child table first
      'sales_invoices',          // Parent table
      'sales_returns',
      'warehouse_release_orders',
      'stock_movements',
      'shipment_movements',
      'shipments',
      'shipping_invoices',
      'receipts',               // Financial transactions
      'payments'                // Financial transactions
    ];

    for (const tableName of cleanOrder) {
      try {
        const [countBefore] = await sequelize.query(`
          SELECT COUNT(*) as count FROM "${tableName}"
        `, { transaction });
        
        if (parseInt(countBefore[0].count) > 0) {
          await sequelize.query(`DELETE FROM "${tableName}"`, { transaction });
          
          console.log(`  ✅ Cleared ${tableName}: ${countBefore[0].count} records removed`);
          cleanedCount++;
        } else {
          console.log(`  ℹ️  ${tableName}: Already empty`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${tableName}: ${error.message}`);
      }
    }

    // 3. Clean customers (sales-related)
    console.log('\n🏢 Cleaning customers data...');
    const [customersBefore] = await sequelize.query(`
      SELECT COUNT(*) as count FROM customers
    `, { transaction });
    
    if (parseInt(customersBefore[0].count) > 0) {
      await sequelize.query(`DELETE FROM customers`, { transaction });
      console.log(`  ✅ Customers: ${customersBefore[0].count} records removed`);
    } else {
      console.log(`  ℹ️  Customers: Already empty`);
    }

    // 4. Reset any sales-related account balances
    console.log('\n💰 Resetting sales-related account balances...');
    
    // Reset customer accounts
    await sequelize.query(`
      UPDATE accounts SET balance = 0.00 
      WHERE type = 'asset' AND (name LIKE '%عميل%' OR name LIKE '%customer%' OR code LIKE '1.1.2%')
    `, { transaction });
    
    // Reset sales revenue accounts
    await sequelize.query(`
      UPDATE accounts SET balance = 0.00 
      WHERE type = 'revenue' AND (name LIKE '%مبيعات%' OR name LIKE '%sales%' OR code LIKE '4%')
    `, { transaction });
    
    console.log('  ✅ Sales-related account balances reset to 0.00');

    // 5. Clean any sales-related GL entries
    console.log('\n📖 Cleaning sales-related GL entries...');
    const [glBefore] = await sequelize.query(`
      SELECT COUNT(*) as count FROM gl_entries 
      WHERE description LIKE '%مبيعات%' OR description LIKE '%sales%' 
         OR voucherType = 'Sales Invoice' OR voucherType = 'Sales Receipt'
    `, { transaction });
    
    if (parseInt(glBefore[0].count) > 0) {
      await sequelize.query(`
        DELETE FROM gl_entries 
        WHERE description LIKE '%مبيعات%' OR description LIKE '%sales%' 
           OR voucherType = 'Sales Invoice' OR voucherType = 'Sales Receipt'
      `, { transaction });
      console.log(`  ✅ Sales GL entries: ${glBefore[0].count} records removed`);
    } else {
      console.log(`  ℹ️  Sales GL entries: Already clean`);
    }

    await transaction.commit();
    
    console.log('\n🎉 Sales dashboard cleanup completed successfully!');
    console.log('\n📊 SUMMARY:');
    console.log(`✅ ${cleanedCount} sales tables cleaned`);
    console.log('✅ All customer data removed');
    console.log('✅ Sales account balances reset to zero');
    console.log('✅ Sales GL entries removed');
    console.log('✅ Sales dashboard is now completely clean');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Sales dashboard cleanup failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

cleanSalesDashboard();