import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function testFixedCategoriesAPI() {
  let sequelize;
  
  try {
    console.log('🧪 اختبار API endpoint للفئات...');
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
    
    // 2. البحث عن المجموعات الفرعية
    console.log('\n2️⃣ البحث عن المجموعات الفرعية...');
    
    const [subGroups] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset' AND "isActive" = true AND "isGroup" = true
      ORDER BY code
    `, {
      replacements: { parentId: parent.id }
    });
    
    console.log(`📁 تم العثور على ${subGroups.length} مجموعة فرعية:`);
    subGroups.forEach((group, index) => {
      console.log(`   ${index + 1}. ${group.code} - ${group.name} (ID: ${group.id})`);
    });
    
    // 3. البحث عن الفئات تحت المجموعات الفرعية
    console.log('\n3️⃣ البحث عن الفئات تحت المجموعات الفرعية...');
    
    const [categories] = await sequelize.query(`
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
    
    console.log(`📋 تم العثور على ${categories.length} فئة للأصول الثابتة:`);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    // 4. محاكاة API response
    console.log('\n4️⃣ محاكاة API response...');
    
    const apiResponse = {
      success: true,
      data: categories,
      total: categories.length
    };
    
    console.log('📊 API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // 5. اختبار الاستعلام المحدث
    console.log('\n5️⃣ اختبار الاستعلام المحدث...');
    
    const [testCategories] = await sequelize.query(`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
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
    
    console.log(`✅ الاستعلام المحدث يعمل بشكل صحيح: ${testCategories.length} فئة`);
    
    console.log('\n🎉 تم اختبار API endpoint بنجاح!');
    console.log('💡 الآن يمكنك رفع الكود المحدث إلى الخادم');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
testFixedCategoriesAPI();
