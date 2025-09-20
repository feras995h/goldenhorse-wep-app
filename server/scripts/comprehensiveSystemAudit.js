#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

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

async function comprehensiveSystemAudit() {
  console.log('🔍 فحص شامل للنظام - تشخيص جميع المشاكل');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  const issues = [];
  const fixes = [];
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص شجرة الحسابات
    console.log('\n📊 1. فحص شجرة الحسابات وهيكل الترقيم...');
    
    const [accounts] = await sequelize.query(`
      SELECT 
        id,
        code,
        name,
        type,
        level,
        "parentId",
        "isGroup",
        "isActive",
        balance,
        currency
      FROM accounts 
      ORDER BY code
    `);
    
    console.log(`إجمالي الحسابات: ${accounts.length}`);
    
    // فحص الحسابات الرئيسية
    const mainAccounts = accounts.filter(a => a.level === 1);
    console.log(`الحسابات الرئيسية: ${mainAccounts.length}`);
    
    const expectedMainAccounts = ['1', '2', '3', '4', '5'];
    const missingMainAccounts = [];
    
    expectedMainAccounts.forEach(code => {
      if (!mainAccounts.find(a => a.code === code)) {
        missingMainAccounts.push(code);
        issues.push(`حساب رئيسي مفقود: ${code}`);
      }
    });
    
    if (missingMainAccounts.length === 0) {
      console.log('✅ جميع الحسابات الرئيسية موجودة');
    } else {
      console.log(`❌ حسابات رئيسية مفقودة: ${missingMainAccounts.join(', ')}`);
    }
    
    // فحص التسلسل الهرمي
    const hierarchyIssues = [];
    accounts.forEach(account => {
      if (account.parentId) {
        const parent = accounts.find(a => a.id === account.parentId);
        if (!parent) {
          hierarchyIssues.push(`الحساب ${account.code} له parent مفقود: ${account.parentId}`);
        } else {
          // فحص مستوى التسلسل
          const expectedLevel = parent.level + 1;
          if (account.level !== expectedLevel) {
            hierarchyIssues.push(`الحساب ${account.code} له مستوى خاطئ: ${account.level} (المتوقع: ${expectedLevel})`);
          }
        }
      }
    });
    
    if (hierarchyIssues.length === 0) {
      console.log('✅ التسلسل الهرمي سليم');
    } else {
      console.log(`❌ مشاكل في التسلسل الهرمي: ${hierarchyIssues.length}`);
      hierarchyIssues.forEach(issue => {
        console.log(`   - ${issue}`);
        issues.push(issue);
      });
    }

    // 2. فحص ترقيم حسابات العملاء
    console.log('\n👥 2. فحص ترقيم حسابات العملاء...');
    
    const customerAccounts = accounts.filter(a => 
      a.code.startsWith('AR-') || 
      a.code.startsWith('1.2.1') || 
      a.type === 'receivable'
    );
    
    console.log(`حسابات العملاء الموجودة: ${customerAccounts.length}`);
    
    // فحص العملاء في جدول customers
    const [customers] = await sequelize.query(`
      SELECT 
        id,
        name,
        "accountCode",
        "isActive",
        "createdAt"
      FROM customers 
      ORDER BY "createdAt"
    `);
    
    console.log(`العملاء في جدول customers: ${customers.length}`);
    
    // فحص التوافق بين العملاء وحساباتهم
    const customerAccountIssues = [];
    customers.forEach(customer => {
      if (customer.accountCode) {
        const account = accounts.find(a => a.code === customer.accountCode);
        if (!account) {
          customerAccountIssues.push(`العميل ${customer.name} له حساب مفقود: ${customer.accountCode}`);
        }
      } else {
        customerAccountIssues.push(`العميل ${customer.name} ليس له رمز حساب`);
      }
    });
    
    if (customerAccountIssues.length === 0) {
      console.log('✅ حسابات العملاء متوافقة');
    } else {
      console.log(`❌ مشاكل في حسابات العملاء: ${customerAccountIssues.length}`);
      customerAccountIssues.forEach(issue => {
        console.log(`   - ${issue}`);
        issues.push(issue);
      });
    }

    // 3. فحص الأصول الثابتة
    console.log('\n🏢 3. فحص الأصول الثابتة...');
    
    // فحص جدول fixed_assets
    const [fixedAssetsTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'fixed_assets'
    `);
    
    if (fixedAssetsTable.length === 0) {
      console.log('❌ جدول fixed_assets غير موجود');
      issues.push('جدول fixed_assets غير موجود');
      fixes.push('إنشاء جدول fixed_assets');
    } else {
      console.log('✅ جدول fixed_assets موجود');
      
      // فحص الأصول الثابتة الموجودة
      const [fixedAssets] = await sequelize.query(`
        SELECT 
          id,
          name,
          "assetCode",
          "accountId",
          "purchasePrice",
          "depreciationMethod",
          "usefulLife",
          "isActive"
        FROM fixed_assets
      `);
      
      console.log(`الأصول الثابتة الموجودة: ${fixedAssets.length}`);
      
      // فحص حسابات الأصول الثابتة
      const fixedAssetAccounts = accounts.filter(a => 
        a.code.startsWith('1.1') && 
        (a.name.includes('أصول') || a.name.includes('معدات') || a.name.includes('مباني'))
      );
      
      console.log(`حسابات الأصول الثابتة: ${fixedAssetAccounts.length}`);
      
      if (fixedAssetAccounts.length === 0) {
        issues.push('لا توجد حسابات للأصول الثابتة');
        fixes.push('إنشاء حسابات الأصول الثابتة (1.1.x)');
      }
    }

    // 4. فحص جداول الإهلاك
    console.log('\n📉 4. فحص جداول الإهلاك...');
    
    const [depreciationTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'depreciation_schedules'
    `);
    
    if (depreciationTable.length === 0) {
      console.log('❌ جدول depreciation_schedules غير موجود');
      issues.push('جدول depreciation_schedules غير موجود');
      fixes.push('إنشاء جدول depreciation_schedules');
    } else {
      console.log('✅ جدول depreciation_schedules موجود');
    }

    // 5. فحص Routes والـ APIs
    console.log('\n🔌 5. فحص Routes والـ APIs...');
    
    // فحص ملفات الـ routes
    const routeFiles = [
      'financial.js',
      'sales.js', 
      'auth.js',
      'admin.js',
      'settings.js'
    ];
    
    for (const file of routeFiles) {
      try {
        const fs = await import('fs');
        const path = `./src/routes/${file}`;
        if (fs.existsSync(path)) {
          console.log(`✅ Route file موجود: ${file}`);
        } else {
          console.log(`❌ Route file مفقود: ${file}`);
          issues.push(`Route file مفقود: ${file}`);
        }
      } catch (error) {
        console.log(`⚠️ خطأ في فحص ${file}: ${error.message}`);
      }
    }

    // 6. فحص Models
    console.log('\n📋 6. فحص Models...');
    
    const expectedModels = [
      'Account',
      'Customer', 
      'JournalEntry',
      'JournalLine',
      'FixedAsset',
      'DepreciationSchedule'
    ];
    
    for (const model of expectedModels) {
      try {
        const [modelCheck] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${model.toLowerCase()}s'
        `);
        
        if (modelCheck.length > 0) {
          console.log(`✅ Model جدول موجود: ${model}`);
        } else {
          console.log(`❌ Model جدول مفقود: ${model}`);
          issues.push(`Model جدول مفقود: ${model}`);
        }
      } catch (error) {
        console.log(`⚠️ خطأ في فحص ${model}: ${error.message}`);
      }
    }

    // 7. فحص العرض والواجهة
    console.log('\n🖥️ 7. فحص مشاكل العرض...');
    
    // فحص الصفحات الرئيسية
    const frontendPages = [
      'ChartOfAccounts.tsx',
      'FixedAssetsManagement.tsx',
      'CustomersManagement.tsx',
      'JournalEntries.tsx',
      'FinancialReports.tsx'
    ];
    
    for (const page of frontendPages) {
      try {
        const fs = await import('fs');
        const path = `../client/src/pages/${page}`;
        if (fs.existsSync(path)) {
          console.log(`✅ صفحة موجودة: ${page}`);
        } else {
          console.log(`❌ صفحة مفقودة: ${page}`);
          issues.push(`صفحة مفقودة: ${page}`);
        }
      } catch (error) {
        console.log(`⚠️ خطأ في فحص ${page}: ${error.message}`);
      }
    }

    // 8. تلخيص النتائج
    console.log('\n📊 8. تلخيص النتائج...');
    console.log('='.repeat(60));
    
    console.log(`\n🔍 إجمالي المشاكل المكتشفة: ${issues.length}`);
    if (issues.length > 0) {
      console.log('\n❌ قائمة المشاكل:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log(`\n🔧 إجمالي الإصلاحات المقترحة: ${fixes.length}`);
    if (fixes.length > 0) {
      console.log('\n🛠️ قائمة الإصلاحات:');
      fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    // حساب النسبة المئوية للصحة
    const totalChecks = 50; // تقدير عدد الفحوصات
    const healthPercentage = Math.max(0, ((totalChecks - issues.length) / totalChecks) * 100);
    
    console.log(`\n🎯 نسبة صحة النظام: ${healthPercentage.toFixed(1)}%`);
    
    if (healthPercentage >= 90) {
      console.log('🎉 النظام في حالة ممتازة!');
    } else if (healthPercentage >= 70) {
      console.log('✅ النظام في حالة جيدة مع بعض التحسينات المطلوبة');
    } else if (healthPercentage >= 50) {
      console.log('⚠️ النظام يحتاج إصلاحات متوسطة');
    } else {
      console.log('❌ النظام يحتاج إصلاحات جذرية');
    }

    return {
      issues,
      fixes,
      healthPercentage,
      accounts: accounts.length,
      customers: customers.length,
      customerAccounts: customerAccounts.length
    };

  } catch (error) {
    console.error('❌ خطأ في الفحص الشامل:', error);
    return { issues: [`خطأ عام: ${error.message}`], fixes: [], healthPercentage: 0 };
  } finally {
    await sequelize.close();
  }
}

// تشغيل الفحص الشامل
comprehensiveSystemAudit()
  .then((result) => {
    console.log('\n✅ انتهى الفحص الشامل للنظام');
    console.log(`📊 النتيجة النهائية: ${result.healthPercentage.toFixed(1)}% صحة النظام`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل الفحص الشامل:', error);
    process.exit(1);
  });
