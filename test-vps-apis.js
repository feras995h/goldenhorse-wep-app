const axios = require('axios');

/**
 * سكريپت اختبار APIs على VPS
 * يقوم بفحص جميع الـ endpoints المهمة للتأكد من عملها
 */

// إعدادات VPS - استبدل بالرابط الفعلي
const VPS_URL = 'https://web.goldenhorse-ly.com'; // أو الرابط الخاص بك
const TIMEOUT = 15000; // 15 ثانية

// بيانات اختبار
const TEST_DATA = {
  customer: {
    name: 'عميل تجريبي',
    nameEn: 'Test Customer',
    type: 'individual',
    phone: '0912345678',
    email: 'test@example.com',
    address: 'طرابلس، ليبيا',
    creditLimit: 5000,
    paymentTerms: 30,
    currency: 'LYD'
  },
  account: {
    code: '1.1.99',
    name: 'حساب تجريبي',
    nameEn: 'Test Account',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: false,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'debit',
    accountType: 'sub'
  }
};

async function testVPSAPIs() {
  console.log('🧪 بدء اختبار APIs على VPS...');
  console.log(`🌐 الخادم: ${VPS_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // قائمة الاختبارات
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/api/health',
      requiresAuth: false,
      description: 'فحص حالة الخادم'
    },
    {
      name: 'Settings API',
      method: 'GET',
      url: '/api/settings',
      requiresAuth: false,
      description: 'جلب إعدادات النظام'
    },
    {
      name: 'Logo API',
      method: 'GET',
      url: '/api/settings/logo',
      requiresAuth: false,
      description: 'جلب شعار الشركة',
      expectedStatus: [200, 404] // 404 مقبول إذا لم يكن هناك شعار
    },
    {
      name: 'Accounts List',
      method: 'GET',
      url: '/api/financial/accounts',
      requiresAuth: true,
      description: 'جلب قائمة الحسابات'
    },
    {
      name: 'Financial Summary',
      method: 'GET',
      url: '/api/financial/summary',
      requiresAuth: true,
      description: 'جلب الملخص المالي'
    },
    {
      name: 'Opening Balances',
      method: 'GET',
      url: '/api/financial/opening-balances',
      requiresAuth: true,
      description: 'جلب الأرصدة الافتتاحية'
    },
    {
      name: 'Customers List',
      method: 'GET',
      url: '/api/sales/customers',
      requiresAuth: true,
      description: 'جلب قائمة العملاء'
    },
    {
      name: 'Sales Summary',
      method: 'GET',
      url: '/api/sales/summary',
      requiresAuth: true,
      description: 'جلب ملخص المبيعات'
    }
  ];

  // اختبار APIs بدون مصادقة
  console.log('📋 اختبار APIs العامة (بدون مصادقة):\n');
  
  for (const test of tests.filter(t => !t.requiresAuth)) {
    totalTests++;
    const result = await runTest(test);
    if (result.success) passedTests++;
  }

  // محاولة تسجيل الدخول للحصول على token
  console.log('\n🔐 محاولة تسجيل الدخول...');
  const authToken = await attemptLogin();

  if (authToken) {
    console.log('✅ تم تسجيل الدخول بنجاح\n');
    
    // اختبار APIs التي تحتاج مصادقة
    console.log('📋 اختبار APIs المحمية (تحتاج مصادقة):\n');
    
    for (const test of tests.filter(t => t.requiresAuth)) {
      totalTests++;
      const result = await runTest(test, authToken);
      if (result.success) passedTests++;
    }

    // اختبار إنشاء البيانات
    console.log('\n📝 اختبار إنشاء البيانات:\n');
    
    // اختبار إنشاء حساب
    totalTests++;
    const accountResult = await testCreateAccount(authToken);
    if (accountResult.success) passedTests++;

    // اختبار إنشاء عميل
    totalTests++;
    const customerResult = await testCreateCustomer(authToken);
    if (customerResult.success) passedTests++;

  } else {
    console.log('❌ فشل في تسجيل الدخول - تخطي اختبارات APIs المحمية\n');
  }

  // النتائج النهائية
  console.log('=' .repeat(60));
  console.log('📊 نتائج الاختبار النهائية:');
  console.log(`✅ نجح: ${passedTests}/${totalTests} اختبار`);
  console.log(`❌ فشل: ${totalTests - passedTests}/${totalTests} اختبار`);
  console.log(`📈 معدل النجاح: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 جميع الاختبارات نجحت! النظام يعمل بشكل مثالي');
  } else if (passedTests > totalTests * 0.7) {
    console.log('⚠️  معظم الاختبارات نجحت - يحتاج بعض الإصلاحات الطفيفة');
  } else {
    console.log('🚨 العديد من الاختبارات فشلت - يحتاج إصلاحات جوهرية');
  }
  
  console.log('=' .repeat(60));
}

