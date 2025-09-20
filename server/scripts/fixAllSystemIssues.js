#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function fixAllSystemIssues() {
  console.log('🔧 إصلاح جميع مشاكل النظام...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  const fixes = [];
  const errors = [];
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إصلاح مستويات الحسابات في شجرة الحسابات
    console.log('\n📊 1. إصلاح مستويات شجرة الحسابات...');
    
    try {
      // إصلاح الحسابات ذات المستويات الخاطئة
      const accountLevelFixes = [
        { code: '1.1.2.1', correctLevel: 4 },
        { code: '5.1.9', correctLevel: 3 },
        { code: '5.2.1', correctLevel: 3 },
        { code: '5.2.2', correctLevel: 3 },
        { code: '5.2.3', correctLevel: 3 },
        { code: '5.2.4', correctLevel: 3 },
        { code: '5.2.5', correctLevel: 3 },
        { code: 'AR-C175810139', correctLevel: 4 },
        { code: 'AR-CUST-17581', correctLevel: 4 }
      ];
      
      for (const fix of accountLevelFixes) {
        const [result] = await sequelize.query(`
          UPDATE accounts 
          SET level = ${fix.correctLevel}
          WHERE code = '${fix.code}'
        `);
        
        if (result.rowCount > 0) {
          console.log(`   ✅ تم إصلاح مستوى الحساب ${fix.code} إلى ${fix.correctLevel}`);
          fixes.push(`إصلاح مستوى الحساب ${fix.code}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح مستويات الحسابات: ${error.message}`);
      errors.push(`خطأ في إصلاح مستويات الحسابات: ${error.message}`);
    }

    // 2. إصلاح ترقيم حسابات العملاء
    console.log('\n👥 2. إصلاح ترقيم حسابات العملاء...');
    
    try {
      // التأكد من وجود حساب رئيسي للذمم المدينة
      const [arMainAccount] = await sequelize.query(`
        SELECT id, code FROM accounts 
        WHERE code = '1.2.1' AND name LIKE '%ذمم%'
      `);
      
      let arMainAccountId;
      if (arMainAccount.length === 0) {
        // إنشاء حساب الذمم المدينة الرئيسي
        const [newAccount] = await sequelize.query(`
          INSERT INTO accounts (
            id, code, name, type, "rootType", "reportType", 
            "parentId", level, "isGroup", "isActive", 
            balance, currency, "accountType", nature,
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '1.2.1', 'الذمم المدينة', 'asset', 'asset', 'balance_sheet',
            (SELECT id FROM accounts WHERE code = '1.2'), 3, true, true,
            0, 'LYD', 'asset', 'debit',
            NOW(), NOW()
          ) RETURNING id
        `);
        arMainAccountId = newAccount[0].id;
        console.log('   ✅ تم إنشاء حساب الذمم المدينة الرئيسي (1.2.1)');
        fixes.push('إنشاء حساب الذمم المدينة الرئيسي');
      } else {
        arMainAccountId = arMainAccount[0].id;
        console.log('   ✅ حساب الذمم المدينة الرئيسي موجود');
      }
      
      // إصلاح حسابات العملاء الموجودة
      const [customerAccounts] = await sequelize.query(`
        SELECT a.id, a.code, a.name, a."parentId"
        FROM accounts a
        WHERE a.code LIKE 'AR-%' OR a.code LIKE '1.2.1.%'
      `);
      
      for (const account of customerAccounts) {
        if (!account.parentId || account.parentId !== arMainAccountId) {
          await sequelize.query(`
            UPDATE accounts 
            SET "parentId" = '${arMainAccountId}', level = 4
            WHERE id = '${account.id}'
          `);
          console.log(`   ✅ تم ربط حساب العميل ${account.code} بالحساب الرئيسي`);
          fixes.push(`ربط حساب العميل ${account.code}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح حسابات العملاء: ${error.message}`);
      errors.push(`خطأ في إصلاح حسابات العملاء: ${error.message}`);
    }

    // 3. إصلاح مشكلة إنشاء الأصول الثابتة
    console.log('\n🏢 3. إصلاح مشكلة الأصول الثابتة...');
    
    try {
      // التأكد من وجود حسابات الأصول الثابتة المطلوبة
      const requiredFixedAssetAccounts = [
        { code: '1.1.1', name: 'الأصول الثابتة', level: 3, isGroup: true },
        { code: '1.1.1.1', name: 'المباني والإنشاءات', level: 4, isGroup: false },
        { code: '1.1.1.2', name: 'المعدات والآلات', level: 4, isGroup: false },
        { code: '1.1.1.3', name: 'الأثاث والتجهيزات', level: 4, isGroup: false },
        { code: '1.1.1.4', name: 'وسائل النقل', level: 4, isGroup: false },
        { code: '1.1.2', name: 'مجمع الإهلاك', level: 3, isGroup: true },
        { code: '1.1.2.1', name: 'مجمع إهلاك المباني', level: 4, isGroup: false },
        { code: '1.1.2.2', name: 'مجمع إهلاك المعدات', level: 4, isGroup: false },
        { code: '1.1.2.3', name: 'مجمع إهلاك الأثاث', level: 4, isGroup: false },
        { code: '1.1.2.4', name: 'مجمع إهلاك وسائل النقل', level: 4, isGroup: false }
      ];
      
      // الحصول على الحساب الرئيسي للأصول الثابتة
      const [fixedAssetsParent] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '1.1'
      `);
      
      if (fixedAssetsParent.length === 0) {
        console.log('   ❌ الحساب الرئيسي للأصول الثابتة (1.1) غير موجود');
        errors.push('الحساب الرئيسي للأصول الثابتة غير موجود');
      } else {
        const parentId = fixedAssetsParent[0].id;
        
        for (const account of requiredFixedAssetAccounts) {
          const [existing] = await sequelize.query(`
            SELECT id FROM accounts WHERE code = '${account.code}'
          `);
          
          if (existing.length === 0) {
            // تحديد الـ parent ID
            let accountParentId = parentId;
            if (account.level === 4) {
              if (account.code.startsWith('1.1.1.')) {
                const [parent] = await sequelize.query(`SELECT id FROM accounts WHERE code = '1.1.1'`);
                accountParentId = parent.length > 0 ? parent[0].id : parentId;
              } else if (account.code.startsWith('1.1.2.')) {
                const [parent] = await sequelize.query(`SELECT id FROM accounts WHERE code = '1.1.2'`);
                accountParentId = parent.length > 0 ? parent[0].id : parentId;
              }
            }
            
            await sequelize.query(`
              INSERT INTO accounts (
                id, code, name, type, "rootType", "reportType", 
                "parentId", level, "isGroup", "isActive", 
                balance, currency, "accountType", nature,
                "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), '${account.code}', '${account.name}', 'asset', 'asset', 'balance_sheet',
                '${accountParentId}', ${account.level}, ${account.isGroup}, true,
                0, 'LYD', 'asset', '${account.code.includes('مجمع') ? 'credit' : 'debit'}',
                NOW(), NOW()
              )
            `);
            
            console.log(`   ✅ تم إنشاء حساب ${account.name} (${account.code})`);
            fixes.push(`إنشاء حساب ${account.name}`);
          } else {
            console.log(`   ✅ حساب ${account.name} موجود`);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح الأصول الثابتة: ${error.message}`);
      errors.push(`خطأ في إصلاح الأصول الثابتة: ${error.message}`);
    }

    // 4. إصلاح حسابات المصروفات المطلوبة للإهلاك
    console.log('\n📉 4. إصلاح حسابات مصروفات الإهلاك...');
    
    try {
      const depreciationExpenseAccounts = [
        { code: '2.2.1', name: 'مصروف إهلاك المباني', level: 3 },
        { code: '2.2.2', name: 'مصروف إهلاك المعدات', level: 3 },
        { code: '2.2.3', name: 'مصروف إهلاك الأثاث', level: 3 },
        { code: '2.2.4', name: 'مصروف إهلاك وسائل النقل', level: 3 }
      ];
      
      // التأكد من وجود الحساب الرئيسي للمصروفات
      const [expenseParent] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '2.2' OR (code = '2' AND "isGroup" = true)
      `);
      
      if (expenseParent.length > 0) {
        const parentId = expenseParent[0].id;
        
        for (const account of depreciationExpenseAccounts) {
          const [existing] = await sequelize.query(`
            SELECT id FROM accounts WHERE code = '${account.code}'
          `);
          
          if (existing.length === 0) {
            await sequelize.query(`
              INSERT INTO accounts (
                id, code, name, type, "rootType", "reportType", 
                "parentId", level, "isGroup", "isActive", 
                balance, currency, "accountType", nature,
                "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), '${account.code}', '${account.name}', 'expense', 'expense', 'income_statement',
                '${parentId}', ${account.level}, false, true,
                0, 'LYD', 'expense', 'debit',
                NOW(), NOW()
              )
            `);
            
            console.log(`   ✅ تم إنشاء ${account.name} (${account.code})`);
            fixes.push(`إنشاء ${account.name}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح حسابات الإهلاك: ${error.message}`);
      errors.push(`خطأ في إصلاح حسابات الإهلاك: ${error.message}`);
    }

    // 5. التحقق من صحة البيانات بعد الإصلاح
    console.log('\n✅ 5. التحقق من صحة البيانات بعد الإصلاح...');
    
    try {
      // عدد الحسابات الجديد
      const [accountCount] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`   إجمالي الحسابات: ${accountCount[0].count}`);
      
      // فحص التسلسل الهرمي
      const [hierarchyCheck] = await sequelize.query(`
        SELECT COUNT(*) as issues FROM accounts a
        LEFT JOIN accounts p ON a."parentId" = p.id
        WHERE a."parentId" IS NOT NULL AND p.id IS NULL
      `);
      console.log(`   مشاكل التسلسل الهرمي: ${hierarchyCheck[0].issues}`);
      
      // فحص حسابات العملاء
      const [customerAccountsCheck] = await sequelize.query(`
        SELECT COUNT(*) as count FROM accounts 
        WHERE code LIKE 'AR-%' OR code LIKE '1.2.1.%'
      `);
      console.log(`   حسابات العملاء: ${customerAccountsCheck[0].count}`);
      
      // فحص حسابات الأصول الثابتة
      const [fixedAssetAccountsCheck] = await sequelize.query(`
        SELECT COUNT(*) as count FROM accounts 
        WHERE code LIKE '1.1.1.%' OR code LIKE '1.1.2.%'
      `);
      console.log(`   حسابات الأصول الثابتة: ${fixedAssetAccountsCheck[0].count}`);
      
    } catch (error) {
      console.log(`   ❌ خطأ في التحقق: ${error.message}`);
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
    
    const successRate = fixes.length > 0 ? ((fixes.length / (fixes.length + errors.length)) * 100) : 0;
    console.log(`\n🎯 معدل نجاح الإصلاحات: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('🎉 تم إصلاح معظم المشاكل بنجاح!');
    } else if (successRate >= 70) {
      console.log('✅ تم إصلاح أغلب المشاكل مع بعض التحديات');
    } else {
      console.log('⚠️ تم إصلاح بعض المشاكل، لكن هناك مشاكل أخرى تحتاج مراجعة');
    }

    return { fixes, errors, successRate };

  } catch (error) {
    console.error('❌ خطأ عام في الإصلاح:', error);
    return { fixes, errors: [...errors, `خطأ عام: ${error.message}`], successRate: 0 };
  } finally {
    await sequelize.close();
  }
}

// تشغيل إصلاح جميع المشاكل
fixAllSystemIssues()
  .then((result) => {
    console.log('\n✅ انتهى إصلاح جميع مشاكل النظام');
    console.log(`📊 النتيجة النهائية: ${result.successRate.toFixed(1)}% نجاح`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل في إصلاح المشاكل:', error);
    process.exit(1);
  });
