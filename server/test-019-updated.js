import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const queryInterface = sequelize.getQueryInterface();
    
    // Import and run the migration
    const migrationPath = path.join(__dirname, 'src/migrations/019-add-sales-tax-account-to-account-mappings.js');
    const migration = await import(migrationPath);
    
    console.log('Running migration 019...\n');
    await migration.up(queryInterface, Sequelize);
    
    console.log('\n✅ Migration completed successfully');

    await sequelize.close();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\nStack:', err.stack);
    await sequelize.close();
    process.exit(1);
  }
}

test();
