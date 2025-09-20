import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function debugAPIError() {
  let sequelize;
  
  try {
    console.log('🔍 تشخيص خطأ API الخاص بالفئات...');
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
    
    // محاكاة ما يفعله API
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
    
    // البحث عن الفئات
    console.log('\n2️⃣ البحث عن الفئات تحت المجموعة...');
    const [categories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset' AND "isActive" = true
      ORDER BY code
    `, {
      replacements: { parentId: parent.id }
    });
    
    console.log(`📊 تم العثور على ${categories.length} فئة:`);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    // محاكاة استجابة API
    console.log('\n3️⃣ محاكاة استجابة API...');
    const apiResponse = {
      success: true,
      data: categories,
      total: categories.length
    };
    
    console.log('📤 استجابة API المتوقعة:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // التحقق من صحة البيانات
    console.log('\n4️⃣ التحقق من صحة البيانات...');
    const issues = [];
    
    categories.forEach((cat, index) => {
      if (!cat.id) issues.push(`الفئة ${index + 1}: مفقود ID`);
      if (!cat.code) issues.push(`الفئة ${index + 1}: مفقود code`);
      if (!cat.name) issues.push(`الفئة ${index + 1}: مفقود name`);
      if (!cat.type) issues.push(`الفئة ${index + 1}: مفقود type`);
    });
    
    if (issues.length > 0) {
      console.log('❌ مشاكل في البيانات:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ جميع البيانات صحيحة');
    }
    
    // اختبار استعلام محدد
    console.log('\n5️⃣ اختبار استعلام محدد...');
    try {
      const [testQuery] = await sequelize.query(`
        SELECT id, code, name, "nameEn", type, level, "parentId"
        FROM accounts 
        WHERE "parentId" = :parentId AND type = 'asset' AND "isActive" = true
        ORDER BY code
      `, {
        replacements: { parentId: parent.id }
      });
      console.log('✅ الاستعلام يعمل بشكل صحيح');
      console.log(`📊 عدد النتائج: ${testQuery.length}`);
    } catch (error) {
      console.log('❌ خطأ في الاستعلام:', error.message);
    }
    
    // التحقق من وجود أخطاء في قاعدة البيانات
    console.log('\n6️⃣ التحقق من أخطاء قاعدة البيانات...');
    try {
      const [errorCheck] = await sequelize.query(`
        SELECT COUNT(*) as total_accounts FROM accounts WHERE type = 'asset'
      `);
      console.log(`📊 إجمالي حسابات الأصول: ${errorCheck[0].total_accounts}`);
    } catch (error) {
      console.log('❌ خطأ في قاعدة البيانات:', error.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل التشخيص
debugAPIError();
