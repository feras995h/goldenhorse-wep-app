const { Sequelize } = require('sequelize');

// Use the same database URL from your configuration
const sequelize = new Sequelize('postgresql://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres', { 
  logging: false 
});

const migrations = [
  '001-initial-schema.js', 
  '002-add-missing-columns.js', 
  '002-additional-tables.js', 
  '002-create-notifications.js', 
  '003-add-user-columns.js', 
  '004-add-account-columns.js', 
  '005-add-account-balance-columns.js', 
  '006-add-account-description.js', 
  '008-add-performance-indexes.js', 
  '009-add-customer-missing-fields.js', 
  '010-add-employee-missing-fields.js', 
  '20250115000001-create-invoice-payment.js', 
  '20250115000002-create-invoice-receipt.js', 
  '20250115000003-create-account-provision.js', 
  '20250115000004-enhance-receipt-model.js', 
  '20250115000005-enhance-payment-model.js', 
  '20250115000006-enhance-invoice-model.js'
];

async function markMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    for (const migration of migrations) {
      try {
        await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?)', { 
          replacements: [migration] 
        });
        console.log(`✅ Marked ${migration} as completed`);
      } catch (err) {
        if (err.message.includes('duplicate key')) {
          console.log(`⚠️  ${migration} already marked as completed`);
        } else {
          console.error(`❌ Error marking ${migration}:`, err.message);
        }
      }
    }
    
    console.log('✅ All existing migrations marked as completed');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

markMigrations();