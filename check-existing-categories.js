import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkExistingCategories() {
  let sequelize;
  
  try {
    console.log('🔍 Checking existing Fixed Asset Categories...');
    console.log('📅 Date:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    sequelize = new Sequelize(DATABASE_URL, {
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
    
    // 1. Check main Assets account
    console.log('\n1️⃣ Checking main Assets account...');
    const [assetsRoot] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "isActive"
      FROM accounts 
      WHERE code = '1' AND type = 'asset'
    `);
    
    if (assetsRoot.length > 0) {
      console.log('✅ Main Assets account found:', assetsRoot[0].name, `(${assetsRoot[0].code})`);
    } else {
      console.log('❌ Main Assets account not found');
    }
    
    // 2. Check Fixed Assets parent
    console.log('\n2️⃣ Checking Fixed Assets parent...');
    const [fixedAssetsParent] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    `);
    
    if (fixedAssetsParent.length > 0) {
      console.log('✅ Fixed Assets parent found:', fixedAssetsParent[0].name, `(${fixedAssetsParent[0].code})`);
      console.log('   Parent ID:', fixedAssetsParent[0].id);
    } else {
      console.log('❌ Fixed Assets parent not found');
    }
    
    // 3. Check all asset accounts under Fixed Assets
    console.log('\n3️⃣ Checking all asset accounts under Fixed Assets...');
    const [allAssetAccounts] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive", "isGroup"
      FROM accounts 
      WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
      AND type = 'asset'
      ORDER BY code
    `);
    
    console.log(`📊 Found ${allAssetAccounts.length} asset accounts under Fixed Assets:`);
    allAssetAccounts.forEach((account, index) => {
      const status = account.isActive ? '✅' : '❌';
      const type = account.isGroup ? '(Group)' : '(Category)';
      console.log(`   ${index + 1}. ${status} ${account.code} - ${account.name} ${type}`);
    });
    
    // 4. Check specifically for leaf categories (non-group accounts)
    console.log('\n4️⃣ Checking leaf categories (non-group accounts)...');
    const [leafCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
      AND type = 'asset'
      AND "isGroup" = false
      AND "isActive" = true
      ORDER BY code
    `);
    
    console.log(`📋 Found ${leafCategories.length} active leaf categories:`);
    leafCategories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.code} - ${category.name} (ID: ${category.id})`);
    });
    
    // 5. Check if there are any accounts with "fixed" or "asset" in the name
    console.log('\n5️⃣ Searching for accounts with "fixed" or "asset" keywords...');
    const [keywordAccounts] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE (
        LOWER(name) LIKE '%أصل%' OR 
        LOWER(name) LIKE '%ثابت%' OR 
        LOWER("nameEn") LIKE '%asset%' OR 
        LOWER("nameEn") LIKE '%fixed%'
      )
      AND type = 'asset'
      ORDER BY code
    `);
    
    console.log(`🔍 Found ${keywordAccounts.length} accounts with asset keywords:`);
    keywordAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.code} - ${account.name} (Parent: ${account.parentId})`);
    });
    
    // 6. Summary and recommendations
    console.log('\n📝 Summary:');
    if (leafCategories.length > 0) {
      console.log(`✅ Found ${leafCategories.length} active categories for fixed assets`);
      console.log('💡 The categories exist, the issue might be in the API or frontend');
    } else if (allAssetAccounts.length > 0) {
      console.log(`⚠️  Found ${allAssetAccounts.length} accounts but they might be groups or inactive`);
      console.log('💡 Check if accounts are marked as groups or inactive');
    } else if (fixedAssetsParent.length > 0) {
      console.log('⚠️  Fixed Assets parent exists but no child categories found');
      console.log('💡 Need to create leaf categories under the parent');
    } else {
      console.log('❌ No Fixed Assets structure found');
      console.log('💡 Need to create the complete Fixed Assets structure');
    }
    
  } catch (error) {
    console.error('❌ Error checking categories:', error.message);
    console.error('📝 Details:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkExistingCategories();
