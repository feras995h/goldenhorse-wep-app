import { Sequelize } from 'sequelize';
import config from './src/config/database.cjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = (process.env.NODE_ENV || 'development').trim().replace(/^=+/, '');
const dbConfig = config[env];

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           تطبيق الهجرات - Golden Horse Shipping              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`🔍 البيئة: ${env}`);

// Initialize Sequelize
let sequelize;

if (dbConfig.url) {
  let cleanUrl = dbConfig.url;
  if (cleanUrl.startsWith('=')) {
    cleanUrl = cleanUrl.replace(/^=+/, '');
  }
  if (cleanUrl.startsWith('postgres://')) {
    cleanUrl = cleanUrl.replace('postgres://', 'postgresql://');
  }
  
  console.log('🔗 استخدام اتصال URL');
  sequelize = new Sequelize(cleanUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: dbConfig.dialectOptions
  });
} else if (dbConfig.dialect === 'sqlite') {
  console.log('💾 استخدام SQLite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: false
  });
} else {
  console.log('🗄️  استخدام معاملات فردية');
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: false,
      dialectOptions: dbConfig.dialectOptions
    }
  );
}

async function runMigrations() {
  try {
    console.log('\n🔗 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✓ تم الاتصال بنجاح\n');

    const queryInterface = sequelize.getQueryInterface();

    // التحقق من جدول SequelizeMeta
    const dialect = sequelize.getDialect();
    let tables;
    
    if (dialect === 'sqlite') {
      [tables] = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='SequelizeMeta'"
      );
    } else {
      [tables] = await sequelize.query(
        "SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'"
      );
    }

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

    console.log(`📋 الهجرات المطبقة: ${appliedNames.size}`);
    if (appliedNames.size > 0) {
      appliedNames.forEach(name => console.log(`   ✓ ${name}`));
    }
    console.log('');

    // الهجرات الجديدة
    const newMigrations = [
      '20251005000001-create-missing-tables.js',
      '20251005000002-add-missing-fields.js'
    ];

    console.log('🆕 الهجرات الجديدة:');
    for (const name of newMigrations) {
      const status = appliedNames.has(name) ? '✓ مطبقة' : '⏳ جديدة';
      console.log(`   ${status} ${name}`);
    }
    console.log('');

    // تطبيق الهجرات
    for (const migrationFile of newMigrations) {
      if (appliedNames.has(migrationFile)) {
        console.log(`⏭️  تخطي ${migrationFile}\n`);
        continue;
      }

      console.log('='.repeat(80));
      console.log(`🚀 تطبيق: ${migrationFile}`);
      console.log('='.repeat(80));

      try {
        const migrationPath = 'file:///' + path.join(__dirname, 'src', 'migrations', migrationFile).replace(/\\/g, '/');
        const migration = await import(migrationPath);
        
        await migration.default.up(queryInterface, Sequelize);

        await sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
          {
            replacements: { name: migrationFile },
            type: Sequelize.QueryTypes.INSERT
          }
        );

        console.log(`✅ نجح تطبيق ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ فشل ${migrationFile}:`);
        console.error(error.message);
        if (error.original) {
          console.error('التفاصيل:', error.original.message);
        }
        throw error;
      }
    }

    console.log('='.repeat(80));
    console.log('✅ اكتملت جميع الهجرات بنجاح!');
    console.log('='.repeat(80));

    // عرض الإحصائيات
    if (dialect === 'sqlite') {
      const [tableCount] = await sequelize.query(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      console.log(`\n📊 إجمالي الجداول: ${tableCount[0].count}`);
    } else {
      const [tableCount] = await sequelize.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
      );
      console.log(`\n📊 إجمالي الجداول: ${tableCount[0].count}`);
    }

    console.log('\n🔍 للتحقق من النتائج:');
    console.log('   node comprehensive-database-check.js\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
