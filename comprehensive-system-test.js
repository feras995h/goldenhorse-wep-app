import axios from 'axios';

/**
 * سكريپت اختبار شامل للنظام بعد تطبيق الإصلاحات
 * يختبر جميع الوظائف الحرجة ويقدم تقرير مفصل
 */

// إعدادات الاختبار
const CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  VPS_URL: 'https://web.goldenhorse-ly.com', // استبدل بالرابط الفعلي
  TIMEOUT: 15000,
  TEST_USER: {
    email: 'admin@goldenhorse.ly',
    password: 'admin123'
  }
};

class SystemTester {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.authToken = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runTest(testName, testFunction, critical = false) {
    this.results.total++;
    console.log(`\n🧪 اختبار: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.details.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        critical
      });
      
      console.log(`✅ نجح: ${testName} (${duration}ms)`);
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.details.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        critical
      });
      
      console.log(`❌ فشل: ${testName}`);
      console.log(`   الخطأ: ${error.message}`);
      
      if (critical) {
        console.log(`🚨 اختبار حرج فشل - قد يؤثر على باقي الاختبارات`);
      }
      
      return false;
    }
  }

  async authenticate() {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, CONFIG.TEST_USER, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data && response.data.token) {
      this.authToken = response.data.token;
      return true;
    }
    throw new Error('فشل في الحصول على token');
  }

  async testHealthCheck() {
    const response = await axios.get(`${this.baseURL}/api/health`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
  }

  async testFinancialSummary() {
    const response = await axios.get(`${this.baseURL}/api/financial/summary`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 200) {
      throw new Error(`Financial summary failed: ${response.status}`);
    }
    
    const summary = response.data;
    
    // التحقق من وجود البيانات المطلوبة
    const requiredFields = ['totalAssets', 'totalLiabilities', 'netProfit', 'cashBalance'];
    for (const field of requiredFields) {
      if (summary[field] === undefined) {
        throw new Error(`Missing field: ${field}`);
      }
    }
    
    console.log(`   📊 إجمالي الأصول: ${summary.totalAssets} LYD`);
    console.log(`   📊 صافي الربح: ${summary.netProfit} LYD`);
  }

  async testAccountsList() {
    const response = await axios.get(`${this.baseURL}/api/financial/accounts`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 200) {
      throw new Error(`Accounts list failed: ${response.status}`);
    }
    
    const accounts = response.data.data || response.data;
    if (!Array.isArray(accounts)) {
      throw new Error('Accounts response is not an array');
    }
    
    console.log(`   📋 عدد الحسابات: ${accounts.length}`);
  }

  async testOpeningBalances() {
    const response = await axios.get(`${this.baseURL}/api/financial/opening-balances`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 200) {
      throw new Error(`Opening balances failed: ${response.status}`);
    }
    
    const data = response.data;
    console.log(`   📊 الأرصدة الافتتاحية: ${data.total || 0} قيد`);
  }

  async testRecentTransactions() {
    const response = await axios.get(`${this.baseURL}/api/financial/recent-transactions`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 200) {
      throw new Error(`Recent transactions failed: ${response.status}`);
    }
    
    const data = response.data;
    const transactions = data.data || [];
    console.log(`   📝 المعاملات الأخيرة: ${transactions.length} معاملة`);
  }

  async testCustomerCreation() {
    const testCustomer = {
      name: 'عميل اختبار',
      nameEn: 'Test Customer',
      type: 'individual',
      phone: '0912345678',
      email: 'test@example.com',
      creditLimit: 1000,
      paymentTerms: 30,
      currency: 'LYD'
    };

    const response = await axios.post(`${this.baseURL}/api/sales/customers`, testCustomer, {
      headers: { 
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 201) {
      throw new Error(`Customer creation failed: ${response.status}`);
    }
    
    console.log(`   👤 تم إنشاء عميل: ${response.data.name}`);
  }

  async testAccountCreation() {
    const testAccount = {
      code: '1.1.99.TEST',
      name: 'حساب اختبار',
      nameEn: 'Test Account',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      level: 4,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      accountType: 'sub'
    };

    const response = await axios.post(`${this.baseURL}/api/financial/accounts`, testAccount, {
      headers: { 
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status !== 201) {
      throw new Error(`Account creation failed: ${response.status}`);
    }
    
    console.log(`   🏦 تم إنشاء حساب: ${response.data.data?.code || response.data.code}`);
  }

  async runAllTests() {
    console.log('🚀 بدء الاختبار الشامل للنظام...');
    console.log(`🌐 الخادم: ${this.baseURL}\n`);

    // اختبارات أساسية
    await this.runTest('فحص حالة الخادم', () => this.testHealthCheck(), true);
    await this.runTest('تسجيل الدخول', () => this.authenticate(), true);

    // اختبارات APIs المالية
    await this.runTest('الملخص المالي', () => this.testFinancialSummary(), true);
    await this.runTest('قائمة الحسابات', () => this.testAccountsList(), true);
    await this.runTest('الأرصدة الافتتاحية', () => this.testOpeningBalances(), false);
    await this.runTest('المعاملات الأخيرة', () => this.testRecentTransactions(), false);

    // اختبارات إنشاء البيانات
    await this.runTest('إنشاء حساب جديد', () => this.testAccountCreation(), true);
    await this.runTest('إنشاء عميل جديد', () => this.testCustomerCreation(), false);

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 نتائج الاختبار الشامل');
    console.log('='.repeat(60));
    
    console.log(`✅ نجح: ${this.results.passed}/${this.results.total} اختبار`);
    console.log(`❌ فشل: ${this.results.failed}/${this.results.total} اختبار`);
    console.log(`📈 معدل النجاح: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    // تفاصيل الاختبارات الفاشلة
    const failedTests = this.results.details.filter(test => test.status === 'FAILED');
    if (failedTests.length > 0) {
      console.log('\n❌ الاختبارات الفاشلة:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
        if (test.critical) {
          console.log(`     🚨 اختبار حرج`);
        }
      });
    }

    // تقييم عام
    const criticalFailed = failedTests.filter(test => test.critical).length;
    const successRate = (this.results.passed / this.results.total) * 100;

    console.log('\n🎯 التقييم العام:');
    if (criticalFailed === 0 && successRate >= 90) {
      console.log('🟢 النظام يعمل بشكل ممتاز');
    } else if (criticalFailed === 0 && successRate >= 70) {
      console.log('🟡 النظام يعمل بشكل جيد مع بعض المشاكل الطفيفة');
    } else if (criticalFailed <= 2) {
      console.log('🟠 النظام يحتاج إصلاحات');
    } else {
      console.log('🔴 النظام يحتاج إصلاحات عاجلة');
    }

    console.log('='.repeat(60));
  }
}

// تشغيل الاختبارات
async function runTests() {
  const environment = process.argv[2] || 'local';
  const baseURL = environment === 'vps' ? CONFIG.VPS_URL : CONFIG.LOCAL_URL;
  
  console.log(`🔧 اختبار البيئة: ${environment.toUpperCase()}`);
  
  const tester = new SystemTester(baseURL);
  await tester.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('comprehensive-system-test.js')) {
  runTests().catch(error => {
    console.error('❌ خطأ في تشغيل الاختبارات:', error.message);
    process.exit(1);
  });
}

export { SystemTester };
