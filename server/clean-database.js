import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: console.log 
});

/**
 * سكريبت تنظيف قاعدة البيانات بالكامل
 * ⚠️ تحذير: هذا السكريبت سيحذف جميع الجداول والبيانات!
 */
async function cleanDatabase() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    console.log('⚠️  تحذير: سيتم حذف جميع الجداول والبيانات!');
    console.log('⏳ الانتظار 5 ثواني... (اضغط Ctrl+C للإلغاء)\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  بدء عملية التنظيف...\n');

    // الحصول على قائمة بجميع الجداول
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`📊 تم العثور على ${tables.length} جدول\n`);

    if (tables.length === 0) {
      console.log('✅ قاعدة البيانات فارغة بالفعل');
      await sequelize.close();
      return;
    }

    // حذف جميع الجداول
    console.log('🗑️  حذف الجداول...\n');
    
    // تعطيل foreign key constraints مؤقتاً
    await sequelize.query('SET session_replication_role = replica;');

    let deletedCount = 0;
    for (const table of tables) {
      const tableName = table.tablename;
      
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        console.log(`   ✅ تم حذف: ${tableName}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ فشل حذف ${tableName}:`, error.message);
      }
    }

    // إعادة تفعيل foreign key constraints
    await sequelize.query('SET session_replication_role = DEFAULT;');

    console.log(`\n✅ تم حذف ${deletedCount} من ${tables.length} جدول بنجاح`);

    // حذف SequelizeMeta (جدول الترحيلات)
    try {
      await sequelize.query('DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;');
      console.log('✅ تم حذف جدول الترحيلات (SequelizeMeta)');
    } catch (error) {
      console.log('⚠️  جدول الترحيلات غير موجود');
    }

    // التحقق من النتيجة
    const [remainingTables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

    if (remainingTables.length === 0) {
      console.log('\n✅ قاعدة البيانات نظيفة تماماً!');
    } else {
      console.log(`\n⚠️  تبقى ${remainingTables.length} جدول:`);
      remainingTables.forEach(t => console.log(`   - ${t.tablename}`));
    }

    await sequelize.close();
    console.log('\n✅ اكتملت عملية التنظيف بنجاح');
    
  } catch (error) {
    console.error('\n❌ خطأ في عملية التنظيف:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل السكريبت
cleanDatabase();
