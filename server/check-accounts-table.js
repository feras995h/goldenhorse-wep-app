// Check accounts table structure
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkAccountsTable() {
  try {
    console.log('🔍 Checking accounts table structure...');
    
    const sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check accounts table structure
    try {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'accounts'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Accounts table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ Error checking accounts table structure:', error.message);
    }
    
    await sequelize.close();
    console.log('\n✅ Accounts table structure check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAccountsTable();