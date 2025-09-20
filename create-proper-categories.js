import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createProperCategories() {
  let sequelize;
  
  try {
    console.log('🔧 إنشاء فئات مناسبة للأصول الثابتة...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
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
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // 1. البحث عن مجموعة الأصول الثابتة
    console.log('\n1️⃣ البحث عن مجموعة الأصول الثابتة...');
    
    const [fixedAssetsParent] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    `);
    
    if (fixedAssetsParent.length === 0) {
      console.log('❌ لم يتم العثور على مجموعة الأصول الثابتة!');
      return;
    }
    
    const parent = fixedAssetsParent[0];
    console.log('✅ تم العثور على المجموعة:', parent.name, `(ID: ${parent.id})`);
    
    // 2. البحث عن المجموعات الموجودة
    console.log('\n2️⃣ البحث عن المجموعات الموجودة...');
    
    const [groups] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset' AND "isGroup" = true
      ORDER BY code
    `, {
      replacements: { parentId: parent.id }
    });
    
    console.log(`📁 تم العثور على ${groups.length} مجموعة:`);
    groups.forEach((group, index) => {
      console.log(`   ${index + 1}. ${group.code} - ${group.name} (ID: ${group.id})`);
    });
    
    // 3. إنشاء فئات مناسبة تحت كل مجموعة
    console.log('\n3️⃣ إنشاء فئات مناسبة تحت كل مجموعة...');
    
    const categoriesToCreate = [
      { groupCode: '1.2.1', groupName: 'الأراضي', categoryName: 'أراضي', categoryNameEn: 'Land' },
      { groupCode: '1.2.2', groupName: 'المباني والإنشاءات', categoryName: 'مباني', categoryNameEn: 'Buildings' },
      { groupCode: '1.2.3', groupName: 'الآلات والمعدات', categoryName: 'آلات ومعدات', categoryNameEn: 'Machinery and Equipment' },
      { groupCode: '1.2.4', groupName: 'الأثاث والتجهيزات', categoryName: 'أثاث', categoryNameEn: 'Furniture' },
      { groupCode: '1.2.5', groupName: 'وسائل النقل', categoryName: 'سيارات', categoryNameEn: 'Vehicles' },
      { groupCode: '1.2.6', groupName: 'أجهزة الحاسوب', categoryName: 'أجهزة حاسوب', categoryNameEn: 'Computer Equipment' }
    ];
    
    let createdCount = 0;
    
    for (const categoryData of categoriesToCreate) {
      // البحث عن المجموعة
      const group = groups.find(g => g.code === categoryData.groupCode);
      if (!group) {
        console.log(`⚠️  لم يتم العثور على المجموعة: ${categoryData.groupCode}`);
        continue;
      }
      
      // التحقق من وجود الفئة
      const [existingCategory] = await sequelize.query(`
        SELECT id FROM accounts 
        WHERE "parentId" = :parentId AND name = :name
      `, {
        replacements: { 
          parentId: group.id, 
          name: categoryData.categoryName 
        }
      });
      
      if (existingCategory.length > 0) {
        console.log(`✅ الفئة موجودة بالفعل: ${categoryData.groupCode}.1 - ${categoryData.categoryName}`);
        continue;
      }
      
      // إنشاء الفئة
      try {
        await sequelize.query(`
          INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), :code, :name, :nameEn, 'asset', 'Asset', 'Balance Sheet', :parentId, :level, false, true, 0, 'LYD', 'debit', 'sub', :description, true, NOW(), NOW())
        `, {
          replacements: {
            code: `${categoryData.groupCode}.1`,
            name: categoryData.categoryName,
            nameEn: categoryData.categoryNameEn,
            parentId: group.id,
            level: group.level + 1,
            description: `فئة أصل ثابت: ${categoryData.categoryName}`
          }
        });
        
        console.log(`✅ تم إنشاء الفئة: ${categoryData.groupCode}.1 - ${categoryData.categoryName}`);
        createdCount++;
        
      } catch (error) {
        console.log(`❌ خطأ في إنشاء الفئة ${categoryData.categoryName}:`, error.message);
      }
    }
    
    // 4. التحقق النهائي
    console.log('\n4️⃣ التحقق النهائي...');
    
    const [finalCategories] = await sequelize.query(`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId", a."isActive"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = :parentId 
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    `, {
      replacements: { parentId: parent.id }
    });
    
    console.log(`\n🎉 النتيجة النهائية: ${finalCategories.length} فئة متاحة للأصول الثابتة:`);
    finalCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    console.log(`\n📊 تم إنشاء ${createdCount} فئة جديدة`);
    
    // 5. إنشاء API endpoint محدث
    console.log('\n5️⃣ إنشاء API endpoint محدث...');
    
    const apiCode = `
// API endpoint محدث للفئات - يتعامل مع الهيكل الهرمي
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // البحث عن مجموعة الأصول الثابتة
    const fixedAssetsParent = await Account.findOne({
      where: {
        code: '1.2',
        type: 'asset'
      }
    });
    
    if (!fixedAssetsParent) {
      return res.status(500).json({
        success: false,
        message: 'مجموعة الأصول الثابتة غير موجودة'
      });
    }
    
    // البحث عن الفئات (غير المجموعات) تحت الأصول الثابتة
    const categories = await Account.findAll({
      where: {
        parentId: {
          [Op.in]: await Account.findAll({
            where: {
              parentId: fixedAssetsParent.id,
              type: 'asset',
              isGroup: true
            },
            attributes: ['id']
          }).then(accounts => accounts.map(acc => acc.id))
        },
        type: 'asset',
        isActive: true,
        isGroup: false
      },
      attributes: ['id', 'code', 'name', 'nameEn', 'type', 'level', 'parentId'],
      order: [['code', 'ASC']]
    });
    
    console.log(\`✅ Found \${categories.length} fixed asset categories\`);
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching fixed asset categories:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب فئات الأصول الثابتة',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي'
    });
  }
});
`;
    
    // حفظ الكود في ملف
    const fs = await import('fs');
    fs.writeFileSync('updated-categories-api.js', apiCode);
    console.log('✅ تم حفظ API endpoint المحدث في ملف updated-categories-api.js');
    
    console.log('\n✅ تم إصلاح المشكلة بطريقة صحيحة!');
    console.log('💡 هذا الحل يحافظ على دليل الحسابات الهرمي وينشئ فئات مناسبة');
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الإصلاح
createProperCategories();
