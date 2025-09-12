#!/usr/bin/env node

/**
 * Data Persistence Verification Script
 * تحقق من أن جميع البيانات المهمة محفوظة في قاعدة البيانات وليس في ملفات JSON
 */

import models, { sequelize } from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  User,
  Account,
  Customer,
  Employee,
  GLEntry,
  JournalEntry,
  Invoice,
  Payment,
  Receipt,
  PayrollEntry,
  EmployeeAdvance,
  FixedAsset,
  Setting
} = models;

/**
 * تحقق من اتصال قاعدة البيانات
 */
async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * تحقق من وجود البيانات في قاعدة البيانات
 */
async function checkDataInDatabase() {
  console.log('\n📊 Checking data in database...');
  
  const checks = [
    { name: 'Users', model: User },
    { name: 'Accounts', model: Account },
    { name: 'Customers', model: Customer },
    { name: 'Employees', model: Employee },
    { name: 'GL Entries', model: GLEntry },
    { name: 'Journal Entries', model: JournalEntry },
    { name: 'Invoices', model: Invoice },
    { name: 'Payments', model: Payment },
    { name: 'Receipts', model: Receipt },
    { name: 'Payroll Entries', model: PayrollEntry },
    { name: 'Employee Advances', model: EmployeeAdvance },
    { name: 'Fixed Assets', model: FixedAsset },
    { name: 'Settings', model: Setting }
  ];

  const results = {};
  
  for (const check of checks) {
    try {
      const count = await check.model.count();
      results[check.name] = count;
      console.log(`✅ ${check.name}: ${count} records`);
    } catch (error) {
      results[check.name] = 'ERROR';
      console.error(`❌ ${check.name}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * تحقق من عدم وجود ملفات JSON مؤقتة
 */
async function checkForJsonFiles() {
  console.log('\n🔍 Checking for temporary JSON files...');
  
  const dataDir = path.join(__dirname, '../data');
  const problematicFiles = [
    'accounts.json',
    'customers.json',
    'employees.json',
    'gl_entries.json',
    'invoices.json',
    'journal-entries.json',
    'payroll.json',
    'settings.json',
    'users.json',
    'payments.json',
    'receipts.json',
    'employee-advances.json',
    'fixed-assets.json'
  ];
  
  const foundFiles = [];
  
  try {
    // تحقق من وجود مجلد data
    await fs.access(dataDir);
    
    // تحقق من كل ملف
    for (const file of problematicFiles) {
      const filePath = path.join(dataDir, file);
      try {
        await fs.access(filePath);
        foundFiles.push(file);
        console.log(`⚠️  Found temporary file: ${file}`);
      } catch {
        // الملف غير موجود - هذا جيد
      }
    }
    
    if (foundFiles.length === 0) {
      console.log('✅ No temporary JSON files found');
    }
    
  } catch (error) {
    console.log('✅ Data directory does not exist (good)');
  }
  
  return foundFiles;
}

/**
 * تحقق من إعدادات الشعار
 */
async function checkLogoSettings() {
  console.log('\n🖼️  Checking logo settings...');
  
  try {
    const logoFilename = await Setting.get('logo_filename');
    const logoOriginalName = await Setting.get('logo_originalname');
    const logoUploadDate = await Setting.get('logo_uploaddate');
    const logoSize = await Setting.get('logo_size');
    const logoMimetype = await Setting.get('logo_mimetype');
    
    if (logoFilename) {
      console.log('✅ Logo settings found in database:');
      console.log(`   - Filename: ${logoFilename}`);
      console.log(`   - Original Name: ${logoOriginalName}`);
      console.log(`   - Upload Date: ${logoUploadDate}`);
      console.log(`   - Size: ${logoSize} bytes`);
      console.log(`   - MIME Type: ${logoMimetype}`);
      return true;
    } else {
      console.log('ℹ️  No logo configured yet');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking logo settings:', error.message);
    return false;
  }
}

/**
 * تحقق من localStorage usage
 */
async function checkLocalStorageUsage() {
  console.log('\n💾 Checking localStorage usage...');
  
  const clientDir = path.join(__dirname, '../../../client/src');
  const jsFiles = [];
  
  // البحث عن ملفات JavaScript/TypeScript
  async function findJsFiles(dir) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await findJsFiles(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          jsFiles.push(filePath);
        }
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  }
  
  await findJsFiles(clientDir);
  
  const localStorageUsage = [];
  
  for (const file of jsFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('localStorage.setItem') || content.includes('localStorage.getItem')) {
        const relativePath = path.relative(path.join(__dirname, '../../..'), file);
        localStorageUsage.push(relativePath);
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  }
  
  if (localStorageUsage.length > 0) {
    console.log('ℹ️  Files using localStorage (should only be for temporary data):');
    localStorageUsage.forEach(file => console.log(`   - ${file}`));
  } else {
    console.log('✅ No localStorage usage found');
  }
  
  return localStorageUsage;
}

/**
 * إنشاء تقرير شامل
 */
async function generateReport(dbData, jsonFiles, logoSettings, localStorageFiles) {
  console.log('\n📋 PERSISTENCE VERIFICATION REPORT');
  console.log('=====================================');
  
  // حالة قاعدة البيانات
  console.log('\n🗄️  DATABASE STATUS:');
  let totalRecords = 0;
  Object.entries(dbData).forEach(([table, count]) => {
    if (typeof count === 'number') {
      totalRecords += count;
      console.log(`   ✅ ${table}: ${count} records`);
    } else {
      console.log(`   ❌ ${table}: ${count}`);
    }
  });
  console.log(`   📊 Total records: ${totalRecords}`);
  
  // ملفات JSON المؤقتة
  console.log('\n📄 TEMPORARY JSON FILES:');
  if (jsonFiles.length === 0) {
    console.log('   ✅ No temporary JSON files found');
  } else {
    console.log('   ⚠️  Found temporary files:');
    jsonFiles.forEach(file => console.log(`      - ${file}`));
  }
  
  // إعدادات الشعار
  console.log('\n🖼️  LOGO SETTINGS:');
  if (logoSettings) {
    console.log('   ✅ Logo settings stored in database');
  } else {
    console.log('   ℹ️  No logo configured');
  }
  
  // استخدام localStorage
  console.log('\n💾 LOCALSTORAGE USAGE:');
  if (localStorageFiles.length === 0) {
    console.log('   ✅ No localStorage usage found');
  } else {
    console.log(`   ℹ️  ${localStorageFiles.length} files use localStorage (should be temporary data only)`);
  }
  
  // التقييم العام
  console.log('\n🎯 OVERALL ASSESSMENT:');
  const issues = jsonFiles.length;
  
  if (issues === 0 && totalRecords > 0) {
    console.log('   🟢 EXCELLENT: All data is properly stored in database');
  } else if (issues === 0) {
    console.log('   🟡 GOOD: No JSON files found, but database seems empty');
  } else {
    console.log(`   🔴 NEEDS ATTENTION: ${issues} temporary files found`);
  }
  
  console.log('\n=====================================');
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('🚀 Starting Data Persistence Verification...\n');
  
  try {
    // تحقق من اتصال قاعدة البيانات
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      process.exit(1);
    }
    
    // تحقق من البيانات في قاعدة البيانات
    const dbData = await checkDataInDatabase();
    
    // تحقق من ملفات JSON المؤقتة
    const jsonFiles = await checkForJsonFiles();
    
    // تحقق من إعدادات الشعار
    const logoSettings = await checkLogoSettings();
    
    // تحقق من استخدام localStorage
    const localStorageFiles = await checkLocalStorageUsage();
    
    // إنشاء التقرير
    await generateReport(dbData, jsonFiles, logoSettings, localStorageFiles);
    
    // إغلاق اتصال قاعدة البيانات
    await sequelize.close();
    
    // تحديد كود الخروج
    const exitCode = jsonFiles.length > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل الفحص
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
