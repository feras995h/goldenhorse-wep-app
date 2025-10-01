/**
 * Create AccountMapping - إنشاء AccountMapping فقط
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createMapping() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ متصل!\n');

    // الحصول على IDs الحسابات
    console.log('📊 البحث عن الحسابات...\n');
    
    const accounts = {};
    const codes = ['4101', '1201', '2301', '4102', '4103', '4104', '4105'];
    
    for (const code of codes) {
      const result = await client.query('SELECT id, name FROM accounts WHERE code = $1', [code]);
      if (result.rows.length > 0) {
        accounts[code] = result.rows[0];
        console.log(`✅ ${code} - ${result.rows[0].name}`);
      } else {
        console.log(`❌ ${code} - غير موجود!`);
      }
    }

    if (Object.keys(accounts).length < 3) {
      console.log('\n❌ الحسابات الأساسية مفقودة! شغل: npm run ultimate-fix\n');
      return;
    }

    console.log('\n🔗 إنشاء AccountMapping...\n');

    // تعطيل القديم
    await client.query(`UPDATE account_mappings SET "isActive" = false`);

    // إنشاء جديد - بالبنية الصحيحة
    await client.query(`
      INSERT INTO account_mappings (
        "mappingType",
        "sourceType",
        "accountId",
        "salesRevenueAccount",
        "accountsReceivableAccount",
        "salesTaxAccount",
        "discountAccount",
        "shippingRevenueAccount",
        "customsClearanceAccount",
        "storageAccount",
        "insuranceAccount",
        "isActive",
        description
      ) VALUES (
        'default',
        'system',
        $1,
        $2, $3, $4, $5, $6, $7, $8, $9,
        true,
        'Account Mapping للشحن الدولي - تم الإنشاء تلقائياً'
      )
    `, [
      accounts['4101'].id, // accountId (الحساب الرئيسي)
      accounts['4101'].id, // salesRevenueAccount
      accounts['1201'].id, // accountsReceivableAccount
      accounts['2301'].id, // salesTaxAccount
      accounts['4102']?.id || null, // discountAccount
      accounts['4101'].id, // shippingRevenueAccount
      accounts['4103']?.id || null, // customsClearanceAccount
      accounts['4104']?.id || null, // storageAccount
      accounts['4105']?.id || null  // insuranceAccount
    ]);

    console.log('✅ تم إنشاء AccountMapping بنجاح!\n');

    // التحقق
    const check = await client.query(`
      SELECT 
        am."mappingType",
        am."sourceType",
        am."isActive",
        sr.code as sales_code,
        sr.name as sales_name,
        ar.code as ar_code,
        ar.name as ar_name
      FROM account_mappings am
      LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
      LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
      WHERE am."isActive" = true
    `);

    if (check.rows.length > 0) {
      console.log('📊 AccountMapping النشط:');
      console.table(check.rows);
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 نجح! النظام جاهز تماماً');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🚀 الخطوة التالية:');
      console.log('   npm run dev\n');
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error('\nالتفاصيل:', error);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال\n');
  }
}

createMapping();
