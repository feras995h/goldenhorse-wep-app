#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// تحميل متغيرات البيئة
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function checkFrontendBackendCompatibility() {
  console.log('🔍 بدء فحص التوافق بين الواجهة والخلفية...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  
  const compatibilityReport = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      warningChecks: 0
    },
    sections: []
  };

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص API Endpoints في الواجهة مقابل الخلفية
    console.log('\n📡 فحص API Endpoints...');
    const apiCheck = await checkAPIEndpoints();
    compatibilityReport.sections.push(apiCheck);
    updateSummary(compatibilityReport.summary, apiCheck);

    // 2. فحص نماذج البيانات
    console.log('\n📋 فحص نماذج البيانات...');
    const modelsCheck = await checkDataModels();
    compatibilityReport.sections.push(modelsCheck);
    updateSummary(compatibilityReport.summary, modelsCheck);

    // 3. فحص الصفحات والمكونات
    console.log('\n🖥️ فحص الصفحات والمكونات...');
    const pagesCheck = await checkPagesAndComponents();
    compatibilityReport.sections.push(pagesCheck);
    updateSummary(compatibilityReport.summary, pagesCheck);

    // 4. فحص التكامل مع النظام المحاسبي الجديد
    console.log('\n🧮 فحص التكامل مع النظام المحاسبي الجديد...');
    const accountingCheck = await checkAccountingSystemIntegration();
    compatibilityReport.sections.push(accountingCheck);
    updateSummary(compatibilityReport.summary, accountingCheck);

    // 5. فحص الأمان والصلاحيات
    console.log('\n🔒 فحص الأمان والصلاحيات...');
    const securityCheck = await checkSecurityAndPermissions();
    compatibilityReport.sections.push(securityCheck);
    updateSummary(compatibilityReport.summary, securityCheck);

    // حفظ التقرير
    const reportFileName = `frontend-backend-compatibility-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(compatibilityReport, null, 2), 'utf8');
    
    // عرض الملخص النهائي
    console.log('\n🎉 انتهى فحص التوافق!');
    console.log(`📊 الملخص: ${compatibilityReport.summary.passedChecks}/${compatibilityReport.summary.totalChecks} نجح`);
    
    if (compatibilityReport.summary.warningChecks > 0) {
      console.log(`⚠️ تحذيرات: ${compatibilityReport.summary.warningChecks}`);
    }
    
    if (compatibilityReport.summary.failedChecks > 0) {
      console.log(`❌ فشل: ${compatibilityReport.summary.failedChecks}`);
    }
    
    console.log(`📄 تم حفظ تقرير التوافق في: ${reportFileName}`);
    
    // تحديد حالة التوافق العامة
    let compatibilityStatus = 'ممتاز';
    if (compatibilityReport.summary.failedChecks > 0) {
      compatibilityStatus = 'يحتاج إصلاح';
    } else if (compatibilityReport.summary.warningChecks > 3) {
      compatibilityStatus = 'جيد مع ملاحظات';
    }
    
    console.log(`🎯 حالة التوافق: ${compatibilityStatus}`);
    
    return compatibilityReport;

  } catch (error) {
    console.error('❌ خطأ في فحص التوافق:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function checkAPIEndpoints() {
  const section = {
    name: 'فحص API Endpoints',
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // قائمة endpoints المطلوبة في الواجهة
  const frontendEndpoints = [
    // Financial API
    { path: '/api/financial/accounts', method: 'GET', page: 'ChartOfAccounts' },
    { path: '/api/financial/accounts', method: 'POST', page: 'ChartOfAccounts' },
    { path: '/api/financial/journal-entries', method: 'GET', page: 'JournalEntries' },
    { path: '/api/financial/journal-entries', method: 'POST', page: 'JournalEntries' },
    { path: '/api/financial/reports/trial-balance', method: 'GET', page: 'FinancialReports' },
    { path: '/api/financial/fixed-assets', method: 'GET', page: 'FixedAssetsManagement' },
    { path: '/api/financial/audit', method: 'GET', page: 'NEW_ACCOUNTING_SYSTEM' },
    
    // Sales API
    { path: '/api/sales/customers', method: 'GET', page: 'CustomersManagement' },
    { path: '/api/sales/customers', method: 'POST', page: 'CustomersManagement' },
    { path: '/api/sales/sales-invoices', method: 'GET', page: 'SalesInvoices' },
    { path: '/api/sales/shipping-invoices', method: 'GET', page: 'ShippingInvoices' },
    
    // Settings API
    { path: '/api/settings', method: 'GET', page: 'SystemSettings' },
    { path: '/api/settings/logo', method: 'POST', page: 'SystemSettings' },
    
    // Auth API
    { path: '/api/auth/login', method: 'POST', page: 'Login' },
    { path: '/api/auth/verify', method: 'GET', page: 'AuthContext' }
  ];

  for (const endpoint of frontendEndpoints) {
    try {
      // فحص وجود endpoint في ملفات routes
      const routeExists = await checkRouteExists(endpoint.path, endpoint.method);
      
      if (routeExists) {
        section.checks.push({
          name: `${endpoint.method} ${endpoint.path}`,
          status: 'PASSED',
          message: `متوفر في ${endpoint.page}`,
          page: endpoint.page
        });
        section.passed++;
      } else {
        section.checks.push({
          name: `${endpoint.method} ${endpoint.path}`,
          status: 'FAILED',
          message: `غير متوفر - مطلوب في ${endpoint.page}`,
          page: endpoint.page
        });
        section.failed++;
      }
    } catch (error) {
      section.checks.push({
        name: `${endpoint.method} ${endpoint.path}`,
        status: 'FAILED',
        message: `خطأ في الفحص: ${error.message}`,
        page: endpoint.page
      });
      section.failed++;
    }
  }

  return section;
}

async function checkRouteExists(path, method) {
  // فحص مبسط - في التطبيق الحقيقي يمكن فحص ملفات routes فعلياً
  const routeFiles = [
    'src/routes/financial.js',
    'src/routes/sales.js',
    'src/routes/settings.js',
    'src/routes/auth.js',
    'src/routes/admin.js'
  ];

  for (const file of routeFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        // إزالة /api/ من المسار للبحث في ملفات routes
        const routePath = path.replace('/api/financial', '').replace('/api/sales', '').replace('/api/settings', '').replace('/api/auth', '').replace('/api/admin', '');
        const routePattern = new RegExp(`router\\.${method.toLowerCase()}\\(['"]${routePath}`, 'i');
        if (routePattern.test(content)) {
          return true;
        }
      }
    } catch (error) {
      // تجاهل أخطاء قراءة الملفات
    }
  }

  return false;
}

