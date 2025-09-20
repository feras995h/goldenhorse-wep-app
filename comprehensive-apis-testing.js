#!/usr/bin/env node

/**
 * اختبار شامل ومكثف لجميع APIs - المرحلة 2
 * Golden Horse Shipping System - Comprehensive APIs Testing
 */

import fs from 'fs';

const BASE_URL = 'https://web.goldenhorse-ly.com';

class ComprehensiveAPITester {
  constructor() {
    this.testResults = {
      financialAPIs: [],
      salesAPIs: [],
      authenticationTests: [],
      performanceTests: [],
      errorHandlingTests: [],
      issues: [],
      summary: {}
    };
    this.startTime = Date.now();
    this.authToken = null;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (this.authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const finalOptions = { ...defaultOptions, ...options };
      
      const response = await fetch(url, finalOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let responseData = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = { error: 'Invalid JSON response' };
        }
      } else {
        responseData = { text: await response.text() };
      }

      return {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        success: response.ok
      };
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        status: 0,
        statusText: 'Network Error',
        responseTime,
        data: { error: error.message },
        headers: {},
        success: false,
        networkError: true
      };
    }
  }

  async testAuthentication() {
    console.log('\n🔐 المرحلة 1/5: اختبار Authentication والتفويض...');
    
    // اختبار تسجيل الدخول
    const loginTest = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@goldenhorse.com',
        password: 'admin123'
      })
    });

    this.testResults.authenticationTests.push({
      endpoint: '/api/auth/login',
      method: 'POST',
      status: loginTest.status,
      responseTime: loginTest.responseTime,
      success: loginTest.success,
      description: 'اختبار تسجيل الدخول'
    });

    if (loginTest.success && loginTest.data && loginTest.data.token) {
      this.authToken = loginTest.data.token;
      console.log('   ✅ تم الحصول على token بنجاح');
    } else {
      console.log('   ⚠️ فشل في الحصول على token - سيتم اختبار APIs بدون authentication');
    }

    // اختبار الوصول بدون token
    const unauthorizedTest = await this.makeRequest('/api/financial/accounts');
    
    this.testResults.authenticationTests.push({
      endpoint: '/api/financial/accounts',
      method: 'GET',
      status: unauthorizedTest.status,
      responseTime: unauthorizedTest.responseTime,
      success: unauthorizedTest.status === 401,
      description: 'اختبار الحماية - يجب أن يعيد 401'
    });

    if (unauthorizedTest.status === 401) {
      console.log('   ✅ نظام الحماية يعمل بشكل صحيح');
    } else {
      console.log('   ⚠️ مشكلة في نظام الحماية');
      this.testResults.issues.push({
        type: 'SECURITY',
        category: 'AUTHENTICATION',
        description: 'API غير محمي بشكل صحيح',
        endpoint: '/api/financial/accounts',
        severity: 'HIGH'
      });
    }
  }

  async testFinancialAPIs() {
    console.log('\n💰 المرحلة 2/5: اختبار Financial APIs...');
    
    const financialEndpoints = [
      { path: '/api/financial/accounts', method: 'GET', description: 'قائمة الحسابات' },
      { path: '/api/financial/accounts/tree', method: 'GET', description: 'شجرة الحسابات' },
      { path: '/api/financial/vouchers/payments', method: 'GET', description: 'سندات الدفع' },
      { path: '/api/financial/vouchers/receipts', method: 'GET', description: 'سندات القبض' },
      { path: '/api/financial/fixed-assets/categories', method: 'GET', description: 'فئات الأصول الثابتة' },
      { path: '/api/financial/fixed-assets', method: 'GET', description: 'الأصول الثابتة' },
      { path: '/api/financial/reports/balance-sheet', method: 'GET', description: 'الميزانية العمومية' },
      { path: '/api/financial/reports/income-statement', method: 'GET', description: 'قائمة الدخل' },
      { path: '/api/financial/reports/trial-balance', method: 'GET', description: 'ميزان المراجعة' },
      { path: '/api/financial/journal-entries', method: 'GET', description: 'القيود اليومية' }
    ];

    for (const endpoint of financialEndpoints) {
      console.log(`   🔍 اختبار: ${endpoint.description}...`);
      
      const result = await this.makeRequest(endpoint.path, {
        method: endpoint.method
      });

      const testResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        dataReceived: result.data ? Object.keys(result.data).length > 0 : false
      };

      this.testResults.financialAPIs.push(testResult);

      if (result.success) {
        console.log(`   ✅ ${endpoint.description} - ${result.responseTime}ms`);
      } else {
        console.log(`   ❌ ${endpoint.description} - ${result.status} ${result.statusText}`);
        
        if (result.status >= 500) {
          this.testResults.issues.push({
            type: 'API_ERROR',
            category: 'FINANCIAL_API',
            description: `خطأ خادم في ${endpoint.description}`,
            endpoint: endpoint.path,
            status: result.status,
            severity: 'HIGH'
          });
        }
      }
    }
  }

  async testSalesAPIs() {
    console.log('\n🛒 المرحلة 3/5: اختبار Sales APIs...');
    
    const salesEndpoints = [
      { path: '/api/sales/customers', method: 'GET', description: 'قائمة العملاء' },
      { path: '/api/sales/invoices', method: 'GET', description: 'فواتير المبيعات' },
      { path: '/api/sales/shipping-invoices', method: 'GET', description: 'فواتير الشحن' },
      { path: '/api/sales/products', method: 'GET', description: 'المنتجات' },
      { path: '/api/sales/reports/sales-summary', method: 'GET', description: 'ملخص المبيعات' },
      { path: '/api/sales/reports/customer-statement', method: 'GET', description: 'كشف حساب العميل' },
      { path: '/api/sales/dashboard/stats', method: 'GET', description: 'إحصائيات المبيعات' }
    ];

    for (const endpoint of salesEndpoints) {
      console.log(`   🔍 اختبار: ${endpoint.description}...`);
      
      const result = await this.makeRequest(endpoint.path, {
        method: endpoint.method
      });

      const testResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        dataReceived: result.data ? Object.keys(result.data).length > 0 : false
      };

      this.testResults.salesAPIs.push(testResult);

      if (result.success) {
        console.log(`   ✅ ${endpoint.description} - ${result.responseTime}ms`);
      } else {
        console.log(`   ❌ ${endpoint.description} - ${result.status} ${result.statusText}`);
        
        if (result.status >= 500) {
          this.testResults.issues.push({
            type: 'API_ERROR',
            category: 'SALES_API',
            description: `خطأ خادم في ${endpoint.description}`,
            endpoint: endpoint.path,
            status: result.status,
            severity: 'HIGH'
          });
        }
      }
    }
  }

  async testPerformance() {
    console.log('\n🚀 المرحلة 4/5: اختبار الأداء وأوقات الاستجابة...');
    
    const performanceEndpoints = [
      { path: '/api/financial/accounts', description: 'الحسابات', maxTime: 2000 },
      { path: '/api/sales/customers', description: 'العملاء', maxTime: 2000 },
      { path: '/api/sales/invoices', description: 'الفواتير', maxTime: 3000 },
      { path: '/api/financial/reports/balance-sheet', description: 'الميزانية', maxTime: 5000 }
    ];

    for (const endpoint of performanceEndpoints) {
      console.log(`   ⏱️ اختبار أداء: ${endpoint.description}...`);
      
      // تشغيل الاختبار 3 مرات وحساب المتوسط
      const times = [];
      for (let i = 0; i < 3; i++) {
        const result = await this.makeRequest(endpoint.path);
        if (result.success) {
          times.push(result.responseTime);
        }
      }

      if (times.length > 0) {
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        const performanceResult = {
          endpoint: endpoint.path,
          description: endpoint.description,
          averageTime: avgTime,
          minTime: minTime,
          maxTime: maxTime,
          expectedMaxTime: endpoint.maxTime,
          performance: avgTime <= endpoint.maxTime ? 'GOOD' : 'SLOW'
        };

        this.testResults.performanceTests.push(performanceResult);

        if (avgTime <= endpoint.maxTime) {
          console.log(`   ✅ ${endpoint.description} - متوسط: ${avgTime}ms (ممتاز)`);
        } else {
          console.log(`   ⚠️ ${endpoint.description} - متوسط: ${avgTime}ms (بطيء)`);
          this.testResults.issues.push({
            type: 'PERFORMANCE',
            category: 'SLOW_RESPONSE',
            description: `استجابة بطيئة في ${endpoint.description}`,
            endpoint: endpoint.path,
            averageTime: avgTime,
            expectedTime: endpoint.maxTime,
            severity: 'MEDIUM'
          });
        }
      } else {
        console.log(`   ❌ ${endpoint.description} - فشل في جميع المحاولات`);
      }
    }
  }

  async testErrorHandling() {
    console.log('\n🛡️ المرحلة 5/5: اختبار معالجة الأخطاء...');
    
    const errorTests = [
      { path: '/api/financial/accounts/invalid-id', method: 'GET', expectedStatus: 404, description: 'حساب غير موجود' },
      { path: '/api/sales/customers', method: 'POST', body: {}, expectedStatus: 400, description: 'بيانات ناقصة' },
      { path: '/api/nonexistent-endpoint', method: 'GET', expectedStatus: 404, description: 'endpoint غير موجود' }
    ];

    for (const test of errorTests) {
      console.log(`   🔍 اختبار: ${test.description}...`);
      
      const options = { method: test.method };
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const result = await this.makeRequest(test.path, options);

      const errorResult = {
        endpoint: test.path,
        method: test.method,
        description: test.description,
        expectedStatus: test.expectedStatus,
        actualStatus: result.status,
        correct: result.status === test.expectedStatus,
        responseTime: result.responseTime
      };

      this.testResults.errorHandlingTests.push(errorResult);

      if (result.status === test.expectedStatus) {
        console.log(`   ✅ ${test.description} - ${result.status} (صحيح)`);
      } else {
        console.log(`   ⚠️ ${test.description} - توقع ${test.expectedStatus} لكن حصل على ${result.status}`);
      }
    }
  }

  async generateSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const allAPIs = [...this.testResults.financialAPIs, ...this.testResults.salesAPIs];
    const successfulAPIs = allAPIs.filter(api => api.success);
    const failedAPIs = allAPIs.filter(api => !api.success);
    
    const avgResponseTime = allAPIs.length > 0 ? 
      Math.round(allAPIs.reduce((sum, api) => sum + api.responseTime, 0) / allAPIs.length) : 0;

    this.testResults.summary = {
      testDate: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)} ثانية`,
      totalAPIs: allAPIs.length,
      successfulAPIs: successfulAPIs.length,
      failedAPIs: failedAPIs.length,
      successRate: allAPIs.length > 0 ? Math.round((successfulAPIs.length / allAPIs.length) * 100) : 0,
      averageResponseTime: avgResponseTime,
      authenticationWorking: this.authToken !== null,
      totalIssues: this.testResults.issues.length,
      highSeverityIssues: this.testResults.issues.filter(i => i.severity === 'HIGH').length,
      mediumSeverityIssues: this.testResults.issues.filter(i => i.severity === 'MEDIUM').length,
      overallHealth: this.calculateOverallHealth()
    };
  }

  calculateOverallHealth() {
    const successRate = this.testResults.summary.successRate;
    const highIssues = this.testResults.summary.highSeverityIssues;
    const avgResponseTime = this.testResults.summary.averageResponseTime;

    if (highIssues > 3 || successRate < 50) return 'CRITICAL';
    if (highIssues > 1 || successRate < 70 || avgResponseTime > 3000) return 'POOR';
    if (highIssues > 0 || successRate < 85 || avgResponseTime > 2000) return 'FAIR';
    if (successRate < 95 || avgResponseTime > 1000) return 'GOOD';
    return 'EXCELLENT';
  }

  async saveReport() {
    const reportData = {
      ...this.testResults,
      metadata: {
        testType: 'COMPREHENSIVE_API_TESTING',
        version: '1.0',
        system: 'Golden Horse Shipping System',
        tester: 'Augment Agent',
        timestamp: new Date().toISOString(),
        baseURL: BASE_URL
      }
    };
    
    try {
      fs.writeFileSync('apis-testing-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n📄 تم حفظ تقرير اختبار APIs: apis-testing-report.json');
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير اختبار APIs:', error.message);
    }
  }

  async runComprehensiveAPITests() {
    console.log('🚀 بدء الاختبار الشامل لجميع APIs...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: اختبار شامل لجميع واجهات البرمجة');
    console.log('🌐 الخادم:', BASE_URL);
    console.log('='.repeat(80));

    try {
      await this.testAuthentication();
      await this.testFinancialAPIs();
      await this.testSalesAPIs();
      await this.testPerformance();
      await this.testErrorHandling();
      
      await this.generateSummary();
      await this.saveReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ خطأ عام في اختبار APIs:', error.message);
      this.testResults.issues.push({
        type: 'GENERAL_ERROR',
        category: 'TESTING_ERROR',
        description: `خطأ عام: ${error.message}`,
        severity: 'HIGH'
      });
      return this.testResults;
    }
  }
}

// تشغيل الاختبار الشامل
const tester = new ComprehensiveAPITester();
tester.runComprehensiveAPITests().then(results => {
  if (results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص نتائج اختبار APIs الشامل:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة الاختبار: ${results.summary.duration}`);
    console.log(`📊 إجمالي APIs: ${results.summary.totalAPIs}`);
    console.log(`✅ APIs ناجحة: ${results.summary.successfulAPIs}`);
    console.log(`❌ APIs فاشلة: ${results.summary.failedAPIs}`);
    console.log(`📈 معدل النجاح: ${results.summary.successRate}%`);
    console.log(`⚡ متوسط وقت الاستجابة: ${results.summary.averageResponseTime}ms`);
    console.log(`🔐 Authentication: ${results.summary.authenticationWorking ? '✅ يعمل' : '❌ لا يعمل'}`);
    console.log(`🚨 إجمالي المشاكل: ${results.summary.totalIssues}`);
    console.log(`   - عالية الخطورة: ${results.summary.highSeverityIssues}`);
    console.log(`   - متوسطة الخطورة: ${results.summary.mediumSeverityIssues}`);
    console.log(`🏥 الحالة العامة: ${results.summary.overallHealth}`);
    
    if (results.summary.overallHealth === 'EXCELLENT') {
      console.log('\n🎉 جميع APIs تعمل بشكل ممتاز!');
      process.exit(0);
    } else if (results.summary.highSeverityIssues > 0) {
      console.log('\n🚨 يوجد مشاكل عالية الخطورة في APIs!');
      process.exit(1);
    } else {
      console.log('\n⚠️ يوجد مشاكل تحتاج انتباه في APIs');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء اختبار APIs الشامل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل اختبار APIs الشامل:', error);
  process.exit(1);
});
