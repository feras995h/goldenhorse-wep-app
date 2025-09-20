import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function checkAccountsForPosting() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔍 فحص الحسابات المطلوبة للترحيل...\n');

    // البحث عن حساب العملاء
    const customerAccounts = await client.query(`
      SELECT id, code, name, type 
      FROM accounts 
      WHERE name ILIKE '%عملاء%' OR name ILIKE '%مدين%' OR code LIKE '1.1.2%'
      ORDER BY code
    `);

    console.log('👥 حسابات العملاء:');
    for (const acc of customerAccounts.rows) {
      console.log(`- ${acc.code}: ${acc.name} (${acc.type})`);
    }

    // البحث عن حسابات المبيعات
    const salesAccounts = await client.query(`
      SELECT id, code, name, type 
      FROM accounts 
      WHERE name ILIKE '%مبيعات%' OR name ILIKE '%إيراد%' OR code LIKE '4%'
      ORDER BY code
    `);

    console.log('\n💰 حسابات المبيعات والإيرادات:');
    for (const acc of salesAccounts.rows) {
      console.log(`- ${acc.code}: ${acc.name} (${acc.type})`);
    }

    // البحث عن حسابات الصندوق
    const cashAccounts = await client.query(`
      SELECT id, code, name, type 
      FROM accounts 
      WHERE name ILIKE '%صندوق%' OR name ILIKE '%نقد%' OR code LIKE '1.1.1%'
      ORDER BY code
    `);

    console.log('\n💵 حسابات الصندوق والنقدية:');
    for (const acc of cashAccounts.rows) {
      console.log(`- ${acc.code}: ${acc.name} (${acc.type})`);
    }

    // إنشاء الحسابات المفقودة إذا لزم الأمر
    console.log('\n🔧 التحقق من الحسابات المطلوبة...');

    // حساب العملاء والمدينون
    const customerAccount = await client.query(`
      SELECT id FROM accounts WHERE code = '1.1.2' AND name = 'العملاء والمدينون'
    `);

    if (customerAccount.rows.length === 0) {
      console.log('⚠️ حساب العملاء والمدينون غير موجود - سيتم إنشاؤه');
      
      // البحث عن حساب الأصول المتداولة كحساب أب
      const currentAssetsAccount = await client.query(`
        SELECT id FROM accounts WHERE code = '1.1' AND name = 'الأصول المتداولة'
      `);

      if (currentAssetsAccount.rows.length > 0) {
        await client.query(`
          INSERT INTO accounts (code, name, type, "parentId", level, "isActive", "createdAt", "updatedAt")
          VALUES ('1.1.2', 'العملاء والمدينون', 'asset', $1, 3, true, NOW(), NOW())
        `, [currentAssetsAccount.rows[0].id]);
        console.log('✅ تم إنشاء حساب العملاء والمدينون');
      }
    } else {
      console.log('✅ حساب العملاء والمدينون موجود');
    }

    // حساب إيرادات المبيعات
    const salesAccount = await client.query(`
      SELECT id FROM accounts WHERE code = '4.1' AND name = 'إيرادات المبيعات'
    `);

    if (salesAccount.rows.length === 0) {
      console.log('⚠️ حساب إيرادات المبيعات غير موجود - سيتم إنشاؤه');
      
      // البحث عن حساب الإيرادات كحساب أب
      const revenueAccount = await client.query(`
        SELECT id FROM accounts WHERE code = '4' AND name = 'الإيرادات'
      `);

      if (revenueAccount.rows.length > 0) {
        await client.query(`
          INSERT INTO accounts (code, name, type, "parentId", level, "isActive", "createdAt", "updatedAt")
          VALUES ('4.1', 'إيرادات المبيعات', 'revenue', $1, 2, true, NOW(), NOW())
        `, [revenueAccount.rows[0].id]);
        console.log('✅ تم إنشاء حساب إيرادات المبيعات');
      }
    } else {
      console.log('✅ حساب إيرادات المبيعات موجود');
    }

    // حساب الصندوق
    const cashAccount = await client.query(`
      SELECT id FROM accounts WHERE code = '1.1.1' AND name = 'الصندوق'
    `);

    if (cashAccount.rows.length === 0) {
      console.log('⚠️ حساب الصندوق غير موجود - سيتم إنشاؤه');
      
      // البحث عن حساب الأصول المتداولة كحساب أب
      const currentAssetsAccount = await client.query(`
        SELECT id FROM accounts WHERE code = '1.1' AND name = 'الأصول المتداولة'
      `);

      if (currentAssetsAccount.rows.length > 0) {
        await client.query(`
          INSERT INTO accounts (code, name, type, "parentId", level, "isActive", "createdAt", "updatedAt")
          VALUES ('1.1.1', 'الصندوق', 'asset', $1, 3, true, NOW(), NOW())
        `, [currentAssetsAccount.rows[0].id]);
        console.log('✅ تم إنشاء حساب الصندوق');
      }
    } else {
      console.log('✅ حساب الصندوق موجود');
    }

    console.log('\n🎉 تم التحقق من جميع الحسابات المطلوبة!');

    // عرض الحسابات النهائية
    console.log('\n📋 الحسابات المطلوبة للترحيل:');
    
    const finalAccounts = await client.query(`
      SELECT id, code, name, type 
      FROM accounts 
      WHERE (code = '1.1.2' AND name = 'العملاء والمدينون')
         OR (code = '4.1' AND name = 'إيرادات المبيعات')
         OR (code = '1.1.1' AND name = 'الصندوق')
      ORDER BY code
    `);

    for (const acc of finalAccounts.rows) {
      console.log(`✅ ${acc.code}: ${acc.name} (${acc.type}) - ID: ${acc.id}`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkAccountsForPosting().catch(console.error);
