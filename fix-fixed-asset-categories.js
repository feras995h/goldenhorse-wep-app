import { Sequelize } from 'sequelize';

// Database connection - replace with your production database URL
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function fixFixedAssetCategories() {
  let sequelize;
  
  try {
    console.log('🔧 Fixing Fixed Asset Categories...');
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
    
    // 1. Check if main Assets account exists
    console.log('\n1️⃣ Checking main Assets account...');
    const [assetsRoot] = await sequelize.query(`
      SELECT id, code, name, type, level 
      FROM accounts 
      WHERE code = '1' AND type = 'asset'
    `);
    
    if (assetsRoot.length === 0) {
      console.log('❌ Main Assets account not found! Creating it...');
      await sequelize.query(`
        INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '1', 'الأصول', 'Assets', 'asset', 'Asset', 'Balance Sheet', NULL, 1, true, true, 0, 'LYD', 'debit', 'main', 'حساب الأصول الرئيسي', true, NOW(), NOW())
      `);
      console.log('✅ Created main Assets account');
    } else {
      console.log('✅ Main Assets account found:', assetsRoot[0].name);
    }
    
    // 2. Check if Fixed Assets parent exists
    console.log('\n2️⃣ Checking Fixed Assets parent account...');
    const [fixedAssetsParent] = await sequelize.query(`
      SELECT id, code, name, type, level, "parentId"
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    `);
    
    let fixedAssetsParentId;
    if (fixedAssetsParent.length === 0) {
      console.log('❌ Fixed Assets parent not found! Creating it...');
      const [newParent] = await sequelize.query(`
        INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '1.2', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'Asset', 'Balance Sheet', (SELECT id FROM accounts WHERE code = '1' AND type = 'asset' LIMIT 1), 2, true, true, 0, 'LYD', 'debit', 'sub', 'مجموعة الأصول الثابتة', true, NOW(), NOW())
        RETURNING id
      `);
      fixedAssetsParentId = newParent[0].id;
      console.log('✅ Created Fixed Assets parent account');
    } else {
      fixedAssetsParentId = fixedAssetsParent[0].id;
      console.log('✅ Fixed Assets parent found:', fixedAssetsParent[0].name);
    }
    
    // 3. Check existing categories
    console.log('\n3️⃣ Checking existing categories...');
    const [existingCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset' AND "isActive" = true
      ORDER BY code
    `, {
      replacements: { parentId: fixedAssetsParentId }
    });
    
    console.log(`📊 Found ${existingCategories.length} existing categories:`);
    existingCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name}`);
    });
    
    // 4. Create default categories if they don't exist
    console.log('\n4️⃣ Creating default categories...');
    
    const defaultCategories = [
      { code: '1.2.1', name: 'سيارات', nameEn: 'Vehicles' },
      { code: '1.2.2', name: 'معدات وآلات', nameEn: 'Equipment and Machinery' },
      { code: '1.2.3', name: 'أثاث', nameEn: 'Furniture' },
      { code: '1.2.4', name: 'مباني', nameEn: 'Buildings' },
      { code: '1.2.5', name: 'أجهزة حاسوب', nameEn: 'Computers' }
    ];
    
    for (const category of defaultCategories) {
      const existing = existingCategories.find(cat => cat.code === category.code);
      if (!existing) {
        try {
          await sequelize.query(`
            INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), :code, :name, :nameEn, 'asset', 'Asset', 'Balance Sheet', :parentId, 3, false, true, 0, 'LYD', 'debit', 'sub', :description, true, NOW(), NOW())
          `, {
            replacements: {
              code: category.code,
              name: category.name,
              nameEn: category.nameEn,
              parentId: fixedAssetsParentId,
              description: `فئة أصل ثابت: ${category.name}`
            }
          });
          console.log(`✅ Created category: ${category.code} - ${category.name}`);
        } catch (error) {
          console.log(`⚠️  Error creating category ${category.code}:`, error.message);
        }
      } else {
        console.log(`✅ Category already exists: ${category.code} - ${category.name}`);
      }
    }
    
    // 5. Final verification
    console.log('\n5️⃣ Final verification...');
    const [finalCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset' AND "isActive" = true
      ORDER BY code
    `, {
      replacements: { parentId: fixedAssetsParentId }
    });
    
    console.log(`\n🎉 Final result: ${finalCategories.length} categories available:`);
    finalCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    if (finalCategories.length > 0) {
      console.log('\n✅ Fixed Asset Categories are now available!');
      console.log('💡 You can now add fixed assets and select categories.');
    } else {
      console.log('\n❌ No categories found. Please check the database manually.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing categories:', error.message);
    console.error('📝 Details:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the fix
fixFixedAssetCategories();
