import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🧹 Database Cleanup Script');
console.log('==========================');
console.log('- Keep chart of accounts');
console.log('- Keep admin user only');
console.log('- Clear all transactional data');

// Production database connection
// استخدم متغيرات البيئة بدلاً من hardcoded credentials
const databaseUrl = process.env.DATABASE_URL || 'postgresql://username:password@host:5432/database';

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

async function cleanDatabase() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\n');

    // 1. Backup admin user info
    console.log('👤 Finding admin users...');
    const [adminUsers] = await sequelize.query(`
      SELECT id, username, email, role 
      FROM users 
      WHERE role = 'admin'
    `, { transaction });
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    // 2. Keep chart of accounts info
    console.log('\n💰 Checking chart of accounts...');
    const [accounts] = await sequelize.query(`
      SELECT COUNT(*) as count FROM accounts
    `, { transaction });
    console.log(`Found ${accounts[0].count} accounts in chart of accounts`);

    // 3. Clear transactional data (keep structure and reference data)
    console.log('\n🧹 Cleaning transactional data...');
    
    const tablesToClear = [
      // Sales and shipping data
      'sales_invoice_items',
      'sales_invoice_payments', 
      'sales_invoices',
      'sales_returns',
      'shipping_invoices',
      'shipment_movements',
      'shipments',
      'warehouse_release_orders',
      'stock_movements',
      
      // Financial transactions
      'invoice_payments',
      'invoice_receipts',
      'invoices',
      'payments',
      'receipts',
      'journal_entry_details',
      'journal_entries',
      'gl_entries',
      'purchase_invoice_payments',
      'purchase_invoices',
      
      // Employee and payroll data
      'employee_advances',
      'payroll_entries',
      
      // Fixed assets
      'fixed_assets',
      
      // Other transactional data
      'audit_logs',
      'notifications'
    ];

    let clearedCount = 0;
    for (const tableName of tablesToClear) {
      try {
        const [countBefore] = await sequelize.query(`
          SELECT COUNT(*) as count FROM "${tableName}"
        `, { transaction });
        
        await sequelize.query(`DELETE FROM "${tableName}"`, { transaction });
        
        console.log(`  ✅ Cleared ${tableName}: ${countBefore[0].count} records removed`);
        clearedCount++;
      } catch (error) {
        console.log(`  ⚠️  ${tableName}: ${error.message}`);
      }
    }

    // 4. Keep only admin users
    console.log('\n👥 Cleaning users (keep admin only)...');
    const [usersBefore] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users
    `, { transaction });
    
    await sequelize.query(`
      DELETE FROM users WHERE role != 'admin'
    `, { transaction });
    
    const [usersAfter] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users  
    `, { transaction });
    
    console.log(`  Users: ${usersBefore[0].count} → ${usersAfter[0].count} (kept admin only)`);

    // 5. Clean customers but keep structure
    console.log('\n🏢 Cleaning customers...');
    const [customersBefore] = await sequelize.query(`
      SELECT COUNT(*) as count FROM customers
    `, { transaction });
    
    await sequelize.query(`DELETE FROM customers`, { transaction });
    
    console.log(`  Customers: ${customersBefore[0].count} → 0 (all removed)`);

    // 6. Reset account balances to zero
    console.log('\n⚖️  Resetting account balances...');
    await sequelize.query(`
      UPDATE accounts SET balance = 0.00
    `, { transaction });
    console.log('  ✅ All account balances reset to 0.00');

    // 7. Clean suppliers
    console.log('\n🏭 Cleaning suppliers...');
    const [suppliersBefore] = await sequelize.query(`
      SELECT COUNT(*) as count FROM suppliers
    `, { transaction });
    
    await sequelize.query(`DELETE FROM suppliers`, { transaction });
    console.log(`  Suppliers: ${suppliersBefore[0].count} → 0 (all removed)`);

    // 8. Clean employees
    console.log('\n👷 Cleaning employees...');
    const [employeesBefore] = await sequelize.query(`
      SELECT COUNT(*) as count FROM employees
    `, { transaction });
    
    await sequelize.query(`DELETE FROM employees`, { transaction });
    console.log(`  Employees: ${employeesBefore[0].count} → 0 (all removed)`);

    await transaction.commit();
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n📊 SUMMARY:');
    console.log(`✅ ${clearedCount} transactional tables cleared`);
    console.log(`✅ Chart of accounts preserved (${accounts[0].count} accounts)`);
    console.log(`✅ Admin users preserved (${adminUsers.length} users)`);
    console.log('✅ All account balances reset to zero');
    console.log('✅ All transactional data removed');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Database cleanup failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

cleanDatabase();