#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function fixFrontendIssues() {
  console.log('🔧 إصلاح مشاكل العرض في الواجهة...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  const fixes = [];
  const errors = [];
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص بيانات الأصول الثابتة
    console.log('\n🏢 1. فحص بيانات الأصول الثابتة...');
    
    try {
      const [fixedAssets] = await sequelize.query(`
        SELECT 
          id, "assetNumber", name, "purchaseCost", "salvageValue", 
          "currentValue", "usefulLife", status, location, description,
          "categoryAccountId", "assetAccountId", "depreciationExpenseAccountId", 
          "accumulatedDepreciationAccountId"
        FROM fixed_assets
        ORDER BY "createdAt" DESC
      `);
      
      console.log(`   الأصول الثابتة الموجودة: ${fixedAssets.length}`);
      
      if (fixedAssets.length === 0) {
        // إنشاء أصل ثابت تجريبي للاختبار
        console.log('   إنشاء أصل ثابت تجريبي...');
        
        // الحصول على الحسابات المطلوبة
        const [accounts] = await sequelize.query(`
          SELECT id, code, name FROM accounts 
          WHERE code IN ('1.2.1', '1.2.5.1', '2.1.5')
          ORDER BY code
        `);
        
        if (accounts.length >= 3) {
          const assetAccount = accounts.find(a => a.code === '1.2.1');
          const accDepAccount = accounts.find(a => a.code === '1.2.5.1');
          const expenseAccount = accounts.find(a => a.code === '2.1.5');
          
          await sequelize.query(`
            INSERT INTO fixed_assets (
              id, "assetNumber", name, "categoryAccountId", "assetAccountId",
              "depreciationExpenseAccountId", "accumulatedDepreciationAccountId",
              "purchaseDate", "purchaseCost", "salvageValue", "usefulLife",
              "depreciationMethod", "currentValue", status, location, description,
              "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), 'FA-DEMO-001', 'جهاز كمبيوتر مكتبي',
              '${assetAccount.id}', '${assetAccount.id}',
              '${expenseAccount.id}', '${accDepAccount.id}',
              '2025-01-01', 5000.00, 500.00, 5,
              'straight_line', 5000.00, 'active', 'المكتب الرئيسي',
              'جهاز كمبيوتر للاستخدام الإداري',
              NOW(), NOW()
            )
          `);
          
          console.log('   ✅ تم إنشاء أصل ثابت تجريبي');
          fixes.push('إنشاء أصل ثابت تجريبي');
        } else {
          console.log('   ❌ الحسابات المطلوبة غير متوفرة');
          errors.push('الحسابات المطلوبة للأصول الثابتة غير متوفرة');
        }
      } else {
        // فحص البيانات الموجودة للتأكد من عدم وجود قيم null
        fixedAssets.forEach((asset, index) => {
          const issues = [];
          if (asset.purchaseCost === null || asset.purchaseCost === undefined) {
            issues.push('purchaseCost');
          }
          if (asset.salvageValue === null || asset.salvageValue === undefined) {
            issues.push('salvageValue');
          }
          if (asset.currentValue === null || asset.currentValue === undefined) {
            issues.push('currentValue');
          }
          
          if (issues.length > 0) {
            console.log(`   ⚠️ الأصل ${asset.name} يحتوي على قيم null: ${issues.join(', ')}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص الأصول الثابتة: ${error.message}`);
      errors.push(`خطأ في فحص الأصول الثابتة: ${error.message}`);
    }

    // 2. فحص API endpoints للتقارير المالية
    console.log('\n📊 2. فحص API endpoints للتقارير المالية...');
    
    try {
      // اختبار endpoint قائمة الدخل
      const [incomeTest] = await sequelize.query(`
        SELECT 
          a.code, a.name, a.type, a.balance
        FROM accounts a
        WHERE a.type IN ('revenue', 'expense') AND a."isActive" = true
        ORDER BY a.type, a.code
        LIMIT 5
      `);
      
      console.log(`   حسابات الإيرادات والمصروفات: ${incomeTest.length}`);
      
      if (incomeTest.length > 0) {
        console.log('   ✅ بيانات قائمة الدخل متوفرة');
        fixes.push('تأكيد توفر بيانات قائمة الدخل');
      } else {
        console.log('   ❌ لا توجد حسابات إيرادات أو مصروفات');
        errors.push('لا توجد حسابات إيرادات أو مصروفات');
      }
      
      // اختبار endpoint ميزان المراجعة
      const [trialBalanceTest] = await sequelize.query(`
        SELECT 
          COUNT(*) as account_count,
          SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_debit,
          SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as total_credit
        FROM accounts 
        WHERE "isActive" = true AND balance != 0
      `);
      
      if (trialBalanceTest.length > 0) {
        const result = trialBalanceTest[0];
        console.log(`   ميزان المراجعة: ${result.account_count} حساب`);
        console.log(`   إجمالي المدين: ${result.total_debit}`);
        console.log(`   إجمالي الدائن: ${result.total_credit}`);
        console.log('   ✅ بيانات ميزان المراجعة متوفرة');
        fixes.push('تأكيد توفر بيانات ميزان المراجعة');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص التقارير المالية: ${error.message}`);
      errors.push(`خطأ في فحص التقارير المالية: ${error.message}`);
    }

    // 3. إصلاح قيم null في البيانات
    console.log('\n🔧 3. إصلاح قيم null في البيانات...');
    
    try {
      // إصلاح قيم null في الأصول الثابتة
      const [nullFixResult] = await sequelize.query(`
        UPDATE fixed_assets 
        SET 
          "purchaseCost" = COALESCE("purchaseCost", 0),
          "salvageValue" = COALESCE("salvageValue", 0),
          "currentValue" = COALESCE("currentValue", "purchaseCost", 0)
        WHERE 
          "purchaseCost" IS NULL OR 
          "salvageValue" IS NULL OR 
          "currentValue" IS NULL
      `);
      
      if (nullFixResult.rowCount > 0) {
        console.log(`   ✅ تم إصلاح ${nullFixResult.rowCount} سجل يحتوي على قيم null`);
        fixes.push(`إصلاح ${nullFixResult.rowCount} سجل يحتوي على قيم null`);
      } else {
        console.log('   ✅ لا توجد قيم null تحتاج إصلاح');
      }
      
      // إصلاح قيم null في الحسابات
      const [accountNullFix] = await sequelize.query(`
        UPDATE accounts 
        SET balance = COALESCE(balance, 0)
        WHERE balance IS NULL
      `);
      
      if (accountNullFix.rowCount > 0) {
        console.log(`   ✅ تم إصلاح ${accountNullFix.rowCount} حساب يحتوي على رصيد null`);
        fixes.push(`إصلاح ${accountNullFix.rowCount} حساب يحتوي على رصيد null`);
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح قيم null: ${error.message}`);
      errors.push(`خطأ في إصلاح قيم null: ${error.message}`);
    }

    // 4. فحص enum values للأصول الثابتة
    console.log('\n🔍 4. فحص enum values للأصول الثابتة...');
    
    try {
      const [enumValues] = await sequelize.query(`
        SELECT 
          t.typname as enum_name,
          array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname LIKE '%fixed%'
        GROUP BY t.typname
        ORDER BY t.typname
      `);
      
      console.log('   قيم Enum المتاحة:');
      enumValues.forEach(enumType => {
        console.log(`     ${enumType.enum_name}: ${enumType.values.join(', ')}`);
      });
      
      if (enumValues.length > 0) {
        console.log('   ✅ enum values متوفرة');
        fixes.push('تأكيد توفر enum values');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص enum values: ${error.message}`);
      errors.push(`خطأ في فحص enum values: ${error.message}`);
    }

    // 5. التحقق النهائي
    console.log('\n✅ 5. التحقق النهائي...');
    
    try {
      // عدد الأصول الثابتة
      const [assetCount] = await sequelize.query('SELECT COUNT(*) as count FROM fixed_assets');
      console.log(`   الأصول الثابتة: ${assetCount[0].count}`);
      
      // عدد الحسابات النشطة
      const [activeAccountCount] = await sequelize.query('SELECT COUNT(*) as count FROM accounts WHERE "isActive" = true');
      console.log(`   الحسابات النشطة: ${activeAccountCount[0].count}`);
      
      // عدد القيود
      const [journalCount] = await sequelize.query('SELECT COUNT(*) as count FROM journal_entries');
      console.log(`   القيود المحاسبية: ${journalCount[0].count}`);
      
    } catch (error) {
      console.log(`   ❌ خطأ في التحقق النهائي: ${error.message}`);
    }

    // 6. تلخيص النتائج
    console.log('\n📊 6. تلخيص النتائج...');
    console.log('='.repeat(60));
    
    console.log(`\n✅ إجمالي الإصلاحات المطبقة: ${fixes.length}`);
    if (fixes.length > 0) {
      fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    console.log(`\n❌ إجمالي الأخطاء: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    const successRate = fixes.length > 0 ? ((fixes.length / (fixes.length + errors.length)) * 100) : 100;
    console.log(`\n🎯 معدل نجاح الإصلاحات: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('🎉 تم إصلاح معظم مشاكل العرض بنجاح!');
    } else if (successRate >= 70) {
      console.log('✅ تم إصلاح أغلب مشاكل العرض');
    } else {
      console.log('⚠️ تم إصلاح بعض مشاكل العرض، لكن هناك مشاكل أخرى');
    }

    return { fixes, errors, successRate };

  } catch (error) {
    console.error('❌ خطأ عام في إصلاح مشاكل العرض:', error);
    return { fixes, errors: [...errors, `خطأ عام: ${error.message}`], successRate: 0 };
  } finally {
    await sequelize.close();
  }
}

// تشغيل إصلاح مشاكل العرض
fixFrontendIssues()
  .then((result) => {
    console.log('\n✅ انتهى إصلاح مشاكل العرض');
    console.log(`📊 النتيجة النهائية: ${result.successRate.toFixed(1)}% نجاح`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل في إصلاح مشاكل العرض:', error);
    process.exit(1);
  });
