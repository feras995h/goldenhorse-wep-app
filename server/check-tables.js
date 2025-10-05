import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const tables = ['suppliers', 'receipt_vouchers', 'payment_vouchers', 'purchase_invoices', 'warehouse'];
    
    for (const table of tables) {
      try {
        await sequelize.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ Table exists: ${table}`);
      } catch (err) {
        console.log(`❌ Table missing: ${table}`);
      }
    }

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();
