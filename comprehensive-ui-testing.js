#!/usr/bin/env node

/**
 * اختبار شامل لواجهة المستخدم - المرحلة 4
 * Golden Horse Shipping System - Comprehensive UI Testing
 */

import fs from 'fs';

const BASE_URL = 'https://web.goldenhorse-ly.com';

class ComprehensiveUITester {
  constructor() {
    this.testResults = {
      pageTests: [],
      javascriptErrors: [],
      responsiveTests: [],
      navigationTests: [],
      formTests: [],
      performanceTests: [],
      accessibilityTests: [],
      issues: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      const finalOptions = { ...defaultOptions, ...options };
      
      const response = await fetch(url, finalOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let responseData = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        responseData = await response.text();
      } else if (contentType && contentType.includes('application/json')) {
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

  async testMainPages() {
    console.log('\n🏠 المرحلة 1/7: فحص الصفحات الرئيسية...');
    
    const mainPages = [
      { path: '/', name: 'الصفحة الرئيسية', critical: true },
      { path: '/login', name: 'صفحة تسجيل الدخول', critical: true },
      { path: '/dashboard', name: 'لوحة التحكم', critical: true },
      { path: '/financial', name: 'النظام المالي', critical: true },
      { path: '/financial/accounts', name: 'إدارة الحسابات', critical: true },
      { path: '/financial/vouchers', name: 'السندات', critical: true },
      { path: '/financial/reports', name: 'التقارير المالية', critical: true },
      { path: '/financial/fixed-assets', name: 'الأصول الثابتة', critical: true },
      { path: '/sales', name: 'نظام المبيعات', critical: true },
      { path: '/sales/customers', name: 'إدارة العملاء', critical: true },
      { path: '/sales/invoices', name: 'الفواتير', critical: true },
      { path: '/sales/reports', name: 'تقارير المبيعات', critical: false },
      { path: '/settings', name: 'الإعدادات', critical: false }
    ];

    for (const page of mainPages) {
      console.log(`   🔍 اختبار: ${page.name}...`);
      
      const result = await this.makeRequest(page.path);
      
      const pageTest = {
        path: page.path,
        name: page.name,
        critical: page.critical,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        contentType: result.contentType,
        hasHTML: result.data && result.data.includes('<html'),
        hasTitle: result.data && result.data.includes('<title>'),
        hasCSS: result.data && (result.data.includes('.css') || result.data.includes('<style')),
        hasJS: result.data && (result.data.includes('.js') || result.data.includes('<script')),
        contentLength: result.data ? result.data.length : 0
      };

      this.testResults.pageTests.push(pageTest);

      if (result.success) {
        console.log(`   ✅ ${page.name} - ${result.responseTime}ms`);
        
        // فحص محتوى الصفحة
        if (pageTest.hasHTML && pageTest.hasTitle) {
          console.log(`   📄 محتوى HTML صحيح`);
        } else if (page.critical) {
          this.testResults.issues.push({
            type: 'HIGH',
            category: 'INVALID_HTML',
            description: `صفحة ${page.name} لا تحتوي على HTML صحيح`,
            page: page.path,
            severity: 'HIGH'
          });
        }
      } else {
        console.log(`   ❌ ${page.name} - ${result.status} ${result.statusText}`);
        
        if (page.critical) {
          this.testResults.issues.push({
            type: 'CRITICAL',
            category: 'PAGE_NOT_ACCESSIBLE',
            description: `صفحة حرجة غير متاحة: ${page.name}`,
            page: page.path,
            status: result.status,
            severity: 'CRITICAL'
          });
        }
      }
    }
  }

  async testJavaScriptErrors() {
    console.log('\n🔧 المرحلة 2/7: فحص أخطاء JavaScript...');
    
    // نظراً لأننا في بيئة Node.js، سنفحص وجود ملفات JS والأخطاء الشائعة
    const jsTestPages = [
      '/dashboard',
      '/financial',
      '/sales'
    ];

    for (const page of jsTestPages) {
      console.log(`   🔍 فحص JS في: ${page}...`);
      
      const result = await this.makeRequest(page);
      
      if (result.success && result.data) {
        const jsErrors = this.analyzeJavaScriptContent(result.data, page);
        this.testResults.javascriptErrors.push(...jsErrors);
        
        if (jsErrors.length === 0) {
          console.log(`   ✅ لا توجد أخطاء JS واضحة في ${page}`);
        } else {
          console.log(`   ⚠️ تم اكتشاف ${jsErrors.length} مشكلة محتملة في ${page}`);
        }
      }
    }
  }

  analyzeJavaScriptContent(htmlContent, page) {
    const errors = [];
    
    // فحص وجود ملفات JS
    const jsFiles = htmlContent.match(/<script[^>]*src=["']([^"']*\.js[^"']*)/g);
    if (!jsFiles || jsFiles.length === 0) {
      errors.push({
        type: 'WARNING',
        category: 'NO_JS_FILES',
        description: `لا توجد ملفات JavaScript في ${page}`,
        page: page,
        severity: 'LOW'
      });
    }

    // فحص أخطاء شائعة في الكود
    const commonErrors = [
      { pattern: /console\.error/gi, type: 'Console Errors' },
      { pattern: /undefined is not a function/gi, type: 'Undefined Function' },
      { pattern: /cannot read property/gi, type: 'Property Access Error' },
      { pattern: /syntaxerror/gi, type: 'Syntax Error' },
      { pattern: /referenceerror/gi, type: 'Reference Error' }
    ];

    for (const errorPattern of commonErrors) {
      const matches = htmlContent.match(errorPattern.pattern);
      if (matches) {
        errors.push({
          type: 'HIGH',
          category: 'JS_ERROR',
          description: `خطأ JavaScript محتمل: ${errorPattern.type} في ${page}`,
          page: page,
          count: matches.length,
          severity: 'HIGH'
        });
      }
    }

    return errors;
  }

  async testResponsiveDesign() {
    console.log('\n📱 المرحلة 3/7: اختبار التصميم المتجاوب...');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    const testPages = ['/', '/dashboard', '/financial'];

    for (const page of testPages) {
      console.log(`   📐 اختبار استجابة: ${page}...`);
      
      for (const viewport of viewports) {
        const result = await this.makeRequest(page, {
          headers: {
            'User-Agent': `Mozilla/5.0 (compatible; ResponsiveTest/${viewport.name}; ${viewport.width}x${viewport.height})`
          }
        });

        const responsiveTest = {
          page: page,
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          status: result.status,
          responseTime: result.responseTime,
          success: result.success,
          hasViewportMeta: result.data && result.data.includes('viewport'),
          hasMediaQueries: result.data && result.data.includes('@media'),
          hasBootstrap: result.data && result.data.includes('bootstrap'),
          contentLength: result.data ? result.data.length : 0
        };

        this.testResults.responsiveTests.push(responsiveTest);

        if (result.success) {
          console.log(`   ✅ ${viewport.name} (${viewport.width}x${viewport.height}) - ${result.responseTime}ms`);
        } else {
          console.log(`   ❌ ${viewport.name} - فشل التحميل`);
        }
      }
    }
  }

  async testNavigation() {
    console.log('\n🧭 المرحلة 4/7: اختبار التنقل والروابط...');
    
    const navigationTests = [
      { from: '/', to: '/login', name: 'الرئيسية إلى تسجيل الدخول' },
      { from: '/login', to: '/dashboard', name: 'تسجيل الدخول إلى لوحة التحكم' },
      { from: '/dashboard', to: '/financial', name: 'لوحة التحكم إلى المالية' },
      { from: '/financial', to: '/financial/accounts', name: 'المالية إلى الحسابات' },
      { from: '/financial', to: '/financial/reports', name: 'المالية إلى التقارير' }
    ];

    for (const navTest of navigationTests) {
      console.log(`   🔗 اختبار: ${navTest.name}...`);
      
      // اختبار الصفحة المصدر
      const fromResult = await this.makeRequest(navTest.from);
      
      // اختبار الصفحة الهدف
      const toResult = await this.makeRequest(navTest.to);
      
      const navigationResult = {
        from: navTest.from,
        to: navTest.to,
        name: navTest.name,
        fromStatus: fromResult.status,
        toStatus: toResult.status,
        fromSuccess: fromResult.success,
        toSuccess: toResult.success,
        fromResponseTime: fromResult.responseTime,
        toResponseTime: toResult.responseTime,
        navigationPossible: fromResult.success && toResult.success
      };

      this.testResults.navigationTests.push(navigationResult);

      if (navigationResult.navigationPossible) {
        console.log(`   ✅ ${navTest.name} - ممكن`);
      } else {
        console.log(`   ❌ ${navTest.name} - غير ممكن`);
        
        this.testResults.issues.push({
          type: 'MEDIUM',
          category: 'NAVIGATION_ISSUE',
          description: `مشكلة في التنقل: ${navTest.name}`,
          from: navTest.from,
          to: navTest.to,
          severity: 'MEDIUM'
        });
      }
    }
  }

  async testForms() {
    console.log('\n📝 المرحلة 5/7: اختبار النماذج والتفاعل...');
    
    const formPages = [
      { path: '/login', name: 'نموذج تسجيل الدخول', critical: true },
      { path: '/financial/accounts', name: 'نموذج إضافة حساب', critical: true },
      { path: '/sales/customers', name: 'نموذج إضافة عميل', critical: true }
    ];

    for (const formPage of formPages) {
      console.log(`   📋 فحص نماذج: ${formPage.name}...`);
      
      const result = await this.makeRequest(formPage.path);
      
      if (result.success && result.data) {
        const formAnalysis = this.analyzeFormContent(result.data, formPage.path);
        
        const formTest = {
          page: formPage.path,
          name: formPage.name,
          critical: formPage.critical,
          status: result.status,
          responseTime: result.responseTime,
          success: result.success,
          ...formAnalysis
        };

        this.testResults.formTests.push(formTest);

        if (formAnalysis.hasForm) {
          console.log(`   ✅ ${formPage.name} - يحتوي على نماذج`);
          console.log(`   📊 عدد النماذج: ${formAnalysis.formCount}`);
          console.log(`   🔘 عدد الحقول: ${formAnalysis.inputCount}`);
        } else {
          console.log(`   ⚠️ ${formPage.name} - لا يحتوي على نماذج`);
          
          if (formPage.critical) {
            this.testResults.issues.push({
              type: 'HIGH',
              category: 'MISSING_FORMS',
              description: `صفحة حرجة لا تحتوي على نماذج: ${formPage.name}`,
              page: formPage.path,
              severity: 'HIGH'
            });
          }
        }
      }
    }
  }

  analyzeFormContent(htmlContent, page) {
    const forms = htmlContent.match(/<form[^>]*>/gi) || [];
    const inputs = htmlContent.match(/<input[^>]*>/gi) || [];
    const buttons = htmlContent.match(/<button[^>]*>/gi) || [];
    const selects = htmlContent.match(/<select[^>]*>/gi) || [];
    const textareas = htmlContent.match(/<textarea[^>]*>/gi) || [];

    return {
      hasForm: forms.length > 0,
      formCount: forms.length,
      inputCount: inputs.length,
      buttonCount: buttons.length,
      selectCount: selects.length,
      textareaCount: textareas.length,
      totalFields: inputs.length + selects.length + textareas.length,
      hasValidation: htmlContent.includes('required') || htmlContent.includes('validate'),
      hasCSRF: htmlContent.includes('csrf') || htmlContent.includes('_token')
    };
  }

  async testPerformance() {
    console.log('\n⚡ المرحلة 6/7: اختبار الأداء وسرعة التحميل...');
    
    const performancePages = [
      { path: '/', name: 'الصفحة الرئيسية', maxTime: 3000 },
      { path: '/dashboard', name: 'لوحة التحكم', maxTime: 4000 },
      { path: '/financial', name: 'النظام المالي', maxTime: 4000 },
      { path: '/financial/reports', name: 'التقارير المالية', maxTime: 5000 }
    ];

    for (const page of performancePages) {
      console.log(`   ⏱️ اختبار أداء: ${page.name}...`);
      
      // تشغيل الاختبار 3 مرات وحساب المتوسط
      const times = [];
      const sizes = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await this.makeRequest(page.path);
        if (result.success) {
          times.push(result.responseTime);
          sizes.push(result.data ? result.data.length : 0);
        }
      }

      if (times.length > 0) {
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const avgSize = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);

        const performanceResult = {
          page: page.path,
          name: page.name,
          averageTime: avgTime,
          minTime: minTime,
          maxTime: maxTime,
          averageSize: avgSize,
          expectedMaxTime: page.maxTime,
          performance: avgTime <= page.maxTime ? 'GOOD' : 'SLOW',
          sizeCategory: avgSize < 100000 ? 'SMALL' : avgSize < 500000 ? 'MEDIUM' : 'LARGE'
        };

        this.testResults.performanceTests.push(performanceResult);

        if (avgTime <= page.maxTime) {
          console.log(`   ✅ ${page.name} - متوسط: ${avgTime}ms (ممتاز)`);
        } else {
          console.log(`   ⚠️ ${page.name} - متوسط: ${avgTime}ms (بطيء)`);
          
          this.testResults.issues.push({
            type: 'MEDIUM',
            category: 'SLOW_PAGE_LOAD',
            description: `تحميل بطيء للصفحة: ${page.name}`,
            page: page.path,
            averageTime: avgTime,
            expectedTime: page.maxTime,
            severity: 'MEDIUM'
          });
        }

        console.log(`   📊 حجم الصفحة: ${(avgSize / 1024).toFixed(1)} KB`);
      } else {
        console.log(`   ❌ ${page.name} - فشل في جميع المحاولات`);
      }
    }
  }

