#!/usr/bin/env node

/**
 * اختبار الحالة الحالية للـ APIs بعد التحديث
 * للتحقق من الأخطاء المستمرة
 */

import fetch from 'node-fetch';
import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';
const API_BASE_URL = 'https://web.goldenhorse-ly.com/api';

class CurrentAPITester {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.testResults = [];
    this.errors = [];
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async testDatabaseStructure() {
    console.log('\n🔍 فحص هيكل قاعدة البيانات الحالي...');
    
    try {
      // فحص فئات الأصول الثابتة
      const categoriesQuery = `
        SELECT 
          a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId", a."isGroup"
        FROM accounts a
        WHERE a.type = 'asset' 
          AND a."isActive" = true 
          AND a.code LIKE '1.2.%'
        ORDER BY a.code
      `;
      
      const categoriesResult = await this.client.query(categoriesQuery);
      const categories = categoriesResult.rows.filter(row => !row.isGroup);
      
      console.log(`📊 فئات الأصول الثابتة المتاحة: ${categories.length}`);
      
      if (categories.length === 0) {
        console.log('❌ لا توجد فئات أصول ثابتة - هذا سبب الخطأ!');
        this.errors.push('No fixed asset categories found in database');
        return false;
      }
      
      console.log('✅ الفئات المتاحة:');
      categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (${cat.code})`);
      });
      
      this.testResults.push(`Database has ${categories.length} fixed asset categories`);
      return true;
      
    } catch (error) {
      console.error('❌ خطأ في فحص قاعدة البيانات:', error.message);
      this.errors.push(`Database check failed: ${error.message}`);
      return false;
    }
  }

  async testAPIEndpoints() {
    console.log('\n🧪 اختبار API endpoints...');
    
    const endpoints = [
      {
        name: 'Fixed Assets Categories',
        url: `${API_BASE_URL}/financial/fixed-assets/categories`,
        method: 'GET'
      },
      {
        name: 'Payment Vouchers',
        url: `${API_BASE_URL}/financial/vouchers/payments?limit=10`,
        method: 'GET'
      },
      {
        name: 'Shipping Invoices',
        url: `${API_BASE_URL}/sales/shipping-invoices?page=1&limit=10`,
        method: 'GET'
      }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔍 اختبار: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'API-Tester/1.0'
          },
          timeout: 10000
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 500) {
          const errorText = await response.text();
          console.log(`   ❌ خطأ 500: ${errorText.substring(0, 200)}...`);
          this.errors.push(`${endpoint.name}: 500 error - ${errorText.substring(0, 100)}`);
        } else if (response.status === 401) {
          console.log(`   ⚠️  خطأ 401: Authentication required (متوقع)`);
          this.testResults.push(`${endpoint.name}: Authentication required (normal)`);
        } else if (response.status === 200) {
          const data = await response.json();
          console.log(`   ✅ نجح: ${JSON.stringify(data).substring(0, 100)}...`);
          this.testResults.push(`${endpoint.name}: Success`);
        } else {
          console.log(`   ⚠️  Status غير متوقع: ${response.status}`);
          this.testResults.push(`${endpoint.name}: Unexpected status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
        this.errors.push(`${endpoint.name}: Connection error - ${error.message}`);
      }
    }
  }

  async checkServerLogs() {
    console.log('\n📋 محاولة فحص server logs...');
    
    // محاكاة ما قد يحدث في server logs
    const possibleIssues = [
      'Server not restarted after code update',
      'Environment variables not updated',
      'Database connection issues',
      'Missing dependencies',
      'Code syntax errors',
      'Authentication middleware issues'
    ];
    
    console.log('🔍 المشاكل المحتملة:');
    possibleIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  async generateDiagnosticReport() {
    console.log('\n📋 إنشاء تقرير التشخيص...');
    
    const report = {
      timestamp: new Date().toISOString(),
      issue: 'API still returning errors after code update',
      database_status: this.testResults.length > 0 ? 'Connected' : 'Issues found',
      api_tests: this.testResults,
      errors_found: this.errors,
      recommendations: [
        'Check if server was restarted after code update',
        'Verify that the updated code was deployed correctly',
        'Check server logs for specific error messages',
        'Ensure database has the required fixed asset categories',
        'Verify API endpoint code is correctly updated',
        'Check authentication and middleware configuration'
      ],
      immediate_actions: [
        'Restart the production server',
        'Check server deployment status',
        'Verify database connection',
        'Test API endpoints manually',
        'Review server error logs'
      ]
    };
    
    console.log('\n🎯 تقرير التشخيص:');
    console.log(`   الوقت: ${report.timestamp}`);
    console.log(`   حالة قاعدة البيانات: ${report.database_status}`);
    console.log(`   الاختبارات الناجحة: ${report.api_tests.length}`);
    console.log(`   الأخطاء المكتشفة: ${report.errors_found.length}`);
    
    if (report.errors_found.length > 0) {
      console.log('\n❌ الأخطاء المكتشفة:');
      report.errors_found.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n💡 التوصيات الفورية:');
    report.immediate_actions.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action}`);
    });
    
    return report;
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runDiagnostics() {
    console.log('🔍 بدء تشخيص الحالة الحالية للـ APIs...\n');
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      // فحص قاعدة البيانات
      await this.testDatabaseStructure();
      
      // اختبار API endpoints
      await this.testAPIEndpoints();
      
      // فحص server logs المحتملة
      await this.checkServerLogs();
      
      // إنشاء تقرير التشخيص
      const report = await this.generateDiagnosticReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ خطأ عام في التشخيص:', error.message);
      this.errors.push(`General diagnostic error: ${error.message}`);
      return await this.generateDiagnosticReport();
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل التشخيص
const tester = new CurrentAPITester();
tester.runDiagnostics().then(report => {
  if (report) {
    console.log('\n🎉 تم إكمال التشخيص');
    
    if (report.errors_found.length > 0) {
      console.log('\n⚠️ تم العثور على مشاكل تحتاج إلى حل:');
      console.log('\n📋 الخطوات المقترحة:');
      console.log('   1. إعادة تشغيل الخادم المنشور');
      console.log('   2. التحقق من تطبيق التحديثات بشكل صحيح');
      console.log('   3. فحص server logs للأخطاء المحددة');
      console.log('   4. اختبار API endpoints يدوياً');
      
      process.exit(1);
    } else {
      console.log('\n✅ لم يتم العثور على مشاكل واضحة');
      console.log('   قد تحتاج إلى فحص server logs للتفاصيل');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء التشخيص');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل التشخيص:', error);
  process.exit(1);
});
