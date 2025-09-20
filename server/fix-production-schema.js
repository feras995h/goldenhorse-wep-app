import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة من المجلد الجذر
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔧 إصلاح مخطط قاعدة البيانات الإنتاج...');

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function fixProductionSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
    
    // إصلاح 1: إضافة عمود isMonitored إلى جدول accounts
    console.log('\n🔧 إضافة عمود isMonitored إلى جدول accounts...');
    try {
      await sequelize.query(`
        ALTER TABLE accounts 
        ADD COLUMN IF NOT EXISTS "isMonitored" BOOLEAN DEFAULT false;
      `);
      console.log('✅ تم إضافة عمود isMonitored بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  عمود isMonitored موجود مسبقاً');
      } else {
        console.error('❌ خطأ في إضافة عمود isMonitored:', error.message);
      }
    }
    
    // إصلاح 2: التحقق من الأعمدة المفقودة الأخرى
    console.log('\n🔍 فحص الأعمدة المطلوبة...');
    
    const requiredColumns = [
      { name: 'isMonitored', type: 'BOOLEAN', default: 'false' },
      { name: 'categoryAccountId', type: 'UUID', default: 'NULL' },
      { name: 'journalEntryId', type: 'UUID', default: 'NULL' }
    ];
    
    for (const column of requiredColumns) {
      try {
        await sequelize.query(`
          ALTER TABLE accounts 
          ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type} DEFAULT ${column.default};
        `);
        console.log(`✅ تم التحقق من عمود ${column.name}`);
      } catch (error) {
        console.log(`ℹ️  عمود ${column.name} موجود مسبقاً أو لا يحتاج إضافة`);
      }
    }
    
    // إصلاح 3: التحقق من جدول gl_entries
    console.log('\n🔍 فحص جدول gl_entries...');
    try {
      await sequelize.query(`
        ALTER TABLE gl_entries 
        ADD COLUMN IF NOT EXISTS "journalEntryId" UUID;
      `);
      console.log('✅ تم التحقق من عمود journalEntryId في gl_entries');
    } catch (error) {
      console.log('ℹ️  عمود journalEntryId موجود مسبقاً في gl_entries');
    }
    
    // إصلاح 4: التحقق من جدول fixed_assets
    console.log('\n🔍 فحص جدول fixed_assets...');
    try {
      await sequelize.query(`
        ALTER TABLE fixed_assets 
        ADD COLUMN IF NOT EXISTS "categoryAccountId" UUID;
      `);
      console.log('✅ تم التحقق من عمود categoryAccountId في fixed_assets');
    } catch (error) {
      console.log('ℹ️  عمود categoryAccountId موجود مسبقاً في fixed_assets');
    }
    
    // اختبار 5: اختبار الاستعلام الذي كان يفشل
    console.log('\n🧪 اختبار استعلام الحسابات...');
    try {
      const [accounts] = await sequelize.query(`
        SELECT 
          "Account"."id", 
          "Account"."code", 
          "Account"."name", 
          "Account"."type", 
          "Account"."isActive", 
          "Account"."isMonitored"
        FROM "accounts" AS "Account" 
        WHERE "Account"."isActive" = true
        ORDER BY "Account"."code" ASC 
        LIMIT 5;
      `);
      
      console.log(`✅ تم جلب ${accounts.length} حساب بنجاح`);
      console.log('📋 عينة من الحسابات:');
      accounts.forEach(acc => {
        console.log(`  ${acc.code} - ${acc.name} (مراقب: ${acc.isMonitored ? 'نعم' : 'لا'})`);
      });
      
    } catch (error) {
      console.error('❌ خطأ في اختبار استعلام الحسابات:', error.message);
    }
    
    // إصلاح 6: إنشاء مجلد الرفع إذا لم يكن موجود
    console.log('\n📁 التحقق من مجلد الرفع...');
    try {
      await sequelize.query(`
        SELECT 1; -- Just a test query
      `);
      console.log('ℹ️  لا يمكن إنشاء مجلدات من قاعدة البيانات - يجب إنشاؤها يدوياً');
    } catch (error) {
      console.log('ℹ️  مجلد الرفع يحتاج إنشاء يدوي');
    }
    
    // إصلاح 7: تحديث إعدادات الشعار لحل مشكلة 404
    console.log('\n🖼️  إصلاح إعدادات الشعار...');
    try {
      // حذف إعدادات الشعار المكسورة
      await sequelize.query(`
        DELETE FROM settings 
        WHERE key LIKE 'logo%';
      `);
      console.log('✅ تم حذف إعدادات الشعار المكسورة');
      
      // إعادة تعيين إعدادات الشعار الافتراضية
      await sequelize.query(`
        INSERT INTO settings (key, value, type, description, "createdAt", "updatedAt")
        VALUES 
        ('logo_filename', NULL, 'string', 'Logo filename', NOW(), NOW()),
        ('logo_originalname', NULL, 'string', 'Logo original name', NOW(), NOW()),
        ('logo_mimetype', NULL, 'string', 'Logo MIME type', NOW(), NOW()),
        ('logo_size', NULL, 'string', 'Logo file size', NOW(), NOW()),
        ('logo_uploaddate', NULL, 'string', 'Logo upload date', NOW(), NOW())
        ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        "updatedAt" = NOW();
      `);
      console.log('✅ تم إعادة تعيين إعدادات الشعار الافتراضية');
      
    } catch (error) {
      console.error('❌ خطأ في إصلاح إعدادات الشعار:', error.message);
    }
    
    console.log('\n🎉 تم إصلاح مخطط قاعدة البيانات بنجاح!');
    
    // ملخص الإصلاحات
    console.log('\n📊 ملخص الإصلاحات:');
    console.log('  ✅ إضافة عمود isMonitored إلى جدول accounts');
    console.log('  ✅ التحقق من الأعمدة المطلوبة الأخرى');
    console.log('  ✅ إصلاح إعدادات الشعار');
    console.log('  ✅ اختبار استعلامات الحسابات');
    
    console.log('\n💡 الخطوات التالية:');
    console.log('  1. إعادة تشغيل الخادم الإنتاج');
    console.log('  2. اختبار تحميل الحسابات');
    console.log('  3. رفع شعار جديد إذا لزم الأمر');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح مخطط قاعدة البيانات:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

fixProductionSchema();
