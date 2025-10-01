/**
 * Complete Database Fix - التحقق والإصلاح الشامل
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function completeFix() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Golden Horse - Complete Database Fix');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // الخطوة 1: فحص بنية account_mappings
    console.log('🔍 الخطوة 1: فحص بنية account_mappings...\n');
    
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'account_mappings'
      AND is_nullable = 'NO'
      AND column_default IS NULL
      ORDER BY ordinal_position
    `);

    console.log('📊 الأعمدة المطلوبة (NOT NULL):');
    console.table(columns.rows);

    // الخطوة 2: فحص ENUM values لـ mappingType
    const mappingTypeEnum = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_account_mappings_mappingtype'
      )
      ORDER BY enumsortorder
    `);

    console.log('\n📊 قيم mappingType المسموحة:');
    mappingTypeEnum.rows.forEach(r => console.log(`  - ${r.enumlabel}`));

    // الخطوة 3: إنشاء الحسابات الأساسية
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 الخطوة 2: إنشاء الحسابات الأساسية...\n');

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

    // الخطوة 4: إنشاء AccountMapping مع mappingType
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 الخطوة 3: إنشاء AccountMapping...\n');

    // تعطيل أي mapping قديم
    await client.query(`UPDATE account_mappings SET "isActive" = false`);
    console.log('⏭️  تم تعطيل AccountMappings القديمة');

    // الحصول على IDs الحسابات
    const acc4101 = await client.query(`SELECT id FROM accounts WHERE code = '4101'`);
    const acc1201 = await client.query(`SELECT id FROM accounts WHERE code = '1201'`);
    const acc2301 = await client.query(`SELECT id FROM accounts WHERE code = '2301'`);
    const acc4102 = await client.query(`SELECT id FROM accounts WHERE code = '4102'`);
    const acc4103 = await client.query(`SELECT id FROM accounts WHERE code = '4103'`);
    const acc4104 = await client.query(`SELECT id FROM accounts WHERE code = '4104'`);
    const acc4105 = await client.query(`SELECT id FROM accounts WHERE code = '4105'`);

    if (acc4101.rows.length && acc1201.rows.length && acc2301.rows.length) {
      // تحديد القيم المطلوبة للأعمدة NOT NULL
      const mappingType = 'default';
      const sourceType = 'manual'; // أو أي قيمة افتراضية

      // بناء الاستعلام ديناميكياً بناءً على الأعمدة المطلوبة
      const requiredColumns = columns.rows.map(r => r.column_name);
      
      let insertColumns = [
        'id', 'salesRevenueAccount', 'accountsReceivableAccount', 'salesTaxAccount',
        'discountAccount', 'shippingRevenueAccount', 'customsClearanceAccount',
        'storageAccount', 'insuranceAccount', 'isActive', 'description', 'createdAt', 'updatedAt'
      ];
      
      let insertValues = [
        'gen_random_uuid()',
        `'${acc4101.rows[0].id}'`,
        `'${acc1201.rows[0].id}'`,
        `'${acc2301.rows[0].id}'`,
        acc4102.rows[0]?.id ? `'${acc4102.rows[0].id}'` : 'NULL',
        `'${acc4101.rows[0].id}'`,
        acc4103.rows[0]?.id ? `'${acc4103.rows[0].id}'` : 'NULL',
        acc4104.rows[0]?.id ? `'${acc4104.rows[0].id}'` : 'NULL',
        acc4105.rows[0]?.id ? `'${acc4105.rows[0].id}'` : 'NULL',
        'true',
        `'Account Mapping للشحن الدولي'`,
        'NOW()',
        'NOW()'
      ];

      // إضافة الأعمدة المطلوبة
      if (requiredColumns.includes('mappingType')) {
        insertColumns.push('"mappingType"');
        insertValues.push(`'${mappingType}'`);
      }
      if (requiredColumns.includes('sourceType')) {
        insertColumns.push('"sourceType"');
        insertValues.push(`'${sourceType}'`);
      }

      const sql = `
        INSERT INTO account_mappings (${insertColumns.join(', ')})
        VALUES (${insertValues.join(', ')})
      `;

      await client.query(sql);

      console.log(`✅ تم إنشاء AccountMapping جديد`);
      if (requiredColumns.includes('mappingType')) console.log(`   - mappingType: ${mappingType}`);
      if (requiredColumns.includes('sourceType')) console.log(`   - sourceType: ${sourceType}`);
      console.log('');
    } else {
      console.log('❌ بعض الحسابات الأساسية مفقودة!\n');
    }

    // الخطوة 5: التحقق النهائي
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 الخطوة 4: التحقق النهائي...\n');

    const finalAccounts = await client.query(`
      SELECT code, name, type, "rootType", "isGroup", balance
      FROM accounts 
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    console.log('📊 الحسابات الأساسية:');
    console.table(finalAccounts.rows);

    const finalMapping = await client.query(`
      SELECT 
        am."mappingType",
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

    console.log('\n✅ AccountMapping النشط:');
    console.table(finalMapping.rows);

    // إحصائيات
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM accounts) as total_accounts,
        (SELECT COUNT(*) FROM accounts WHERE "isActive" = true) as active_accounts,
        (SELECT COUNT(*) FROM account_mappings WHERE "isActive" = true) as active_mappings,
        (SELECT COUNT(*) FROM gl_entries) as gl_entries,
        (SELECT COUNT(*) FROM journal_entries) as journal_entries,
        (SELECT COUNT(*) FROM sales_invoices) as sales_invoices
    `);

    console.log('\n📊 إحصائيات النظام:');
    console.table(stats.rows);

    // النتيجة النهائية
    if (finalAccounts.rows.length >= 7 && finalMapping.rows.length === 1) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 نجح! قاعدة البيانات جاهزة تماماً');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('✅ تم إنشاء 7 حسابات أساسية');
      console.log('✅ تم إنشاء AccountMapping نشط');
      console.log('✅ النظام المحاسبي جاهز للعمل\n');
      console.log('🚀 الخطوة التالية:');
      console.log('   npm run dev\n');
      console.log('   ثم اختبر: GET /api/financial/system-health\n');
    } else {
      console.log('\n⚠️ تحذير: قد تكون هناك مشاكل');
      console.log(`   الحسابات: ${finalAccounts.rows.length}/7`);
      console.log(`   AccountMapping: ${finalMapping.rows.length}/1\n`);
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error('\nالتفاصيل الكاملة:');
    console.error(error);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال\n');
  }
}

completeFix();
