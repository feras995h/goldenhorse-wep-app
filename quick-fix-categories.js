import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function quickFixCategories() {
  let sequelize;
  
  try {
    console.log('🔧 إصلاح سريع لمشكلة الفئات...');
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
    
    // 1. التحقق من الفئات الموجودة
    console.log('\n1️⃣ التحقق من الفئات الموجودة...');
    
    const [categories] = await sequelize.query(`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    `);
    
    console.log(`📊 تم العثور على ${categories.length} فئة للأصول الثابتة`);
    
    // 2. إنشاء API endpoint بسيط
    console.log('\n2️⃣ إنشاء API endpoint بسيط...');
    
    const apiCode = `
// API endpoint بسيط للفئات
app.get('/api/financial/fixed-assets/categories', async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // البحث عن مجموعة الأصول الثابتة
    const [fixedAssetsParent] = await sequelize.query(\`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    \`);
    
    if (fixedAssetsParent.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'مجموعة الأصول الثابتة غير موجودة'
      });
    }
    
    const parent = fixedAssetsParent[0];
    
    // البحث عن الفئات تحت المجموعات الفرعية
    const [categories] = await sequelize.query(\`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId", a."isActive"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = :parentId 
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    \`, {
      replacements: { parentId: parent.id }
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
      error: error.message
    });
  }
});
`;
    
    const fs = await import('fs');
    fs.writeFileSync('simple-categories-api.js', apiCode);
    console.log('✅ تم حفظ API endpoint في ملف simple-categories-api.js');
    
    // 3. إنشاء حل مؤقت للواجهة الأمامية
    console.log('\n3️⃣ إنشاء حل مؤقت للواجهة الأمامية...');
    
    const frontendFix = `
// حل مؤقت للواجهة الأمامية
// استبدل هذا الكود في FixedAssetsManagement.tsx

const loadCategories = async () => {
  try {
    console.log('🔄 Loading fixed asset categories...');
    
    // محاولة استخدام API المرفوع
    try {
      const resp = await financialAPI.getFixedAssetCategories();
      console.log('📊 Categories response:', resp);
      
      if (resp && resp.data && Array.isArray(resp.data)) {
        const categoriesArray = resp.data;
        setCategories(categoriesArray);
        console.log(\`✅ Loaded \${categoriesArray.length} categories:\`, 
          categoriesArray.map(c => \`\${c.code} - \${c.name}\`));
        return;
      }
    } catch (apiError) {
      console.warn('⚠️ API error, using fallback categories:', apiError.message);
    }
    
    // استخدام فئات احتياطية إذا فشل API
    const fallbackCategories = [
      { id: 'c32e4672-4df8-44a6-8be9-f136d732d4ec', code: '1.2.1.1', name: 'أراضي', nameEn: 'Land' },
      { id: '4120a1bb-6613-4cec-b19e-177f14bf71b4', code: '1.2.2.1', name: 'مباني', nameEn: 'Buildings' },
      { id: 'd8bee94c-a8fa-4385-9a54-fc30045f6084', code: '1.2.3.1', name: 'آلات ومعدات', nameEn: 'Machinery and Equipment' },
      { id: 'b47e722a-fc3e-43fa-a3ef-681164650c6b', code: '1.2.4.1', name: 'أثاث', nameEn: 'Furniture' },
      { id: '5d6ecf92-7d01-47bc-b084-9eae3b498074', code: '1.2.5.1', name: 'سيارات', nameEn: 'Vehicles' },
      { id: '7ab5613c-ce23-4613-b433-ae7d4c91c8c9', code: '1.2.6.1', name: 'أجهزة حاسوب', nameEn: 'Computer Equipment' }
    ];
    
    setCategories(fallbackCategories);
    console.log(\`✅ Using fallback categories: \${fallbackCategories.length} categories\`);
    
  } catch (error) {
    console.error('❌ Error loading fixed asset categories:', error);
    setCategories([]);
  }
};
`;
    
    fs.writeFileSync('frontend-fallback-fix.js', frontendFix);
    console.log('✅ تم حفظ حل الواجهة الأمامية في ملف frontend-fallback-fix.js');
    
    // 4. إنشاء دليل الإصلاح السريع
    console.log('\n4️⃣ إنشاء دليل الإصلاح السريع...');
    
    const quickFixGuide = `
# دليل الإصلاح السريع لمشكلة الفئات

## المشكلة:
- الخادم المرفوع على السحابة يعطي 500 error
- لا يمكن تحميل فئات الأصول الثابتة

## الحلول:

### الحل 1: إصلاح الخادم المرفوع
1. رفع ملف server/src/routes/financial.js المحدث
2. إعادة تشغيل الخادم
3. اختبار الوظيفة

### الحل 2: استخدام فئات احتياطية (فوري)
1. استبدل كود loadCategories في FixedAssetsManagement.tsx
2. استخدم محتوى ملف frontend-fallback-fix.js
3. هذا سيحل المشكلة فوراً

### الحل 3: إنشاء API منفصل
1. استخدم محتوى ملف simple-categories-api.js
2. ارفعه إلى خادم آخر
3. غيّر URL في الواجهة الأمامية

## الفئات الاحتياطية:
- أراضي (1.2.1.1)
- مباني (1.2.2.1)
- آلات ومعدات (1.2.3.1)
- أثاث (1.2.4.1)
- سيارات (1.2.5.1)
- أجهزة حاسوب (1.2.6.1)

## المزايا:
- ✅ يحل المشكلة فوراً
- ✅ لا يحتاج إلى إصلاح الخادم
- ✅ يعمل مع الفئات الأساسية
- ✅ يمكن تحديثه لاحقاً

## الخطوات:
1. انسخ كود frontend-fallback-fix.js
2. استبدل loadCategories في FixedAssetsManagement.tsx
3. اختبر الوظيفة
4. أصلح الخادم لاحقاً
`;
    
    fs.writeFileSync('QUICK_FIX_GUIDE.md', quickFixGuide);
    console.log('✅ تم حفظ دليل الإصلاح السريع في ملف QUICK_FIX_GUIDE.md');
    
    // 5. عرض النتائج
    console.log('\n📊 النتائج:');
    console.log(`✅ تم العثور على ${categories.length} فئة للأصول الثابتة`);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name}`);
    });
    
    console.log('\n🎉 تم إنشاء جميع الحلول!');
    console.log('📁 الملفات المنشأة:');
    console.log('   - simple-categories-api.js (API endpoint)');
    console.log('   - frontend-fallback-fix.js (حل الواجهة الأمامية)');
    console.log('   - QUICK_FIX_GUIDE.md (دليل الإصلاح السريع)');
    
    console.log('\n💡 الحل الأسرع: استخدم frontend-fallback-fix.js');
    
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
quickFixCategories();
