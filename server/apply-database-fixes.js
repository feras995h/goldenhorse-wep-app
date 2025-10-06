import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد الاتصال بقاعدة البيانات
const cleanDBUrl = process.env.DB_URL ? process.env.DB_URL.trim().replace(/^=+/, '') : null;
const cleanDatabaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim().replace(/^=+/, '') : null;
const DATABASE_URL = cleanDBUrl || cleanDatabaseUrl;

let sequelize;

if (DATABASE_URL && DATABASE_URL.trim() !== '') {
  sequelize = new Sequelize(DATABASE_URL.trim(), {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'golden_horse',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: false
      }
    }
  );
}

async function createBackup() {
  console.log('📦 إنشاء نسخة احتياطية من قاعدة البيانات...');
  console.log('⚠️  يُنصح بشدة بإنشاء نسخة احتياطية يدوياً باستخدام:');
  console.log(`   pg_dump -U ${process.env.DB_USERNAME || 'postgres'} -d ${process.env.DB_NAME || 'golden_horse'} > backup_$(date +%Y%m%d_%H%M%S).sql`);
  console.log('');
  
  // انتظار 5 ثواني للسماح للمستخدم بالإلغاء
  console.log('⏳ سيبدأ التطبيق خلال 5 ثواني... اضغط Ctrl+C للإلغاء');
  await new Promise(resolve => setTimeout(resolve, 5000));
}

async function applyMigrations() {
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✓ تم الاتصال بنجاح\n');

    // التحقق من وجود جدول SequelizeMeta
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'"
    );

    if (tables.length === 0) {
      console.log('📝 إنشاء جدول SequelizeMeta...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        )
      `);
    }

    // قراءة الهجرات المطبقة
    const [appliedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name'
    );
    const appliedMigrationNames = new Set(appliedMigrations.map(m => m.name));

    console.log('📋 الهجرات المطبقة حالياً:', appliedMigrationNames.size);
    appliedMigrationNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // قراءة ملفات الهجرة الجديدة
    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const newMigrations = [
      '20251005000001-create-missing-tables.js',
      '20251005000002-add-missing-fields.js'
    ];

    console.log('🔧 الهجرات الجديدة المتاحة:');
    newMigrations.forEach(name => {
      const status = appliedMigrationNames.has(name) ? '✓ مطبقة' : '⏳ جديدة';
      console.log(`   ${status} - ${name}`);
    });
    console.log('');

    // تطبيق الهجرات الجديدة
    for (const migrationFile of newMigrations) {
      if (appliedMigrationNames.has(migrationFile)) {
        console.log(`⏭️  تخطي ${migrationFile} (مطبقة مسبقاً)`);
        continue;
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🚀 تطبيق الهجرة: ${migrationFile}`);
      console.log('='.repeat(80));

      try {
        const migrationPath = 'file://' + path.join(migrationsDir, migrationFile).replace(/\\/g, '/');
        console.log(`📂 تحميل الهجرة من: ${migrationPath}`);
        
        const migration = await import(migrationPath);
        
        // تطبيق الهجرة
        await migration.default.up(sequelize.getQueryInterface(), Sequelize);

        // تسجيل الهجرة كمطبقة
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
          {
            replacements: [migrationFile],
            type: Sequelize.QueryTypes.INSERT
          }
        );

        console.log(`✅ تم تطبيق ${migrationFile} بنجاح!`);
      } catch (error) {
        console.error(`❌ فشل تطبيق ${migrationFile}:`, error.message);
        console.error('التفاصيل:', error);
        throw error;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتمل تطبيق جميع الهجرات بنجاح!');
    console.log('='.repeat(80));

    // عرض ملخص
    const [finalTables] = await sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    );
    
    console.log('\n📊 ملخص النتائج:');
    console.log(`   - إجمالي الجداول في قاعدة البيانات: ${finalTables[0].count}`);
    console.log(`   - الهجرات المطبقة: ${appliedMigrationNames.size + newMigrations.filter(m => !appliedMigrationNames.has(m)).length}`);

    console.log('\n🔍 للتحقق من النتائج، قم بتشغيل:');
    console.log('   node comprehensive-database-check.js');

  } catch (error) {
    console.error('\n❌ حدث خطأ أثناء تطبيق الهجرات:', error);
    console.error('\n⚠️  يُرجى التحقق من النسخة الاحتياطية واستعادتها إذا لزم الأمر');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        تطبيق إصلاحات قاعدة البيانات - Golden Horse          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  console.log('⚠️  تحذير مهم:');
  console.log('   - سيتم تطبيق تغييرات على قاعدة البيانات');
  console.log('   - تأكد من وجود نسخة احتياطية قبل المتابعة');
  console.log('   - لا تقاطع العملية بعد البدء');
  console.log('');

  await createBackup();
  await applyMigrations();

  console.log('\n✅ تمت العملية بنجاح!');
  process.exit(0);
}

// معالجة الإشارات
process.on('SIGINT', () => {
  console.log('\n\n⚠️  تم إلغاء العملية من قبل المستخدم');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('\n❌ خطأ غير متوقع:', error);
  process.exit(1);
});

// تشغيل السكريبت
main();