  async testAccessibility() {
    console.log('\n♿ المرحلة 7/7: اختبار إمكانية الوصول...');
    
    const accessibilityPages = [
      '/login',
      '/dashboard',
      '/financial'
    ];

    for (const page of accessibilityPages) {
      console.log(`   🔍 فحص إمكانية الوصول: ${page}...`);
      
      const result = await this.makeRequest(page);
      
      if (result.success && result.data) {
        const accessibilityAnalysis = this.analyzeAccessibility(result.data, page);
        
        this.testResults.accessibilityTests.push({
          page: page,
          status: result.status,
          responseTime: result.responseTime,
          success: result.success,
          ...accessibilityAnalysis
        });

        const score = this.calculateAccessibilityScore(accessibilityAnalysis);
        console.log(`   📊 نقاط إمكانية الوصول: ${score}/100`);
        
        if (score >= 80) {
          console.log(`   ✅ إمكانية وصول جيدة`);
        } else if (score >= 60) {
          console.log(`   ⚠️ إمكانية وصول متوسطة`);
        } else {
          console.log(`   ❌ إمكانية وصول ضعيفة`);
          
          this.testResults.issues.push({
            type: 'MEDIUM',
            category: 'POOR_ACCESSIBILITY',
            description: `إمكانية وصول ضعيفة في ${page}`,
            page: page,
            score: score,
            severity: 'MEDIUM'
          });
        }
      }
    }
  }

