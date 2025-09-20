import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function completeChartFix() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إكمال إصلاح دليل الحسابات...\n');

    // 1. إصلاح مستويات الحسابات بطريقة مبسطة
    console.log('📊 إصلاح مستويات الحسابات...');
    
    // تحديث مستويات الحسابات الرئيسية
    await client.query(`
      UPDATE accounts 
      SET level = 1, "updatedAt" = NOW()
      WHERE "parentId" IS NULL
    `);

    // تحديث مستويات الحسابات من المستوى الثاني
    await client.query(`
      UPDATE accounts 
      SET level = 2, "updatedAt" = NOW()
      WHERE "parentId" IN (SELECT id FROM accounts WHERE "parentId" IS NULL)
    `);

    // تحديث مستويات الحسابات من المستوى الثالث
    await client.query(`
      UPDATE accounts 
      SET level = 3, "updatedAt" = NOW()
      WHERE "parentId" IN (
        SELECT id FROM accounts 
        WHERE "parentId" IN (SELECT id FROM accounts WHERE "parentId" IS NULL)
      )
    `);

    // تحديث مستويات الحسابات من المستوى الرابع
    await client.query(`
      UPDATE accounts 
      SET level = 4, "updatedAt" = NOW()
      WHERE "parentId" IN (
        SELECT id FROM accounts 
        WHERE "parentId" IN (
          SELECT id FROM accounts 
          WHERE "parentId" IN (SELECT id FROM accounts WHERE "parentId" IS NULL)
        )
      )
    `);

    console.log('✅ تم إصلاح مستويات الحسابات');

    // 2. التحقق من حسابات العملاء
    console.log('\n👥 التحقق من حسابات العملاء...');
    
    const customerAccounts = await client.query(`
      SELECT 
        c.name as customer_name,
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.level,
        a."parentId",
        parent.name as parent_name,
        parent.code as parent_code
      FROM customers c
      JOIN accounts a ON c."accountId" = a.id
      LEFT JOIN accounts parent ON a."parentId" = parent.id
      ORDER BY a.code
    `);

    console.log(`📊 عدد حسابات العملاء: ${customerAccounts.rows.length}`);
    
    for (const row of customerAccounts.rows) {
      console.log(`- العميل: ${row.customer_name}`);
      console.log(`  الحساب: ${row.account_name} (${row.account_code}) - مستوى ${row.level}`);
      console.log(`  تحت: ${row.parent_name || 'لا يوجد'} (${row.parent_code || 'N/A'})`);
      console.log('');
    }

    // 3. التأكد من ربط جميع حسابات العملاء بالحساب الرئيسي
    console.log('🔗 التأكد من ربط حسابات العملاء...');
    
    const customersMainAccount = await client.query(`
      SELECT id, code, name FROM accounts 
      WHERE name = 'العملاء والمدينون' AND code = '1.1.2'
      LIMIT 1
    `);

    if (customersMainAccount.rows.length > 0) {
      const mainAccountId = customersMainAccount.rows[0].id;
      
      // ربط جميع حسابات العملاء بالحساب الرئيسي
      const updateResult = await client.query(`
        UPDATE accounts 
        SET "parentId" = $1, level = 4, "updatedAt" = NOW()
        WHERE id IN (
          SELECT a.id FROM accounts a
          JOIN customers c ON c."accountId" = a.id
          WHERE a."parentId" != $1 OR a."parentId" IS NULL
        )
      `, [mainAccountId]);

      console.log(`✅ تم ربط ${updateResult.rowCount} حساب عميل بالحساب الرئيسي`);
    }

    // 4. التحقق من حساب الالتزامات
    console.log('\n💼 التحقق من حساب الالتزامات...');
    
    const liabilitiesAccounts = await client.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId"
      FROM accounts 
      WHERE (name LIKE '%التزامات%' OR name LIKE '%خصوم%' OR code = '2')
      ORDER BY code
    `);

    console.log(`📊 حسابات الالتزامات: ${liabilitiesAccounts.rows.length}`);
    for (const row of liabilitiesAccounts.rows) {
      console.log(`- ${row.name} (${row.code}) - مستوى ${row.level} - نوع: ${row.type}`);
    }

    // 5. إنشاء تقرير نهائي للتسلسل الهرمي
    console.log('\n📋 التقرير النهائي للتسلسل الهرمي...');
    
    const hierarchyReport = await client.query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.level,
        a."isGroup",
        a.type,
        parent.name as parent_name,
        parent.code as parent_code,
        (SELECT COUNT(*) FROM accounts sub WHERE sub."parentId" = a.id) as children_count
      FROM accounts a
      LEFT JOIN accounts parent ON a."parentId" = parent.id
      WHERE a."isActive" = true
      ORDER BY 
        CASE 
          WHEN a.code ~ '^[0-9]+$' THEN LPAD(a.code, 10, '0')
          ELSE a.code
        END
    `);

    console.log('\n🌳 التسلسل الهرمي الكامل:');
    
    let currentLevel1 = '';
    let currentLevel2 = '';
    
    for (const account of hierarchyReport.rows) {
      const indent = '  '.repeat(account.level - 1);
      const groupIndicator = account.isGroup ? ' 📁' : ' 📄';
      const childrenInfo = account.children_count > 0 ? ` (${account.children_count} فرعي)` : '';
      
      console.log(`${indent}${groupIndicator} ${account.name} (${account.code})${childrenInfo}`);
      
      // عرض تفاصيل إضافية للحسابات المهمة
      if (account.name.includes('عملاء') || account.name.includes('العملاء') || account.name.includes('التزامات')) {
        console.log(`${indent}    النوع: ${account.type} | المستوى: ${account.level} | تحت: ${account.parent_name || 'رئيسي'}`);
      }
    }

    // 6. إحصائيات نهائية
    console.log('\n📊 إحصائيات نهائية:');
    
    const stats = await client.query(`
      SELECT 
        type,
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN "isGroup" = true THEN 1 END) as group_accounts,
        COUNT(CASE WHEN "isGroup" = false THEN 1 END) as sub_accounts
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type
    `);

    for (const stat of stats.rows) {
      console.log(`- ${stat.type}: ${stat.total_accounts} حساب (${stat.group_accounts} مجموعة، ${stat.sub_accounts} فرعي)`);
    }

    // إحصائيات خاصة بالعملاء
    const customerStats = await client.query(`
      SELECT 
        COUNT(c.id) as total_customers,
        COUNT(c."accountId") as customers_with_accounts,
        COUNT(CASE WHEN a."parentId" IS NOT NULL THEN 1 END) as properly_linked_accounts
      FROM customers c
      LEFT JOIN accounts a ON c."accountId" = a.id
    `);

    if (customerStats.rows.length > 0) {
      const cs = customerStats.rows[0];
      console.log(`\n👥 إحصائيات العملاء:`);
      console.log(`- إجمالي العملاء: ${cs.total_customers}`);
      console.log(`- العملاء الذين لديهم حسابات: ${cs.customers_with_accounts}`);
      console.log(`- الحسابات المربوطة بشكل صحيح: ${cs.properly_linked_accounts}`);
    }

    console.log('\n🎉 تم إكمال إصلاح دليل الحسابات بنجاح!');
    
    console.log('\n📋 ملخص الإصلاحات المطبقة:');
    console.log('✅ تم إصلاح مستويات جميع الحسابات');
    console.log('✅ تم ربط حسابات العملاء بالحساب الرئيسي');
    console.log('✅ تم تغيير "الخصوم" إلى "الالتزامات"');
    console.log('✅ تم التحقق من التسلسل الهرمي');
    
    console.log('\n💡 النتيجة المتوقعة في الواجهة:');
    console.log('- حسابات العملاء ستظهر تحت "العملاء والمدينون" وليس منفردة');
    console.log('- "الخصوم" ستظهر كـ "الالتزامات"');
    console.log('- التسلسل الهرمي سيكون منظماً ومرتباً');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
completeChartFix().catch(console.error);
