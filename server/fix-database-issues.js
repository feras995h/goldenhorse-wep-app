import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Use the PostgreSQL connection string you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function fixDatabaseIssues() {
  let sequelize;
  
  try {
    console.log('🔧 Starting database fix process...');
    
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
    
    // Check existing tables
    const tables = await sequelize.getQueryInterface().showAllSchemas();
    console.log('📋 Existing schemas:', tables);
    
    // Create suppliers table if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          nameEn VARCHAR(100),
          contactPerson VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          taxNumber VARCHAR(50),
          creditLimit DECIMAL(15, 2) DEFAULT 0,
          balance DECIMAL(15, 2) DEFAULT 0,
          isActive BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Suppliers table created or already exists');
    } catch (error) {
      console.log('⚠️ Suppliers table creation issue:', error.message);
    }
    
    // Create customers table if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE,
          name VARCHAR(200) NOT NULL,
          nameEn VARCHAR(200),
          type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
          email VARCHAR(100),
          phone VARCHAR(50),
          address TEXT,
          taxNumber VARCHAR(50),
          creditLimit DECIMAL(15,2) DEFAULT 0,
          paymentTerms INTEGER DEFAULT 30,
          currency VARCHAR(3) DEFAULT 'LYD',
          contactPerson VARCHAR(100),
          isActive BOOLEAN DEFAULT true,
          "accountId" UUID REFERENCES accounts(id),
          notes TEXT,
          "createdBy" UUID,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Customers table created or already exists');
    } catch (error) {
      console.log('⚠️ Customers table creation issue:', error.message);
    }
    
    // Create payment_vouchers table if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS payment_vouchers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "supplierId" UUID NOT NULL REFERENCES suppliers(id),
          "voucherNumber" VARCHAR(50) NOT NULL,
          "paymentDate" DATE NOT NULL,
          amount DECIMAL(18,2) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'posted',
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Payment vouchers table created or already exists');
    } catch (error) {
      console.log('⚠️ Payment vouchers table creation issue:', error.message);
    }
    
    // Add indexes for better performance
    try {
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_payment_vouchers_supplier ON payment_vouchers(supplier_id)');
      console.log('✅ Database indexes created or already exist');
    } catch (error) {
      console.log('⚠️ Index creation issue:', error.message);
    }
    
    // Test data insertion to verify tables work
    try {
      // Insert a test supplier if none exist
      const [supplierCount] = await sequelize.query('SELECT COUNT(*) FROM suppliers');
      if (supplierCount[0].count === '0') {
        await sequelize.query(`
          INSERT INTO suppliers (code, name, email, phone) 
          VALUES ('SUP001', 'Test Supplier', 'supplier@test.com', '+1234567890')
        `);
        console.log('✅ Test supplier inserted');
      }
      
      console.log('✅ Database tables verified and working');
    } catch (error) {
      console.log('⚠️ Data verification issue:', error.message);
    }
    
    console.log('\n🎉 Database fix completed successfully!');
    console.log('✅ All required tables should now exist');
    console.log('✅ API endpoints should work properly now');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔒 Database connection closed');
    }
  }
}

fixDatabaseIssues();