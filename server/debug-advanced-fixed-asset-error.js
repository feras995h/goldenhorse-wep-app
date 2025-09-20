import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function debugAdvancedFixedAssetError() {
  try {
    console.log('🔍 Debugging advanced fixed asset creation error with name "F"...');
    
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
    
    // Test data with name "F"
    const testAssetData = {
      id: uuidv4(),
      assetNumber: 'TEST-F-ADV-' + Date.now(),
      name: 'F', // This might be the source of the "F" error
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-20',
      purchaseCost: 1000,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      status: 'active'
    };
    
    console.log('📝 Test data:', testAssetData);
    
    // Try to create the fixed asset directly first
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
      
      // Now try to create accounts for this asset (this is where the error might occur)
      console.log('\n🏗️ Trying to create accounts for asset with name "F"...');
      
      // Get the category account details
      const [categoryAccount] = await sequelize.query(`
        SELECT id, code, name, level, "parentId"
        FROM accounts 
        WHERE id = :categoryId
      `, {
        replacements: { categoryId: testAssetData.categoryAccountId },
        type: Sequelize.QueryTypes.SELECT
      });
      
      console.log('📋 Category account:', categoryAccount);
      
      // Try to generate next sub-account code
      console.log('\n🔢 Generating next sub-account code...');
      const existingCodes = await sequelize.query(`
        SELECT code FROM accounts 
        WHERE code LIKE :parentPattern
        ORDER BY code ASC
      `, {
        replacements: { parentPattern: `${categoryAccount.code}.%` },
        type: Sequelize.QueryTypes.SELECT
      });
      
      console.log('📋 Existing codes under this category:', existingCodes.length);
      
      let maxNumber = 0;
      const pattern = new RegExp(`^${categoryAccount.code.replace('.', '\\.')}\\.([0-9]+)$`);
      
      existingCodes.forEach(account => {
        const match = account.code.match(pattern);
        if (match) {
          const number = parseInt(match[1]);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      });
      
      const nextNumber = maxNumber + 1;
      const nextSubCode = `${categoryAccount.code}.${String(nextNumber).padStart(3, '0')}`;
      console.log('🔢 Next sub-account code:', nextSubCode);
      
      // Try to create the asset account
      console.log('\n🏦 Creating asset account...');
      const assetAccountData = {
        id: uuidv4(),
        code: nextSubCode,
        name: `${testAssetData.name} - أصل`, // This might be the issue: "F - أصل"
        nameEn: `${testAssetData.name} - Asset`,
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: categoryAccount.id,
        level: categoryAccount.level + 1,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: `حساب الأصل الثابت: ${testAssetData.name}`,
        isSystemAccount: false
      };
      
      console.log('📝 Asset account data:', assetAccountData);
      
      try {
        const [assetAccountResult] = await sequelize.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType",
            "parentId", level, "isGroup", "isActive", balance, currency,
            nature, "accountType", description, "isSystemAccount",
            "createdAt", "updatedAt"
          ) VALUES (
            :id, :code, :name, :nameEn, :type, :rootType, :reportType,
            :parentId, :level, :isGroup, :isActive, :balance, :currency,
            :nature, :accountType, :description, :isSystemAccount,
            NOW(), NOW()
          ) RETURNING id, code, name
        `, {
          replacements: assetAccountData,
          type: Sequelize.QueryTypes.INSERT
        });
        
        console.log('✅ Asset account created successfully:', assetAccountResult[0]);
        
        // Clean up the account
        await sequelize.query(`
          DELETE FROM accounts WHERE id = :accountId
        `, {
          replacements: { accountId: assetAccountData.id }
        });
        console.log('🗑️ Cleaned up asset account');
        
      } catch (accountError) {
        console.log('❌ Error creating asset account:', accountError.message);
        console.log('Error code:', accountError.code);
        console.log('Error detail:', accountError.detail);
      }
      
      // Clean up the fixed asset
      await sequelize.query(`
        DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
      `, {
        replacements: { assetNumber: testAssetData.assetNumber }
      });
      
      console.log('🗑️ Cleaned up fixed asset');
      
    } catch (error) {
      console.log('❌ Error in advanced fixed asset creation:', error.message);
      console.log('Error code:', error.code);
      console.log('Error detail:', error.detail);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugAdvancedFixedAssetError();