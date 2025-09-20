import models, { sequelize } from './src/models/index.js';

async function verifyFix() {
  try {
    console.log('🔍 Verifying database fix...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
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
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

verifyFix();