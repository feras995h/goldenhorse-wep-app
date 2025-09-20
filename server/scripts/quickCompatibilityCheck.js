#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 فحص سريع للتوافق بين الواجهة والخلفية...');
console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);

// 1. فحص وجود ملفات routes الأساسية
console.log('\n📡 فحص ملفات Routes...');
const routeFiles = [
  'src/routes/financial.js',
  'src/routes/sales.js', 
  'src/routes/settings.js',
  'src/routes/auth.js',
  'src/routes/admin.js'
];

let routesFound = 0;
for (const file of routeFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - موجود`);
    routesFound++;
  } else {
    console.log(`❌ ${file} - غير موجود`);
  }
}

// 2. فحص وجود صفحات الواجهة
console.log('\n🖥️ فحص صفحات الواجهة...');
const frontendPages = [
  '../client/src/pages/ChartOfAccounts.tsx',
  '../client/src/pages/JournalEntries.tsx',
  '../client/src/pages/FinancialReports.tsx',
  '../client/src/pages/FixedAssetsManagement.tsx',
  '../client/src/pages/CustomersManagement.tsx',
  '../client/src/pages/SalesInvoices.tsx',
  '../client/src/pages/ShippingInvoices.tsx'
];

let pagesFound = 0;
for (const page of frontendPages) {
  if (fs.existsSync(page)) {
    console.log(`✅ ${path.basename(page)} - موجود`);
    pagesFound++;
  } else {
    console.log(`❌ ${path.basename(page)} - غير موجود`);
  }
}

// 3. فحص ملف API الرئيسي
console.log('\n📱 فحص ملف API الرئيسي...');
const apiFile = '../client/src/services/api.ts';
if (fs.existsSync(apiFile)) {
  console.log(`✅ ${path.basename(apiFile)} - موجود`);
  
  // فحص محتوى ملف API
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  const hasFinancialAPI = apiContent.includes('financialAPI');
  const hasSalesAPI = apiContent.includes('salesAPI');
  const hasAuthAPI = apiContent.includes('authAPI');
  
  console.log(`   - financialAPI: ${hasFinancialAPI ? '✅' : '❌'}`);
  console.log(`   - salesAPI: ${hasSalesAPI ? '✅' : '❌'}`);
  console.log(`   - authAPI: ${hasAuthAPI ? '✅' : '❌'}`);
} else {
  console.log(`❌ ${path.basename(apiFile)} - غير موجود`);
}

// 4. فحص endpoints محددة في ملفات routes
console.log('\n🔗 فحص Endpoints المحددة...');

// فحص financial routes
if (fs.existsSync('src/routes/financial.js')) {
  const financialContent = fs.readFileSync('src/routes/financial.js', 'utf8');
  
  const endpoints = [
    { path: '/accounts', method: 'get', name: 'GET /accounts' },
    { path: '/accounts', method: 'post', name: 'POST /accounts' },
    { path: '/journal-entries', method: 'get', name: 'GET /journal-entries' },
    { path: '/journal-entries', method: 'post', name: 'POST /journal-entries' },
    { path: '/reports/trial-balance', method: 'get', name: 'GET /reports/trial-balance' },
    { path: '/fixed-assets', method: 'get', name: 'GET /fixed-assets' },
    { path: '/audit', method: 'get', name: 'GET /audit' }
  ];
  
  console.log('   Financial Routes:');
  for (const endpoint of endpoints) {
    const pattern = new RegExp(`router\\.${endpoint.method}\\(['"]${endpoint.path}`, 'i');
    if (pattern.test(financialContent)) {
      console.log(`   ✅ ${endpoint.name}`);
    } else {
      console.log(`   ❌ ${endpoint.name}`);
    }
  }
}

// فحص sales routes
if (fs.existsSync('src/routes/sales.js')) {
  const salesContent = fs.readFileSync('src/routes/sales.js', 'utf8');
  
  const salesEndpoints = [
    { path: '/customers', method: 'get', name: 'GET /customers' },
    { path: '/customers', method: 'post', name: 'POST /customers' },
    { path: '/sales-invoices', method: 'get', name: 'GET /sales-invoices' },
    { path: '/shipping-invoices', method: 'get', name: 'GET /shipping-invoices' }
  ];
  
  console.log('   Sales Routes:');
  for (const endpoint of salesEndpoints) {
    const pattern = new RegExp(`router\\.${endpoint.method}\\(['"]${endpoint.path}`, 'i');
    if (pattern.test(salesContent)) {
      console.log(`   ✅ ${endpoint.name}`);
    } else {
      console.log(`   ❌ ${endpoint.name}`);
    }
  }
}

// فحص auth routes
if (fs.existsSync('src/routes/auth.js')) {
  const authContent = fs.readFileSync('src/routes/auth.js', 'utf8');
  
  const authEndpoints = [
    { path: '/login', method: 'post', name: 'POST /login' },
    { path: '/verify', method: 'get', name: 'GET /verify' }
  ];
  
  console.log('   Auth Routes:');
  for (const endpoint of authEndpoints) {
    const pattern = new RegExp(`router\\.${endpoint.method}\\(['"]${endpoint.path}`, 'i');
    if (pattern.test(authContent)) {
      console.log(`   ✅ ${endpoint.name}`);
    } else {
      console.log(`   ❌ ${endpoint.name}`);
    }
  }
}

// 5. فحص ملفات middleware الأمان
console.log('\n🔒 فحص ملفات الأمان...');
const securityFiles = [
  'src/middleware/auth.js',
  'src/middleware/auditTrail.js'
];

let securityFound = 0;
for (const file of securityFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${path.basename(file)} - موجود`);
    securityFound++;
  } else {
    console.log(`❌ ${path.basename(file)} - غير موجود`);
  }
}

// 6. الملخص النهائي
console.log('\n📊 الملخص النهائي:');
console.log(`   Routes: ${routesFound}/${routeFiles.length} موجود`);
console.log(`   صفحات الواجهة: ${pagesFound}/${frontendPages.length} موجود`);
console.log(`   ملفات الأمان: ${securityFound}/${securityFiles.length} موجود`);

const totalScore = routesFound + pagesFound + securityFound;
const maxScore = routeFiles.length + frontendPages.length + securityFiles.length;
const percentage = Math.round((totalScore / maxScore) * 100);

console.log(`\n🎯 النتيجة الإجمالية: ${totalScore}/${maxScore} (${percentage}%)`);

if (percentage >= 90) {
  console.log('🎉 حالة التوافق: ممتاز');
} else if (percentage >= 70) {
  console.log('👍 حالة التوافق: جيد');
} else if (percentage >= 50) {
  console.log('⚠️ حالة التوافق: يحتاج تحسين');
} else {
  console.log('❌ حالة التوافق: يحتاج إصلاح شامل');
}

// 7. التوصيات
console.log('\n💡 التوصيات:');

if (routesFound < routeFiles.length) {
  console.log('   - تأكد من وجود جميع ملفات routes في المجلد الصحيح');
}

if (pagesFound < frontendPages.length) {
  console.log('   - تأكد من وجود جميع صفحات الواجهة في المجلد الصحيح');
}

if (securityFound < securityFiles.length) {
  console.log('   - تأكد من وجود ملفات middleware الأمان');
}

if (percentage < 100) {
  console.log('   - راجع مسارات الملفات والمجلدات');
  console.log('   - تأكد من أن جميع الملفات في المواقع الصحيحة');
}

console.log('\n✅ انتهى الفحص السريع للتوافق');
