import { sequelize } from '../models/index.js';

// Function to clear all data from database
const clearAllData = async () => {
  try {
    console.log('🗑️ Starting to clear all data from database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Disable foreign key checks temporarily
    await sequelize.query('SET session_replication_role = replica;');
    
    // Clear data in reverse order of dependencies
    console.log('🔄 Clearing data...');
    
    // Clear financial data first
    await sequelize.query('DELETE FROM gl_entry_details;');
    console.log('✅ Cleared gl_entry_details');
    
    await sequelize.query('DELETE FROM gl_entries;');
    console.log('✅ Cleared gl_entries');
    
    await sequelize.query('DELETE FROM journal_entry_details;');
    console.log('✅ Cleared journal_entry_details');
    
    await sequelize.query('DELETE FROM journal_entries;');
    console.log('✅ Cleared journal_entries');
    
    await sequelize.query('DELETE FROM invoice_items;');
    console.log('✅ Cleared invoice_items');
    
    await sequelize.query('DELETE FROM invoices;');
    console.log('✅ Cleared invoices');
    
    await sequelize.query('DELETE FROM payments;');
    console.log('✅ Cleared payments');
    
    await sequelize.query('DELETE FROM receipts;');
    console.log('✅ Cleared receipts');
    
    await sequelize.query('DELETE FROM payroll_entries;');
    console.log('✅ Cleared payroll_entries');
    
    await sequelize.query('DELETE FROM employee_advances;');
    console.log('✅ Cleared employee_advances');
    
    await sequelize.query('DELETE FROM fixed_assets;');
    console.log('✅ Cleared fixed_assets');
    
    // Clear main entities
    await sequelize.query('DELETE FROM customers;');
    console.log('✅ Cleared customers');
    
    await sequelize.query('DELETE FROM suppliers;');
    console.log('✅ Cleared suppliers');
    
    await sequelize.query('DELETE FROM employees;');
    console.log('✅ Cleared employees');
    
    await sequelize.query('DELETE FROM accounts;');
    console.log('✅ Cleared accounts');
    
    await sequelize.query('DELETE FROM users;');
    console.log('✅ Cleared users');
    
    await sequelize.query('DELETE FROM roles;');
    console.log('✅ Cleared roles');
    
    await sequelize.query('DELETE FROM settings;');
    console.log('✅ Cleared settings');
    
    // Re-enable foreign key checks
    await sequelize.query('SET session_replication_role = DEFAULT;');
    
    console.log('🎉 All data cleared successfully!');
    console.log('📊 Database is now empty and ready for fresh data entry.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Function to reset auto-increment counters
const resetCounters = async () => {
  try {
    console.log('🔄 Resetting auto-increment counters...');
    
    // Reset counters for tables that might have sequences
    const tables = [
      'users', 'accounts', 'customers', 'employees', 'suppliers',
      'invoices', 'payments', 'receipts', 'gl_entries', 'journal_entries',
      'payroll_entries', 'employee_advances', 'fixed_assets'
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1;`);
        console.log(`✅ Reset counter for ${table}`);
      } catch (error) {
        // Ignore errors for tables without sequences
      }
    }
    
    console.log('✅ All counters reset successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting counters:', error);
  }
};

// Main execution
const main = async () => {
  const action = process.argv[2];
  
  if (action === 'reset-counters') {
    await resetCounters();
  } else {
    await clearAllData();
    await resetCounters();
  }
};

// Run the script
main();
