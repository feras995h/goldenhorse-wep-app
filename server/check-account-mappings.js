import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    try {
      await sequelize.query('SELECT 1 FROM account_mappings LIMIT 1');
      console.log('✅ Table account_mappings exists');
    } catch (err) {
      console.log('❌ Table account_mappings does NOT exist');
      console.log('Error:', err.message);
    }

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTable();