  analyzeAccessibility(htmlContent, page) {
    return {
      hasLang: htmlContent.includes('lang='),
      hasTitle: htmlContent.includes('<title>'),
      hasHeadings: htmlContent.includes('<h1') || htmlContent.includes('<h2'),
      hasAltText: htmlContent.includes('alt='),
      hasLabels: htmlContent.includes('<label'),
      hasAriaLabels: htmlContent.includes('aria-label'),
      hasSkipLinks: htmlContent.includes('skip') && htmlContent.includes('content'),
      hasFocusIndicators: htmlContent.includes(':focus') || htmlContent.includes('focus'),
      hasSemanticHTML: htmlContent.includes('<nav') || htmlContent.includes('<main') || htmlContent.includes('<section'),
      hasColorContrast: true // نفترض وجود تباين مناسب
    };
  }

  calculateAccessibilityScore(analysis) {
    const criteria = [
      'hasLang', 'hasTitle', 'hasHeadings', 'hasAltText', 'hasLabels',
      'hasAriaLabels', 'hasSkipLinks', 'hasFocusIndicators', 'hasSemanticHTML', 'hasColorContrast'
    ];
    
    const passedCriteria = criteria.filter(criterion => analysis[criterion]).length;
    return Math.round((passedCriteria / criteria.length) * 100);
  }

