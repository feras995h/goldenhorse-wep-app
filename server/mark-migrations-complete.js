import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function markComplete() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    // Mark migration 019 as complete
    await sequelize.query(`
      INSERT INTO migrations_log (filename, applied_at) 
      VALUES ('019-add-sales-tax-account-to-account-mappings.js', NOW())
      ON CONFLICT (filename) DO NOTHING
    `);
    console.log('✅ Marked 019 as complete');

    // Mark all 20250115 migrations as complete
    const migrations = [
      '20250115000001-create-invoice-payment.js',
      '20250115000002-create-invoice-receipt.js',
      '20250115000003-create-account-provision.js',
      '20250115000004-enhance-receipt-model.js',
      '20250115000005-enhance-payment-model.js',
      '20250115000006-enhance-invoice-model.js'
    ];

    for (const migration of migrations) {
      await sequelize.query(`
        INSERT INTO migrations_log (filename, applied_at) 
        VALUES ('${migration}', NOW())
        ON CONFLICT (filename) DO NOTHING
      `);
      console.log(`✅ Marked ${migration} as complete`);
    }

    console.log('\n✅ All migrations marked as complete!');

    await sequelize.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

markComplete();
