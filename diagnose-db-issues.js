import models, { sequelize } from './server/src/models/index.js';

async function diagnoseDatabaseIssues() {
  try {
    console.log('🔍 Diagnosing database issues...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if suppliers table exists
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM suppliers LIMIT 1"
      );
      console.log('✅ Suppliers table exists');
      console.log('Suppliers count:', results[0].count);
    } catch (error) {
      console.log('❌ Suppliers table does not exist or is inaccessible');
      console.log('Error:', error.message);
    }
    
    // Check if customers table exists
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM customers LIMIT 1"
      );
      console.log('✅ Customers table exists');
      console.log('Customers count:', results[0].count);
    } catch (error) {
      console.log('❌ Customers table does not exist or is inaccessible');
      console.log('Error:', error.message);
    }
    
    // Check if payment_vouchers table exists
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM payment_vouchers LIMIT 1"
      );
      console.log('✅ Payment vouchers table exists');
      console.log('Payment vouchers count:', results[0].count);
    } catch (error) {
      console.log('❌ Payment vouchers table does not exist or is inaccessible');
      console.log('Error:', error.message);
    }
    
    // List all tables
    try {
      const tables = await sequelize.getQueryInterface().showAllSchemas();
      console.log('📋 All database tables:');
      console.log(tables);
    } catch (error) {
      console.log('❌ Could not list tables');
      console.log('Error:', error.message);
    }
    
    // Check Sequelize models
    console.log('📋 Sequelize models available:');
    Object.keys(models).forEach(modelName => {
      console.log(`- ${modelName}`);
    });
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

diagnoseDatabaseIssues();