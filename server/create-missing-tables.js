import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة من المجلد الجذر
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔄 فحص وإنشاء الجداول المفقودة في PostgreSQL...');

// الاتصال المباشر بـ PostgreSQL
const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function createMissingTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
    
    // فحص الجداول الموجودة
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 الجداول الموجودة:');
    const tableNames = existingTables.map(t => t.table_name);
    tableNames.forEach(table => console.log(`  - ${table}`));
    
    // قائمة الجداول المطلوبة
    const requiredTables = [
      'accounts',
      'users', 
      'customers',
      'journal_entries',
      'journal_entry_details',
      'gl_entries',
      'fixed_assets',
      'notifications',
      'settings'
    ];
    
    console.log('\n🔍 فحص الجداول المطلوبة...');
    
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ جميع الجداول المطلوبة موجودة');
    } else {
      console.log(`⚠️  الجداول المفقودة: ${missingTables.join(', ')}`);
      
      console.log('\n🔄 إنشاء الجداول المفقودة...');

      // إنشاء جدول الإشعارات إذا كان مفقود
      if (missingTables.includes('notifications')) {
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            category VARCHAR(20) DEFAULT 'system' CHECK (category IN ('system', 'financial', 'user', 'security', 'sales', 'operations')),
            "userId" UUID REFERENCES users(id),
            read BOOLEAN DEFAULT false,
            "readAt" TIMESTAMP WITH TIME ZONE,
            "actionUrl" VARCHAR(500),
            "actionLabel" VARCHAR(100),
            metadata JSONB,
            "expiresAt" TIMESTAMP WITH TIME ZONE,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `);
        console.log('✅ تم إنشاء جدول notifications');
      }

      console.log('✅ تم إنشاء الجداول المفقودة بنجاح');
    }
    
    // فحص الجداول مرة أخرى
    const [finalTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 الجداول النهائية:');
    finalTables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // اختبار جدول الإشعارات
    if (finalTables.some(t => t.table_name === 'notifications')) {
      try {
        const [notificationResult] = await sequelize.query('SELECT COUNT(*) as count FROM notifications');
        console.log(`\n📬 عدد الإشعارات: ${notificationResult[0].count}`);
      } catch (error) {
        console.log(`⚠️  خطأ في الوصول لجدول الإشعارات: ${error.message}`);
      }
    }

    // اختبار جدول الحسابات
    try {
      const [accountResult] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`💰 عدد الحسابات: ${accountResult[0].count}`);
    } catch (error) {
      console.log(`⚠️  خطأ في الوصول لجدول الحسابات: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

createMissingTables();
