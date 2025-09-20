import axios from 'axios';

async function testProductionAPI() {
  try {
    console.log('🧪 اختبار API في الخادم المرفوع...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    const PRODUCTION_URL = 'https://web.goldenhorse-ly.com';
    
    console.log('🔐 الخطوة 1: محاولة تسجيل الدخول...');
    
    // محاولة تسجيل الدخول
    const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
      username: 'admin',
      password: '123456'
    });
    
    if (!loginResponse.data.token) {
      console.log('❌ فشل في تسجيل الدخول');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    console.log('\n📋 الخطوة 2: اختبار API الفئات...');
    
    try {
      const categoriesResponse = await axios.get(`${PRODUCTION_URL}/api/financial/fixed-assets/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API يعمل بنجاح!');
      console.log('📊 الاستجابة:', categoriesResponse.data);
      
    } catch (apiError) {
      console.log('❌ خطأ في API:', apiError.response?.status, apiError.response?.statusText);
      console.log('📝 تفاصيل الخطأ:', apiError.response?.data);
      
      if (apiError.response?.status === 500) {
        console.log('\n🔧 المشكلة: خطأ 500 في الخادم');
        console.log('💡 الحلول المحتملة:');
        console.log('1. تأكد من رفع الملف المحدث server/src/routes/financial.js');
        console.log('2. أعد تشغيل الخادم');
        console.log('3. تحقق من logs الخادم');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    
    if (error.response) {
      console.error('📝 تفاصيل الاستجابة:', error.response.data);
      console.error('📝 حالة الاستجابة:', error.response.status);
    }
  }
}

// تشغيل الاختبار
testProductionAPI();
