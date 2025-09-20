import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createSimpleCategoriesAPI() {
  let sequelize;
  
  try {
    console.log('🔧 إنشاء API بسيط للفئات...');
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
    
    // إنشاء جدول مؤقت للفئات
    console.log('\n1️⃣ إنشاء جدول مؤقت للفئات...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fixed_asset_categories_temp (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL,
        name VARCHAR(200) NOT NULL,
        "nameEn" VARCHAR(200),
        type VARCHAR(20) DEFAULT 'asset',
        level INTEGER DEFAULT 3,
        "parentId" UUID,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ تم إنشاء الجدول المؤقت');
    
    // إدراج الفئات في الجدول المؤقت
    console.log('\n2️⃣ إدراج الفئات في الجدول المؤقت...');
    
    const categories = [
      { code: '1.2.1', name: 'الأراضي', nameEn: 'Land' },
      { code: '1.2.2', name: 'المباني والإنشاءات', nameEn: 'Buildings and Constructions' },
      { code: '1.2.3', name: 'الآلات والمعدات', nameEn: 'Machinery and Equipment' },
      { code: '1.2.4', name: 'الأثاث والتجهيزات', nameEn: 'Furniture and Fixtures' },
      { code: '1.2.5', name: 'وسائل النقل', nameEn: 'Vehicles' },
      { code: '1.2.6', name: 'أجهزة الحاسوب', nameEn: 'Computer Equipment' },
      { code: '1.2.7', name: 'مجمع الإهلاك', nameEn: 'Accumulated Depreciation' },
      { code: '1.2.8', name: 'معدات وآلات', nameEn: 'Equipment and Machinery' },
      { code: '1.2.9', name: 'سيارات', nameEn: 'Cars' }
    ];
    
    // مسح البيانات القديمة
    await sequelize.query('DELETE FROM fixed_asset_categories_temp');
    
    // إدراج البيانات الجديدة
    for (const category of categories) {
      await sequelize.query(`
        INSERT INTO fixed_asset_categories_temp (code, name, "nameEn", type, level, "isActive")
        VALUES (:code, :name, :nameEn, 'asset', 3, true)
      `, {
        replacements: {
          code: category.code,
          name: category.name,
          nameEn: category.nameEn
        }
      });
    }
    
    console.log(`✅ تم إدراج ${categories.length} فئة في الجدول المؤقت`);
    
    // إنشاء view للفئات
    console.log('\n3️⃣ إنشاء view للفئات...');
    
    await sequelize.query(`
      CREATE OR REPLACE VIEW fixed_asset_categories_view AS
      SELECT 
        id,
        code,
        name,
        "nameEn",
        type,
        level,
        "parentId",
        "isActive",
        "createdAt",
        "updatedAt"
      FROM fixed_asset_categories_temp
      WHERE "isActive" = true
      ORDER BY code
    `);
    
    console.log('✅ تم إنشاء view للفئات');
    
    // اختبار الاستعلام
    console.log('\n4️⃣ اختبار الاستعلام...');
    
    const [testCategories] = await sequelize.query(`
      SELECT * FROM fixed_asset_categories_view
    `);
    
    console.log(`📊 تم العثور على ${testCategories.length} فئة:`);
    testCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    // إنشاء API endpoint بسيط
    console.log('\n5️⃣ إنشاء API endpoint بسيط...');
    
    const apiCode = `
// API endpoint بسيط للفئات
app.get('/api/financial/fixed-assets/categories-simple', (req, res) => {
  try {
    const categories = [
      { id: '1', code: '1.2.1', name: 'الأراضي', nameEn: 'Land' },
      { id: '2', code: '1.2.2', name: 'المباني والإنشاءات', nameEn: 'Buildings and Constructions' },
      { id: '3', code: '1.2.3', name: 'الآلات والمعدات', nameEn: 'Machinery and Equipment' },
      { id: '4', code: '1.2.4', name: 'الأثاث والتجهيزات', nameEn: 'Furniture and Fixtures' },
      { id: '5', code: '1.2.5', name: 'وسائل النقل', nameEn: 'Vehicles' },
      { id: '6', code: '1.2.6', name: 'أجهزة الحاسوب', nameEn: 'Computer Equipment' },
      { id: '7', code: '1.2.7', name: 'مجمع الإهلاك', nameEn: 'Accumulated Depreciation' },
      { id: '8', code: '1.2.8', name: 'معدات وآلات', nameEn: 'Equipment and Machinery' },
      { id: '9', code: '1.2.9', name: 'سيارات', nameEn: 'Cars' }
    ];
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفئات',
      error: error.message
    });
  }
});
`;
    
    // حفظ الكود في ملف
    const fs = await import('fs');
    fs.writeFileSync('simple-categories-api.js', apiCode);
    console.log('✅ تم حفظ API endpoint في ملف simple-categories-api.js');
    
    console.log('\n🎉 تم إنشاء API بسيط للفئات!');
    console.log('💡 يمكنك الآن استخدام هذا API كبديل مؤقت');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء API:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الإنشاء
createSimpleCategoriesAPI();
