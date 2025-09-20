#!/usr/bin/env node

// Force synchronize production database models
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import PaymentModel from './src/models/Payment.js';

dotenv.config();

// Connect directly to production database
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:tP1Cf7Wf2A6H@194.28.243.162:5432/golden_horse_db', {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const Payment = PaymentModel(sequelize);

console.log('🔄 SYNCHRONIZING PRODUCTION DATABASE MODELS');
console.log('===========================================');

async function syncModels() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check current Payment model definition
    console.log('\n💰 Checking Payment model definition...');
    
    // Log model attributes
    console.log('Payment model attributes:', Object.keys(Payment.rawAttributes));
    
    // Check if currency attribute exists in model
    if (Payment.rawAttributes.currency) {
      console.log('✅ Currency attribute exists in Payment model');
      console.log('   Type:', Payment.rawAttributes.currency.type.constructor.name);
    } else {
      console.log('❌ Currency attribute missing from Payment model');
    }

    // Check if createdBy attribute exists in model  
    if (Payment.rawAttributes.createdBy) {
      console.log('✅ CreatedBy attribute exists in Payment model');
    } else {
      console.log('❌ CreatedBy attribute missing from Payment model');
    }

    console.log('\n🔄 Attempting model synchronization...');
    
    // Try to sync Payment model specifically
    try {
      await Payment.sync({ alter: true });
      console.log('✅ Payment model synchronized');
    } catch (syncError) {
      console.log('❌ Payment model sync failed:', syncError.message);
    }

    // Check database table columns directly
    console.log('\n🗃️ Checking actual database table columns...');
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Database table columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if there's a mismatch between model and database
    const modelColumns = Object.keys(Payment.rawAttributes);
    const dbColumns = tableInfo.map(col => col.column_name);
    
    const missingInDb = modelColumns.filter(col => !dbColumns.includes(col));
    const missingInModel = dbColumns.filter(col => !modelColumns.includes(col));
    
    if (missingInDb.length > 0) {
      console.log('\n❌ Columns in model but missing in database:', missingInDb);
    }
    
    if (missingInModel.length > 0) {
      console.log('\n⚠️ Columns in database but missing in model:', missingInModel);
    }

    if (missingInDb.length === 0 && missingInModel.length === 0) {
      console.log('\n✅ Model and database columns are synchronized');
    }

    // Test a simple Payment query to see exact error
    console.log('\n🧪 Testing Payment model query...');
    try {
      const paymentCount = await Payment.count({ limit: 1 });
      console.log(`✅ Payment query successful. Total payments: ${paymentCount}`);
    } catch (queryError) {
      console.log('❌ Payment query failed:', queryError.message);
      
      // Try a raw query to bypass model
      try {
        const rawCount = await sequelize.query('SELECT COUNT(*) as count FROM payments', {
          type: sequelize.QueryTypes.SELECT
        });
        console.log(`✅ Raw query successful. Total payments: ${rawCount[0].count}`);
        console.log('💡 Issue is with model definition, not database table');
      } catch (rawError) {
        console.log('❌ Raw query also failed:', rawError.message);
        console.log('💡 Issue is with database table itself');
      }
    }

    // Try to force reload models
    console.log('\n🔄 Attempting to reload all models...');
    try {
      await sequelize.sync({ alter: false, force: false });
      console.log('✅ All models reloaded successfully');
    } catch (reloadError) {
      console.log('❌ Model reload failed:', reloadError.message);
    }

    console.log('\n🎯 SYNCHRONIZATION COMPLETE');
    console.log('============================');

  } catch (error) {
    console.error('❌ Synchronization failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

syncModels().catch(console.error);