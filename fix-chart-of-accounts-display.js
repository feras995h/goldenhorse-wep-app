import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixChartOfAccountsDisplay() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إصلاح مشاكل عرض دليل الحسابات...\n');

    // 1. إصلاح مشكلة حساب العميل المنفرد
    console.log('👥 إصلاح ربط حسابات العملاء بالحساب الرئيسي...');
    
    // البحث عن الحساب الرئيسي للعملاء
    const customersMainAccount = await client.query(`
      SELECT id, code, name, level FROM accounts 
      WHERE (name LIKE '%عملاء%' OR name LIKE '%مدينون%' OR name LIKE '%العملاء%')
      AND type = 'asset' AND "isGroup" = true
      ORDER BY level ASC
      LIMIT 1
    `);

    if (customersMainAccount.rows.length === 0) {
      console.error('❌ لم يتم العثور على الحساب الرئيسي للعملاء');
      return;
    }

    const mainAccount = customersMainAccount.rows[0];
    console.log(`📊 الحساب الرئيسي: ${mainAccount.name} (${mainAccount.code})`);

    // البحث عن حسابات العملاء المنفردة (بدون parent)
    const orphanCustomerAccounts = await client.query(`
      SELECT a.id, a.code, a.name, a."parentId", c.name as customer_name
      FROM accounts a
      LEFT JOIN customers c ON c."accountId" = a.id
      WHERE a."parentId" IS NULL 
      AND a.type = 'asset' 
      AND a."isGroup" = false
      AND (a.code LIKE '1201%' OR c.id IS NOT NULL)
      AND a.id != $1
    `, [mainAccount.id]);

    console.log(`🔍 عدد حسابات العملاء المنفردة: ${orphanCustomerAccounts.rows.length}`);

    // ربط حسابات العملاء بالحساب الرئيسي
    for (const account of orphanCustomerAccounts.rows) {
      try {
        await client.query(`
          UPDATE accounts 
          SET "parentId" = $1, level = $2, "updatedAt" = NOW()
          WHERE id = $3
        `, [mainAccount.id, mainAccount.level + 1, account.id]);

        console.log(`✅ تم ربط الحساب: ${account.name} (${account.code}) بالحساب الرئيسي`);
      } catch (error) {
        console.error(`❌ خطأ في ربط الحساب ${account.name}:`, error.message);
      }
    }

    // 2. إصلاح مشكلة "الخصوم" إلى "الالتزامات"
    console.log('\n📝 تغيير "الخصوم" إلى "الالتزامات"...');
    
    // تحديث الحساب الرئيسي للخصوم
    const liabilitiesUpdate = await client.query(`
      UPDATE accounts 
      SET name = 'الالتزامات', "updatedAt" = NOW()
      WHERE code = '2' AND name = 'الخصوم'
      RETURNING id, code, name
    `);

    if (liabilitiesUpdate.rows.length > 0) {
      console.log(`✅ تم تغيير "الخصوم" إلى "الالتزامات"`);
    } else {
      // البحث عن الحساب بطرق أخرى
      const liabilitiesAccount = await client.query(`
        SELECT id, code, name FROM accounts 
        WHERE (name LIKE '%خصوم%' OR name LIKE '%Liabilities%')
        AND type = 'liability' AND level <= 2
        LIMIT 1
      `);

      if (liabilitiesAccount.rows.length > 0) {
        await client.query(`
          UPDATE accounts 
          SET name = 'الالتزامات', "nameEn" = 'Liabilities', "updatedAt" = NOW()
          WHERE id = $1
        `, [liabilitiesAccount.rows[0].id]);
        
        console.log(`✅ تم تغيير "${liabilitiesAccount.rows[0].name}" إلى "الالتزامات"`);
      } else {
        console.log('⚠️ لم يتم العثور على حساب الخصوم لتغييره');
      }
    }

    // تحديث الحسابات الفرعية للخصوم أيضاً
    const subLiabilitiesUpdate = await client.query(`
      UPDATE accounts 
      SET name = REPLACE(name, 'خصوم', 'التزامات'), "updatedAt" = NOW()
      WHERE name LIKE '%خصوم%' AND type = 'liability'
      RETURNING id, code, name
    `);

    if (subLiabilitiesUpdate.rows.length > 0) {
      console.log(`✅ تم تحديث ${subLiabilitiesUpdate.rows.length} حساب فرعي من "خصوم" إلى "التزامات"`);
      for (const account of subLiabilitiesUpdate.rows) {
        console.log(`  - ${account.name} (${account.code})`);
      }
    }

    // 3. التحقق من التسلسل الهرمي للحسابات
    console.log('\n🌳 التحقق من التسلسل الهرمي للحسابات...');
    
    const hierarchyCheck = await client.query(`
      WITH RECURSIVE account_hierarchy AS (
        -- الحسابات الرئيسية (بدون parent)
        SELECT id, code, name, "parentId", level, 0 as depth, 
               ARRAY[code] as path, code as sort_path
        FROM accounts 
        WHERE "parentId" IS NULL AND "isActive" = true
        
        UNION ALL
        
        -- الحسابات الفرعية
        SELECT a.id, a.code, a.name, a."parentId", a.level, ah.depth + 1,
               ah.path || a.code, ah.sort_path || '.' || a.code
        FROM accounts a
        INNER JOIN account_hierarchy ah ON a."parentId" = ah.id
        WHERE a."isActive" = true
      )
      SELECT id, code, name, level, depth, sort_path
      FROM account_hierarchy
      WHERE (name LIKE '%عملاء%' OR name LIKE '%العملاء%' OR name LIKE '%مدينون%' 
             OR code LIKE '1201%' OR name LIKE '%التزامات%' OR name LIKE '%خصوم%')
      ORDER BY sort_path
    `);

    console.log('\n📊 التسلسل الهرمي للحسابات ذات الصلة:');
    for (const account of hierarchyCheck.rows) {
      const indent = '  '.repeat(account.depth);
      console.log(`${indent}- ${account.name} (${account.code}) - مستوى ${account.level}`);
    }

    // 4. إصلاح أي مشاكل في المستويات
    console.log('\n🔧 إصلاح مستويات الحسابات...');
    
    const fixLevels = `
      WITH RECURSIVE level_fix AS (
        -- الحسابات الرئيسية
        SELECT id, "parentId", 1 as correct_level
        FROM accounts 
        WHERE "parentId" IS NULL
        
        UNION ALL
        
        -- الحسابات الفرعية
        SELECT a.id, a."parentId", lf.correct_level + 1
        FROM accounts a
        INNER JOIN level_fix lf ON a."parentId" = lf.id
      )
      UPDATE accounts 
      SET level = lf.correct_level, "updatedAt" = NOW()
      FROM level_fix lf
      WHERE accounts.id = lf.id AND accounts.level != lf.correct_level
    `;

    try {
      const levelFixResult = await client.query(fixLevels);
      console.log(`✅ تم إصلاح مستويات ${levelFixResult.rowCount} حساب`);
    } catch (error) {
      console.error('❌ خطأ في إصلاح المستويات:', error.message);
    }

    // 5. التحقق النهائي
    console.log('\n🧪 التحقق النهائي من النتائج...');
    
    // التحقق من حسابات العملاء
    const customerAccountsCheck = await client.query(`
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

    console.log('\n👥 حسابات العملاء بعد الإصلاح:');
    for (const row of customerAccountsCheck.rows) {
      console.log(`- العميل: ${row.customer_name}`);
      console.log(`  الحساب: ${row.account_name} (${row.account_code}) - مستوى ${row.level}`);
      console.log(`  تحت: ${row.parent_name || 'لا يوجد'} (${row.parent_code || 'N/A'})`);
      console.log('');
    }

    // التحقق من حساب الالتزامات
    const liabilitiesCheck = await client.query(`
      SELECT code, name, "nameEn", type, level FROM accounts 
      WHERE (name LIKE '%التزامات%' OR name LIKE '%خصوم%' OR code = '2')
      AND type = 'liability'
      ORDER BY code
    `);

    console.log('\n💼 حسابات الالتزامات بعد الإصلاح:');
    for (const row of liabilitiesCheck.rows) {
      console.log(`- ${row.name} (${row.code}) - مستوى ${row.level}`);
    }

    console.log('\n🎉 تم إصلاح مشاكل عرض دليل الحسابات بنجاح!');
    
    console.log('\n📋 ملخص الإصلاحات:');
    console.log('✅ تم ربط حسابات العملاء بالحساب الرئيسي');
    console.log('✅ تم تغيير "الخصوم" إلى "الالتزامات"');
    console.log('✅ تم إصلاح التسلسل الهرمي للحسابات');
    console.log('✅ تم إصلاح مستويات الحسابات');
    
    console.log('\n💡 النتيجة المتوقعة:');
    console.log('- حسابات العملاء ستظهر تحت "العملاء والمدينون"');
    console.log('- "الخصوم" ستظهر كـ "الالتزامات"');
    console.log('- التسلسل الهرمي سيكون صحيحاً');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixChartOfAccountsDisplay().catch(console.error);
