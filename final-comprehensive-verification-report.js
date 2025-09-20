#!/usr/bin/env node

/**
 * التحقق النهائي والتقرير الشامل - المرحلة 7
 * Golden Horse Shipping System - Final Comprehensive Verification & Report
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';
const BASE_URL = 'https://web.goldenhorse-ly.com';

class FinalComprehensiveVerificationReporter {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.verificationResults = {
      database: {},
      apis: {},
      functions: {},
      ui: {},
      security: {},
      performance: {},
      fixes: {},
      overall: {}
    };
    this.startTime = Date.now();
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
    const startTime = Date.now();
    
    try {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

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
        headers: Object.fromEntries(response.headers.entries()),
        success: response.ok,
        contentType: contentType
      };
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        status: 0,
        statusText: 'Network Error',
        responseTime,
        data: null,
        headers: {},
        success: false,
        networkError: true,
        error: error.message
      };
    }
  }

  async verifyDatabaseHealth() {
    console.log('\n🗄️ المرحلة 1/6: التحقق النهائي من صحة قاعدة البيانات...');
    
    try {
      // فحص المعادلة المحاسبية
      const accountingEquation = await this.client.query(`
        SELECT 
          type,
          COALESCE(SUM(balance), 0) as total_balance
        FROM accounts 
        WHERE "isActive" = true
        GROUP BY type
      `);

      const balancesByType = {};
      accountingEquation.rows.forEach(row => {
        balancesByType[row.type] = parseFloat(row.total_balance);
      });

      const assets = balancesByType.asset || 0;
      const liabilities = balancesByType.liability || 0;
      const equity = balancesByType.equity || 0;
      const equationBalance = Math.abs(assets - (liabilities + equity));
      const isEquationBalanced = equationBalance < 0.01;

      // فحص عدد الجداول والبيانات
      const tablesCount = await this.client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const accountsCount = await this.client.query('SELECT COUNT(*) as count FROM accounts');
      const customersCount = await this.client.query('SELECT COUNT(*) as count FROM customers');
      const fixedAssetsCount = await this.client.query('SELECT COUNT(*) as count FROM fixed_assets');

      this.verificationResults.database = {
        tablesCount: parseInt(tablesCount.rows[0].count),
        accountsCount: parseInt(accountsCount.rows[0].count),
        customersCount: parseInt(customersCount.rows[0].count),
        fixedAssetsCount: parseInt(fixedAssetsCount.rows[0].count),
        accountingEquation: {
          assets: assets,
          liabilities: liabilities,
          equity: equity,
          isBalanced: isEquationBalanced,
          difference: equationBalance
        },
        status: isEquationBalanced ? 'HEALTHY' : 'UNBALANCED'
      };

      console.log(`   ✅ عدد الجداول: ${this.verificationResults.database.tablesCount}`);
      console.log(`   ✅ عدد الحسابات: ${this.verificationResults.database.accountsCount}`);
      console.log(`   ✅ عدد العملاء: ${this.verificationResults.database.customersCount}`);
      console.log(`   ✅ عدد الأصول الثابتة: ${this.verificationResults.database.fixedAssetsCount}`);
      console.log(`   ${isEquationBalanced ? '✅' : '❌'} المعادلة المحاسبية: ${isEquationBalanced ? 'متوازنة' : 'غير متوازنة'}`);

    } catch (error) {
      console.log(`   ❌ خطأ في فحص قاعدة البيانات: ${error.message}`);
      this.verificationResults.database.status = 'ERROR';
      this.verificationResults.database.error = error.message;
    }
  }

  async verifyAPIsHealth() {
    console.log('\n🌐 المرحلة 2/6: التحقق النهائي من صحة APIs...');
    
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

    this.verificationResults.apis = {
      totalAPIs: criticalAPIs.length,
      workingAPIs: workingAPIs,
      successRate: Math.round((workingAPIs / criticalAPIs.length) * 100),
      apiResults: apiResults,
      status: workingAPIs === criticalAPIs.length ? 'HEALTHY' : 'PARTIAL'
    };

    console.log(`   📊 معدل نجاح APIs: ${this.verificationResults.apis.successRate}%`);
  }

  async verifyUIHealth() {
    console.log('\n🖥️ المرحلة 3/6: التحقق النهائي من صحة واجهة المستخدم...');
    
    const criticalPages = [
      { path: '/', name: 'الصفحة الرئيسية' },
      { path: '/login', name: 'تسجيل الدخول' },
      { path: '/dashboard', name: 'لوحة التحكم' },
      { path: '/financial', name: 'النظام المالي' },
      { path: '/sales', name: 'نظام المبيعات' }
    ];

    let workingPages = 0;
    const pageResults = [];
    let totalResponseTime = 0;

    for (const page of criticalPages) {
      console.log(`   🔍 اختبار: ${page.name}...`);
      
      const result = await this.makeRequest(page.path);
      
      pageResults.push({
        path: page.path,
        name: page.name,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        hasHTML: result.data && result.data.includes('<html')
      });

      if (result.success) {
        workingPages++;
        totalResponseTime += result.responseTime;
        console.log(`   ✅ ${page.name} - ${result.responseTime}ms`);
      } else {
        console.log(`   ❌ ${page.name} - ${result.status} ${result.statusText}`);
      }
    }

    const avgResponseTime = workingPages > 0 ? Math.round(totalResponseTime / workingPages) : 0;

    this.verificationResults.ui = {
      totalPages: criticalPages.length,
      workingPages: workingPages,
      successRate: Math.round((workingPages / criticalPages.length) * 100),
      averageResponseTime: avgResponseTime,
      pageResults: pageResults,
      status: workingPages === criticalPages.length ? 'HEALTHY' : 'PARTIAL'
    };

    console.log(`   📊 معدل نجاح الصفحات: ${this.verificationResults.ui.successRate}%`);
    console.log(`   ⚡ متوسط وقت الاستجابة: ${avgResponseTime}ms`);
  }

  async verifySecurityHealth() {
    console.log('\n🔒 المرحلة 4/6: التحقق النهائي من الأمان...');
    
    const securityEndpoints = ['/', '/login', '/dashboard'];
    let totalSecurityScore = 0;
    const securityResults = [];

    for (const endpoint of securityEndpoints) {
      const result = await this.makeRequest(endpoint);
      
      if (result.success) {
        const securityHeaders = {
          'x-frame-options': result.headers['x-frame-options'] || null,
          'x-content-type-options': result.headers['x-content-type-options'] || null,
          'x-xss-protection': result.headers['x-xss-protection'] || null,
          'strict-transport-security': result.headers['strict-transport-security'] || null
        };

        const securityHeadersCount = Object.values(securityHeaders).filter(h => h !== null).length;
        const securityScore = Math.round((securityHeadersCount / 4) * 100);
        totalSecurityScore += securityScore;

        securityResults.push({
          endpoint: endpoint,
          securityScore: securityScore,
          headers: securityHeaders
        });
      }
    }

    const avgSecurityScore = securityResults.length > 0 ? Math.round(totalSecurityScore / securityResults.length) : 0;

    this.verificationResults.security = {
      averageSecurityScore: avgSecurityScore,
      securityResults: securityResults,
      status: avgSecurityScore >= 70 ? 'GOOD' : avgSecurityScore >= 40 ? 'FAIR' : 'POOR'
    };

    console.log(`   🔒 متوسط نقاط الأمان: ${avgSecurityScore}/100`);
    console.log(`   📊 حالة الأمان: ${this.verificationResults.security.status}`);
  }

  async verifyPerformanceHealth() {
    console.log('\n⚡ المرحلة 5/6: التحقق النهائي من الأداء...');
    
    try {
      // اختبار أداء قاعدة البيانات
      const dbPerformanceTests = [
        {
          name: 'استعلام الحسابات',
          query: 'SELECT COUNT(*) FROM accounts WHERE "isActive" = true',
          expectedTime: 100
        },
        {
          name: 'استعلام العملاء',
          query: 'SELECT COUNT(*) FROM customers WHERE "isActive" = true',
          expectedTime: 50
        }
      ];

      let optimalQueries = 0;
      const queryResults = [];

      for (const test of dbPerformanceTests) {
        const startTime = Date.now();
        await this.client.query(test.query);
        const endTime = Date.now();
        const queryTime = endTime - startTime;

        const isOptimal = queryTime <= test.expectedTime;
        if (isOptimal) optimalQueries++;

        queryResults.push({
          name: test.name,
          executionTime: queryTime,
          expectedTime: test.expectedTime,
          isOptimal: isOptimal
        });

        console.log(`   ${isOptimal ? '✅' : '⚠️'} ${test.name}: ${queryTime}ms`);
      }

      this.verificationResults.performance = {
        totalQueries: dbPerformanceTests.length,
        optimalQueries: optimalQueries,
        queryOptimizationRate: Math.round((optimalQueries / dbPerformanceTests.length) * 100),
        queryResults: queryResults,
        status: optimalQueries === dbPerformanceTests.length ? 'OPTIMAL' : 'NEEDS_IMPROVEMENT'
      };

      console.log(`   📊 معدل تحسين الاستعلامات: ${this.verificationResults.performance.queryOptimizationRate}%`);

    } catch (error) {
      console.log(`   ❌ خطأ في فحص الأداء: ${error.message}`);
      this.verificationResults.performance.status = 'ERROR';
      this.verificationResults.performance.error = error.message;
    }
  }

  async verifyAppliedFixes() {
    console.log('\n🔧 المرحلة 6/6: التحقق من الإصلاحات المطبقة...');
    
    try {
      // قراءة تقرير الإصلاحات
      if (fs.existsSync('comprehensive-issues-fixes-report.json')) {
        const fixesReport = JSON.parse(fs.readFileSync('comprehensive-issues-fixes-report.json', 'utf8'));
        
        this.verificationResults.fixes = {
          totalIssuesFound: fixesReport.summary.totalIssuesFound,
          fixesApplied: fixesReport.summary.fixesApplied.successful,
          fixesSuccessRate: fixesReport.summary.fixesApplied.successRate,
          criticalIssuesRemaining: fixesReport.summary.issuesByPriority.critical,
          highIssuesRemaining: fixesReport.summary.issuesByPriority.high,
          preventiveMaintenancePlans: fixesReport.summary.preventiveMaintenancePlans,
          status: fixesReport.summary.issuesByPriority.critical === 0 ? 'RESOLVED' : 'PARTIAL'
        };

        console.log(`   📋 إجمالي المشاكل: ${this.verificationResults.fixes.totalIssuesFound}`);
        console.log(`   🔧 الإصلاحات المطبقة: ${this.verificationResults.fixes.fixesApplied}`);
        console.log(`   📈 معدل نجاح الإصلاحات: ${this.verificationResults.fixes.fixesSuccessRate}%`);
        console.log(`   🔴 مشاكل حرجة متبقية: ${this.verificationResults.fixes.criticalIssuesRemaining}`);
        console.log(`   🛠️ خطط الصيانة الوقائية: ${this.verificationResults.fixes.preventiveMaintenancePlans}`);
      } else {
        console.log('   ⚠️ تقرير الإصلاحات غير موجود');
        this.verificationResults.fixes.status = 'NO_REPORT';
      }

    } catch (error) {
      console.log(`   ❌ خطأ في قراءة تقرير الإصلاحات: ${error.message}`);
      this.verificationResults.fixes.status = 'ERROR';
      this.verificationResults.fixes.error = error.message;
    }
  }

  calculateOverallHealth() {
    console.log('\n📊 حساب الحالة العامة للنظام...');
    
    const healthScores = {
      database: this.getDatabaseScore(),
      apis: this.getAPIsScore(),
      ui: this.getUIScore(),
      security: this.getSecurityScore(),
      performance: this.getPerformanceScore(),
      fixes: this.getFixesScore()
    };

    const totalScore = Object.values(healthScores).reduce((sum, score) => sum + score, 0);
    const averageScore = Math.round(totalScore / Object.keys(healthScores).length);

    let overallHealth;
    if (averageScore >= 90) overallHealth = 'EXCELLENT';
    else if (averageScore >= 80) overallHealth = 'GOOD';
    else if (averageScore >= 70) overallHealth = 'FAIR';
    else if (averageScore >= 60) overallHealth = 'POOR';
    else overallHealth = 'CRITICAL';

    this.verificationResults.overall = {
      healthScores: healthScores,
      averageScore: averageScore,
      overallHealth: overallHealth,
      systemEfficiency: averageScore,
      readyForProduction: averageScore >= 80 && this.verificationResults.fixes.criticalIssuesRemaining === 0
    };

    console.log('   📊 نقاط الصحة لكل مكون:');
    Object.entries(healthScores).forEach(([component, score]) => {
      console.log(`     ${this.getComponentName(component)}: ${score}/100`);
    });
    console.log(`   🏆 النقاط الإجمالية: ${averageScore}/100`);
    console.log(`   🎯 الحالة العامة: ${overallHealth}`);
    console.log(`   🚀 جاهز للإنتاج: ${this.verificationResults.overall.readyForProduction ? 'نعم' : 'لا'}`);
  }

  getDatabaseScore() {
    if (this.verificationResults.database.status === 'HEALTHY') return 100;
    if (this.verificationResults.database.status === 'UNBALANCED') return 70;
    return 0;
  }

  getAPIsScore() {
    return this.verificationResults.apis.successRate || 0;
  }

  getUIScore() {
    return this.verificationResults.ui.successRate || 0;
  }

  getSecurityScore() {
    return this.verificationResults.security.averageSecurityScore || 0;
  }

  getPerformanceScore() {
    return this.verificationResults.performance.queryOptimizationRate || 0;
  }

  getFixesScore() {
    if (this.verificationResults.fixes.status === 'RESOLVED') return 100;
    if (this.verificationResults.fixes.status === 'PARTIAL') return this.verificationResults.fixes.fixesSuccessRate || 50;
    return 0;
  }

  getComponentName(component) {
    const names = {
      database: 'قاعدة البيانات',
      apis: 'واجهات البرمجة',
      ui: 'واجهة المستخدم',
      security: 'الأمان',
      performance: 'الأداء',
      fixes: 'الإصلاحات'
    };
    return names[component] || component;
  }

  async generateFinalReport() {
    console.log('\n📄 إنشاء التقرير النهائي الشامل...');
    
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const finalReport = {
      metadata: {
        reportType: 'FINAL_COMPREHENSIVE_VERIFICATION_REPORT',
        version: '1.0',
        system: 'Golden Horse Shipping System',
        generatedBy: 'Augment Agent',
        timestamp: new Date().toISOString(),
        duration: `${Math.round(duration / 1000)} ثانية`,
        baseURL: BASE_URL
      },
      executiveSummary: {
        systemHealth: this.verificationResults.overall.overallHealth,
        systemEfficiency: this.verificationResults.overall.systemEfficiency,
        readyForProduction: this.verificationResults.overall.readyForProduction,
        criticalIssuesRemaining: this.verificationResults.fixes.criticalIssuesRemaining || 0,
        recommendedActions: this.generateFinalRecommendations()
      },
      detailedResults: this.verificationResults,
      finalRecommendations: this.generateFinalRecommendations(),
      nextSteps: this.generateNextSteps(),
      maintenanceSchedule: this.generateMaintenanceSchedule()
    };

    try {
      fs.writeFileSync('FINAL_COMPREHENSIVE_SYSTEM_REPORT.json', JSON.stringify(finalReport, null, 2));
      console.log('   📄 تم حفظ التقرير النهائي: FINAL_COMPREHENSIVE_SYSTEM_REPORT.json');
    } catch (error) {
      console.error('   ❌ فشل في حفظ التقرير النهائي:', error.message);
    }

    return finalReport;
  }

  generateFinalRecommendations() {
    const recommendations = [];

    if (this.verificationResults.fixes.criticalIssuesRemaining > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'إصلاح المشاكل الحرجة المتبقية',
        description: `يوجد ${this.verificationResults.fixes.criticalIssuesRemaining} مشكلة حرجة تحتاج إصلاح فوري`
      });
    }

    if (this.verificationResults.security.averageSecurityScore < 70) {
      recommendations.push({
        priority: 'HIGH',
        title: 'تحسين الأمان',
        description: 'تطبيق رؤوس الأمان المفقودة وتحسين إعدادات الأمان'
      });
    }

    if (this.verificationResults.performance.queryOptimizationRate < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'تحسين الأداء',
        description: 'تحسين الاستعلامات البطيئة وإضافة فهارس إضافية'
      });
    }

    recommendations.push({
      priority: 'LOW',
      title: 'تطبيق الصيانة الوقائية',
      description: 'تطبيق خطط الصيانة الوقائية المقترحة بانتظام'
    });

    return recommendations;
  }

  generateNextSteps() {
    const nextSteps = [];

    if (this.verificationResults.overall.readyForProduction) {
      nextSteps.push('✅ النظام جاهز للإنتاج');
      nextSteps.push('🔄 تطبيق الصيانة الوقائية الدورية');
      nextSteps.push('📊 مراقبة الأداء والأمان بانتظام');
    } else {
      nextSteps.push('🔧 إصلاح المشاكل المتبقية');
      nextSteps.push('🔄 إعادة تشغيل الفحص الشامل');
      nextSteps.push('✅ التأكد من جاهزية النظام للإنتاج');
    }

    nextSteps.push('📚 توثيق الإجراءات والعمليات');
    nextSteps.push('👥 تدريب الفريق على النظام');

    return nextSteps;
  }

  generateMaintenanceSchedule() {
    return [
      { frequency: 'يومي', task: 'النسخ الاحتياطي', priority: 'CRITICAL' },
      { frequency: 'أسبوعي', task: 'صيانة قاعدة البيانات', priority: 'HIGH' },
      { frequency: 'أسبوعي', task: 'مراقبة الأداء', priority: 'MEDIUM' },
      { frequency: 'شهري', task: 'فحص الأمان', priority: 'HIGH' },
      { frequency: 'شهري', task: 'صيانة واجهة المستخدم', priority: 'MEDIUM' },
      { frequency: 'ربع سنوي', task: 'فحص شامل للنظام', priority: 'HIGH' }
    ];
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runFinalComprehensiveVerification() {
    console.log('🚀 بدء التحقق النهائي والتقرير الشامل...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: التحقق النهائي من كفاءة النظام 100% وإنشاء التقرير الشامل');
    console.log('🌐 الموقع:', BASE_URL);
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.verifyDatabaseHealth();
      await this.verifyAPIsHealth();
      await this.verifyUIHealth();
      await this.verifySecurityHealth();
      await this.verifyPerformanceHealth();
      await this.verifyAppliedFixes();
      
      this.calculateOverallHealth();
      const finalReport = await this.generateFinalReport();
      
      return finalReport;
      
    } catch (error) {
      console.error('❌ خطأ عام في التحقق النهائي:', error.message);
      return null;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل التحقق النهائي والتقرير الشامل
const verifier = new FinalComprehensiveVerificationReporter();
verifier.runFinalComprehensiveVerification().then(report => {
  if (report) {
    console.log('\n' + '='.repeat(80));
    console.log('🏆 ملخص التحقق النهائي والتقرير الشامل:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة التحقق: ${report.metadata.duration}`);
    console.log(`🏥 حالة النظام: ${report.executiveSummary.systemHealth}`);
    console.log(`📊 كفاءة النظام: ${report.executiveSummary.systemEfficiency}%`);
    console.log(`🚀 جاهز للإنتاج: ${report.executiveSummary.readyForProduction ? 'نعم ✅' : 'لا ❌'}`);
    console.log(`🔴 مشاكل حرجة متبقية: ${report.executiveSummary.criticalIssuesRemaining}`);
    console.log(`💡 التوصيات النهائية: ${report.finalRecommendations.length}`);
    console.log(`📋 الخطوات التالية: ${report.nextSteps.length}`);
    console.log(`🛠️ جدول الصيانة: ${report.maintenanceSchedule.length} مهمة`);
    
    if (report.executiveSummary.systemHealth === 'EXCELLENT' && report.executiveSummary.readyForProduction) {
      console.log('\n🎉 النظام في حالة ممتازة وجاهز للإنتاج بكفاءة 100%!');
      process.exit(0);
    } else if (report.executiveSummary.criticalIssuesRemaining > 0) {
      console.log('\n🚨 يوجد مشاكل حرجة تحتاج إصلاح قبل الإنتاج!');
      process.exit(1);
    } else {
      console.log('\n⚠️ النظام في حالة جيدة مع حاجة لتحسينات طفيفة');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء التحقق النهائي الشامل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل التحقق النهائي الشامل:', error);
  process.exit(1);
});