async function checkDataModels() {
  const section = {
    name: 'فحص نماذج البيانات',
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // فحص الجداول المطلوبة
  const requiredTables = [
    'accounts', 'journal_entries', 'journal_entry_details', 'customers', 
    'invoices', 'fixed_assets', 'users', 'audit_logs', 'accounting_periods',
    'currencies', 'exchange_rates', 'depreciation_schedules'
  ];

  for (const table of requiredTables) {
    try {
      const [results] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '${table}'
      `);
      
      if (results.length > 0) {
        section.checks.push({
          name: `جدول ${table}`,
          status: 'PASSED',
          message: 'موجود في قاعدة البيانات'
        });
        section.passed++;
      } else {
        section.checks.push({
          name: `جدول ${table}`,
          status: 'FAILED',
          message: 'غير موجود في قاعدة البيانات'
        });
        section.failed++;
      }
    } catch (error) {
      section.checks.push({
        name: `جدول ${table}`,
        status: 'FAILED',
        message: `خطأ في الفحص: ${error.message}`
      });
      section.failed++;
    }
  }

  return section;
}

async function checkPagesAndComponents() {
  const section = {
    name: 'فحص الصفحات والمكونات',
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // قائمة الصفحات المطلوبة
  const requiredPages = [
    '../client/src/pages/ChartOfAccounts.tsx',
    '../client/src/pages/JournalEntries.tsx',
    '../client/src/pages/FinancialReports.tsx',
    '../client/src/pages/FixedAssetsManagement.tsx',
    '../client/src/pages/CustomersManagement.tsx',
    '../client/src/pages/SalesInvoices.tsx',
    '../client/src/pages/ShippingInvoices.tsx'
  ];

  for (const page of requiredPages) {
    try {
      if (fs.existsSync(page)) {
        // فحص محتوى الصفحة للتأكد من استخدام API صحيح
        const content = fs.readFileSync(page, 'utf8');
        const hasAPIImport = content.includes('from \'../services/api\'');
        
        if (hasAPIImport) {
          section.checks.push({
            name: path.basename(page),
            status: 'PASSED',
            message: 'موجودة ومتصلة بـ API'
          });
          section.passed++;
        } else {
          section.checks.push({
            name: path.basename(page),
            status: 'WARNING',
            message: 'موجودة لكن قد لا تستخدم API بشكل صحيح'
          });
          section.warnings++;
        }
      } else {
        section.checks.push({
          name: path.basename(page),
          status: 'FAILED',
          message: 'الصفحة غير موجودة'
        });
        section.failed++;
      }
    } catch (error) {
      section.checks.push({
        name: path.basename(page),
        status: 'FAILED',
        message: `خطأ في الفحص: ${error.message}`
      });
      section.failed++;
    }
  }

  return section;
}

async function checkAccountingSystemIntegration() {
  const section = {
    name: 'فحص التكامل مع النظام المحاسبي الجديد',
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // فحص وجود endpoints النظام المحاسبي الجديد
  const newAccountingEndpoints = [
    '/api/financial/audit',
    '/api/financial/audit/full',
    '/api/financial/audit-trail/financial'
  ];

  for (const endpoint of newAccountingEndpoints) {
    const exists = await checkRouteExists(endpoint, 'GET');
    if (exists) {
      section.checks.push({
        name: `النظام المحاسبي الجديد - ${endpoint}`,
        status: 'PASSED',
        message: 'متوفر في الخلفية'
      });
      section.passed++;
    } else {
      section.checks.push({
        name: `النظام المحاسبي الجديد - ${endpoint}`,
        status: 'WARNING',
        message: 'غير متوفر - قد يحتاج إضافة في الواجهة'
      });
      section.warnings++;
    }
  }

  // فحص وجود الجداول الجديدة
  const newTables = ['accounting_periods', 'currencies', 'exchange_rates', 'depreciation_schedules', 'audit_logs'];
  
  for (const table of newTables) {
    try {
      const [results] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '${table}'
      `);
      
      if (results.length > 0) {
        section.checks.push({
          name: `جدول النظام الجديد - ${table}`,
          status: 'PASSED',
          message: 'موجود ومتاح للاستخدام'
        });
        section.passed++;
      } else {
        section.checks.push({
          name: `جدول النظام الجديد - ${table}`,
          status: 'FAILED',
          message: 'غير موجود - مطلوب للنظام المحاسبي الجديد'
        });
        section.failed++;
      }
    } catch (error) {
      section.checks.push({
        name: `جدول النظام الجديد - ${table}`,
        status: 'FAILED',
        message: `خطأ في الفحص: ${error.message}`
      });
      section.failed++;
    }
  }

  return section;
}

