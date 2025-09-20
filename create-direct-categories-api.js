import { Sequelize } from 'sequelize';
import express from 'express';
import cors from 'cors';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createDirectCategoriesAPI() {
  let sequelize;
  
  try {
    console.log('🚀 إنشاء API مباشر للفئات...');
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
    
    // 1. إنشاء Express app
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // 2. إنشاء API endpoint مباشر
    app.get('/api/financial/fixed-assets/categories', async (req, res) => {
      try {
        console.log('🔍 Fetching fixed asset categories...');
        
        // البحث عن مجموعة الأصول الثابتة
        const [fixedAssetsParent] = await sequelize.query(`
          SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
          FROM accounts 
          WHERE code = '1.2' AND type = 'asset'
        `);
        
        if (fixedAssetsParent.length === 0) {
          return res.status(500).json({
            success: false,
            message: 'مجموعة الأصول الثابتة غير موجودة'
          });
        }
        
        const parent = fixedAssetsParent[0];
        console.log('✅ Found Fixed Assets parent:', parent.name, `(ID: ${parent.id})`);
        
        // البحث عن الفئات تحت المجموعات الفرعية
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
        
        console.log(`✅ Found ${categories.length} fixed asset categories`);
        
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
    
    // 3. إنشاء endpoint للاختبار
    app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'API يعمل بشكل صحيح',
        timestamp: new Date().toISOString()
      });
    });
    
    // 4. بدء الخادم
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Direct Categories API running on port ${PORT}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api/financial/fixed-assets/categories`);
      console.log(`🧪 Test URL: http://localhost:${PORT}/api/test`);
    });
    
    // 5. اختبار API
    console.log('\n🧪 اختبار API...');
    
    const testResponse = await fetch(`http://localhost:${PORT}/api/financial/fixed-assets/categories`);
    const testData = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ API يعمل بشكل صحيح!');
      console.log(`📊 تم العثور على ${testData.total} فئة`);
      testData.data.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.code} - ${cat.name}`);
      });
    } else {
      console.log('❌ API لا يعمل:', testData.message);
    }
    
    // 6. إنشاء سكريبت للاختبار
    const testScript = `
// سكريبت اختبار API المباشر
async function testDirectAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/financial/fixed-assets/categories');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API يعمل بشكل صحيح!');
      console.log('📊 الفئات المتاحة:', data.data.length);
      data.data.forEach((cat, index) => {
        console.log(\`   \${index + 1}. \${cat.code} - \${cat.name}\`);
      });
    } else {
      console.log('❌ خطأ في API:', data.message);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
  }
}

testDirectAPI();
`;
    
    const fs = await import('fs');
    fs.writeFileSync('test-direct-api.js', testScript);
    console.log('✅ تم حفظ سكريبت الاختبار في ملف test-direct-api.js');
    
    // 7. إنشاء دليل الاستخدام
    const usageGuide = `
# دليل استخدام API المباشر للفئات

## المشكلة:
- الخادم المرفوع على السحابة يعطي 500 error
- لا يمكن الوصول إلى فئات الأصول الثابتة

## الحل:
- إنشاء API مباشر يعمل من قاعدة البيانات
- يمكن استخدامه كبديل مؤقت أو دائم

## الاستخدام:

### 1. تشغيل API:
\`\`\`bash
node create-direct-categories-api.js
\`\`\`

### 2. اختبار API:
\`\`\`bash
node test-direct-api.js
\`\`\`

### 3. استخدام API في الواجهة الأمامية:
\`\`\`javascript
// تغيير URL في الواجهة الأمامية
const API_BASE_URL = 'http://localhost:3001'; // بدلاً من الخادم المرفوع

// أو استخدام API مباشر
const response = await fetch('http://localhost:3001/api/financial/fixed-assets/categories');
const data = await response.json();
\`\`\`

### 4. رفع API إلى خادم آخر:
- يمكن رفع هذا API إلى خادم آخر
- أو استخدامه كخدمة منفصلة
- أو دمجه في الخادم الرئيسي

## المزايا:
- ✅ يعمل مباشرة من قاعدة البيانات
- ✅ لا يعتمد على الخادم المرفوع
- ✅ يمكن تشغيله محلياً أو على خادم آخر
- ✅ يحل المشكلة فوراً

## الفئات المتاحة:
- أراضي (1.2.1.1)
- مباني (1.2.2.1)
- آلات ومعدات (1.2.3.1)
- أثاث (1.2.4.1)
- سيارات (1.2.5.1)
- أجهزة حاسوب (1.2.6.1)
- مجمع إهلاك المباني (1.2.7.001)
- مجمع إهلاك الآلات والمعدات (1.2.7.002)
- مجمع إهلاك الأثاث والتجهيزات (1.2.7.003)
- مجمع إهلاك وسائل النقل (1.2.7.004)
- مجمع إهلاك أجهزة الحاسوب (1.2.7.005)
- جهاز حاسوب - أصل (1.2.8.001)
- سيارة - أصل (1.2.8.002)
- مجمع إهلاك - جهاز حاسوب (1.2.5.001)
- مجمع إهلاك - سيارة (1.2.5.002)
`;
    
    fs.writeFileSync('DIRECT_API_USAGE_GUIDE.md', usageGuide);
    console.log('✅ تم حفظ دليل الاستخدام في ملف DIRECT_API_USAGE_GUIDE.md');
    
    console.log('\n🎉 تم إنشاء API المباشر بنجاح!');
    console.log('💡 يمكنك الآن استخدام هذا API كبديل للخادم المرفوع');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء API:', error.message);
    console.error('📝 التفاصيل:', error);
  }
}

// تشغيل API
createDirectCategoriesAPI();
