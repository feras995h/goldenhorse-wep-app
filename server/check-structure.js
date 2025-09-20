import { Sequelize } from 'sequelize';

// Use the PostgreSQL connection string you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkTableStructure() {
  let sequelize;
  
  try {
    console.log('🔍 Checking table structure...');
    
    // Connect to PostgreSQL database
    sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database successfully');
    
    // Check table structure
    try {
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
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔒 Database connection closed');
    }
  }
}

checkTableStructure();