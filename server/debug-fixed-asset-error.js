import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function debugFixedAssetError() {
  try {
    console.log('🔍 Debugging fixed asset creation error...');
    
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
    
    console.log('📊 Available category accounts:', categories.length);
    categories.forEach(cat => {
      console.log(`   ${cat.code}: ${cat.name} (level ${cat.level})`);
    });
    
    if (categories.length === 0) {
      console.log('❌ No category accounts available');
      return;
    }
    
    // Test data that might cause the "F" error
    const testAssetData = {
      id: uuidv4(),
      assetNumber: 'TEST-F-' + Date.now(),
      name: 'F', // This might be the source of the "F" error
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-20',
      purchaseCost: 1000,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      status: 'active'
    };
    
    console.log('📝 Test data:', testAssetData);
    
    // Try to create the fixed asset
    try {
      const [result] = await sequelize.query(`
        INSERT INTO fixed_assets (
          id, "assetNumber", name, "categoryAccountId", "purchaseDate",
          "purchaseCost", "usefulLife", "depreciationMethod", status,
          "currentValue", "createdAt", "updatedAt"
        ) VALUES (
          :id, :assetNumber, :name, :categoryAccountId, :purchaseDate,
          :purchaseCost, :usefulLife, :depreciationMethod, :status,
          :purchaseCost, NOW(), NOW()
        ) RETURNING id, "assetNumber", name
      `, {
        replacements: testAssetData,
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ Fixed asset created successfully:', result[0]);
      
      // Clean up
      await sequelize.query(`
        DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
      `, {
        replacements: { assetNumber: testAssetData.assetNumber }
      });
      
      console.log('🗑️ Cleaned up test data');
      
    } catch (error) {
      console.log('❌ Error creating fixed asset:', error.message);
      console.log('Error code:', error.code);
      console.log('Error detail:', error.detail);
    }
    
    // Try with different name
    const testAssetData2 = {
      id: uuidv4(),
      assetNumber: 'TEST-F2-' + Date.now(),
      name: 'Fixed Asset F', // Different name
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-20',
      purchaseCost: 1000,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      status: 'active'
    };
    
    console.log('\n📝 Test data 2:', testAssetData2);
    
    try {
      const [result] = await sequelize.query(`
        INSERT INTO fixed_assets (
          id, "assetNumber", name, "categoryAccountId", "purchaseDate",
          "purchaseCost", "usefulLife", "depreciationMethod", status,
          "currentValue", "createdAt", "updatedAt"
        ) VALUES (
          :id, :assetNumber, :name, :categoryAccountId, :purchaseDate,
          :purchaseCost, :usefulLife, :depreciationMethod, :status,
          :purchaseCost, NOW(), NOW()
        ) RETURNING id, "assetNumber", name
      `, {
        replacements: testAssetData2,
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ Fixed asset 2 created successfully:', result[0]);
      
      // Clean up
      await sequelize.query(`
        DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
      `, {
        replacements: { assetNumber: testAssetData2.assetNumber }
      });
      
      console.log('🗑️ Cleaned up test data 2');
      
    } catch (error) {
      console.log('❌ Error creating fixed asset 2:', error.message);
      console.log('Error code:', error.code);
      console.log('Error detail:', error.detail);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugFixedAssetError();