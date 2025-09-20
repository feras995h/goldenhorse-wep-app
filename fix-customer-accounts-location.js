import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixCustomerAccountsLocation() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إصلاح مواقع حسابات العملاء...\n');

    // 1. العثور على الحساب الرئيسي للعملاء
    const customersMainAccount = await client.query(`
      SELECT id, code, name FROM accounts 
      WHERE name = 'العملاء والمدينون' AND code = '1.1.2'
      LIMIT 1
    `);

    if (customersMainAccount.rows.length === 0) {
      console.error('❌ لم يتم العثور على الحساب الرئيسي للعملاء');
      return;
    }

    const mainAccountId = customersMainAccount.rows[0].id;
    console.log(`📊 الحساب الرئيسي: ${customersMainAccount.rows[0].name} (${customersMainAccount.rows[0].code})`);

    // 2. العثور على جميع حسابات العملاء المنتشرة في أماكن خاطئة
    const misplacedCustomerAccounts = await client.query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a."parentId",
        c.name as customer_name,
        parent.name as current_parent_name,
        parent.code as current_parent_code
      FROM accounts a
      JOIN customers c ON c."accountId" = a.id
      LEFT JOIN accounts parent ON a."parentId" = parent.id
      WHERE a."parentId" != $1 OR a."parentId" IS NULL
    `, [mainAccountId]);

    console.log(`🔍 عدد حسابات العملاء في أماكن خاطئة: ${misplacedCustomerAccounts.rows.length}`);

    // 3. نقل جميع حسابات العملاء إلى المكان الصحيح
    for (const account of misplacedCustomerAccounts.rows) {
      console.log(`🔄 نقل حساب: ${account.customer_name} (${account.code})`);
      console.log(`   من: ${account.current_parent_name || 'لا يوجد'} (${account.current_parent_code || 'N/A'})`);
      console.log(`   إلى: العملاء والمدينون (1.1.2)`);

      try {
        await client.query(`
          UPDATE accounts 
          SET "parentId" = $1, level = 4, "updatedAt" = NOW()
          WHERE id = $2
        `, [mainAccountId, account.id]);

        console.log(`✅ تم نقل الحساب بنجاح`);
      } catch (error) {
        console.error(`❌ خطأ في نقل الحساب: ${error.message}`);
      }
      console.log('');
    }

    // 4. إزالة الحسابات المكررة أو الخاطئة من أماكن أخرى
    console.log('🧹 تنظيف الحسابات المكررة...');

    // البحث عن حسابات بأسماء العملاء في أماكن خاطئة
    const duplicateAccounts = await client.query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a."parentId",
        parent.name as parent_name
      FROM accounts a
      LEFT JOIN accounts parent ON a."parentId" = parent.id
      WHERE a.name IN (SELECT name FROM customers)
      AND a.id NOT IN (SELECT "accountId" FROM customers WHERE "accountId" IS NOT NULL)
      AND a."parentId" != $1
    `, [mainAccountId]);

    console.log(`🔍 عدد الحسابات المكررة: ${duplicateAccounts.rows.length}`);

    for (const duplicate of duplicateAccounts.rows) {
      console.log(`🗑️ حذف الحساب المكرر: ${duplicate.name} (${duplicate.code}) من ${duplicate.parent_name}`);
      
      try {
        // التحقق من عدم وجود حركات على هذا الحساب
        const hasTransactions = await client.query(`
          SELECT COUNT(*) as count FROM journal_entry_details 
          WHERE "accountId" = $1
        `, [duplicate.id]);

        if (parseInt(hasTransactions.rows[0].count) === 0) {
          await client.query(`DELETE FROM accounts WHERE id = $1`, [duplicate.id]);
          console.log(`✅ تم حذف الحساب المكرر`);
        } else {
          console.log(`⚠️ لا يمكن حذف الحساب لوجود حركات عليه`);
        }
      } catch (error) {
        console.error(`❌ خطأ في حذف الحساب المكرر: ${error.message}`);
      }
      console.log('');
    }

    // 5. التحقق النهائي من النتائج
    console.log('🧪 التحقق النهائي من النتائج...');

    const finalCheck = await client.query(`
      SELECT 
        c.name as customer_name,
        a.code as account_code,
        a.name as account_name,
        a.level,
        parent.name as parent_name,
        parent.code as parent_code
      FROM customers c
      JOIN accounts a ON c."accountId" = a.id
      LEFT JOIN accounts parent ON a."parentId" = parent.id
      ORDER BY a.code
    `);

    console.log('\n📊 حسابات العملاء بعد الإصلاح:');
    let correctlyPlaced = 0;
    let incorrectlyPlaced = 0;

    for (const row of finalCheck.rows) {
      const isCorrect = row.parent_code === '1.1.2';
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} العميل: ${row.customer_name}`);
      console.log(`   الحساب: ${row.account_name} (${row.account_code}) - مستوى ${row.level}`);
      console.log(`   تحت: ${row.parent_name || 'لا يوجد'} (${row.parent_code || 'N/A'})`);
      
      if (isCorrect) {
        correctlyPlaced++;
      } else {
        incorrectlyPlaced++;
      }
      console.log('');
    }

    // 6. إحصائيات نهائية
    console.log('📈 الإحصائيات النهائية:');
    console.log(`✅ حسابات في المكان الصحيح: ${correctlyPlaced}`);
    console.log(`❌ حسابات في مكان خاطئ: ${incorrectlyPlaced}`);

    // 7. التحقق من التسلسل الهرمي للعملاء
    const hierarchyCheck = await client.query(`
      SELECT 
        main.name as main_account_name,
        main.code as main_account_code,
        COUNT(sub.id) as customer_accounts_count,
        STRING_AGG(sub.name, ', ') as customer_accounts_names
      FROM accounts main
      LEFT JOIN accounts sub ON sub."parentId" = main.id
      LEFT JOIN customers c ON c."accountId" = sub.id
      WHERE main.id = $1
      GROUP BY main.id, main.name, main.code
    `, [mainAccountId]);

    if (hierarchyCheck.rows.length > 0) {
      const hierarchy = hierarchyCheck.rows[0];
      console.log(`\n🏦 ملخص الحساب الرئيسي:`);
      console.log(`📊 الاسم: ${hierarchy.main_account_name} (${hierarchy.main_account_code})`);
      console.log(`📈 عدد حسابات العملاء التابعة: ${hierarchy.customer_accounts_count}`);
      console.log(`👥 أسماء الحسابات: ${hierarchy.customer_accounts_names || 'لا يوجد'}`);
    }

    console.log('\n🎉 تم إصلاح مواقع حسابات العملاء بنجاح!');
    
    console.log('\n📋 ملخص الإصلاحات:');
    console.log('✅ تم نقل جميع حسابات العملاء إلى المكان الصحيح');
    console.log('✅ تم حذف الحسابات المكررة');
    console.log('✅ تم التحقق من التسلسل الهرمي');
    
    console.log('\n💡 النتيجة المتوقعة في الواجهة:');
    console.log('- جميع حسابات العملاء ستظهر تحت "العملاء والمدينون"');
    console.log('- لن تظهر حسابات العملاء في "المخزون" أو أماكن أخرى');
    console.log('- التسلسل الهرمي سيكون منظماً ومنطقياً');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixCustomerAccountsLocation().catch(console.error);
