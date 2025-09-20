// Check fixed assets table constraints
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkFixedAssetsConstraints() {
  try {
    console.log('🔍 Checking fixed assets table constraints...');
    
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
    
    // Check table constraints
    try {
      const [constraints] = await sequelize.query(`
        SELECT conname, contype, conkey, confkey, confrelid::regclass
        FROM pg_constraint 
        WHERE conrelid = 'fixed_assets'::regclass
        ORDER BY contype
      `);
      
      console.log('📋 Fixed assets table constraints:');
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.conname} (${constraint.contype})`);
        if (constraint.confrelid) {
          console.log(`    References: ${constraint.confrelid}`);
        }
      });
    } catch (error) {
      console.log('❌ Error checking table constraints:', error.message);
    }
    
    // Check column constraints
    try {
      const [columnConstraints] = await sequelize.query(`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = 'fixed_assets' 
          AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE')
        ORDER BY tc.constraint_type, tc.constraint_name
      `);
      
      console.log('\n📋 Fixed assets column constraints:');
      columnConstraints.forEach(constraint => {
        if (constraint.constraint_type === 'FOREIGN KEY') {
          console.log(`  - ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name} (${constraint.constraint_name})`);
        } else {
          console.log(`  - ${constraint.column_name} (${constraint.constraint_type}) (${constraint.constraint_name})`);
        }
      });
    } catch (error) {
      console.log('❌ Error checking column constraints:', error.message);
    }
    
    // Check for any check constraints
    try {
      const [checkConstraints] = await sequelize.query(`
        SELECT conname, consrc
        FROM pg_constraint 
        WHERE conrelid = 'fixed_assets'::regclass 
          AND contype = 'c'
      `);
      
      console.log('\n📋 Fixed assets check constraints:');
      if (checkConstraints.length === 0) {
        console.log('  - No check constraints found');
      } else {
        checkConstraints.forEach(constraint => {
          console.log(`  - ${constraint.conname}: ${constraint.consrc}`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking check constraints:', error.message);
    }
    
    // Try to create a fixed asset with name "F" directly
    console.log('\n🧪 Testing fixed asset creation with name "F"...');
    try {
      const [result] = await sequelize.query(`
        INSERT INTO fixed_assets (
          id, "assetNumber", name, category, "categoryAccountId", "purchaseDate",
          "purchaseCost", "usefulLife", "depreciationMethod", "currentValue", 
          status, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'TEST-F-CONSTRAINT-' || floor(random() * 1000000)::text, 'F', 'other', 
          (SELECT id FROM accounts WHERE code LIKE '1.2.%' AND level = 3 LIMIT 1),
          '2025-09-20', 1000, 5, 'straight_line', 1000, 'active', NOW(), NOW()
        ) RETURNING id, "assetNumber", name
      `);
      
      console.log('✅ Fixed asset with name "F" created successfully:', result[0]);
      
      // Clean up
      await sequelize.query(`
        DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
      `, {
        replacements: { assetNumber: result[0].assetNumber }
      });
      
      console.log('🗑️ Cleaned up test asset');
    } catch (error) {
      console.log('❌ Error creating fixed asset with name "F":', error.message);
      if (error.detail) {
        console.log('   Detail:', error.detail);
      }
    }
    
    await sequelize.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFixedAssetsConstraints();