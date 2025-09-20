import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Force production environment for this diagnosis
process.env.NODE_ENV = 'production';

// Load environment variables
dotenv.config();

// Models are now defined above

console.log('🔍 PRODUCTION ERROR DIAGNOSIS');
console.log('============================');

// Production database connection
const databaseUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: console.log, // Enable logging to see actual queries
  dialectOptions: {
    ssl: false,
    connectTimeout: 30000
  },
  pool: {
    max: 2,
    min: 0,
    acquire: 30000,
    idle: 30000
  }
});

// Import models after setting up the production sequelize instance
import CustomerModel from './src/models/Customer.js';
import ShipmentModel from './src/models/Shipment.js';
import PaymentModel from './src/models/Payment.js';
import AccountModel from './src/models/Account.js';
import UserModel from './src/models/User.js';

// Initialize models with production sequelize
const Customer = CustomerModel(sequelize);
const Shipment = ShipmentModel(sequelize);
const Payment = PaymentModel(sequelize);
const Account = AccountModel(sequelize);
const User = UserModel(sequelize);

// Set up basic associations
Shipment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Payment.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });
Payment.belongsTo(Customer, { foreignKey: 'partyId', as: 'customer' });
Payment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

async function diagnoseErrors() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\n');

    // 1. Check shipments table
    console.log('📦 Checking shipments table...');
    try {
      const [result1] = await sequelize.query('SELECT COUNT(*) as count FROM shipments');
      console.log(`  ✅ Shipments table exists with ${result1[0].count} records`);
      
      // Try to query with models
      const shipmentCount = await Shipment.count();
      console.log(`  ✅ Shipment model working: ${shipmentCount} records`);
      
      // Test the specific query from the shipments endpoint
      const testQuery = await Shipment.findAndCountAll({
        where: {},
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'phone', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      });
      console.log(`  ✅ Complex shipments query working: ${testQuery.count} total, ${testQuery.rows.length} returned`);
      
    } catch (error) {
      console.log(`  ❌ Shipments error: ${error.message}`);
    }

    // 2. Check payment vouchers
    console.log('\n💰 Checking payment vouchers...');
    try {
      const [result2] = await sequelize.query('SELECT COUNT(*) as count FROM payments');
      console.log(`  ✅ Payments table exists with ${result2[0].count} records`);
      
      // Test the specific query from the payments endpoint
      const testPaymentQuery = await Payment.findAndCountAll({
        where: {},
        include: [
          { model: Account, as: 'account', attributes: ['id', 'code', 'name'] },
          { model: Customer, as: 'customer', attributes: ['id', 'name'], required: false }
        ],
        limit: 50,
        offset: 0,
        order: [['date', 'DESC']]
      });
      console.log(`  ✅ Complex payments query working: ${testPaymentQuery.count} total, ${testPaymentQuery.rows.length} returned`);
      
    } catch (error) {
      console.log(`  ❌ Payments error: ${error.message}`);
    }

    // 3. Check sales reports functionality
    console.log('\n📊 Checking sales reports functionality...');
    try {
      // Check if SalesInvoice table exists
      const [result3] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'sales_invoices'");
      if (result3.length > 0) {
        console.log('  ✅ sales_invoices table exists');
        const [salesCount] = await sequelize.query('SELECT COUNT(*) as count FROM sales_invoices');
        console.log(`  ✅ Sales invoices: ${salesCount[0].count} records`);
      } else {
        console.log('  ❌ sales_invoices table does not exist');
      }
      
      // Check customers table for sales reports
      const [customerResult] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
      console.log(`  ✅ Customers table: ${customerResult[0].count} records`);
      
    } catch (error) {
      console.log(`  ❌ Sales reports error: ${error.message}`);
    }

    // 4. Check specific models and associations
    console.log('\n🔗 Checking model associations...');
    try {
      // Check if Shipment associations are working
      const shipmentWithCustomer = await Shipment.findOne({
        include: [
          {
            model: Customer,
            as: 'customer',
            required: false
          }
        ]
      });
      console.log('  ✅ Shipment-Customer association working');
      
      // Check if Payment associations are working
      const paymentWithAccount = await Payment.findOne({
        include: [
          {
            model: Account,
            as: 'account',
            required: false
          }
        ]
      });
      console.log('  ✅ Payment-Account association working');
      
    } catch (error) {
      console.log(`  ❌ Association error: ${error.message}`);
    }

    // 5. Check for any schema mismatches
    console.log('\n🏗️ Checking schema integrity...');
    try {
      // Check shipments table structure
      const [shipmentCols] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shipments'");
      console.log(`  ✅ Shipments table has ${shipmentCols.length} columns`);
      
      // Check if createdBy column exists (this was mentioned in error)
      const hasCreatedBy = shipmentCols.some(col => col.column_name === 'createdBy');
      console.log(`  ${hasCreatedBy ? '✅' : '❌'} shipments.createdBy column ${hasCreatedBy ? 'exists' : 'missing'}`);
      
      // Check payments table structure
      const [paymentCols] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'");
      console.log(`  ✅ Payments table has ${paymentCols.length} columns`);
      
    } catch (error) {
      console.log(`  ❌ Schema check error: ${error.message}`);
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

diagnoseErrors();