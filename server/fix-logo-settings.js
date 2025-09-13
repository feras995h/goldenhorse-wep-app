import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة من المجلد الجذر
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🖼️  إصلاح إعدادات الشعار...');

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function fixLogoSettings() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
    
    // فحص بنية جدول settings
    console.log('\n🔍 فحص بنية جدول settings...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 أعمدة جدول settings:');
    columns.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - NULL: ${col.is_nullable}`);
    });
    
    // حذف إعدادات الشعار المكسورة
    console.log('\n🗑️  حذف إعدادات الشعار المكسورة...');
    await sequelize.query(`
      DELETE FROM settings 
      WHERE key LIKE 'logo%';
    `);
    console.log('✅ تم حذف إعدادات الشعار المكسورة');
    
    // إعادة إدراج إعدادات الشعار بشكل صحيح
    console.log('\n➕ إضافة إعدادات الشعار الافتراضية...');
    
    const logoSettings = [
      { key: 'logo_filename', value: null, description: 'Logo filename' },
      { key: 'logo_originalname', value: null, description: 'Logo original name' },
      { key: 'logo_mimetype', value: null, description: 'Logo MIME type' },
      { key: 'logo_size', value: null, description: 'Logo file size' },
      { key: 'logo_uploaddate', value: null, description: 'Logo upload date' }
    ];
    
    for (const setting of logoSettings) {
      try {
        await sequelize.query(`
          INSERT INTO settings (id, key, value, type, description, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), :key, :value, 'string', :description, NOW(), NOW())
          ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          "updatedAt" = NOW();
        `, {
          replacements: {
            key: setting.key,
            value: setting.value,
            description: setting.description
          }
        });
        console.log(`✅ تم إضافة إعداد: ${setting.key}`);
      } catch (error) {
        console.error(`❌ خطأ في إضافة إعداد ${setting.key}:`, error.message);
      }
    }
    
    // اختبار قراءة الإعدادات
    console.log('\n🧪 اختبار قراءة إعدادات الشعار...');
    const [logoSettings2] = await sequelize.query(`
      SELECT key, value, description 
      FROM settings 
      WHERE key LIKE 'logo%' 
      ORDER BY key;
    `);
    
    console.log('📋 إعدادات الشعار الحالية:');
    logoSettings2.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value || 'NULL'} (${setting.description})`);
    });
    
    console.log('\n🎉 تم إصلاح إعدادات الشعار بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح إعدادات الشعار:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

fixLogoSettings();
