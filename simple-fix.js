/**
 * Simple Database Fix - Direct INSERT
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function simpleFix() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('🔗 الاتصال...');
    await client.connect();
    console.log('✅ متصل!\n');

    // إنشاء الحسابات واحداً تلو الآخر بدون parameters
    const accounts = [
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '4101', 'إيرادات خدمات الشحن البحري', 'Sea Freight Revenue', 'revenue', 'revenue', 'income_statement', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '1201', 'ذمم العملاء', 'Accounts Receivable', 'asset', 'current_assets', 'balance_sheet', 2, true, true, 0, 'LYD', 'debit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '2301', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 'current_liabilities', 'balance_sheet', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '4102', 'خصومات المبيعات', 'Sales Discounts', 'revenue', 'revenue', 'income_statement', 2, false, true, 0, 'LYD', 'debit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '4103', 'إيرادات خدمات التخليص الجمركي', 'Customs Clearance Revenue', 'revenue', 'revenue', 'income_statement', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '4104', 'إيرادات خدمات التخزين', 'Storage Services Revenue', 'revenue', 'revenue', 'income_statement', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      
      `INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), '4105', 'إيرادات خدمات التأمين', 'Insurance Services Revenue', 'revenue', 'revenue', 'income_statement', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`
    ];

    console.log('📊 إنشاء الحسابات...\n');
    for (const sql of accounts) {
      try {
        await client.query(sql);
        const code = sql.match(/'(\d{4})'/)[1];
        console.log(`✅ ${code}`);
      } catch (err) {
        console.log(`❌ خطأ: ${err.message}`);
      }
    }

    // تحديث AccountMapping
    console.log('\n🔗 تحديث AccountMapping...\n');
    
    await client.query(`UPDATE account_mappings SET "isActive" = false`);
    
    await client.query(`
      INSERT INTO account_mappings (
        id, "salesRevenueAccount", "accountsReceivableAccount", "salesTaxAccount",
        "discountAccount", "shippingRevenueAccount", "customsClearanceAccount",
        "storageAccount", "insuranceAccount", "isActive", description, "createdAt", "updatedAt"
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
        'Account Mapping - تم الإنشاء تلقائياً',
        NOW(), NOW()
      )
    `);
    
    console.log('✅ تم إنشاء AccountMapping جديد\n');

    // التحقق
    const check = await client.query(`
      SELECT code, name, type FROM accounts 
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 الحسابات المنشأة:');
    console.table(check.rows);

    const mapping = await client.query(`
      SELECT 
        sr.code as sales, ar.code as ar, tax.code as tax
      FROM account_mappings am
      JOIN accounts sr ON am."salesRevenueAccount" = sr.id
      JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
      JOIN accounts tax ON am."salesTaxAccount" = tax.id
      WHERE am."isActive" = true
    `);

    console.log('\n✅ AccountMapping:');
    console.table(mapping.rows);

    if (check.rows.length === 7 && mapping.rows.length === 1) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 نجح! النظام جاهز');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🚀 شغل السيرفر الآن: npm run dev\n');
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

simpleFix();
