// Check fixed assets table structure
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkFixedAssetsTable() {
  try {
    console.log('🔍 Checking fixed assets table structure...');
    
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
    console.log('✅ Database connection successful');
    
    // Check if fixed_assets table exists
    try {
      const [result] = await sequelize.query('SELECT COUNT(*) as count FROM fixed_assets');
      console.log(`✅ Fixed assets table exists with ${result[0].count} records`);
    } catch (error) {
      console.log('❌ Fixed assets table does not exist or is inaccessible');
      console.log('Error:', error.message);
      
      // Try to create the table
      try {
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS fixed_assets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "assetNumber" VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            "nameEn" VARCHAR(200),
            "categoryAccountId" UUID REFERENCES accounts(id),
            "purchaseDate" DATE NOT NULL,
            "purchaseCost" DECIMAL(15,2) NOT NULL,
            "salvageValue" DECIMAL(15,2) DEFAULT 0,
            "usefulLife" INTEGER NOT NULL,
            "depreciationMethod" VARCHAR(20) DEFAULT 'straight_line',
            "currentValue" DECIMAL(15,2),
            "accumulatedDepreciation" DECIMAL(15,2) DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            location VARCHAR(200),
            "serialNumber" VARCHAR(100),
            model VARCHAR(100),
            manufacturer VARCHAR(100),
            currency VARCHAR(3) DEFAULT 'LYD',
            description TEXT,
            "assetAccountId" UUID REFERENCES accounts(id),
            "depreciationExpenseAccountId" UUID REFERENCES accounts(id),
            "accumulatedDepreciationAccountId" UUID REFERENCES accounts(id),
            "createdBy" UUID,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Fixed assets table created successfully');
      } catch (createError) {
        console.log('❌ Error creating fixed assets table:', createError.message);
      }
    }
    
    // Check table structure
    try {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'fixed_assets'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Fixed assets table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
    }
    
    await sequelize.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFixedAssetsTable();