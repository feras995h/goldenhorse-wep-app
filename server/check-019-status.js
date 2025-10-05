import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkStatus() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const [result] = await sequelize.query(`
      SELECT * FROM migrations_log 
      WHERE filename = '019-add-sales-tax-account-to-account-mappings.js'
    `);

    if (result.length > 0) {
      console.log('✅ Migration 019 is marked as applied');
      console.log('Applied at:', result[0].applied_at);
    } else {
      console.log('❌ Migration 019 is NOT marked as applied');
    }

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStatus();
