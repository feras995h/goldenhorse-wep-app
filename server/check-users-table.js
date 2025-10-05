import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkUsersTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Users table structure:');
    console.log('======================\n');
    columns.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUsersTable();