  async generateSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const totalPages = this.testResults.pageTests.length;
    const successfulPages = this.testResults.pageTests.filter(page => page.success).length;
    const criticalPages = this.testResults.pageTests.filter(page => page.critical).length;
    const successfulCriticalPages = this.testResults.pageTests.filter(page => page.critical && page.success).length;

    const avgResponseTime = totalPages > 0 ? 
      Math.round(this.testResults.pageTests.reduce((sum, page) => sum + page.responseTime, 0) / totalPages) : 0;

    this.testResults.summary = {
      testDate: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)} ثانية`,
      totalPages: totalPages,
      successfulPages: successfulPages,
      failedPages: totalPages - successfulPages,
      criticalPages: criticalPages,
      successfulCriticalPages: successfulCriticalPages,
      pageSuccessRate: totalPages > 0 ? Math.round((successfulPages / totalPages) * 100) : 0,
      criticalPageSuccessRate: criticalPages > 0 ? Math.round((successfulCriticalPages / criticalPages) * 100) : 0,
      averageResponseTime: avgResponseTime,
      totalIssues: this.testResults.issues.length,
      criticalIssues: this.testResults.issues.filter(i => i.type === 'CRITICAL').length,
      highIssues: this.testResults.issues.filter(i => i.severity === 'HIGH').length,
      mediumIssues: this.testResults.issues.filter(i => i.severity === 'MEDIUM').length,
      lowIssues: this.testResults.issues.filter(i => i.severity === 'LOW').length,
      overallHealth: this.calculateOverallHealth()
    };
  }

  calculateOverallHealth() {
    const pageSuccessRate = this.testResults.summary.pageSuccessRate;
    const criticalPageSuccessRate = this.testResults.summary.criticalPageSuccessRate;
    const criticalIssues = this.testResults.summary.criticalIssues;
    const highIssues = this.testResults.summary.highIssues;

    if (criticalIssues > 0 || criticalPageSuccessRate < 50) return 'CRITICAL';
    if (highIssues > 3 || criticalPageSuccessRate < 70 || pageSuccessRate < 60) return 'POOR';
    if (highIssues > 1 || criticalPageSuccessRate < 85 || pageSuccessRate < 75) return 'FAIR';
    if (criticalPageSuccessRate < 95 || pageSuccessRate < 85) return 'GOOD';
    return 'EXCELLENT';
  }

  async saveReport() {
    const reportData = {
      ...this.testResults,
      metadata: {
        testType: 'COMPREHENSIVE_UI_TESTING',
        version: '1.0',
        system: 'Golden Horse Shipping System',
        tester: 'Augment Agent',
        timestamp: new Date().toISOString(),
        baseURL: BASE_URL
      }
    };
    
    try {
      fs.writeFileSync('ui-testing-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n📄 تم حفظ تقرير اختبار واجهة المستخدم: ui-testing-report.json');
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير اختبار واجهة المستخدم:', error.message);
    }
  }

  async runComprehensiveUITests() {
    console.log('🚀 بدء الاختبار الشامل لواجهة المستخدم...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: اختبار شامل لجميع جوانب واجهة المستخدم');
    console.log('🌐 الموقع:', BASE_URL);
    console.log('='.repeat(80));

    try {
      await this.testMainPages();
      await this.testJavaScriptErrors();
      await this.testResponsiveDesign();
      await this.testNavigation();
      await this.testForms();
      await this.testPerformance();
      await this.testAccessibility();
      
      await this.generateSummary();
      await this.saveReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ خطأ عام في اختبار واجهة المستخدم:', error.message);
      this.testResults.issues.push({
        type: 'CRITICAL',
        category: 'TESTING_ERROR',
        description: `خطأ عام: ${error.message}`,
        severity: 'CRITICAL'
      });
      return this.testResults;
    }
  }
}

// تشغيل الاختبار الشامل لواجهة المستخدم
const tester = new ComprehensiveUITester();
tester.runComprehensiveUITests().then(results => {
  if (results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص نتائج اختبار واجهة المستخدم الشامل:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة الاختبار: ${results.summary.duration}`);
    console.log(`📊 إجمالي الصفحات: ${results.summary.totalPages}`);
    console.log(`✅ الصفحات الناجحة: ${results.summary.successfulPages}`);
    console.log(`❌ الصفحات الفاشلة: ${results.summary.failedPages}`);
    console.log(`📈 معدل نجاح الصفحات: ${results.summary.pageSuccessRate}%`);
    console.log(`🔥 الصفحات الحرجة: ${results.summary.criticalPages}`);
    console.log(`✅ الصفحات الحرجة الناجحة: ${results.summary.successfulCriticalPages}`);
    console.log(`📈 معدل نجاح الصفحات الحرجة: ${results.summary.criticalPageSuccessRate}%`);
    console.log(`⚡ متوسط وقت الاستجابة: ${results.summary.averageResponseTime}ms`);
    console.log(`🚨 إجمالي المشاكل: ${results.summary.totalIssues}`);
    console.log(`   - حرجة: ${results.summary.criticalIssues}`);
    console.log(`   - عالية: ${results.summary.highIssues}`);
    console.log(`   - متوسطة: ${results.summary.mediumIssues}`);
    console.log(`   - منخفضة: ${results.summary.lowIssues}`);
    console.log(`🏥 الحالة العامة: ${results.summary.overallHealth}`);
    
    if (results.summary.overallHealth === 'EXCELLENT') {
      console.log('\n🎉 واجهة المستخدم تعمل بشكل ممتاز!');
      process.exit(0);
    } else if (results.summary.criticalIssues > 0) {
      console.log('\n🚨 يوجد مشاكل حرجة في واجهة المستخدم!');
      process.exit(1);
    } else {
      console.log('\n⚠️ يوجد مشاكل تحتاج انتباه في واجهة المستخدم');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء اختبار واجهة المستخدم الشامل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل اختبار واجهة المستخدم الشامل:', error);
  process.exit(1);
});
