import models, { sequelize } from './src/models/index.js';

// Force production environment and set database URL
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function verifyFix() {
  try {
    console.log('🔍 Verifying database fix in production mode...');
    console.log('Environment:', process.env.NODE_ENV);
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Show database dialect
    console.log('Database dialect:', sequelize.getDialect());
    
    // Test if all required tables exist
    const tablesToCheck = ['suppliers', 'customers', 'payment_vouchers'];
    
    for (const table of tablesToCheck) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table} table exists with ${result[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table} table error:`, error.message);
      }
    }
    
    // Test Sequelize models
    console.log('\n🔍 Testing Sequelize models...');
    
    // Test Supplier model
    try {
      const supplierCount = await models.Supplier.count();
      console.log(`✅ Supplier model working, found ${supplierCount} suppliers`);
    } catch (error) {
      console.log('❌ Supplier model error:', error.message);
    }
    
    // Test Customer model
    try {
      const customerCount = await models.Customer.count();
      console.log(`✅ Customer model working, found ${customerCount} customers`);
    } catch (error) {
      console.log('❌ Customer model error:', error.message);
    }
    
    // Test PaymentVoucher model
    try {
      const voucherCount = await models.PaymentVoucher.count();
      console.log(`✅ PaymentVoucher model working, found ${voucherCount} vouchers`);
    } catch (error) {
      console.log('❌ PaymentVoucher model error:', error.message);
    }
    
    console.log('\n🎉 Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

verifyFix();