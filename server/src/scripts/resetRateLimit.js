import express from 'express';
import rateLimit from 'express-rate-limit';

/**
 * سكريبت لإعادة تعيين حدود الطلبات (Rate Limiting)
 * يمكن استخدامه لحل مشكلة "Too many requests" للمستخدمين المحظورين
 */

// إنشاء تطبيق Express مؤقت لإعادة تعيين الحدود
const resetApp = express();

// إنشاء Rate Limiter مؤقت للوصول إلى store
const tempLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * إعادة تعيين حدود الطلبات لعنوان IP محدد
 * @param {string} ipAddress - عنوان IP المراد إعادة تعيين حدوده
 */
async function resetRateLimitForIP(ipAddress) {
  try {
    console.log(`🔄 إعادة تعيين حدود الطلبات لـ IP: ${ipAddress}`);
    
    // محاولة الوصول إلى store الخاص بـ rate limiter
    if (tempLimiter.store && typeof tempLimiter.store.resetKey === 'function') {
      await tempLimiter.store.resetKey(ipAddress);
      console.log(`✅ تم إعادة تعيين حدود الطلبات بنجاح لـ ${ipAddress}`);
    } else {
      console.log('⚠️  لا يمكن الوصول إلى store، سيتم إعادة التعيين تلقائياً بعد انتهاء النافذة الزمنية');
    }
    
  } catch (error) {
    console.error(`❌ خطأ في إعادة تعيين حدود الطلبات لـ ${ipAddress}:`, error.message);
  }
}

/**
 * إعادة تعيين جميع حدود الطلبات
 */
async function resetAllRateLimits() {
  try {
    console.log('🔄 إعادة تعيين جميع حدود الطلبات...');
    
    if (tempLimiter.store && typeof tempLimiter.store.resetAll === 'function') {
      await tempLimiter.store.resetAll();
      console.log('✅ تم إعادة تعيين جميع حدود الطلبات بنجاح');
    } else {
      console.log('⚠️  لا يمكن إعادة تعيين جميع الحدود، سيتم إعادة التعيين تلقائياً بعد انتهاء النافذة الزمنية');
    }
    
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين جميع حدود الطلبات:', error.message);
  }
}

/**
 * عرض معلومات حدود الطلبات الحالية
 */
function showRateLimitInfo() {
  console.log('\n📊 معلومات حدود الطلبات الحالية:');
  console.log('=====================================');
  console.log('🔹 النافذة الزمنية العامة: 15 دقيقة');
  console.log('🔹 الحد الأقصى العام: 500 طلب (إنتاج) / 2000 طلب (تطوير)');
  console.log('🔹 حد تسجيل الدخول: 20 محاولة (إنتاج) / 100 محاولة (تطوير)');
  console.log('🔹 حد العمليات المالية: 200 طلب/دقيقة (إنتاج) / 1000 طلب/دقيقة (تطوير)');
  console.log('🔹 حد عمليات المبيعات: 300 طلب/دقيقة (إنتاج) / 1000 طلب/دقيقة (تطوير)');
  console.log('\n💡 لتعطيل Rate Limiting بالكامل، أضف ENABLE_RATE_LIMITING=false إلى ملف .env');
}

/**
 * الدالة الرئيسية
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🚀 سكريبت إعادة تعيين حدود الطلبات');
    console.log('=====================================');
    console.log('الاستخدام:');
    console.log('  node resetRateLimit.js --ip <IP_ADDRESS>  # إعادة تعيين IP محدد');
    console.log('  node resetRateLimit.js --all              # إعادة تعيين جميع الحدود');
    console.log('  node resetRateLimit.js --info             # عرض معلومات الحدود');
    console.log('\nأمثلة:');
    console.log('  node resetRateLimit.js --ip 192.168.1.100');
    console.log('  node resetRateLimit.js --all');
    console.log('  node resetRateLimit.js --info');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case '--ip':
      if (args[1]) {
        await resetRateLimitForIP(args[1]);
      } else {
        console.error('❌ يرجى تحديد عنوان IP');
        console.log('مثال: node resetRateLimit.js --ip 192.168.1.100');
      }
      break;
      
    case '--all':
      await resetAllRateLimits();
      break;
      
    case '--info':
      showRateLimitInfo();
      break;
      
    default:
      console.error(`❌ أمر غير معروف: ${command}`);
      console.log('استخدم --help لعرض المساعدة');
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { resetRateLimitForIP, resetAllRateLimits, showRateLimitInfo };
