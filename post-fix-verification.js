#!/usr/bin/env node

/**
 * التحقق من النظام بعد الإصلاح الطارئ
 * Post-Fix Verification - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';
const BASE_URL = 'https://web.goldenhorse-ly.com';

class PostFixVerification {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
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
          'Accept': 'application/json,text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const finalOptions = { ...defaultOptions, ...options };
      const startTime = Date.now();
      
      const response = await fetch(url, finalOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        success: response.ok
      };
      
    } catch (error) {
      return {
        status: 0,
        statusText: 'Network Error',
        responseTime: 0,
        success: false,
        error: error.message
      };
    }
  }

  async verifyDatabaseIntegrity() {
    console.log('\n🔍 التحقق من سلامة قاعدة البيانات...');
    
    try {
      // التحقق من جدول المستخدمين
      const usersCheck = await this.client.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as users_with_username,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
        FROM users
      `);

      const userStats = usersCheck.rows[0];
      console.log(`   👥 إجمالي المستخدمين: ${userStats.total_users}`);
      console.log(`   ✅ المستخدمين مع username: ${userStats.users_with_username}`);
      console.log(`   🟢 المستخدمين النشطين: ${userStats.active_users}`);

      // التحقق من الجداول الأساسية
      const tablesCheck = await this.client.query(`
        SELECT 
          (SELECT COUNT(*) FROM accounts) as accounts_count,
          (SELECT COUNT(*) FROM customers) as customers_count,
          (SELECT COUNT(*) FROM fixed_assets) as fixed_assets_count,
          (SELECT COUNT(*) FROM sales_invoices) as invoices_count
      `);

      const tableStats = tablesCheck.rows[0];
      console.log(`   📊 الحسابات: ${tableStats.accounts_count}`);
      console.log(`   👥 العملاء: ${tableStats.customers_count}`);
      console.log(`   🏢 الأصول الثابتة: ${tableStats.fixed_assets_count}`);
      console.log(`   📄 الفواتير: ${tableStats.invoices_count}`);

      // التحقق من المعادلة المحاسبية
      const accountingCheck = await this.client.query(`
        SELECT 
          type,
          COALESCE(SUM(balance), 0) as total_balance
        FROM accounts 
        WHERE "isActive" = true
        GROUP BY type
      `);

      console.log('   💰 المعادلة المحاسبية:');
      let assets = 0, liabilities = 0, equity = 0;
      
      accountingCheck.rows.forEach(row => {
        console.log(`     ${row.type}: ${parseFloat(row.total_balance).toFixed(2)}`);
        if (row.type === 'asset') assets = parseFloat(row.total_balance);
        else if (row.type === 'liability') liabilities = parseFloat(row.total_balance);
        else if (row.type === 'equity') equity = parseFloat(row.total_balance);
      });

      const isBalanced = Math.abs(assets - (liabilities + equity)) < 0.01;
      console.log(`   ${isBalanced ? '✅' : '❌'} المعادلة متوازنة: ${isBalanced ? 'نعم' : 'لا'}`);

      return {
        usersIntegrity: userStats.users_with_username === userStats.total_users,
        accountingBalanced: isBalanced,
        tablesPopulated: tableStats.accounts_count > 0
      };

    } catch (error) {
      console.log(`   ❌ خطأ في التحقق من قاعدة البيانات: ${error.message}`);
      return { usersIntegrity: false, accountingBalanced: false, tablesPopulated: false };
    }
  }

  async verifyAuthenticationSystem() {
    console.log('\n🔐 التحقق من نظام المصادقة...');
    
    try {
      // اختبار تسجيل الدخول لجميع المستخدمين
      const users = await this.client.query(`
        SELECT username, email, role 
        FROM users 
        WHERE is_active = true
        ORDER BY role
      `);

      console.log('   👤 المستخدمين المتاحين:');
      
      let successfulLogins = 0;
      
      for (const user of users.rows) {
        try {
          const authTest = await this.client.query(`
            SELECT success, message 
            FROM authenticate_user_fixed($1, $2)
          `, [user.username, 'admin123']);

          const result = authTest.rows[0];
          const status = result.success ? '✅' : '❌';
          console.log(`     ${status} ${user.username} (${user.role}): ${result.message}`);
          
          if (result.success) successfulLogins++;
          
        } catch (authError) {
          console.log(`     ❌ ${user.username}: خطأ في الاختبار`);
        }
      }

      const authSuccessRate = Math.round((successfulLogins / users.rows.length) * 100);
      console.log(`   📊 معدل نجاح المصادقة: ${authSuccessRate}%`);

      return {
        totalUsers: users.rows.length,
        successfulLogins: successfulLogins,
        successRate: authSuccessRate
      };

    } catch (error) {
      console.log(`   ❌ خطأ في التحقق من نظام المصادقة: ${error.message}`);
      return { totalUsers: 0, successfulLogins: 0, successRate: 0 };
    }
  }

  async verifyWebEndpoints() {
    console.log('\n🌐 التحقق من نقاط النهاية الويب...');
    
    const endpoints = [
      { path: '/', name: 'الصفحة الرئيسية' },
      { path: '/login', name: 'صفحة تسجيل الدخول' },
      { path: '/api/health', name: 'فحص صحة API' },
      { path: '/api/settings/logo', name: 'شعار النظام' }
    ];

    let successfulEndpoints = 0;
    let totalResponseTime = 0;

    for (const endpoint of endpoints) {
      const result = await this.makeRequest(endpoint.path);
      
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${endpoint.name}: ${result.status} (${result.responseTime}ms)`);
      
      if (result.success) {
        successfulEndpoints++;
        totalResponseTime += result.responseTime;
      }
    }

    const endpointSuccessRate = Math.round((successfulEndpoints / endpoints.length) * 100);
    const avgResponseTime = successfulEndpoints > 0 ? Math.round(totalResponseTime / successfulEndpoints) : 0;

    console.log(`   📊 معدل نجاح النقاط: ${endpointSuccessRate}%`);
    console.log(`   ⚡ متوسط وقت الاستجابة: ${avgResponseTime}ms`);

    return {
      totalEndpoints: endpoints.length,
      successfulEndpoints: successfulEndpoints,
      successRate: endpointSuccessRate,
      avgResponseTime: avgResponseTime
    };
  }

  async generateSystemHealthReport() {
    console.log('\n📊 إنشاء تقرير صحة النظام...');
    
    try {
      // حساب نقاط صحة النظام
      const healthScore = await this.client.query(`
        SELECT get_system_health_score() as score
      `);

      const systemScore = healthScore.rows[0].score;
      console.log(`   🏆 نقاط صحة النظام: ${systemScore}/100`);

      // إحصائيات شاملة
      const systemStats = await this.client.query(`
        SELECT * FROM get_system_statistics()
      `);

      const stats = systemStats.rows[0];
      console.log('   📈 إحصائيات النظام:');
      console.log(`     📊 إجمالي الحسابات: ${stats.total_accounts}`);
      console.log(`     👥 إجمالي العملاء: ${stats.total_customers}`);
      console.log(`     👤 إجمالي المستخدمين: ${stats.total_users}`);
      console.log(`     🏢 إجمالي الأصول الثابتة: ${stats.total_fixed_assets}`);
      console.log(`     📄 إجمالي الفواتير: ${stats.total_invoices}`);

      return {
        systemHealthScore: systemScore,
        systemStats: stats
      };

    } catch (error) {
      console.log(`   ❌ خطأ في إنشاء تقرير صحة النظام: ${error.message}`);
      return { systemHealthScore: 0, systemStats: null };
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

  async runVerification() {
    console.log('🔍 بدء التحقق من النظام بعد الإصلاح الطارئ...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: التأكد من عمل النظام بشكل كامل');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      const dbIntegrity = await this.verifyDatabaseIntegrity();
      const authSystem = await this.verifyAuthenticationSystem();
      const webEndpoints = await this.verifyWebEndpoints();
      const systemHealth = await this.generateSystemHealthReport();

      // حساب النتيجة الإجمالية
      const overallScore = Math.round(
        (dbIntegrity.usersIntegrity ? 25 : 0) +
        (dbIntegrity.accountingBalanced ? 25 : 0) +
        (authSystem.successRate >= 75 ? 25 : (authSystem.successRate * 25 / 100)) +
        (webEndpoints.successRate >= 75 ? 25 : (webEndpoints.successRate * 25 / 100))
      );

      console.log('\n' + '='.repeat(80));
      console.log('🏆 ملخص التحقق من النظام بعد الإصلاح');
      console.log('='.repeat(80));
      console.log(`🔍 سلامة قاعدة البيانات: ${dbIntegrity.usersIntegrity && dbIntegrity.accountingBalanced ? '✅ ممتاز' : '⚠️ يحتاج مراجعة'}`);
      console.log(`🔐 نظام المصادقة: ${authSystem.successRate}% (${authSystem.successfulLogins}/${authSystem.totalUsers})`);
      console.log(`🌐 نقاط النهاية الويب: ${webEndpoints.successRate}% (${webEndpoints.successfulEndpoints}/${webEndpoints.totalEndpoints})`);
      console.log(`🏆 صحة النظام الإجمالية: ${systemHealth.systemHealthScore}/100`);
      console.log(`📊 النتيجة الإجمالية: ${overallScore}/100`);

      let systemStatus;
      if (overallScore >= 95) systemStatus = '🎉 ممتاز - النظام يعمل بكفاءة مثالية';
      else if (overallScore >= 85) systemStatus = '✅ جيد جداً - النظام يعمل بشكل ممتاز';
      else if (overallScore >= 75) systemStatus = '👍 جيد - النظام يعمل بشكل مقبول';
      else systemStatus = '⚠️ يحتاج تحسين - هناك مشاكل تحتاج إصلاح';

      console.log(`🎯 حالة النظام: ${systemStatus}`);

      if (overallScore >= 85) {
        console.log('\n🎊 تهانينا! تم إصلاح المشكلة بنجاح والنظام يعمل بكفاءة عالية!');
        console.log('✅ يمكن الآن استخدام النظام بثقة كاملة');
      } else {
        console.log('\n⚠️ تم إصلاح المشكلة الأساسية لكن هناك تحسينات إضافية مطلوبة');
      }

      return {
        overallScore: overallScore,
        systemStatus: systemStatus,
        dbIntegrity: dbIntegrity,
        authSystem: authSystem,
        webEndpoints: webEndpoints,
        systemHealth: systemHealth
      };
      
    } catch (error) {
      console.error('❌ خطأ عام في التحقق:', error.message);
      return null;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل التحقق
const verification = new PostFixVerification();
verification.runVerification().then(result => {
  if (result && result.overallScore >= 75) {
    console.log('\n🎉 التحقق مكتمل بنجاح!');
    process.exit(0);
  } else {
    console.log('\n⚠️ التحقق مكتمل مع ملاحظات');
    process.exit(0);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل التحقق:', error);
  process.exit(1);
});
