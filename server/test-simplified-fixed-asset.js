import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function testSimplifiedFixedAssetCreation() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🧪 Testing simplified fixed asset creation with name "F"...');
    
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
      await transaction.rollback();
      return;
    }
    
    // Test data with name "F"
    const assetData = {
      id: uuidv4(),
      assetNumber: 'TEST-F-SIMPLIFIED-' + Date.now(),
      name: 'F', // This was causing the error
      category: 'other',
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-20',
      purchaseCost: 1000,
      salvageValue: 0,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      currentValue: 1000,
      status: 'active',
      location: 'Test Location',
      description: 'Test asset with name F - Simplified version'
    };
    
    console.log('\n📝 Asset data:', assetData);
    
    // Create the fixed asset (simplified version - no complex account creation)
    console.log('\n🏗️ Creating fixed asset (simplified version)...');
    const [result] = await sequelize.query(`
      INSERT INTO fixed_assets (
        id, "assetNumber", name, category, "categoryAccountId", "purchaseDate",
        "purchaseCost", "salvageValue", "usefulLife", "depreciationMethod", 
        "currentValue", status, location, description, "createdAt", "updatedAt"
      ) VALUES (
        :id, :assetNumber, :name, :category, :categoryAccountId, :purchaseDate,
        :purchaseCost, :salvageValue, :usefulLife, :depreciationMethod,
        :currentValue, :status, :location, :description, NOW(), NOW()
      ) RETURNING id, "assetNumber", name
    `, {
      replacements: assetData,
      transaction,
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ Fixed asset created successfully:', result[0]);
    
    // Commit the transaction
    await transaction.commit();
    console.log('✅ Transaction committed');
    
    // Clean up
    await sequelize.query(`
      DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
    `, {
      replacements: { assetNumber: assetData.assetNumber }
    });
    
    console.log('🗑️ Cleaned up test asset');
    console.log('\n🎉 Simplified fixed asset creation with name "F" works perfectly!');
    
  } catch (error) {
    console.log('❌ Error in simplified fixed asset creation:', error.message);
    await transaction.rollback();
    console.log('🗑️ Transaction rolled back due to error');
  } finally {
    await sequelize.close();
  }
}

testSimplifiedFixedAssetCreation();