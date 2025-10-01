/**
 * Golden Horse Shipping System
 * Database Setup Script - Automatic Execution
 * 
 * هذا السكريبت يقوم بتنفيذ database_setup.sql تلقائياً
 * على قاعدة البيانات السحابية
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// معلومات الاتصال بقاعدة البيانات السحابية
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false // السيرفر لا يستخدم SSL
  });

  try {
    console.log('🔗 جاري الاتصال بقاعدة البيانات السحابية...');
    console.log('📍 Host: 72.60.92.146:5432');
    console.log('');

    await client.connect();
    console.log('✅ تم الاتصال بنجاح!');
    console.log('');

    // قراءة ملف SQL
    console.log('📄 جاري قراءة ملف database_setup.sql...');
    const sqlFilePath = path.join(__dirname, 'database_setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ تم قراءة الملف بنجاح');
    console.log('');

    // تقسيم السكريبت إلى statements منفصلة
    console.log('⚙️ جاري تنفيذ السكريبت...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // تنفيذ السكريبت بالكامل
    // نقسمه إلى أجزاء للتنفيذ المنفصل
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // تخطي التعليقات والاستعلامات الفارغة
      if (statement.startsWith('/*') || statement.length < 10) {
        continue;
      }

      try {
        // تحديد نوع الاستعلام
        const isSelect = statement.toUpperCase().trim().startsWith('SELECT');
        const isInsert = statement.toUpperCase().trim().startsWith('INSERT');
        const isUpdate = statement.toUpperCase().trim().startsWith('UPDATE');

        const result = await client.query(statement + ';');

        if (isSelect) {
          console.log(`📊 استعلام ${i + 1}: تم العثور على ${result.rows.length} سجل`);
          if (result.rows.length > 0 && result.rows.length <= 5) {
            console.table(result.rows);
          }
        } else if (isInsert) {
          if (result.rowCount > 0) {
            console.log(`✅ إدراج ${i + 1}: تم إنشاء ${result.rowCount} سجل جديد`);
            successCount++;
          } else {
            console.log(`⏭️  إدراج ${i + 1}: السجل موجود بالفعل (تم التخطي)`);
            skipCount++;
          }
        } else if (isUpdate) {
          console.log(`✅ تحديث ${i + 1}: تم تحديث ${result.rowCount} سجل`);
          successCount++;
        } else {
          console.log(`✅ استعلام ${i + 1}: تم التنفيذ بنجاح`);
          successCount++;
        }
      } catch (error) {
        // بعض الأخطاء متوقعة (مثل السجلات المكررة)
        if (error.code === '23505') {
          // Unique violation - السجل موجود بالفعل
          console.log(`⏭️  استعلام ${i + 1}: السجل موجود بالفعل (تم التخطي)`);
          skipCount++;
        } else if (error.message.includes('already exists')) {
          console.log(`⏭️  استعلام ${i + 1}: موجود بالفعل (تم التخطي)`);
          skipCount++;
        } else {
          console.error(`❌ خطأ في استعلام ${i + 1}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 ملخص التنفيذ:');
    console.log(`   ✅ نجح: ${successCount}`);
    console.log(`   ⏭️  تم التخطي: ${skipCount}`);
    console.log(`   ❌ فشل: ${errorCount}`);
    console.log('');

    // التحقق من النتائج النهائية
    console.log('🔍 جاري التحقق من النتائج...');
    console.log('');

    // 1. التحقق من الحسابات
    const accountsResult = await client.query(`
      SELECT code, name, type, "isGroup", balance
      FROM accounts 
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    console.log('📊 الحسابات الأساسية:');
    console.table(accountsResult.rows);
    console.log('');

    // 2. التحقق من AccountMapping
    const mappingResult = await client.query(`
      SELECT 
        am.id,
        am.description,
        am."isActive",
        sr.code as sales_code,
        sr.name as sales_name,
        ar.code as ar_code,
        ar.name as ar_name,
        tax.code as tax_code,
        tax.name as tax_name
      FROM account_mappings am
      LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
      LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
      LEFT JOIN accounts tax ON am."salesTaxAccount" = tax.id
      WHERE am."isActive" = true
    `);

    if (mappingResult.rows.length > 0) {
      console.log('✅ AccountMapping نشط:');
      console.table(mappingResult.rows);
      console.log('');
    } else {
      console.log('❌ لا يوجد AccountMapping نشط!');
      console.log('');
    }

    // 3. إحصائيات عامة
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM accounts) as total_accounts,
        (SELECT COUNT(*) FROM accounts WHERE "isActive" = true) as active_accounts,
        (SELECT COUNT(*) FROM account_mappings WHERE "isActive" = true) as active_mappings,
        (SELECT COUNT(*) FROM gl_entries) as gl_entries,
        (SELECT COUNT(*) FROM journal_entries) as journal_entries
    `);

    console.log('📊 إحصائيات النظام:');
    console.table(statsResult.rows);
    console.log('');

    // النتيجة النهائية
    if (mappingResult.rows.length > 0 && accountsResult.rows.length >= 7) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
      console.log('');
      console.log('✅ الحسابات الأساسية: موجودة');
      console.log('✅ AccountMapping: نشط');
      console.log('✅ النظام جاهز للعمل');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🚀 الخطوة التالية:');
      console.log('   1. أعد تشغيل السيرفر: npm run dev');
      console.log('   2. تحقق من صحة النظام: GET /api/financial/system-health');
      console.log('   3. اختبر إنشاء فاتورة جديدة');
      console.log('');
    } else {
      console.log('⚠️ تحذير: قد تكون هناك مشاكل في الإعداد');
      console.log('   راجع الأخطاء أعلاه وحاول مرة أخرى');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ حدث خطأ في الاتصال أو التنفيذ:');
    console.error('');
    console.error('الخطأ:', error.message);
    console.error('');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 تأكد من:');
      console.error('   - أن السيرفر متاح ويعمل');
      console.error('   - أن عنوان IP صحيح: 72.60.92.146');
      console.error('   - أن المنفذ صحيح: 5432');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 لا يمكن الوصول إلى السيرفر');
      console.error('   - تحقق من اتصال الإنترنت');
      console.error('   - تحقق من عنوان IP');
    } else if (error.code === '28P01') {
      console.error('💡 خطأ في المصادقة');
      console.error('   - تحقق من اسم المستخدم والباسورد');
    }
    
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    console.log('');
  }
}

// تشغيل السكريبت
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Golden Horse Shipping System');
console.log('📦 Database Setup Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

setupDatabase().catch(error => {
  console.error('💥 فشل تنفيذ السكريبت:', error);
  process.exit(1);
});
