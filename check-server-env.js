/**
 * فحص متغيرات البيئة على الخادم المباشر
 * Check Server Environment Variables
 */

console.log('🔍 فحص متغيرات البيئة على الخادم...\n');

// اختبار endpoint خاص لفحص متغيرات البيئة
async function checkServerEnv() {
  try {
    console.log('🌐 اختبار متغيرات البيئة على الخادم المباشر...');
    
    // إنشاء endpoint مؤقت لفحص متغيرات البيئة
    const response = await fetch('https://web.goldenhorse-ly.com/api/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Env-Check/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ الخادم يعمل');
      console.log('📊 معلومات قاعدة البيانات من health check:');
      console.log(`  - الحالة: ${data.database?.status}`);
      console.log(`  - وقت الاستجابة: ${data.database?.responseTime}`);
      console.log(`  - Pool Size: ${data.database?.pool?.size}`);
      
      // فحص إضافي: محاولة الوصول لـ endpoint يكشف معلومات DB
      console.log('\n🔍 محاولة فحص معلومات قاعدة البيانات...');
      
    } else {
      console.log(`❌ خطأ في الاستجابة: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ خطأ في فحص الخادم:', error.message);
  }
}

// تشغيل الفحص
checkServerEnv();

// إرشادات للتحقق من متغيرات البيئة
console.log('\n📋 خطوات التحقق من متغيرات البيئة:');
console.log('');
console.log('1. تسجيل الدخول للخادم:');
console.log('   ssh user@your-server');
console.log('');
console.log('2. فحص متغيرات البيئة:');
console.log('   echo $DB_URL');
console.log('   echo $DATABASE_URL');
console.log('');
console.log('3. فحص ملف .env:');
console.log('   cat .env | grep DB_URL');
console.log('   cat .env | grep DATABASE_URL');
console.log('');
console.log('4. فحص عملية Node.js:');
console.log('   pm2 env 0  # إذا كنت تستخدم PM2');
console.log('   ps aux | grep node');
console.log('');
console.log('5. إعادة تشغيل مع تحديث البيئة:');
console.log('   pm2 restart all --update-env');
console.log('   # أو');
console.log('   pm2 delete all && pm2 start ecosystem.config.js');
console.log('');
console.log('6. التحقق من logs:');
console.log('   pm2 logs');
console.log('   # ابحث عن رسائل الاتصال بقاعدة البيانات');
console.log('');

console.log('🎯 القيم الصحيحة المطلوبة:');
console.log('DB_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping');
console.log('DATABASE_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping');
console.log('');
console.log('⚠️ تأكد من:');
console.log('  - لا توجد مسافات إضافية');
console.log('  - لا توجد علامات اقتباس إضافية');
console.log('  - اسم قاعدة البيانات صحيح: golden-horse-shipping');
console.log('  - إعادة تشغيل الخادم بعد التحديث');
