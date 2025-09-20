// Check the actual column names in payment_vouchers table
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkColumnNames() {
  try {
    console.log('Checking column names in payment_vouchers table...');
    
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
    
    // Check table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment_vouchers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Payment vouchers table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    await sequelize.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkColumnNames();