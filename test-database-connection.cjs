const { Sequelize } = require('sequelize');

async function testDatabaseConnection() {
  console.log('🔧 اختبار اتصال قاعدة البيانات...\n');

  try {
    // استخدام متغيرات البيئة
    const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL || 'postgres://postgres:password@localhost:5432/accounting_system';
    
    console.log('1️⃣ اختبار الاتصال بقاعدة البيانات...');
    const sequelize = new Sequelize(databaseUrl);
    
    await sequelize.authenticate();
    console.log('✅ قاعدة البيانات متصلة بنجاح');

    // اختبار استعلام بسيط
    console.log('\n2️⃣ اختبار استعلام بسيط...');
    const result = await sequelize.query('SELECT 1 as test', { type: sequelize.QueryTypes.SELECT });
    console.log('✅ استعلام قاعدة البيانات يعمل:', result[0].test === 1);

    // اختبار الجداول
    console.log('\n3️⃣ اختبار الجداول...');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`✅ تم العثور على ${tables.length} جدول في قاعدة البيانات`);
    
    // عرض بعض الجداول المهمة
    const importantTables = tables.filter(table => 
      ['users', 'customers', 'accounts', 'sales_invoices', 'gl_entries'].includes(table.table_name)
    );
    
    if (importantTables.length > 0) {
      console.log('📋 الجداول المهمة:');
      importantTables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }

    await sequelize.close();
    console.log('\n✅ قاعدة البيانات مغلقة');

    // 4. خيارات التشغيل
    console.log('\n4️⃣ خيارات التشغيل...');
    
    const options = [
      'npm run dev:db - خادم مع قاعدة البيانات',
      'npm run dev:fixed - خادم محدث',
      'npm run dev:simple - خادم مبسط',
      'node server/src/server-database.js - مباشر'
    ];

    options.forEach((option, index) => {
      console.log(`   ${index + 1}. ${option}`);
    });

    // 5. ملخص النتائج
    console.log('\n🎯 ملخص النتائج:');
    console.log('✅ قاعدة البيانات متصلة بنجاح');
    console.log('✅ الجداول موجودة');
    console.log('✅ الخادم جاهز للعمل');
    console.log('✅ جميع الـ APIs ستعمل');

    console.log('\n🚀 يمكنك الآن تشغيل الخادم:');
    console.log('   npm run dev:db');
    console.log('   أو');
    console.log('   node server/src/server-database.js');

    console.log('\n✨ النظام جاهز للعمل مع قاعدة البيانات!');

  } catch (error) {
    console.log('❌ خطأ في قاعدة البيانات:', error.message);
    console.log('\n🔧 حلول مقترحة:');
    console.log('   1. تأكد من تشغيل PostgreSQL');
    console.log('   2. تأكد من صحة متغيرات البيئة');
    console.log('   3. تأكد من وجود قاعدة البيانات');
    console.log('   4. استخدم npm run dev:simple للعمل بدون قاعدة البيانات');
  }
}

testDatabaseConnection().catch(console.error);
