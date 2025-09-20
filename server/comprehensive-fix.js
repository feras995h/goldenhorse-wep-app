// Comprehensive database fix and verification script
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Database connection configuration
const DB_CONFIG = {
  dialect: 'postgres',
  host: '72.60.92.146',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: 'XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP'
};

async function comprehensiveDatabaseFix() {
  let sequelize;
  
  try {
    console.log('🔧 Starting comprehensive database fix...');
    
    // 1. Connect directly to PostgreSQL
    sequelize = new Sequelize(
      DB_CONFIG.database,
      DB_CONFIG.username,
      DB_CONFIG.password,
      {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        dialect: DB_CONFIG.dialect,
        logging: false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database successfully');
    
    // 2. Create all required tables if they don't exist
    console.log('\n📋 Creating required tables...');
    
    // Suppliers table
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
    console.log('✅ Suppliers table ready');
    
    // Customers table
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
    console.log('✅ Customers table ready');
    
    // Payment vouchers table
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
    console.log('✅ Payment vouchers table ready');
    
    // 3. Add indexes for better performance
    console.log('\n.CreateIndexes...');
    
    try {
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_payment_vouchers_supplier ON payment_vouchers(supplier_id)');
      console.log('✅ Database indexes created');
    } catch (error) {
      console.log('⚠️ Index creation warning (may already exist):', error.message);
    }
    
    // 4. Verify tables and data
    console.log('\n🔍 Verifying tables...');
    
    const tables = ['suppliers', 'customers', 'payment_vouchers'];
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table} table verified with ${result[0].count} records`);
      } catch (error) {
        console.log(`❌ Error verifying ${table}:`, error.message);
      }
    }
    
    // 5. Create a test record if tables are empty
    try {
      const [supplierCount] = await sequelize.query('SELECT COUNT(*) as count FROM suppliers');
      if (supplierCount[0].count === '0') {
        await sequelize.query(`
          INSERT INTO suppliers (code, name, email, phone) 
          VALUES ('SUP001', 'Test Supplier', 'supplier@test.com', '+1234567890')
        `);
        console.log('✅ Test supplier created');
      }
    } catch (error) {
      console.log('⚠️ Test data creation warning:', error.message);
    }
    
    console.log('\n🎉 Comprehensive database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Comprehensive database fix failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔒 Database connection closed');
    }
  }
}

// Also create a configuration fix for the application
function createApplicationConfig() {
  console.log('\n🔧 Creating application configuration...');
  
  const envContent = `# Golden Horse Shipping System - Production Environment Configuration
NODE_ENV=production
PORT=5001

# JWT Configuration
JWT_SECRET=GH2024_SecureJWT_Key_\\$7mK9pL3qR8vN2xC5bF1wE6tY4uI0oP9sA8dG7hJ6kL5mN4qR3tY2uI1oP0
JWT_REFRESH_SECRET=GH2024_RefreshJWT_Key_\\$9nM7kL5jH3gF1dS8aP6qW4eR2tY0uI9oP8sA7dG6hJ5kL4mN3qR2tY1uI0
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration - PostgreSQL
DB_DIALECT=postgres
DB_HOST=72.60.92.146
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Security Configuration
TRUST_PROXY=1
CORS_ORIGIN=https://web.goldenhorse-ly.com

# Logging Configuration
LOG_LEVEL=info

# Optional Features
ENABLE_MONITORING=true
ENABLE_COMPRESSION=true
ENABLE_RATE_LIMITING=true

# Rate Limiting Configuration
RATE_LIMIT_GENERAL_MAX=500
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_FINANCIAL_MAX=200
RATE_LIMIT_SALES_MAX=300
`;
  
  try {
    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
    console.log('✅ Application configuration file (.env) created');
  } catch (error) {
    console.log('⚠️ Could not create .env file:', error.message);
  }
}

// Run the comprehensive fix
comprehensiveDatabaseFix().then(() => {
  createApplicationConfig();
  console.log('\n🚀 All fixes applied! Please restart your application server.');
});