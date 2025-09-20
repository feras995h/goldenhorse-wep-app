import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔧 Fixing missing createdBy columns in production database...');

const databaseUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function fixMissingColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database successfully');
    
    // List of tables that should have createdBy column
    const tablesNeedingCreatedBy = [
      'company_settings',
      'notifications',
      'settings',
      'fixed_assets',
      'journal_entries',
      'journal_entry_details',
      'gl_entries',
      'gl_entry_details',
      'receipts',
      'payment_vouchers',
      'purchase_invoices',
      'purchase_invoice_items'
    ];
    
    console.log('\n🔍 Checking and adding missing createdBy columns...');
    
    for (const tableName of tablesNeedingCreatedBy) {
      try {
        // Check if table exists first
        const [tableExists] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${tableName}'
        `);
        
        if (tableExists.length === 0) {
          console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
          continue;
        }
        
        // Check if createdBy column exists
        const [columnExists] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}' 
          AND column_name = 'createdBy'
        `);
        
        if (columnExists.length === 0) {
          // Add createdBy column
          await sequelize.query(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN "createdBy" UUID REFERENCES users(id)
          `);
          console.log(`✅ Added createdBy column to ${tableName}`);
        } else {
          console.log(`ℹ️  Column createdBy already exists in ${tableName}`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${tableName}: ${error.message}`);
      }
    }
    
    // Special handling for company_settings table
    console.log('\n🏢 Handling company_settings table...');
    try {
      const [companySettingsExists] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'company_settings'
      `);
      
      if (companySettingsExists.length === 0) {
        // Create company_settings table
        await sequelize.query(`
          CREATE TABLE company_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(200) NOT NULL,
            "nameEn" VARCHAR(200),
            logo TEXT,
            address TEXT NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL,
            website VARCHAR(100),
            "taxNumber" VARCHAR(50),
            "commercialRegister" VARCHAR(50),
            "bankAccount" VARCHAR(50),
            "bankName" VARCHAR(100),
            iban VARCHAR(50),
            "swiftCode" VARCHAR(20),
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "createdBy" UUID REFERENCES users(id)
          )
        `);
        console.log('✅ Created company_settings table with createdBy column');
      }
    } catch (error) {
      console.log(`⚠️  Company settings table handling: ${error.message}`);
    }
    
    console.log('\n🎉 Missing columns fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing missing columns:', error);
    console.error('Details:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

fixMissingColumns();