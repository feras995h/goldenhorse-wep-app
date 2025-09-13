import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد الاتصال بقاعدة البيانات
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database', 'development.sqlite'),
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🔄 بدء تشغيل ترحيل قاعدة البيانات...');
    
    // التحقق من الاتصال
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // تشغيل الاستعلامات
    const migrations = [
      {
        name: 'إضافة categoryAccountId لجدول الأصول الثابتة',
        sql: `ALTER TABLE fixed_assets ADD COLUMN categoryAccountId TEXT REFERENCES accounts(id);`
      },
      {
        name: 'إضافة accountId لجدول العملاء',
        sql: `ALTER TABLE customers ADD COLUMN accountId TEXT REFERENCES accounts(id);`
      },
      {
        name: 'إضافة journalEntryId لجدول قيود الأستاذ العام',
        sql: `ALTER TABLE gl_entries ADD COLUMN journalEntryId TEXT;`
      },
      {
        name: 'إضافة isMonitored لجدول الحسابات',
        sql: `ALTER TABLE accounts ADD COLUMN isMonitored BOOLEAN DEFAULT FALSE;`
      }
    ];
    
    for (const migration of migrations) {
      try {
        console.log(`🔄 تشغيل: ${migration.name}`);
        await sequelize.query(migration.sql);
        console.log(`✅ تم بنجاح: ${migration.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log(`⚠️  العمود موجود مسبقاً: ${migration.name}`);
        } else {
          console.error(`❌ خطأ في: ${migration.name}`, error.message);
        }
      }
    }
    
    console.log('🎉 تم إكمال ترحيل قاعدة البيانات بنجاح!');
    
    // التحقق من الأعمدة الجديدة
    console.log('\n🔍 التحقق من الأعمدة الجديدة:');
    
    const tables = ['fixed_assets', 'customers', 'gl_entries', 'accounts'];
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`PRAGMA table_info(${table});`);
        console.log(`\n📋 أعمدة جدول ${table}:`);
        results.forEach(column => {
          console.log(`  - ${column.name} (${column.type})`);
        });
      } catch (error) {
        console.error(`❌ خطأ في قراءة معلومات جدول ${table}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في ترحيل قاعدة البيانات:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

runMigration();
