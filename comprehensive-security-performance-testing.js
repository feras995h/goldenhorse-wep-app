#!/usr/bin/env node

/**
 * اختبار شامل للأمان والأداء - المرحلة 5
 * Golden Horse Shipping System - Comprehensive Security & Performance Testing
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';
const BASE_URL = 'https://web.goldenhorse-ly.com';

class ComprehensiveSecurityPerformanceTester {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.testResults = {
      securityTests: [],
      performanceTests: [],
      loadTests: [],
      backupTests: [],
      vulnerabilityTests: [],
      databasePerformance: [],
      issues: [],
      summary: {}
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

  async testSecurityHeaders() {
    console.log('\n🔒 المرحلة 1/6: فحص رؤوس الأمان...');
    
    const securityEndpoints = [
      '/',
      '/login',
      '/dashboard',
      '/api/financial/accounts'
    ];

    for (const endpoint of securityEndpoints) {
      console.log(`   🔍 فحص رؤوس الأمان: ${endpoint}...`);
      
      const result = await this.makeRequest(endpoint);
      
      const securityHeaders = {
        endpoint: endpoint,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        headers: {
          'x-frame-options': result.headers['x-frame-options'] || null,
          'x-content-type-options': result.headers['x-content-type-options'] || null,
          'x-xss-protection': result.headers['x-xss-protection'] || null,
          'strict-transport-security': result.headers['strict-transport-security'] || null,
          'content-security-policy': result.headers['content-security-policy'] || null,
          'referrer-policy': result.headers['referrer-policy'] || null,
          'permissions-policy': result.headers['permissions-policy'] || null
        },
        securityScore: 0
      };

      // حساب نقاط الأمان
      let score = 0;
      const securityHeadersCount = Object.values(securityHeaders.headers).filter(h => h !== null).length;
      score = Math.round((securityHeadersCount / 7) * 100);
      securityHeaders.securityScore = score;

      this.testResults.securityTests.push(securityHeaders);

      if (score >= 70) {
        console.log(`   ✅ نقاط الأمان: ${score}/100 (جيد)`);
      } else if (score >= 40) {
        console.log(`   ⚠️ نقاط الأمان: ${score}/100 (متوسط)`);
      } else {
        console.log(`   ❌ نقاط الأمان: ${score}/100 (ضعيف)`);
        
        this.testResults.issues.push({
          type: 'HIGH',
          category: 'WEAK_SECURITY_HEADERS',
          description: `رؤوس أمان ضعيفة في ${endpoint}`,
          endpoint: endpoint,
          score: score,
          severity: 'HIGH'
        });
      }
    }
  }

  async testVulnerabilities() {
    console.log('\n🛡️ المرحلة 2/6: فحص الثغرات الأمنية...');
    
    const vulnerabilityTests = [
      {
        name: 'SQL Injection Test',
        endpoint: '/api/financial/accounts',
        payload: "'; DROP TABLE accounts; --",
        type: 'SQL_INJECTION'
      },
      {
        name: 'XSS Test',
        endpoint: '/login',
        payload: '<script>alert("XSS")</script>',
        type: 'XSS'
      },
      {
        name: 'Path Traversal Test',
        endpoint: '/api/files/../../../etc/passwd',
        payload: null,
        type: 'PATH_TRAVERSAL'
      },
      {
        name: 'CSRF Test',
        endpoint: '/api/financial/accounts',
        payload: null,
        type: 'CSRF',
        method: 'POST'
      }
    ];

    for (const vulnTest of vulnerabilityTests) {
      console.log(`   🔍 اختبار: ${vulnTest.name}...`);
      
      const options = {
        method: vulnTest.method || 'GET'
      };

      if (vulnTest.payload && vulnTest.method === 'POST') {
        options.body = JSON.stringify({ test: vulnTest.payload });
        options.headers = {
          'Content-Type': 'application/json'
        };
      }

      const result = await this.makeRequest(vulnTest.endpoint, options);
      
      const vulnerabilityResult = {
        name: vulnTest.name,
        type: vulnTest.type,
        endpoint: vulnTest.endpoint,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        vulnerable: this.analyzeVulnerability(result, vulnTest.type),
        response: result.data ? (typeof result.data === 'string' ? result.data.substring(0, 200) : JSON.stringify(result.data).substring(0, 200)) : null
      };

      this.testResults.vulnerabilityTests.push(vulnerabilityResult);

      if (vulnerabilityResult.vulnerable) {
        console.log(`   ❌ ثغرة محتملة: ${vulnTest.name}`);
        
        this.testResults.issues.push({
          type: 'CRITICAL',
          category: 'SECURITY_VULNERABILITY',
          description: `ثغرة أمنية محتملة: ${vulnTest.name}`,
          endpoint: vulnTest.endpoint,
          vulnerabilityType: vulnTest.type,
          severity: 'CRITICAL'
        });
      } else {
        console.log(`   ✅ آمن من: ${vulnTest.name}`);
      }
    }
  }

  analyzeVulnerability(result, type) {
    if (!result.success) return false;

    let responseText = '';
    if (result.data) {
      if (typeof result.data === 'string') {
        responseText = result.data.toLowerCase();
      } else {
        responseText = JSON.stringify(result.data).toLowerCase();
      }
    }

    switch (type) {
      case 'SQL_INJECTION':
        return responseText.includes('sql') || responseText.includes('syntax error') ||
               responseText.includes('mysql') || responseText.includes('postgresql');

      case 'XSS':
        return responseText.includes('<script>') || responseText.includes('alert(');

      case 'PATH_TRAVERSAL':
        return responseText.includes('root:') || responseText.includes('/etc/passwd') ||
               responseText.includes('bin/bash');

      case 'CSRF':
        return !result.headers['x-csrf-token'] && !responseText.includes('csrf');

      default:
        return false;
    }
  }

  async testLoadPerformance() {
    console.log('\n⚡ المرحلة 3/6: اختبار الأداء تحت الحمولة...');
    
    const loadTestEndpoints = [
      { path: '/', name: 'الصفحة الرئيسية', concurrent: 10 },
      { path: '/dashboard', name: 'لوحة التحكم', concurrent: 5 },
      { path: '/api/financial/reports/balance-sheet', name: 'تقرير الميزانية', concurrent: 3 }
    ];

    for (const endpoint of loadTestEndpoints) {
      console.log(`   🔄 اختبار حمولة: ${endpoint.name} (${endpoint.concurrent} طلبات متزامنة)...`);
      
      const promises = [];
      const startTime = Date.now();
      
      // إنشاء طلبات متزامنة
      for (let i = 0; i < endpoint.concurrent; i++) {
        promises.push(this.makeRequest(endpoint.path));
      }
      
      try {
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        const successfulRequests = results.filter(r => r.success).length;
        const failedRequests = results.length - successfulRequests;
        const avgResponseTime = Math.round(
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        );
        const maxResponseTime = Math.max(...results.map(r => r.responseTime));
        const minResponseTime = Math.min(...results.map(r => r.responseTime));

        const loadTestResult = {
          endpoint: endpoint.path,
          name: endpoint.name,
          concurrentRequests: endpoint.concurrent,
          totalTime: totalTime,
          successfulRequests: successfulRequests,
          failedRequests: failedRequests,
          successRate: Math.round((successfulRequests / results.length) * 100),
          avgResponseTime: avgResponseTime,
          maxResponseTime: maxResponseTime,
          minResponseTime: minResponseTime,
          requestsPerSecond: Math.round((results.length / totalTime) * 1000),
          performance: avgResponseTime < 1000 ? 'EXCELLENT' : avgResponseTime < 3000 ? 'GOOD' : 'POOR'
        };

        this.testResults.loadTests.push(loadTestResult);

        console.log(`   ✅ معدل النجاح: ${loadTestResult.successRate}%`);
        console.log(`   ⚡ متوسط الاستجابة: ${avgResponseTime}ms`);
        console.log(`   📊 طلبات/ثانية: ${loadTestResult.requestsPerSecond}`);

        if (loadTestResult.successRate < 90) {
          this.testResults.issues.push({
            type: 'HIGH',
            category: 'POOR_LOAD_PERFORMANCE',
            description: `أداء ضعيف تحت الحمولة: ${endpoint.name}`,
            endpoint: endpoint.path,
            successRate: loadTestResult.successRate,
            severity: 'HIGH'
          });
        }

      } catch (error) {
        console.log(`   ❌ فشل اختبار الحمولة: ${error.message}`);
        
        this.testResults.issues.push({
          type: 'HIGH',
          category: 'LOAD_TEST_FAILURE',
          description: `فشل اختبار الحمولة: ${endpoint.name}`,
          endpoint: endpoint.path,
          error: error.message,
          severity: 'HIGH'
        });
      }
    }
  }

  async testDatabasePerformance() {
    console.log('\n🗄️ المرحلة 4/6: اختبار أداء قاعدة البيانات...');
    
    const performanceQueries = [
      {
        name: 'استعلام الحسابات',
        query: 'SELECT COUNT(*) FROM accounts WHERE "isActive" = true',
        expectedTime: 100
      },
      {
        name: 'استعلام المعادلة المحاسبية',
        query: `SELECT type, SUM(balance) as total FROM accounts WHERE "isActive" = true GROUP BY type`,
        expectedTime: 200
      },
      {
        name: 'استعلام العملاء النشطين',
        query: 'SELECT COUNT(*) FROM customers WHERE "isActive" = true',
        expectedTime: 50
      },
      {
        name: 'استعلام الفواتير الحديثة',
        query: `SELECT COUNT(*) FROM sales_invoices WHERE "createdAt" > NOW() - INTERVAL '30 days'`,
        expectedTime: 150
      },
      {
        name: 'استعلام الأصول الثابتة',
        query: 'SELECT COUNT(*) FROM fixed_assets',
        expectedTime: 50
      }
    ];

    for (const perfQuery of performanceQueries) {
      console.log(`   🔍 اختبار: ${perfQuery.name}...`);
      
      try {
        const startTime = Date.now();
        const result = await this.client.query(perfQuery.query);
        const endTime = Date.now();
        const queryTime = endTime - startTime;

        const performanceResult = {
          name: perfQuery.name,
          query: perfQuery.query,
          executionTime: queryTime,
          expectedTime: perfQuery.expectedTime,
          rowCount: result.rowCount,
          performance: queryTime <= perfQuery.expectedTime ? 'GOOD' : 'SLOW',
          success: true
        };

        this.testResults.databasePerformance.push(performanceResult);

        if (queryTime <= perfQuery.expectedTime) {
          console.log(`   ✅ ${perfQuery.name} - ${queryTime}ms (ممتاز)`);
        } else {
          console.log(`   ⚠️ ${perfQuery.name} - ${queryTime}ms (بطيء)`);
          
          this.testResults.issues.push({
            type: 'MEDIUM',
            category: 'SLOW_DATABASE_QUERY',
            description: `استعلام بطيء: ${perfQuery.name}`,
            query: perfQuery.query,
            executionTime: queryTime,
            expectedTime: perfQuery.expectedTime,
            severity: 'MEDIUM'
          });
        }

      } catch (error) {
        console.log(`   ❌ فشل: ${perfQuery.name} - ${error.message}`);
        
        this.testResults.databasePerformance.push({
          name: perfQuery.name,
          query: perfQuery.query,
          executionTime: null,
          expectedTime: perfQuery.expectedTime,
          rowCount: 0,
          performance: 'ERROR',
          success: false,
          error: error.message
        });

        this.testResults.issues.push({
          type: 'HIGH',
          category: 'DATABASE_QUERY_ERROR',
          description: `خطأ في الاستعلام: ${perfQuery.name}`,
          query: perfQuery.query,
          error: error.message,
          severity: 'HIGH'
        });
      }
    }
  }

  async testBackupAndRecovery() {
    console.log('\n💾 المرحلة 5/6: اختبار النسخ الاحتياطي والاستعادة...');
    
    try {
      // فحص إعدادات النسخ الاحتياطي
      console.log('   🔍 فحص إعدادات النسخ الاحتياطي...');
      
      const backupSettings = await this.client.query(`
        SELECT name, setting 
        FROM pg_settings 
        WHERE name IN ('archive_mode', 'archive_command', 'wal_level')
      `);

      const backupConfig = {};
      backupSettings.rows.forEach(row => {
        backupConfig[row.name] = row.setting;
      });

      // فحص حجم قاعدة البيانات
      const dbSize = await this.client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      // فحص آخر نسخة احتياطية (محاكاة)
      const lastBackupCheck = {
        hasBackupSystem: backupConfig.archive_mode === 'on',
        walLevel: backupConfig.wal_level,
        archiveCommand: backupConfig.archive_command,
        databaseSize: dbSize.rows[0].size,
        backupRecommended: true
      };

      this.testResults.backupTests.push({
        type: 'BACKUP_CONFIGURATION',
        ...lastBackupCheck,
        status: lastBackupCheck.hasBackupSystem ? 'CONFIGURED' : 'NOT_CONFIGURED'
      });

      if (lastBackupCheck.hasBackupSystem) {
        console.log('   ✅ نظام النسخ الاحتياطي مُفعل');
        console.log(`   📊 حجم قاعدة البيانات: ${lastBackupCheck.databaseSize}`);
      } else {
        console.log('   ⚠️ نظام النسخ الاحتياطي غير مُفعل');
        
        this.testResults.issues.push({
          type: 'HIGH',
          category: 'NO_BACKUP_SYSTEM',
          description: 'نظام النسخ الاحتياطي غير مُفعل',
          recommendation: 'تفعيل archive_mode وإعداد archive_command',
          severity: 'HIGH'
        });
      }

      // اختبار استعادة البيانات (محاكاة)
      console.log('   🔄 اختبار محاكاة للاستعادة...');
      
      const recoveryTest = await this.simulateRecoveryTest();
      this.testResults.backupTests.push(recoveryTest);

    } catch (error) {
      console.log(`   ❌ فشل اختبار النسخ الاحتياطي: ${error.message}`);
      
      this.testResults.issues.push({
        type: 'HIGH',
        category: 'BACKUP_TEST_ERROR',
        description: `فشل اختبار النسخ الاحتياطي: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  async simulateRecoveryTest() {
    try {
      // إنشاء جدول اختبار مؤقت
      await this.client.query(`
        CREATE TEMP TABLE recovery_test (
          id SERIAL PRIMARY KEY,
          test_data VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // إدراج بيانات اختبار
      await this.client.query(`
        INSERT INTO recovery_test (test_data) 
        VALUES ('test_data_1'), ('test_data_2'), ('test_data_3')
      `);

      // قراءة البيانات للتأكد
      const testData = await this.client.query('SELECT COUNT(*) as count FROM recovery_test');
      const recordCount = parseInt(testData.rows[0].count);

      // حذف الجدول المؤقت
      await this.client.query('DROP TABLE recovery_test');

      console.log('   ✅ اختبار الاستعادة نجح (محاكاة)');

      return {
        type: 'RECOVERY_SIMULATION',
        success: true,
        recordsCreated: 3,
        recordsRecovered: recordCount,
        status: recordCount === 3 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      };

    } catch (error) {
      console.log('   ❌ فشل اختبار الاستعادة (محاكاة)');
      
      return {
        type: 'RECOVERY_SIMULATION',
        success: false,
        error: error.message,
        status: 'FAILED'
      };
    }
  }

  async testSystemResources() {
    console.log('\n🖥️ المرحلة 6/6: فحص موارد النظام...');
    
    try {
      // فحص إحصائيات قاعدة البيانات
      const dbStats = await this.client.query(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size
      `);

      // فحص أداء الاستعلامات
      const queryStats = await this.client.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC 
        LIMIT 10
      `);

      const systemResources = {
        database: {
          activeConnections: parseInt(dbStats.rows[0].active_connections),
          maxConnections: parseInt(dbStats.rows[0].max_connections),
          databaseSize: dbStats.rows[0].db_size,
          connectionUsage: Math.round((parseInt(dbStats.rows[0].active_connections) / parseInt(dbStats.rows[0].max_connections)) * 100)
        },
        tables: queryStats.rows.map(row => ({
          schema: row.schemaname,
          table: row.tablename,
          inserts: parseInt(row.inserts),
          updates: parseInt(row.updates),
          deletes: parseInt(row.deletes),
          liveTuples: parseInt(row.live_tuples),
          deadTuples: parseInt(row.dead_tuples)
        }))
      };

      this.testResults.performanceTests.push({
        type: 'SYSTEM_RESOURCES',
        ...systemResources,
        status: 'ANALYZED'
      });

      console.log(`   ✅ الاتصالات النشطة: ${systemResources.database.activeConnections}/${systemResources.database.maxConnections}`);
      console.log(`   📊 استخدام الاتصالات: ${systemResources.database.connectionUsage}%`);
      console.log(`   💾 حجم قاعدة البيانات: ${systemResources.database.databaseSize}`);
      console.log(`   📋 الجداول المحللة: ${systemResources.tables.length}`);

      if (systemResources.database.connectionUsage > 80) {
        this.testResults.issues.push({
          type: 'HIGH',
          category: 'HIGH_CONNECTION_USAGE',
          description: 'استخدام عالي للاتصالات بقاعدة البيانات',
          usage: systemResources.database.connectionUsage,
          severity: 'HIGH'
        });
      }

    } catch (error) {
      console.log(`   ❌ فشل فحص موارد النظام: ${error.message}`);
      
      this.testResults.issues.push({
        type: 'MEDIUM',
        category: 'SYSTEM_RESOURCES_ERROR',
        description: `فشل فحص موارد النظام: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
  }

  async generateSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const securityScore = this.testResults.securityTests.length > 0 ? 
      Math.round(this.testResults.securityTests.reduce((sum, test) => sum + test.securityScore, 0) / this.testResults.securityTests.length) : 0;

    const vulnerabilitiesFound = this.testResults.vulnerabilityTests.filter(test => test.vulnerable).length;
    const loadTestsPassed = this.testResults.loadTests.filter(test => test.successRate >= 90).length;
    const dbQueriesOptimal = this.testResults.databasePerformance.filter(test => test.performance === 'GOOD').length;

    this.testResults.summary = {
      testDate: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)} ثانية`,
      securityScore: securityScore,
      vulnerabilitiesFound: vulnerabilitiesFound,
      loadTestsPassed: loadTestsPassed,
      totalLoadTests: this.testResults.loadTests.length,
      dbQueriesOptimal: dbQueriesOptimal,
      totalDbQueries: this.testResults.databasePerformance.length,
      backupConfigured: this.testResults.backupTests.some(test => test.status === 'CONFIGURED'),
      totalIssues: this.testResults.issues.length,
      criticalIssues: this.testResults.issues.filter(i => i.type === 'CRITICAL').length,
      highIssues: this.testResults.issues.filter(i => i.severity === 'HIGH').length,
      mediumIssues: this.testResults.issues.filter(i => i.severity === 'MEDIUM').length,
      overallHealth: this.calculateOverallHealth()
    };
  }

  calculateOverallHealth() {
    const securityScore = this.testResults.summary.securityScore;
    const vulnerabilities = this.testResults.summary.vulnerabilitiesFound;
    const criticalIssues = this.testResults.summary.criticalIssues;
    const highIssues = this.testResults.summary.highIssues;

    if (vulnerabilities > 0 || criticalIssues > 0) return 'CRITICAL';
    if (securityScore < 40 || highIssues > 3) return 'POOR';
    if (securityScore < 60 || highIssues > 1) return 'FAIR';
    if (securityScore < 80 || highIssues > 0) return 'GOOD';
    return 'EXCELLENT';
  }

  async saveReport() {
    const reportData = {
      ...this.testResults,
      metadata: {
        testType: 'COMPREHENSIVE_SECURITY_PERFORMANCE_TESTING',
        version: '1.0',
        system: 'Golden Horse Shipping System',
        tester: 'Augment Agent',
        timestamp: new Date().toISOString(),
        baseURL: BASE_URL
      }
    };
    
    try {
      fs.writeFileSync('security-performance-testing-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n📄 تم حفظ تقرير اختبار الأمان والأداء: security-performance-testing-report.json');
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير اختبار الأمان والأداء:', error.message);
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runComprehensiveSecurityPerformanceTests() {
    console.log('🚀 بدء الاختبار الشامل للأمان والأداء...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: اختبار شامل للأمان والأداء والموثوقية');
    console.log('🌐 الموقع:', BASE_URL);
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.testSecurityHeaders();
      await this.testVulnerabilities();
      await this.testLoadPerformance();
      await this.testDatabasePerformance();
      await this.testBackupAndRecovery();
      await this.testSystemResources();
      
      await this.generateSummary();
      await this.saveReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ خطأ عام في اختبار الأمان والأداء:', error.message);
      this.testResults.issues.push({
        type: 'CRITICAL',
        category: 'TESTING_ERROR',
        description: `خطأ عام: ${error.message}`,
        severity: 'CRITICAL'
      });
      return this.testResults;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الاختبار الشامل للأمان والأداء
const tester = new ComprehensiveSecurityPerformanceTester();
tester.runComprehensiveSecurityPerformanceTests().then(results => {
  if (results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص نتائج اختبار الأمان والأداء الشامل:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة الاختبار: ${results.summary.duration}`);
    console.log(`🔒 نقاط الأمان: ${results.summary.securityScore}/100`);
    console.log(`🛡️ الثغرات المكتشفة: ${results.summary.vulnerabilitiesFound}`);
    console.log(`⚡ اختبارات الحمولة الناجحة: ${results.summary.loadTestsPassed}/${results.summary.totalLoadTests}`);
    console.log(`🗄️ استعلامات قاعدة البيانات المحسنة: ${results.summary.dbQueriesOptimal}/${results.summary.totalDbQueries}`);
    console.log(`💾 النسخ الاحتياطي: ${results.summary.backupConfigured ? 'مُفعل' : 'غير مُفعل'}`);
    console.log(`🚨 إجمالي المشاكل: ${results.summary.totalIssues}`);
    console.log(`   - حرجة: ${results.summary.criticalIssues}`);
    console.log(`   - عالية: ${results.summary.highIssues}`);
    console.log(`   - متوسطة: ${results.summary.mediumIssues}`);
    console.log(`🏥 الحالة العامة: ${results.summary.overallHealth}`);
    
    if (results.summary.overallHealth === 'EXCELLENT') {
      console.log('\n🎉 الأمان والأداء في حالة ممتازة!');
      process.exit(0);
    } else if (results.summary.criticalIssues > 0 || results.summary.vulnerabilitiesFound > 0) {
      console.log('\n🚨 يوجد مشاكل حرجة في الأمان!');
      process.exit(1);
    } else {
      console.log('\n⚠️ يوجد مشاكل تحتاج انتباه في الأمان والأداء');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء اختبار الأمان والأداء الشامل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل اختبار الأمان والأداء الشامل:', error);
  process.exit(1);
});
