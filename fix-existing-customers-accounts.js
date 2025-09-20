import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixExistingCustomersAccounts() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إصلاح حسابات العملاء الموجودين...\n');

    // 1. الحصول على الحساب الرئيسي للعملاء
    const customersMainAccount = await client.query(`
      SELECT id, code, name FROM accounts 
      WHERE (name LIKE '%عملاء%' OR name LIKE '%مدينون%')
      AND type = 'asset' AND "isGroup" = true
      LIMIT 1
    `);

    if (customersMainAccount.rows.length === 0) {
      console.error('❌ لم يتم العثور على الحساب الرئيسي للعملاء');
      return;
    }

    const mainAccount = customersMainAccount.rows[0];
    console.log(`📊 الحساب الرئيسي: ${mainAccount.name} (${mainAccount.code})`);

    // 2. الحصول على العملاء بدون حسابات
    const customersWithoutAccounts = await client.query(`
      SELECT c.id, c.name, c."nameEn", c.currency, c.code as customer_code
      FROM customers c
      WHERE c."accountId" IS NULL
    `);

    console.log(`👥 عدد العملاء بدون حسابات: ${customersWithoutAccounts.rows.length}`);

    // 3. إنشاء حسابات للعملاء
    for (const customer of customersWithoutAccounts.rows) {
      try {
        // إنشاء كود حساب فريد
        const timestamp = Date.now();
        const accountCode = '1201' + String(timestamp).slice(-6);
        
        console.log(`🔧 إنشاء حساب للعميل: ${customer.name}`);
        
        // إنشاء الحساب
        const accountResult = await client.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType",
            "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType",
            description, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            'asset',
            'Asset',
            'Balance Sheet',
            $4,
            4,
            false,
            true,
            0.00,
            $5,
            'debit',
            'sub',
            $6,
            NOW(),
            NOW()
          ) RETURNING id, code, name
        `, [
          accountCode, 
          customer.name, 
          customer.nameen || customer.name, 
          mainAccount.id, 
          customer.currency || 'LYD',
          `حساب العميل: ${customer.name}`
        ]);

        const newAccount = accountResult.rows[0];

        // ربط العميل بالحساب
        await client.query(`
          UPDATE customers 
          SET "accountId" = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, [newAccount.id, customer.id]);

        console.log(`✅ تم إنشاء حساب: ${newAccount.name} (${newAccount.code})`);
        
        // انتظار قصير لضمان فريدة الكود
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ خطأ في إنشاء حساب للعميل ${customer.name}:`, error.message);
      }
    }

    // 4. التحقق من النتائج
    console.log('\n🧪 التحقق من النتائج...');
    
    const finalCheck = await client.query(`
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        c.balance as customer_balance,
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.balance as account_balance
      FROM customers c
      LEFT JOIN accounts a ON c."accountId" = a.id
      ORDER BY c.name
    `);

    console.log('\n📊 جميع العملاء وحساباتهم:');
    let customersWithAccountsCount = 0;
    let customersWithoutAccountsCount = 0;

    for (const row of finalCheck.rows) {
      if (row.account_id) {
        console.log(`✅ ${row.customer_name}: حساب ${row.account_code} (رصيد: ${row.account_balance})`);
        customersWithAccountsCount++;
      } else {
        console.log(`❌ ${row.customer_name}: لا يوجد حساب`);
        customersWithoutAccountsCount++;
      }
    }

    console.log(`\n📈 الإحصائيات النهائية:`);
    console.log(`✅ عملاء لديهم حسابات: ${customersWithAccountsCount}`);
    console.log(`❌ عملاء بدون حسابات: ${customersWithoutAccountsCount}`);

    // 5. التحقق من الحساب الرئيسي
    const mainAccountSummary = await client.query(`
      SELECT 
        a.name as main_account_name,
        a.code as main_account_code,
        a.balance as main_account_balance,
        COUNT(sub.id) as sub_accounts_count,
        SUM(sub.balance) as total_sub_balance
      FROM accounts a
      LEFT JOIN accounts sub ON sub."parentId" = a.id
      WHERE a.id = $1
      GROUP BY a.id, a.name, a.code, a.balance
    `, [mainAccount.id]);

    if (mainAccountSummary.rows.length > 0) {
      const summary = mainAccountSummary.rows[0];
      console.log(`\n🏦 ملخص الحساب الرئيسي:`);
      console.log(`📊 الاسم: ${summary.main_account_name} (${summary.main_account_code})`);
      console.log(`📈 عدد الحسابات الفرعية: ${summary.sub_accounts_count}`);
      console.log(`💰 إجمالي أرصدة الحسابات الفرعية: ${summary.total_sub_balance || 0}`);
      console.log(`💰 رصيد الحساب الرئيسي: ${summary.main_account_balance}`);
    }

    console.log('\n🎉 تم إصلاح حسابات العملاء الموجودين بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixExistingCustomersAccounts().catch(console.error);