async function checkSecurityAndPermissions() {
  const section = {
    name: 'فحص الأمان والصلاحيات',
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // فحص وجود middleware الأمان
  const securityFiles = [
    'src/middleware/auth.js',
    'src/middleware/auditTrail.js'
  ];

  for (const file of securityFiles) {
    if (fs.existsSync(file)) {
      section.checks.push({
        name: `ملف الأمان - ${path.basename(file)}`,
        status: 'PASSED',
        message: 'موجود ومتاح'
      });
      section.passed++;
    } else {
      section.checks.push({
        name: `ملف الأمان - ${path.basename(file)}`,
        status: 'FAILED',
        message: 'غير موجود - مطلوب للأمان'
      });
      section.failed++;
    }
  }

  // فحص وجود جدول المستخدمين والأدوار
  try {
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(users[0].count);
    
    if (userCount > 0) {
      section.checks.push({
        name: 'نظام المستخدمين',
        status: 'PASSED',
        message: `يوجد ${userCount} مستخدم في النظام`
      });
      section.passed++;
    } else {
      section.checks.push({
        name: 'نظام المستخدمين',
        status: 'WARNING',
        message: 'لا يوجد مستخدمين - قد تحتاج إنشاء مستخدم admin'
      });
      section.warnings++;
    }
  } catch (error) {
    section.checks.push({
      name: 'نظام المستخدمين',
      status: 'FAILED',
      message: `خطأ في فحص المستخدمين: ${error.message}`
    });
    section.failed++;
  }

  return section;
}

function updateSummary(summary, section) {
  summary.totalChecks += section.passed + section.failed + section.warnings;
  summary.passedChecks += section.passed;
  summary.failedChecks += section.failed;
  summary.warningChecks += section.warnings;
}

// تشغيل فحص التوافق
checkFrontendBackendCompatibility()
  .then((report) => {
    const exitCode = report.summary.failedChecks > 0 ? 1 : 0;
    console.log(`\n🎉 انتهى فحص التوافق بنجاح`);
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n💥 فشل فحص التوافق:', error);
    process.exit(1);
  });
