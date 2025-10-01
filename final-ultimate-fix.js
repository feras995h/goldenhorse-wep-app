/**
 * Ultimate Fix - الحل النهائي البسيط
 * يتجاهل account_mappings ويركز على الحسابات فقط
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function ultimateFix() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Golden Horse - Ultimate Fix');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // إنشاء الحسابات الأساسية فقط
    console.log('📊 إنشاء الحسابات الأساسية...\n');

    const accounts = [
      { code: '4101', name: 'إيرادات خدمات الشحن البحري', nameEn: 'Sea Freight Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', level: 2, isGroup: false, nature: 'credit' },
      { code: '1201', name: 'ذمم العملاء', nameEn: 'Accounts Receivable', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', level: 2, isGroup: true, nature: 'debit' },
      { code: '2301', name: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', level: 2, isGroup: false, nature: 'credit' },
      { code: '4102', name: 'خصومات المبيعات', nameEn: 'Sales Discounts', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', level: 2, isGroup: false, nature: 'debit' },
      { code: '4103', name: 'إيرادات خدمات التخليص الجمركي', nameEn: 'Customs Clearance Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', level: 2, isGroup: false, nature: 'credit' },
      { code: '4104', name: 'إيرادات خدمات التخزين', nameEn: 'Storage Services Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', level: 2, isGroup: false, nature: 'credit' },
      { code: '4105', name: 'إيرادات خدمات التأمين', nameEn: 'Insurance Services Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', level: 2, isGroup: false, nature: 'credit' }
    ];

    let created = 0;
    let existing = 0;

    for (const acc of accounts) {
      try {
        const check = await client.query('SELECT id FROM accounts WHERE code = $1', [acc.code]);
        
        if (check.rows.length === 0) {
          await client.query(`
            INSERT INTO accounts (
              id, code, name, "nameEn", type, "rootType", "reportType", 
              level, "isGroup", "isActive", balance, currency, nature, 
              "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, 0, 'LYD', $9, NOW(), NOW()
            )
          `, [acc.code, acc.name, acc.nameEn, acc.type, acc.rootType, acc.reportType, acc.level, acc.isGroup, acc.nature]);
          
          console.log(`✅ ${acc.code} - ${acc.name}`);
          created++;
        } else {
          console.log(`⏭️  ${acc.code} - موجود بالفعل`);
          existing++;
        }
      } catch (error) {
        console.log(`❌ ${acc.code} - خطأ: ${error.message}`);
      }
    }

    console.log(`\n📊 النتيجة: ${created} جديد، ${existing} موجود\n`);

    // التحقق النهائي
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 التحقق النهائي...\n');

    const finalAccounts = await client.query(`
      SELECT code, name, type, "rootType", "isGroup", balance
      FROM accounts 
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    console.log('📊 الحسابات الأساسية:');
    console.table(finalAccounts.rows);

    // إحصائيات
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM accounts) as total_accounts,
        (SELECT COUNT(*) FROM accounts WHERE "isActive" = true) as active_accounts,
        (SELECT COUNT(*) FROM gl_entries) as gl_entries,
        (SELECT COUNT(*) FROM journal_entries) as journal_entries,
        (SELECT COUNT(*) FROM sales_invoices) as sales_invoices
    `);

    console.log('\n📊 إحصائيات النظام:');
    console.table(stats.rows);

    // النتيجة النهائية
    if (finalAccounts.rows.length >= 7) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 نجح! الحسابات الأساسية جاهزة');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('✅ تم إنشاء/التحقق من 7 حسابات أساسية');
      console.log('✅ النظام جاهز للعمل\n');
      console.log('🚀 الخطوة التالية:');
      console.log('   npm run dev\n');
      console.log('ملاحظة: سيقوم AccountingInitializer بإنشاء AccountMapping');
      console.log('         تلقائياً عند بدء تشغيل السيرفر\n');
    } else {
      console.log('\n⚠️ تحذير: بعض الحسابات مفقودة');
      console.log(`   الحسابات: ${finalAccounts.rows.length}/7\n`);
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال\n');
  }
}

ultimateFix();
