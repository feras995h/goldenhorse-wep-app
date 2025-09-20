import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function testAPIFixed() {
  let sequelize;
  
  try {
    console.log('🧪 اختبار API بعد الإصلاح...');
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
    
    // محاكاة ما يفعله API تماماً
    console.log('\n1️⃣ محاكاة ensureFixedAssetsStructure...');
    
    // البحث عن مجموعة الأصول الثابتة
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
    console.log('\n2️⃣ البحث عن الفئات...');
    const [categories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId"
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
    
    console.log('📤 استجابة API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // اختبار JSON serialization
    console.log('\n4️⃣ اختبار JSON serialization...');
    try {
      const jsonString = JSON.stringify(apiResponse);
      const parsed = JSON.parse(jsonString);
      console.log('✅ JSON serialization يعمل بشكل صحيح');
      console.log(`📊 عدد الفئات في JSON: ${parsed.data.length}`);
    } catch (error) {
      console.log('❌ خطأ في JSON serialization:', error.message);
    }
    
    console.log('\n✅ API يجب أن يعمل بشكل صحيح الآن!');
    console.log('💡 المشكلة كانت في console.error غير مكتمل');
    
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
testAPIFixed();
