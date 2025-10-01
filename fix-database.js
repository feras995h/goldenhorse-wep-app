/**
 * Golden Horse - Database Fix Script
 * إصلاح سريع لإنشاء الحسابات الأساسية
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function fixDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بنجاح!\n');

    // الحسابات المطلوبة
    const accounts = [
      { code: '4101', name: 'إيرادات خدمات الشحن البحري', nameEn: 'Sea Freight Revenue', type: 'revenue', rootType: 'revenue', level: 2, isGroup: false, nature: 'credit' },
      { code: '1201', name: 'ذمم العملاء', nameEn: 'Accounts Receivable', type: 'asset', rootType: 'current_assets', level: 2, isGroup: true, nature: 'debit' },
      { code: '2301', name: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable', type: 'liability', rootType: 'current_liabilities', level: 2, isGroup: false, nature: 'credit' },
      { code: '4102', name: 'خصومات المبيعات', nameEn: 'Sales Discounts', type: 'revenue', rootType: 'revenue', level: 2, isGroup: false, nature: 'debit' },
      { code: '4103', name: 'إيرادات خدمات التخليص الجمركي', nameEn: 'Customs Clearance Revenue', type: 'revenue', rootType: 'revenue', level: 2, isGroup: false, nature: 'credit' },
      { code: '4104', name: 'إيرادات خدمات التخزين', nameEn: 'Storage Services Revenue', type: 'revenue', rootType: 'revenue', level: 2, isGroup: false, nature: 'credit' },
      { code: '4105', name: 'إيرادات خدمات التأمين', nameEn: 'Insurance Services Revenue', type: 'revenue', rootType: 'revenue', level: 2, isGroup: false, nature: 'credit' }
    ];

    console.log('📊 إنشاء الحسابات الأساسية...\n');

    for (const acc of accounts) {
      try {
        const reportType = acc.type === 'revenue' || acc.type === 'expense' ? 'income_statement' : 'balance_sheet';
        
        const result = await client.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType", 
            level, "isGroup", "isActive", balance, currency, nature, 
            "createdAt", "updatedAt"
          )
          SELECT 
            gen_random_uuid(),
            $1, $2, $3, $4::enum_accounts_type, $5::enum_accounts_roottype, $6::enum_accounts_reporttype, 
            $7, $8, true, 0, 'LYD', $9, NOW(), NOW()
          WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = $1)
          RETURNING code, name
        `, [acc.code, acc.name, acc.nameEn, acc.type, acc.rootType, reportType, acc.level, acc.isGroup, acc.nature]);

        if (result.rows.length > 0) {
          console.log(`✅ ${acc.code} - ${acc.name}`);
        } else {
          console.log(`⏭️  ${acc.code} - موجود بالفعل`);
        }
      } catch (error) {
        console.log(`❌ ${acc.code} - خطأ: ${error.message}`);
      }
    }

    console.log('\n🔗 التحقق من AccountMapping...\n');

    // التحقق من AccountMapping
    const mappingCheck = await client.query(`
      SELECT COUNT(*) as count FROM account_mappings WHERE "isActive" = true
    `);

    if (mappingCheck.rows[0].count === '0') {
      console.log('⚠️  لا يوجد AccountMapping نشط، جاري الإنشاء...');
      
      // حذف أي mapping قديم
      await client.query(`UPDATE account_mappings SET "isActive" = false`);

      // إنشاء mapping جديد
      await client.query(`
        INSERT INTO account_mappings (
          id,
          "salesRevenueAccount",
          "accountsReceivableAccount",
          "salesTaxAccount",
          "discountAccount",
          "shippingRevenueAccount",
          "customsClearanceAccount",
          "storageAccount",
          "insuranceAccount",
          "isActive",
          description,
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          (SELECT id FROM accounts WHERE code = '4101'),
          (SELECT id FROM accounts WHERE code = '1201'),
          (SELECT id FROM accounts WHERE code = '2301'),
          (SELECT id FROM accounts WHERE code = '4102'),
          (SELECT id FROM accounts WHERE code = '4101'),
          (SELECT id FROM accounts WHERE code = '4103'),
          (SELECT id FROM accounts WHERE code = '4104'),
          (SELECT id FROM accounts WHERE code = '4105'),
          true,
          'Account Mapping للشحن الدولي - تم الإنشاء تلقائياً',
          NOW(),
          NOW()
        )
      `);

      console.log('✅ تم إنشاء AccountMapping جديد');
    } else {
      console.log('✅ AccountMapping موجود ونشط');
    }

    // التحقق النهائي
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔍 التحقق النهائي...\n');

    const finalCheck = await client.query(`
      SELECT code, name, type, "isGroup", balance
      FROM accounts 
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    console.log('📊 الحسابات الأساسية:');
    console.table(finalCheck.rows);

    const mappingFinal = await client.query(`
      SELECT 
        am."isActive",
        sr.code as sales_code,
        ar.code as ar_code,
        tax.code as tax_code
      FROM account_mappings am
      LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
      LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
      LEFT JOIN accounts tax ON am."salesTaxAccount" = tax.id
      WHERE am."isActive" = true
    `);

    console.log('\n✅ AccountMapping:');
    console.table(mappingFinal.rows);

    if (finalCheck.rows.length >= 7 && mappingFinal.rows.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🚀 الخطوة التالية:');
      console.log('   npm run dev\n');
    } else {
      console.log('\n⚠️ تحذير: بعض الحسابات مفقودة');
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabase();
