import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function fixCategoriesProperly() {
  let sequelize;
  
  try {
    console.log('🔧 إصلاح مشكلة الفئات بطريقة صحيحة...');
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
    
    // 1. التحقق من هيكل دليل الحسابات
    console.log('\n1️⃣ التحقق من هيكل دليل الحسابات...');
    
    const [accountsStructure] = await sequelize.query(`
      SELECT code, name, type, level, "isGroup", "isActive"
      FROM accounts 
      WHERE type = 'asset' 
      ORDER BY code
    `);
    
    console.log(`📊 إجمالي حسابات الأصول: ${accountsStructure.length}`);
    
    // 2. البحث عن مجموعة الأصول الثابتة
    console.log('\n2️⃣ البحث عن مجموعة الأصول الثابتة...');
    
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
    
    // 3. البحث عن الفئات الموجودة
    console.log('\n3️⃣ البحث عن الفئات الموجودة...');
    
    const [existingCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive", "isGroup"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset'
      ORDER BY code
    `, {
      replacements: { parentId: parent.id }
    });
    
    console.log(`📊 تم العثور على ${existingCategories.length} حساب تحت الأصول الثابتة:`);
    existingCategories.forEach((cat, index) => {
      const status = cat.isActive ? '✅' : '❌';
      const type = cat.isGroup ? '(مجموعة)' : '(فئة)';
      console.log(`   ${index + 1}. ${status} ${cat.code} - ${cat.name} ${type}`);
    });
    
    // 4. تصنيف الحسابات
    console.log('\n4️⃣ تصنيف الحسابات...');
    
    const groups = existingCategories.filter(acc => acc.isGroup);
    const categories = existingCategories.filter(acc => !acc.isGroup && acc.isActive);
    
    console.log(`📁 المجموعات: ${groups.length}`);
    groups.forEach(group => {
      console.log(`   - ${group.code} - ${group.name}`);
    });
    
    console.log(`📋 الفئات: ${categories.length}`);
    categories.forEach(category => {
      console.log(`   - ${category.code} - ${category.name}`);
    });
    
    // 5. إنشاء فئات مناسبة للأصول الثابتة
    console.log('\n5️⃣ إنشاء فئات مناسبة للأصول الثابتة...');
    
    const suitableCategories = categories.filter(cat => 
      !cat.name.includes('مجمع') && 
      !cat.name.includes('إهلاك') &&
      cat.code !== '1.2.7' // استبعاد مجمع الإهلاك
    );
    
    console.log(`🎯 الفئات المناسبة للأصول الثابتة: ${suitableCategories.length}`);
    suitableCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    // 6. إنشاء API endpoint صحيح
    console.log('\n6️⃣ إنشاء API endpoint صحيح...');
    
    const apiCode = `
// API endpoint صحيح للفئات - يتعامل مع دليل الحسابات
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
    
    // البحث عن الفئات المناسبة (غير المجموعات وليس مجمع الإهلاك)
    const categories = await Account.findAll({
      where: {
        parentId: fixedAssetsParent.id,
        type: 'asset',
        isActive: true,
        isGroup: false,
        name: {
          [Op.notLike]: '%مجمع%'
        }
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
    fs.writeFileSync('fixed-categories-api.js', apiCode);
    console.log('✅ تم حفظ API endpoint الصحيح في ملف fixed-categories-api.js');
    
    // 7. اختبار الاستعلام الجديد
    console.log('\n7️⃣ اختبار الاستعلام الجديد...');
    
    const [testCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId"
      FROM accounts 
      WHERE "parentId" = :parentId 
      AND type = 'asset' 
      AND "isActive" = true 
      AND "isGroup" = false
      AND name NOT LIKE '%مجمع%'
      ORDER BY code
    `, {
      replacements: { parentId: parent.id }
    });
    
    console.log(`📊 الفئات المناسبة: ${testCategories.length}`);
    testCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    console.log('\n🎉 تم إصلاح المشكلة بطريقة صحيحة!');
    console.log('💡 هذا الحل يحافظ على دليل الحسابات ويعطي الفئات المناسبة فقط');
    
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
fixCategoriesProperly();
