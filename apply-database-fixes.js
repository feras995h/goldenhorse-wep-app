import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * سكريپت تطبيق إصلاحات قاعدة البيانات على VPS
 * يقوم بتنفيذ جميع الإصلاحات المطلوبة لحل أخطاء VPS
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function applyDatabaseFixes() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false // تعطيل SSL للخادم المحلي
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // قراءة ملف الإصلاحات
    const sqlFilePath = path.join(__dirname, 'fix-vps-database.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('ملف الإصلاحات غير موجود: fix-vps-database.sql');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 تم قراءة ملف الإصلاحات');

    // تقسيم الاستعلامات
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 تطبيق ${statements.length} إصلاح...\n`);

    let successCount = 0;
    let errorCount = 0;

    // تنفيذ كل استعلام
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // تخطي التعليقات والأسطر الفارغة
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      try {
        console.log(`⚙️  تنفيذ الإصلاح ${i + 1}/${statements.length}...`);
        
        // عرض جزء من الاستعلام للتشخيص
        const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
        console.log(`   📝 ${preview}${statement.length > 100 ? '...' : ''}`);
        
        await client.query(statement);
        successCount++;
        console.log(`   ✅ نجح`);
        
      } catch (error) {
        errorCount++;
        console.log(`   ❌ فشل: ${error.message}`);
        
        // بعض الأخطاء مقبولة (مثل الجداول الموجودة بالفعل)
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          console.log(`   ℹ️  خطأ مقبول - المتابعة...`);
        } else {
          console.log(`   ⚠️  خطأ غير متوقع - المتابعة...`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 نتائج تطبيق الإصلاحات:');
    console.log(`✅ نجح: ${successCount} إصلاح`);
    console.log(`❌ فشل: ${errorCount} إصلاح`);
    console.log(`📈 معدل النجاح: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

    // فحص حالة قاعدة البيانات بعد الإصلاحات
    console.log('\n🔍 فحص حالة قاعدة البيانات...');
    
    try {
      // فحص الجداول الموجودة
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log(`📋 عدد الجداول: ${tablesResult.rows.length}`);
      
      // فحص جدول الحسابات
      const accountsResult = await client.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`🏦 عدد الحسابات: ${accountsResult.rows[0].count}`);
      
      // فحص الأعمدة المضافة
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' AND column_name IN ('isMonitored', 'freezeAccount', 'accountType')
        ORDER BY column_name
      `);
      
      console.log(`📊 الأعمدة المضافة: ${columnsResult.rows.map(r => r.column_name).join(', ')}`);
      
      // فحص جدول العملاء
      try {
        const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
        console.log(`👥 عدد العملاء: ${customersResult.rows[0].count}`);
      } catch (error) {
        console.log(`👥 جدول العملاء: غير موجود أو يحتاج إنشاء`);
      }
      
      // فحص جدول الإعدادات
      try {
        const settingsResult = await client.query('SELECT COUNT(*) as count FROM settings');
        console.log(`⚙️  عدد الإعدادات: ${settingsResult.rows[0].count}`);
      } catch (error) {
        console.log(`⚙️  جدول الإعدادات: غير موجود أو يحتاج إنشاء`);
      }

    } catch (error) {
      console.log(`❌ خطأ في فحص قاعدة البيانات: ${error.message}`);
    }

    console.log('\n🎉 تم إكمال تطبيق الإصلاحات!');
    
    if (errorCount === 0) {
      console.log('✅ جميع الإصلاحات نجحت - قاعدة البيانات جاهزة');
    } else if (successCount > errorCount) {
      console.log('⚠️  معظم الإصلاحات نجحت - قاعدة البيانات محسنة');
    } else {
      console.log('❌ العديد من الإصلاحات فشلت - قد تحتاج مراجعة');
    }

  } catch (error) {
    console.error('❌ خطأ في تطبيق الإصلاحات:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريپت
console.log('🔧 بدء تطبيق إصلاحات قاعدة البيانات...');
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('apply-database-fixes.js')) {
  applyDatabaseFixes()
    .then(() => {
      console.log('\n🚀 الإصلاحات مكتملة - يمكن الآن إعادة تشغيل الخادم');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في تطبيق الإصلاحات:', error.message);
      process.exit(1);
    });
}

export { applyDatabaseFixes };
