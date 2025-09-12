import models, { sequelize } from './src/models/index.js';

async function cleanDemoData() {
  try {
    console.log('🧹 Starting demo data cleanup...');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Clean data in correct order (respecting foreign key constraints)
    console.log('🗑️ Cleaning transactional data...');
    
    // 1. Clean journal entry details first (child table)
    await sequelize.query('DELETE FROM journal_entry_details WHERE 1=1');
    console.log('✅ Journal entry details cleaned');
    
    // 2. Clean journal entries
    await sequelize.query('DELETE FROM journal_entries WHERE 1=1');
    console.log('✅ Journal entries cleaned');
    
    // 3. Clean GL entries
    await sequelize.query('DELETE FROM gl_entries WHERE 1=1');
    console.log('✅ GL entries cleaned');
    
    // 4. Clean invoices
    await sequelize.query('DELETE FROM invoices WHERE 1=1');
    console.log('✅ Invoices cleaned');
    
    // 5. Clean receipts
    await sequelize.query('DELETE FROM receipts WHERE 1=1');
    console.log('✅ Receipts cleaned');
    
    // 6. Clean payments
    await sequelize.query('DELETE FROM payments WHERE 1=1');
    console.log('✅ Payments cleaned');
    
    // 7. Clean payroll entries
    await sequelize.query('DELETE FROM payroll_entries WHERE 1=1');
    console.log('✅ Payroll entries cleaned');
    
    // 8. Clean employee advances
    await sequelize.query('DELETE FROM employee_advances WHERE 1=1');
    console.log('✅ Employee advances cleaned');
    
    // 9. Clean fixed assets
    await sequelize.query('DELETE FROM fixed_assets WHERE 1=1');
    console.log('✅ Fixed assets cleaned');
    
    // 10. Clean master data (keep only essential)
    console.log('🗑️ Cleaning master data...');
    
    // Keep only admin user, clean others
    await sequelize.query("DELETE FROM users WHERE username != 'admin'");
    console.log('✅ Test users cleaned (kept admin)');
    
    // Clean customers (keep only essential ones if any)
    await sequelize.query('DELETE FROM customers WHERE 1=1');
    console.log('✅ Demo customers cleaned');
    
    // Clean employees (keep only essential ones if any)
    await sequelize.query('DELETE FROM employees WHERE 1=1');
    console.log('✅ Demo employees cleaned');
    
    // Clean suppliers (keep only essential ones if any)
    await sequelize.query('DELETE FROM suppliers WHERE 1=1');
    console.log('✅ Demo suppliers cleaned');
    
    // 11. Clean accounts (keep only basic chart of accounts)
    console.log('🗑️ Cleaning chart of accounts...');
    
    // Delete all accounts except root accounts
    await sequelize.query("DELETE FROM accounts WHERE level > 1");
    console.log('✅ Sub-accounts cleaned (kept root accounts)');
    
    // Reset account balances to zero
    await sequelize.query("UPDATE accounts SET balance = 0 WHERE 1=1");
    console.log('✅ Account balances reset to zero');
    
    // 12. Clean settings (keep only company info)
    console.log('🗑️ Cleaning settings...');
    
    await sequelize.query(`
      DELETE FROM settings 
      WHERE key NOT IN (
        'company_name',
        'company_name_en', 
        'company_address',
        'company_phone',
        'company_email',
        'default_currency'
      )
    `);
    console.log('✅ Demo settings cleaned (kept company info)');
    
    // 13. Reset sequences/auto-increment values
    console.log('🔄 Resetting sequences...');
    
    const tables = [
      'journal_entries',
      'invoices', 
      'receipts',
      'payments',
      'customers',
      'employees',
      'suppliers'
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
        console.log(`✅ ${table} sequence reset`);
      } catch (error) {
        // Ignore if sequence doesn't exist
        console.log(`⚠️ ${table} sequence not found (skipped)`);
      }
    }
    
    console.log('🎉 Demo data cleanup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ All transactional data removed');
    console.log('   ✅ Demo master data removed');
    console.log('   ✅ Account balances reset to zero');
    console.log('   ✅ Only admin user and basic accounts remain');
    console.log('   ✅ System ready for production use');
    
  } catch (error) {
    console.error('❌ Error cleaning demo data:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

cleanDemoData();
