import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function debugEnumValues() {
  try {
    console.log('🔍 Debugging ENUM values for fixed assets...');
    
    // Check ENUM values for fixed assets
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'enum_fixed_assets_depreciationMethod'
      ORDER BY e.enumsortorder
    `);
    
    console.log('📋 Depreciation Method ENUM values:');
    enumValues.forEach(val => {
      console.log(`   - ${val.enumlabel}`);
    });
    
    const [statusEnumValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'enum_fixed_assets_status'
      ORDER BY e.enumsortorder
    `);
    
    console.log('\n📋 Status ENUM values:');
    statusEnumValues.forEach(val => {
      console.log(`   - ${val.enumlabel}`);
    });
    
    const [categoryEnumValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'enum_fixed_assets_category'
      ORDER BY e.enumsortorder
    `);
    
    console.log('\n📋 Category ENUM values:');
    categoryEnumValues.forEach(val => {
      console.log(`   - ${val.enumlabel}`);
    });
    
    // Get available category accounts
    const [categories] = await sequelize.query(`
      SELECT id, code, name, level 
      FROM accounts 
      WHERE code LIKE '1.2.%' 
      AND code != '1.2' 
      AND level = 3 
      AND "isActive" = true
      ORDER BY code
      LIMIT 3
    `);
    
    console.log('\n📊 Available category accounts:', categories.length);
    categories.forEach(cat => {
      console.log(`   ${cat.code}: ${cat.name} (level ${cat.level})`);
    });
    
    if (categories.length === 0) {
      console.log('❌ No category accounts available');
      return;
    }
    
    // Test with various ENUM values
    const testCases = [
      {
        name: 'F',
        depreciationMethod: 'straight_line',
        status: 'active',
        category: 'other'
      },
      {
        name: 'F',
        depreciationMethod: 'declining_balance',
        status: 'active',
        category: 'other'
      },
      {
        name: 'F',
        depreciationMethod: 'sum_of_years',
        status: 'active',
        category: 'other'
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 Test case ${i + 1}:`, testCase);
      
      const testAssetData = {
        id: uuidv4(),
        assetNumber: `TEST-ENUM-${i}-${Date.now()}`,
        name: testCase.name,
        category: testCase.category,
        categoryAccountId: categories[0].id,
        purchaseDate: '2025-09-20',
        purchaseCost: 1000,
        usefulLife: 5,
        depreciationMethod: testCase.depreciationMethod,
        status: testCase.status,
        currentValue: 1000
      };
      
      try {
        // Try to create using the model (this might show validation errors)
        const [result] = await sequelize.query(`
          INSERT INTO fixed_assets (
            id, "assetNumber", name, category, "categoryAccountId", "purchaseDate",
            "purchaseCost", "usefulLife", "depreciationMethod", status, "currentValue",
            "createdAt", "updatedAt"
          ) VALUES (
            :id, :assetNumber, :name, :category, :categoryAccountId, :purchaseDate,
            :purchaseCost, :usefulLife, :depreciationMethod, :status, :currentValue,
            NOW(), NOW()
          ) RETURNING id, "assetNumber", name
        `, {
          replacements: testAssetData,
          type: Sequelize.QueryTypes.INSERT
        });
        
        console.log(`✅ Test case ${i + 1} succeeded:`, result[0]);
        
        // Clean up
        await sequelize.query(`
          DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
        `, {
          replacements: { assetNumber: testAssetData.assetNumber }
        });
        
      } catch (error) {
        console.log(`❌ Test case ${i + 1} failed:`, error.message);
        if (error.detail) {
          console.log('   Detail:', error.detail);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugEnumValues();