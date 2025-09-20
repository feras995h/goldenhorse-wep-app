import { Sequelize } from 'sequelize';

// Production database connection
const databaseUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: console.log,
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

console.log('🔧 FIXING PRODUCTION DATABASE SCHEMA');
console.log('====================================');

async function fixDatabaseSchema() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\n');

    // 1. Check and fix payments table
    console.log('💰 Checking payments table schema...');
    const [paymentCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Found ${paymentCols.length} columns in payments table:`);
    paymentCols.forEach(col => {
      console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if createdBy column exists
    const hasCreatedBy = paymentCols.some(col => col.column_name === 'createdBy');
    
    if (!hasCreatedBy) {
      console.log('\n   ❌ Missing createdBy column, adding it...');
      await sequelize.query(`
        ALTER TABLE payments 
        ADD COLUMN "createdBy" UUID REFERENCES users(id)
      `);
      console.log('   ✅ createdBy column added successfully');
    } else {
      console.log('   ✅ createdBy column already exists');
    }

    // Check if completedBy and completedAt columns exist
    const hasCompletedBy = paymentCols.some(col => col.column_name === 'completedBy');
    const hasCompletedAt = paymentCols.some(col => col.column_name === 'completedAt');

    if (!hasCompletedBy) {
      console.log('   ❌ Missing completedBy column, adding it...');
      await sequelize.query(`
        ALTER TABLE payments 
        ADD COLUMN "completedBy" UUID REFERENCES users(id)
      `);
      console.log('   ✅ completedBy column added successfully');
    }

    if (!hasCompletedAt) {
      console.log('   ❌ Missing completedAt column, adding it...');
      await sequelize.query(`
        ALTER TABLE payments 
        ADD COLUMN "completedAt" TIMESTAMP
      `);
      console.log('   ✅ completedAt column added successfully');
    }

    // 2. Check and fix shipments table
    console.log('\n📦 Checking shipments table schema...');
    const [shipmentCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'shipments' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Found ${shipmentCols.length} columns in shipments table`);
    
    // Check if volume column exists
    const hasVolume = shipmentCols.some(col => col.column_name === 'volume');
    if (!hasVolume) {
      console.log('   ❌ Missing volume column, adding it...');
      await sequelize.query(`
        ALTER TABLE shipments 
        ADD COLUMN volume DECIMAL(15,3)
      `);
      console.log('   ✅ volume column added successfully');
    } else {
      console.log('   ✅ volume column already exists');
    }

    // 3. Check customers table for customerType column (found in error)
    console.log('\n🏢 Checking customers table schema...');
    const [customerCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Found ${customerCols.length} columns in customers table`);
    
    const hasCustomerType = customerCols.some(col => col.column_name === 'customerType');
    if (!hasCustomerType) {
      console.log('   ❌ Missing customerType column, adding it...');
      await sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN "customerType" VARCHAR(50) DEFAULT 'individual'
      `);
      console.log('   ✅ customerType column added successfully');
    } else {
      console.log('   ✅ customerType column already exists');
    }

    // 4. Verify sales_invoices table exists (for reports)
    console.log('\n📊 Checking sales_invoices table...');
    const [salesInvoiceTable] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'sales_invoices'
    `);
    
    if (salesInvoiceTable.length === 0) {
      console.log('   ❌ sales_invoices table missing, creating it...');
      await sequelize.query(`
        CREATE TABLE sales_invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
          "customerId" UUID NOT NULL REFERENCES customers(id),
          date DATE NOT NULL,
          "dueDate" DATE NOT NULL,
          subtotal DECIMAL(15,2) DEFAULT 0.00,
          "discountAmount" DECIMAL(15,2) DEFAULT 0.00,
          "taxAmount" DECIMAL(15,2) DEFAULT 0.00,
          total DECIMAL(15,2) DEFAULT 0.00,
          "paidAmount" DECIMAL(15,2) DEFAULT 0.00,
          "outstandingAmount" DECIMAL(15,2) DEFAULT 0.00,
          currency VARCHAR(10) DEFAULT 'LYD',
          status VARCHAR(20) DEFAULT 'draft',
          "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
          notes TEXT,
          "salesPerson" VARCHAR(100),
          "createdBy" UUID REFERENCES users(id),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ sales_invoices table created successfully');
    } else {
      console.log('   ✅ sales_invoices table already exists');
    }

    console.log('\n🎯 DATABASE SCHEMA FIXES COMPLETE');
    console.log('==================================');
    console.log('✅ All missing columns have been added');
    console.log('✅ Database schema is now up to date');

  } catch (error) {
    console.error('❌ Error fixing database schema:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

fixDatabaseSchema();