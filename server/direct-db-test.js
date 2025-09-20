// Create a simple test to directly connect to the database
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function testConnection() {
  try {
    console.log('Testing direct database connection...');
    
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
    console.log('✅ Direct database connection successful');
    
    // Test if tables exist
    try {
      const [result] = await sequelize.query('SELECT COUNT(*) as count FROM suppliers');
      console.log(`✅ Suppliers table exists with ${result[0].count} records`);
    } catch (error) {
      console.log('❌ Suppliers table error:', error.message);
    }
    
    try {
      const [result] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
      console.log(`✅ Customers table exists with ${result[0].count} records`);
    } catch (error) {
      console.log('❌ Customers table error:', error.message);
    }
    
    try {
      const [result] = await sequelize.query('SELECT COUNT(*) as count FROM payment_vouchers');
      console.log(`✅ Payment vouchers table exists with ${result[0].count} records`);
    } catch (error) {
      console.log('❌ Payment vouchers table error:', error.message);
    }
    
    await sequelize.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();