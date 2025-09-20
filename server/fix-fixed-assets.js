// Fix fixed assets table structure
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function fixFixedAssetsTable() {
  try {
    console.log('🔧 Fixing fixed assets table structure...');
    
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
    
    // Add missing columns
    const missingColumns = [
      { name: 'nameEn', type: 'VARCHAR(200)' },
      { name: 'serialNumber', type: 'VARCHAR(100)' },
      { name: 'model', type: 'VARCHAR(100)' },
      { name: 'manufacturer', type: 'VARCHAR(100)' },
      { name: 'currency', type: 'VARCHAR(3) DEFAULT \'LYD\'' },
      { name: 'assetAccountId', type: 'UUID REFERENCES accounts(id)' },
      { name: 'depreciationExpenseAccountId', type: 'UUID REFERENCES accounts(id)' },
      { name: 'accumulatedDepreciationAccountId', type: 'UUID REFERENCES accounts(id)' },
      { name: 'createdBy', type: 'UUID' }
    ];
    
    for (const column of missingColumns) {
      try {
        await sequelize.query(`
          ALTER TABLE fixed_assets 
          ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}
        `);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Column already exists: ${column.name}`);
        } else {
          console.log(`❌ Error adding column ${column.name}:`, error.message);
        }
      }
    }
    
    // Check final table structure
    try {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'fixed_assets'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Final fixed assets table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } catch (error) {
      console.log('❌ Error checking final table structure:', error.message);
    }
    
    await sequelize.close();
    console.log('\n🎉 Fixed assets table structure fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFixedAssetsTable();