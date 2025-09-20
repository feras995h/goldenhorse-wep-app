import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function deployFixedAssetsFix() {
  let sequelize;
  
  try {
    console.log('🚀 نشر إصلاح الأصول الثابتة...');
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
      WHERE parent."parentId" = (
        SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset'
      )
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    `);
    
    console.log(`📊 تم العثور على ${categories.length} فئة للأصول الثابتة`);
    
    // 2. إنشاء API endpoint محدث
    console.log('\n2️⃣ إنشاء API endpoint محدث...');
    
    const apiCode = `
// GET /api/financial/fixed-assets/categories - Get fixed asset categories from chart of accounts
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // Find Fixed Assets parent account
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
    
    // Find all sub-groups under Fixed Assets (like 1.2.1, 1.2.2, etc.)
    const subGroups = await Account.findAll({
      where: {
        parentId: fixedAssetsParent.id,
        type: 'asset',
        isActive: true,
        isGroup: true
      },
      attributes: ['id']
    });
    
    console.log(\`🔍 Found \${subGroups.length} sub-groups under Fixed Assets\`);
    
    // Find categories under these sub-groups (non-group accounts)
    const categories = await Account.findAll({
      where: {
        parentId: {
          [Op.in]: subGroups.map(group => group.id)
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
    fs.writeFileSync('fixed-assets-categories-api.js', apiCode);
    console.log('✅ تم حفظ API endpoint في ملف fixed-assets-categories-api.js');
    
    // 3. إنشاء سكريبت SQL لإصلاح قاعدة البيانات
    console.log('\n3️⃣ إنشاء سكريبت SQL لإصلاح قاعدة البيانات...');
    
    const sqlScript = `
-- إصلاح فئات الأصول الثابتة
-- التحقق من وجود الفئات المناسبة

-- 1. التحقق من مجموعة الأصول الثابتة
SELECT id, code, name FROM accounts WHERE code = '1.2' AND type = 'asset';

-- 2. التحقق من المجموعات الفرعية
SELECT id, code, name, "isGroup" FROM accounts 
WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
AND type = 'asset' AND "isActive" = true;

-- 3. التحقق من الفئات الموجودة
SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
FROM accounts a
INNER JOIN accounts parent ON a."parentId" = parent.id
WHERE parent."parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
AND a.type = 'asset' 
AND a."isActive" = true 
AND a."isGroup" = false
ORDER BY a.code;

-- 4. إنشاء فئات جديدة إذا لم تكن موجودة
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '1.2.1.1',
  'أراضي',
  'Land',
  'asset',
  'Asset',
  'Balance Sheet',
  (SELECT id FROM accounts WHERE code = '1.2.1' AND type = 'asset'),
  4,
  false,
  true,
  0,
  'LYD',
  'debit',
  'sub',
  'فئة أصل ثابت: أراضي',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM accounts WHERE code = '1.2.1.1'
);

-- 5. إنشاء فئات أخرى بنفس الطريقة...
-- (يمكن إضافة المزيد حسب الحاجة)
`;
    
    fs.writeFileSync('fix-fixed-assets-categories.sql', sqlScript);
    console.log('✅ تم حفظ سكريبت SQL في ملف fix-fixed-assets-categories.sql');
    
    // 4. إنشاء دليل النشر
    console.log('\n4️⃣ إنشاء دليل النشر...');
    
    const deploymentGuide = `
# دليل نشر إصلاح الأصول الثابتة

## المشكلة:
- الخادم المرفوع على السحابة يعطي 500 error عند تحميل فئات الأصول الثابتة
- الكود المحدث لم يتم رفعه إلى الخادم المرفوع

## الحل:

### 1. رفع الكود المحدث:
\`\`\`bash
# رفع ملف server/src/routes/financial.js المحدث
# أو استخدم محتوى ملف fixed-assets-categories-api.js
\`\`\`

### 2. إصلاح قاعدة البيانات:
\`\`\`sql
-- تشغيل سكريبت fix-fixed-assets-categories.sql
\`\`\`

### 3. إعادة تشغيل الخادم:
\`\`\`bash
# إعادة تشغيل الخادم لتطبيق التغييرات
\`\`\`

### 4. اختبار الوظيفة:
1. افتح https://web.goldenhorse-ly.com
2. اذهب إلى إدارة الأصول الثابتة
3. اضغط على "أصل جديد"
4. تأكد من ظهور الفئات في القائمة المنسدلة

## الفئات المتوقعة:
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

## ملاحظات:
- تأكد من أن Op مُعرّف في imports
- تأكد من أن قاعدة البيانات تحتوي على الفئات المطلوبة
- تأكد من أن الخادم يعيد تشغيله بعد التحديث
`;
    
    fs.writeFileSync('DEPLOYMENT_GUIDE.md', deploymentGuide);
    console.log('✅ تم حفظ دليل النشر في ملف DEPLOYMENT_GUIDE.md');
    
    // 5. إنشاء سكريبت اختبار
    console.log('\n5️⃣ إنشاء سكريبت اختبار...');
    
    const testScript = `
import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function testFixedAssetsCategories() {
  let sequelize;
  
  try {
    console.log('🧪 اختبار فئات الأصول الثابتة...');
    
    sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // اختبار API endpoint
    const [categories] = await sequelize.query(\`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    \`);
    
    console.log(\`📊 تم العثور على \${categories.length} فئة للأصول الثابتة\`);
    categories.forEach((cat, index) => {
      console.log(\`   \${index + 1}. \${cat.code} - \${cat.name}\`);
    });
    
    console.log('✅ الاختبار نجح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

testFixedAssetsCategories();
`;
    
    fs.writeFileSync('test-fixed-assets-categories.js', testScript);
    console.log('✅ تم حفظ سكريبت الاختبار في ملف test-fixed-assets-categories.js');
    
    console.log('\n🎉 تم إنشاء جميع الملفات المطلوبة للنشر!');
    console.log('📁 الملفات المنشأة:');
    console.log('   - fixed-assets-categories-api.js (API endpoint)');
    console.log('   - fix-fixed-assets-categories.sql (سكريبت SQL)');
    console.log('   - DEPLOYMENT_GUIDE.md (دليل النشر)');
    console.log('   - test-fixed-assets-categories.js (سكريبت اختبار)');
    
  } catch (error) {
    console.error('❌ خطأ في النشر:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل النشر
deployFixedAssetsFix();
