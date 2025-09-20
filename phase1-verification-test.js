#!/usr/bin/env node

/**
 * اختبار التحقق من نتائج المرحلة 1
 * Phase 1 Verification Test - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';
const BASE_URL = 'https://web.goldenhorse-ly.com';

class Phase1VerificationTester {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.testResults = [];
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const finalOptions = { ...defaultOptions, ...options };
      const startTime = Date.now();
      
      const response = await fetch(url, finalOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let responseData = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = await response.text();
        }
      } else {
        responseData = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data: responseData,
        success: response.ok,
        contentType: contentType
      };
      
    } catch (error) {
      return {
        status: 0,
        statusText: 'Network Error',
        responseTime: 0,
        data: null,
        success: false,
        networkError: true,
        error: error.message
      };
    }
  }

  async testCriticalFormsFixed() {
    console.log('\n📋 اختبار 1/4: التحقق من إصلاح النماذج الحرجة...');
    
    try {
      // فحص النماذج المسجلة في قاعدة البيانات
      const formsCount = await this.client.query('SELECT COUNT(*) as count FROM required_forms');
      const formsDetails = await this.client.query(`
        SELECT page_path, form_name, is_critical 
        FROM required_forms 
        ORDER BY page_path
      `);

      console.log(`   📊 إجمالي النماذج المسجلة: ${formsCount.rows[0].count}`);
      
      formsDetails.rows.forEach(form => {
        const criticalIcon = form.is_critical ? '🔴' : '🟡';
        console.log(`   ${criticalIcon} ${form.page_path}: ${form.form_name}`);
      });

      // فحص جدول قواعد التحقق
      const validationRulesCount = await this.client.query('SELECT COUNT(*) as count FROM form_validation_rules');
      console.log(`   ✅ قواعد التحقق: ${validationRulesCount.rows[0].count}`);

      const expectedForms = 4; // النماذج المطلوبة
      const actualForms = parseInt(formsCount.rows[0].count);
      const success = actualForms >= expectedForms;

      this.testResults.push({
        test: 'إصلاح النماذج الحرجة',
        expected: expectedForms,
        actual: actualForms,
        success: success,
        details: `تم تسجيل ${actualForms} نماذج من أصل ${expectedForms} مطلوبة`
      });

      console.log(`   ${success ? '✅' : '❌'} النتيجة: ${success ? 'نجح' : 'فشل'}`);
      return success;

    } catch (error) {
      console.log(`   ❌ خطأ في اختبار النماذج: ${error.message}`);
      this.testResults.push({
        test: 'إصلاح النماذج الحرجة',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testBackupSystemEnabled() {
    console.log('\n💾 اختبار 2/4: التحقق من تفعيل نظام النسخ الاحتياطي...');
    
    try {
      // فحص جداول النسخ الاحتياطي
      const backupLogsCount = await this.client.query('SELECT COUNT(*) as count FROM backup_logs');
      const backupSettingsCount = await this.client.query('SELECT COUNT(*) as count FROM backup_settings');
      
      console.log(`   📊 سجلات النسخ الاحتياطي: ${backupLogsCount.rows[0].count}`);
      console.log(`   ⚙️ إعدادات النسخ الاحتياطي: ${backupSettingsCount.rows[0].count}`);

      // فحص الإعدادات المحفوظة
      const settings = await this.client.query(`
        SELECT setting_name, setting_value, is_active 
        FROM backup_settings 
        WHERE is_active = true
        ORDER BY setting_name
      `);

      console.log('   📋 الإعدادات النشطة:');
      settings.rows.forEach(setting => {
        console.log(`     ${setting.setting_name}: ${setting.setting_value}`);
      });

      // فحص الدوال المُنشأة
      const functions = await this.client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%backup%'
      `);

      console.log(`   🔧 دوال النسخ الاحتياطي: ${functions.rows.length}`);
      functions.rows.forEach(func => {
        console.log(`     📝 ${func.routine_name}`);
      });

      const expectedSettings = 4; // الإعدادات المطلوبة
      const actualSettings = parseInt(backupSettingsCount.rows[0].count);
      const expectedFunctions = 2; // الدوال المطلوبة
      const actualFunctions = functions.rows.length;

      const success = actualSettings >= expectedSettings && actualFunctions >= expectedFunctions;

      this.testResults.push({
        test: 'تفعيل نظام النسخ الاحتياطي',
        expected: { settings: expectedSettings, functions: expectedFunctions },
        actual: { settings: actualSettings, functions: actualFunctions },
        success: success,
        details: `${actualSettings} إعدادات و ${actualFunctions} دوال تم إنشاؤها`
      });

      console.log(`   ${success ? '✅' : '❌'} النتيجة: ${success ? 'نجح' : 'فشل'}`);
      return success;

    } catch (error) {
      console.log(`   ❌ خطأ في اختبار النسخ الاحتياطي: ${error.message}`);
      this.testResults.push({
        test: 'تفعيل نظام النسخ الاحتياطي',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testAuthenticationSystemFixed() {
    console.log('\n🔐 اختبار 3/4: التحقق من إصلاح نظام المصادقة...');
    
    try {
      // فحص جداول المصادقة
      const usersCount = await this.client.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
      const sessionsCount = await this.client.query('SELECT COUNT(*) as count FROM user_sessions');
      const attemptsCount = await this.client.query('SELECT COUNT(*) as count FROM login_attempts');

      console.log(`   👥 المستخدمين النشطين: ${usersCount.rows[0].count}`);
      console.log(`   🎫 الجلسات: ${sessionsCount.rows[0].count}`);
      console.log(`   📝 محاولات تسجيل الدخول: ${attemptsCount.rows[0].count}`);

      // فحص المستخدمين المُنشأين
      const users = await this.client.query(`
        SELECT email, role, first_name, last_name, is_active 
        FROM users 
        WHERE is_active = true
        ORDER BY role, email
      `);

      console.log('   👤 المستخدمين المُنشأين:');
      users.rows.forEach(user => {
        console.log(`     ${user.email} (${user.role}) - ${user.first_name} ${user.last_name}`);
      });

      // اختبار دالة المصادقة
      const authTest = await this.client.query(`
        SELECT * FROM authenticate_user('admin@goldenhorse.com', 'admin123')
      `);

      const authSuccess = authTest.rows[0] && authTest.rows[0].success;
      console.log(`   🔑 اختبار المصادقة: ${authSuccess ? 'نجح' : 'فشل'}`);

      if (authSuccess) {
        console.log(`     👤 المستخدم: ${authTest.rows[0].email}`);
        console.log(`     🔑 الدور: ${authTest.rows[0].role}`);
        console.log(`     📝 الاسم: ${authTest.rows[0].full_name}`);
      }

      // فحص دوال المصادقة
      const authFunctions = await this.client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('authenticate_user', 'create_user_session', 'validate_session')
      `);

      console.log(`   🔧 دوال المصادقة: ${authFunctions.rows.length}/3`);
      authFunctions.rows.forEach(func => {
        console.log(`     📝 ${func.routine_name}`);
      });

      const expectedUsers = 4; // المستخدمين المطلوبين
      const actualUsers = parseInt(usersCount.rows[0].count);
      const expectedFunctions = 3; // الدوال المطلوبة
      const actualFunctions = authFunctions.rows.length;

      const success = actualUsers >= expectedUsers && actualFunctions >= expectedFunctions && authSuccess;

      this.testResults.push({
        test: 'إصلاح نظام المصادقة',
        expected: { users: expectedUsers, functions: expectedFunctions, authTest: true },
        actual: { users: actualUsers, functions: actualFunctions, authTest: authSuccess },
        success: success,
        details: `${actualUsers} مستخدمين، ${actualFunctions} دوال، اختبار المصادقة: ${authSuccess ? 'نجح' : 'فشل'}`
      });

      console.log(`   ${success ? '✅' : '❌'} النتيجة: ${success ? 'نجح' : 'فشل'}`);
      return success;

    } catch (error) {
      console.log(`   ❌ خطأ في اختبار المصادقة: ${error.message}`);
      this.testResults.push({
        test: 'إصلاح نظام المصادقة',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testAPIEndpointsWorking() {
    console.log('\n🌐 اختبار 4/4: التحقق من عمل APIs بعد الإصلاحات...');
    
    const criticalAPIs = [
      { path: '/api/financial/reports/balance-sheet', name: 'الميزانية العمومية' },
      { path: '/api/financial/reports/income-statement', name: 'قائمة الدخل' },
      { path: '/api/financial/reports/trial-balance', name: 'ميزان المراجعة' }
    ];

    let workingAPIs = 0;
    const apiResults = [];

    for (const api of criticalAPIs) {
      console.log(`   🔍 اختبار: ${api.name}...`);
      
      const result = await this.makeRequest(api.path);
      
      apiResults.push({
        path: api.path,
        name: api.name,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success
      });

      if (result.success) {
        workingAPIs++;
        console.log(`   ✅ ${api.name} - ${result.responseTime}ms`);
      } else {
        console.log(`   ❌ ${api.name} - ${result.status} ${result.statusText}`);
      }
    }

    const successRate = Math.round((workingAPIs / criticalAPIs.length) * 100);
    console.log(`   📊 معدل نجاح APIs: ${successRate}%`);

    const success = successRate >= 80; // نتوقع 80% على الأقل

    this.testResults.push({
      test: 'عمل APIs الحرجة',
      expected: '80% على الأقل',
      actual: `${successRate}%`,
      success: success,
      details: `${workingAPIs}/${criticalAPIs.length} APIs تعمل بنجاح`,
      apiResults: apiResults
    });

    console.log(`   ${success ? '✅' : '❌'} النتيجة: ${success ? 'نجح' : 'فشل'}`);
    return success;
  }

  async calculatePhase1Efficiency() {
    console.log('\n📊 حساب كفاءة النظام بعد المرحلة 1...');
    
    const successfulTests = this.testResults.filter(test => test.success).length;
    const totalTests = this.testResults.length;
    const testSuccessRate = Math.round((successfulTests / totalTests) * 100);

    console.log(`   📈 معدل نجاح الاختبارات: ${testSuccessRate}%`);
    console.log(`   ✅ الاختبارات الناجحة: ${successfulTests}/${totalTests}`);

    // حساب الكفاءة المقدرة
    const baseEfficiency = 82; // الكفاءة قبل المرحلة 1
    const maxImprovement = 8; // أقصى تحسن متوقع للمرحلة 1
    const actualImprovement = (testSuccessRate / 100) * maxImprovement;
    const newEfficiency = Math.round(baseEfficiency + actualImprovement);

    console.log(`   🎯 الكفاءة قبل المرحلة 1: ${baseEfficiency}%`);
    console.log(`   📈 التحسن المحقق: +${Math.round(actualImprovement)}%`);
    console.log(`   🏆 الكفاءة الجديدة المقدرة: ${newEfficiency}%`);

    // تحديد الحالة
    let status;
    if (newEfficiency >= 90) status = 'ممتاز - جاهز للمرحلة 2';
    else if (newEfficiency >= 85) status = 'جيد جداً - يمكن المتابعة';
    else if (newEfficiency >= 80) status = 'جيد - يحتاج مراجعة';
    else status = 'يحتاج إصلاحات إضافية';

    console.log(`   📊 الحالة: ${status}`);

    return {
      testSuccessRate: testSuccessRate,
      newEfficiency: newEfficiency,
      improvement: Math.round(actualImprovement),
      status: status,
      readyForPhase2: newEfficiency >= 85
    };
  }

  async generateVerificationReport() {
    const report = {
      phase: 1,
      title: 'تقرير التحقق من المرحلة 1 - إصلاح المشاكل الحرجة',
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: await this.calculatePhase1Efficiency()
    };

    try {
      const fs = await import('fs');
      fs.default.writeFileSync('phase1-verification-report.json', JSON.stringify(report, null, 2));
      console.log('\n📄 تم حفظ تقرير التحقق: phase1-verification-report.json');
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير التحقق:', error.message);
    }

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

  async runVerificationTests() {
    console.log('🧪 بدء اختبارات التحقق من المرحلة 1...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: التحقق من نجاح إصلاحات المرحلة 1');
    console.log('='.repeat(70));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.testCriticalFormsFixed();
      await this.testBackupSystemEnabled();
      await this.testAuthenticationSystemFixed();
      await this.testAPIEndpointsWorking();
      
      const report = await this.generateVerificationReport();
      return report;
      
    } catch (error) {
      console.error('❌ خطأ عام في اختبارات التحقق:', error.message);
      return null;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل اختبارات التحقق
const verificationTester = new Phase1VerificationTester();
verificationTester.runVerificationTests().then(report => {
  if (report) {
    console.log('\n' + '='.repeat(70));
    console.log('🏆 ملخص نتائج التحقق من المرحلة 1');
    console.log('='.repeat(70));
    console.log(`📊 معدل نجاح الاختبارات: ${report.summary.testSuccessRate}%`);
    console.log(`🎯 الكفاءة الجديدة: ${report.summary.newEfficiency}%`);
    console.log(`📈 التحسن المحقق: +${report.summary.improvement}%`);
    console.log(`📊 الحالة: ${report.summary.status}`);
    console.log(`🚀 جاهز للمرحلة 2: ${report.summary.readyForPhase2 ? 'نعم ✅' : 'لا ❌'}`);
    
    console.log('\n📋 تفاصيل الاختبارات:');
    report.testResults.forEach((test, index) => {
      const icon = test.success ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${test.test}: ${test.success ? 'نجح' : 'فشل'}`);
      if (test.details) {
        console.log(`   📝 ${test.details}`);
      }
    });
    
    if (report.summary.readyForPhase2) {
      console.log('\n🎉 المرحلة 1 مكتملة بنجاح! يمكن الانتقال للمرحلة 2');
      process.exit(0);
    } else {
      console.log('\n⚠️ المرحلة 1 تحتاج مراجعة قبل الانتقال للمرحلة 2');
      process.exit(1);
    }
  } else {
    console.log('\n❌ فشل في إجراء اختبارات التحقق');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل اختبارات التحقق:', error);
  process.exit(1);
});
