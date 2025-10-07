import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// استخدم متغيرات البيئة بدلاً من hardcoded credentials
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@host:5432/database';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           تطبيق الإصلاحات - Golden Horse Shipping              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📊 قاعدة البيانات: postgres');
console.log('🌐 الخادم: 72.60.92.146:5432\n');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function executeFixes() {
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✓ تم الاتصال بنجاح\n');

    const queryInterface = sequelize.getQueryInterface();

    // التحقق من جدول SequelizeMeta
    const [tables] = await sequelize.query(
      "SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'"
    );

    if (tables.length === 0) {
      console.log('📝 إنشاء جدول SequelizeMeta...');
      await sequelize.query(`
        CREATE TABLE "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        )
      `);
    }

    // قراءة الهجرات المطبقة
    const [appliedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name'
    );
    const appliedNames = new Set(appliedMigrations.map(m => m.name));

    console.log(`📋 الهجرات المطبقة حالياً: ${appliedNames.size}`);
    if (appliedNames.size > 0) {
      appliedNames.forEach(name => console.log(`   ✓ ${name}`));
    }
    console.log('');

    const migrations = [
      {
        name: '20251005000001-create-missing-tables.js',
        description: 'إنشاء الجداول المفقودة'
      },
      {
        name: '20251005000002-add-missing-fields.js',
        description: 'إضافة الحقول المفقودة'
      }
    ];

    console.log('🆕 الهجرات الجديدة:');
    for (const migration of migrations) {
      const status = appliedNames.has(migration.name) ? '✓ مطبقة' : '⏳ جديدة';
      console.log(`   ${status} ${migration.description}`);
    }
    console.log('');

    // تطبيق الهجرات
    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) {
        console.log(`⏭️  تخطي ${migration.name} (مطبقة مسبقاً)\n`);
        continue;
      }

      console.log('='.repeat(80));
      console.log(`🚀 ${migration.description}`);
      console.log(`   الملف: ${migration.name}`);
      console.log('='.repeat(80));

      try {
        const migrationPath = 'file:///' + path.join(__dirname, 'src', 'migrations', migration.name).replace(/\\/g, '/');
        console.log(`📂 تحميل من: ${migrationPath}\n`);
        
        const migrationModule = await import(migrationPath);
        
        // التحقق من نوع التصدير
        const upFunction = migrationModule.default?.up || migrationModule.up;
        
        if (!upFunction) {
          throw new Error('لم يتم العثور على دالة up في ملف الهجرة');
        }

        console.log('⚙️  تنفيذ الهجرة...');
        await upFunction(queryInterface, Sequelize);

        console.log('📝 تسجيل الهجرة...');
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
          {
            replacements: { name: migration.name },
            type: Sequelize.QueryTypes.INSERT
          }
        );

        console.log(`✅ نجح تطبيق ${migration.name}\n`);
      } catch (error) {
        console.error(`\n❌ فشل ${migration.name}:`);
        console.error('الخطأ:', error.message);
        
        if (error.original) {
          console.error('التفاصيل:', error.original.message);
          console.error('SQL:', error.sql);
        }
        
        console.error('\nStack trace:');
        console.error(error.stack);
        
        // الاستمرار في الهجرة التالية بدلاً من التوقف
        console.log('\n⚠️  تخطي هذه الهجرة والمتابعة...\n');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتمل تطبيق الهجرات!');
    console.log('='.repeat(80));

    // عرض الإحصائيات
    const [tableCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    );
    
    console.log(`\n📊 إجمالي الجداول في قاعدة البيانات: ${tableCount[0].count}`);

    const [finalApplied] = await sequelize.query('SELECT COUNT(*) as count FROM "SequelizeMeta"');
    console.log(`📋 إجمالي الهجرات المطبقة: ${finalApplied[0].count}`);

    console.log('\n🔍 للتحقق من النتائج، قم بتشغيل:');
    console.log('   node comprehensive-database-check.js\n');

  } catch (error) {
    console.error('\n❌ خطأ في تطبيق الهجرات:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

console.log('⚠️  تحذير: سيتم تطبيق تغييرات على قاعدة البيانات');
console.log('⏳ البدء خلال 3 ثواني... اضغط Ctrl+C للإلغاء\n');

setTimeout(() => {
  executeFixes();
}, 3000);