async function runTest(test, authToken = null) {
  try {
    console.log(`🔍 اختبار ${test.name}...`);
    
    const config = {
      method: test.method,
      url: `${VPS_URL}${test.url}`,
      timeout: TIMEOUT,
      headers: {}
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (test.data) {
      config.data = test.data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    
    const expectedStatuses = test.expectedStatus || [200];
    if (expectedStatuses.includes(response.status)) {
      console.log(`✅ ${test.name}: نجح (${response.status})`);
      if (test.description) {
        console.log(`   📝 ${test.description}`);
      }
      return { success: true, data: response.data };
    } else {
      console.log(`⚠️  ${test.name}: حالة غير متوقعة (${response.status})`);
      return { success: false, error: `Unexpected status: ${response.status}` };
    }

  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    
    console.log(`❌ ${test.name}: فشل (${status})`);
    console.log(`   💬 الخطأ: ${message}`);
    
    return { success: false, error: message };
  }
}

async function attemptLogin() {
  try {
    // بيانات تسجيل دخول تجريبية - استبدل بالبيانات الصحيحة
    const loginData = {
      email: 'admin@goldenhorse.ly', // استبدل بالإيميل الصحيح
      password: 'admin123' // استبدل بكلمة المرور الصحيحة
    };

    const response = await axios.post(`${VPS_URL}/api/auth/login`, loginData, {
      timeout: TIMEOUT
    });

    if (response.data && response.data.token) {
      return response.data.token;
    }
    
    return null;
  } catch (error) {
    console.log(`❌ فشل تسجيل الدخول: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testCreateAccount(authToken) {
  try {
    console.log('🔍 اختبار إنشاء حساب جديد...');
    
    const response = await axios.post(`${VPS_URL}/api/financial/accounts`, TEST_DATA.account, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: TIMEOUT
    });

    if (response.status === 201) {
      console.log('✅ إنشاء حساب: نجح');
      console.log(`   📝 تم إنشاء حساب: ${response.data.code} - ${response.data.name}`);
      return { success: true, data: response.data };
    }

  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    
    console.log(`❌ إنشاء حساب: فشل (${status})`);
    console.log(`   💬 الخطأ: ${message}`);
  }
  
  return { success: false };
}

async function testCreateCustomer(authToken) {
  try {
    console.log('🔍 اختبار إنشاء عميل جديد...');
    
    const response = await axios.post(`${VPS_URL}/api/sales/customers`, TEST_DATA.customer, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: TIMEOUT
    });

    if (response.status === 201) {
      console.log('✅ إنشاء عميل: نجح');
      console.log(`   📝 تم إنشاء عميل: ${response.data.name}`);
      return { success: true, data: response.data };
    }

  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    
    console.log(`❌ إنشاء عميل: فشل (${status})`);
    console.log(`   💬 الخطأ: ${message}`);
  }
  
  return { success: false };
}

// تشغيل الاختبارات
if (require.main === module) {
  testVPSAPIs().catch(error => {
    console.error('❌ خطأ في تشغيل الاختبارات:', error.message);
    process.exit(1);
  });
}

module.exports = { testVPSAPIs };
