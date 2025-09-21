/**
 * اختبار debug endpoint لفحص متغيرات البيئة على الخادم
 * Test Debug Endpoint for Server Environment Variables
 */

console.log('🔍 اختبار debug endpoint...\n');

async function testDebugEndpoint() {
  try {
    console.log('🌐 طلب معلومات البيئة من الخادم المباشر...');
    
    const response = await fetch('https://web.goldenhorse-ly.com/api/debug-env', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Debug-Test/1.0'
      }
    });

    console.log(`📊 الاستجابة: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n✅ معلومات البيئة من الخادم:');
      console.log('🔧 متغيرات البيئة:');
      console.log(`  - NODE_ENV: ${data.environment?.NODE_ENV}`);
      console.log(`  - DB_URL: ${data.environment?.DB_URL}`);
      console.log(`  - DATABASE_URL: ${data.environment?.DATABASE_URL}`);
      console.log(`  - PORT: ${data.environment?.PORT}`);
      
      console.log('\n📊 إعدادات قاعدة البيانات:');
      console.log(`  - Host: ${data.database_config?.host}`);
      console.log(`  - Port: ${data.database_config?.port}`);
      console.log(`  - Database: ${data.database_config?.database}`);
      console.log(`  - Username: ${data.database_config?.username}`);
      console.log(`  - Dialect: ${data.database_config?.dialect}`);
      
      console.log('\n🔍 اختبار قاعدة البيانات:');
      console.log(`  - قاعدة البيانات الحالية: ${data.database_test?.current_db}`);
      console.log(`  - إصدار PostgreSQL: ${data.database_test?.version?.substring(0, 50)}...`);
      
      // تحليل النتائج
      console.log('\n📋 تحليل النتائج:');
      
      if (data.database_config?.database === 'golden-horse-shipping') {
        console.log('✅ الخادم متصل بقاعدة البيانات الصحيحة: golden-horse-shipping');
      } else if (data.database_config?.database === 'postgres') {
        console.log('❌ الخادم متصل بقاعدة البيانات الخاطئة: postgres');
        console.log('🔧 يجب تحديث متغيرات البيئة وإعادة تشغيل الخادم');
      } else {
        console.log(`⚠️ الخادم متصل بقاعدة بيانات غير متوقعة: ${data.database_config?.database}`);
      }
      
      if (data.environment?.DB_URL?.includes('golden-horse-shipping')) {
        console.log('✅ متغير DB_URL يشير لقاعدة البيانات الصحيحة');
      } else if (data.environment?.DB_URL?.includes('postgres')) {
        console.log('❌ متغير DB_URL يشير لقاعدة البيانات الخاطئة');
      } else {
        console.log('⚠️ متغير DB_URL غير واضح أو غير محدد');
      }
      
      if (data.environment?.DATABASE_URL?.includes('golden-horse-shipping')) {
        console.log('✅ متغير DATABASE_URL يشير لقاعدة البيانات الصحيحة');
      } else if (data.environment?.DATABASE_URL?.includes('postgres')) {
        console.log('❌ متغير DATABASE_URL يشير لقاعدة البيانات الخاطئة');
      } else {
        console.log('⚠️ متغير DATABASE_URL غير واضح أو غير محدد');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ خطأ في الاستجابة: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الطلب:', error.message);
  }
}

// تشغيل الاختبار
testDebugEndpoint();

console.log('\n📋 الخطوات المطلوبة إذا كانت قاعدة البيانات خاطئة:');
console.log('');
console.log('1. تحديث ملف .env على الخادم:');
console.log('   DB_URL=postgres://postgres:PASSWORD@72.60.92.146:5432/golden-horse-shipping');
console.log('   DATABASE_URL=postgres://postgres:PASSWORD@72.60.92.146:5432/golden-horse-shipping');
console.log('');
console.log('2. إعادة تشغيل الخادم:');
console.log('   pm2 restart all --update-env');
console.log('   # أو');
console.log('   pm2 delete all && pm2 start ecosystem.config.js');
console.log('');
console.log('3. التحقق من النتيجة:');
console.log('   node test-debug-endpoint.js');
console.log('');
console.log('4. اختبار APIs:');
console.log('   - تسجيل دخول جديد');
console.log('   - اختبار /api/sales/summary');
console.log('   - اختبار /api/sales/customers');
console.log('   - اختبار /api/notifications');
