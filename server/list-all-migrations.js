import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function listAll() {
  try {
    await sequelize.authenticate();
    
    const [migrations] = await sequelize.query(`
      SELECT filename, applied_at 
      FROM migrations_log 
      ORDER BY applied_at
    `);

    console.log(`Total: ${migrations.length} migrations\n`);
    
    migrations.forEach((m, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${m.filename}`);
    });

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

listAll();
