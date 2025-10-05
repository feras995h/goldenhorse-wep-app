import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const [migrations] = await sequelize.query('SELECT filename, applied_at FROM migrations_log ORDER BY applied_at DESC LIMIT 10');
    
    console.log('Last 10 applied migrations:');
    console.log('===========================\n');
    migrations.forEach(m => {
      console.log(`${m.filename} - ${m.applied_at}`);
    });

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkMigrations();
