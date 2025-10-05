import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkAllTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database\n');
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('=== ALL TABLES IN DATABASE ===\n');
    tables.forEach((t, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${t.tablename}`);
    });
    
    console.log(`\nTotal: ${tables.length} tables`);

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAllTables();
