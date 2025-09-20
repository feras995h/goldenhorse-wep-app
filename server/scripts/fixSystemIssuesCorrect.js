#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function fixSystemIssuesCorrect() {
  console.log('🔧 إصلاح مشاكل النظام بالقيم الصحيحة...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  const fixes = [];
  const errors = [];
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إصلاح حسابات الأصول الثابتة تحت الحساب الموجود (1.2)
    console.log('\n🏢 1. إصلاح حسابات الأصول الثابتة...');
    
    try {
      // الحصول على حساب الأصول الثابتة الموجود
      const [fixedAssetsParent] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '1.2' AND name = 'الأصول الثابتة'
      `);
      
      if (fixedAssetsParent.length > 0) {
        const parentId = fixedAssetsParent[0].id;
        console.log('   ✅ تم العثور على حساب الأصول الثابتة الرئيسي (1.2)');
        
        // إنشاء الحسابات الفرعية المطلوبة
        const requiredAccounts = [
          { code: '1.2.1', name: 'المباني والإنشاءات', level: 3, isGroup: false },
          { code: '1.2.2', name: 'المعدات والآلات', level: 3, isGroup: false },
          { code: '1.2.3', name: 'الأثاث والتجهيزات', level: 3, isGroup: false },
          { code: '1.2.4', name: 'وسائل النقل', level: 3, isGroup: false },
          { code: '1.2.5', name: 'مجمع الإهلاك', level: 3, isGroup: true },
          { code: '1.2.5.1', name: 'مجمع إهلاك المباني', level: 4, isGroup: false, parentCode: '1.2.5' },
          { code: '1.2.5.2', name: 'مجمع إهلاك المعدات', level: 4, isGroup: false, parentCode: '1.2.5' },
          { code: '1.2.5.3', name: 'مجمع إهلاك الأثاث', level: 4, isGroup: false, parentCode: '1.2.5' },
          { code: '1.2.5.4', name: 'مجمع إهلاك وسائل النقل', level: 4, isGroup: false, parentCode: '1.2.5' }
        ];
        
        for (const account of requiredAccounts) {
          const [existing] = await sequelize.query(`
            SELECT id FROM accounts WHERE code = '${account.code}'
          `);
          
          if (existing.length === 0) {
            // تحديد الـ parent ID
            let accountParentId = parentId;
            if (account.parentCode) {
              const [parent] = await sequelize.query(`SELECT id FROM accounts WHERE code = '${account.parentCode}'`);
              if (parent.length > 0) {
                accountParentId = parent[0].id;
              }
            }
            
            // تحديد nature حسب نوع الحساب
            const nature = account.name.includes('مجمع') ? 'credit' : 'debit';
            
            await sequelize.query(`
              INSERT INTO accounts (
                id, code, name, type, "rootType", "reportType", 
                "parentId", level, "isGroup", "isActive", 
                balance, currency, "accountType", nature,
                "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), '${account.code}', '${account.name}', 'asset', 'Asset', 'Balance Sheet',
                '${accountParentId}', ${account.level}, ${account.isGroup}, true,
                0, 'LYD', 'sub', '${nature}',
                NOW(), NOW()
              )
            `);
            
            console.log(`   ✅ تم إنشاء حساب ${account.name} (${account.code})`);
            fixes.push(`إنشاء حساب ${account.name}`);
          } else {
            console.log(`   ✅ حساب ${account.name} موجود`);
          }
        }
      } else {
        console.log('   ❌ حساب الأصول الثابتة الرئيسي غير موجود');
        errors.push('حساب الأصول الثابتة الرئيسي غير موجود');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح الأصول الثابتة: ${error.message}`);
      errors.push(`خطأ في إصلاح الأصول الثابتة: ${error.message}`);
    }

    // 2. إصلاح حسابات مصروفات الإهلاك
    console.log('\n📉 2. إصلاح حسابات مصروفات الإهلاك...');
    
    try {
      // التأكد من وجود حساب فرعي للمصروفات
      const [expenseParent] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '2.1' AND type = 'expense'
      `);
      
      if (expenseParent.length > 0) {
        const parentId = expenseParent[0].id;
        
        const depreciationExpenseAccounts = [
          { code: '2.1.5', name: 'مصروف إهلاك المباني', level: 3 },
          { code: '2.1.6', name: 'مصروف إهلاك المعدات', level: 3 },
          { code: '2.1.7', name: 'مصروف إهلاك الأثاث', level: 3 },
          { code: '2.1.8', name: 'مصروف إهلاك وسائل النقل', level: 3 }
        ];
        
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
                gen_random_uuid(), '${account.code}', '${account.name}', 'expense', 'Expense', 'Profit and Loss',
                '${parentId}', ${account.level}, false, true,
                0, 'LYD', 'sub', 'debit',
                NOW(), NOW()
              )
            `);
            
            console.log(`   ✅ تم إنشاء ${account.name} (${account.code})`);
            fixes.push(`إنشاء ${account.name}`);
          } else {
            console.log(`   ✅ حساب ${account.name} موجود`);
          }
        }
      } else {
        console.log('   ❌ حساب المصروفات الفرعي غير موجود');
        errors.push('حساب المصروفات الفرعي غير موجود');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح حسابات الإهلاك: ${error.message}`);
      errors.push(`خطأ في إصلاح حسابات الإهلاك: ${error.message}`);
    }

    // 3. إصلاح حسابات العملاء
    console.log('\n👥 3. إصلاح حسابات العملاء...');
    
    try {
      // إنشاء حساب الذمم المدينة إذا لم يكن موجوداً
      const [arAccount] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '1.3.1' OR name LIKE '%ذمم%مدين%'
      `);
      
      let arAccountId;
      if (arAccount.length === 0) {
        // الحصول على حساب الأصول المتداولة
        const [currentAssetsParent] = await sequelize.query(`
          SELECT id FROM accounts WHERE code = '1.3'
        `);
        
        if (currentAssetsParent.length > 0) {
          const [newArAccount] = await sequelize.query(`
            INSERT INTO accounts (
              id, code, name, type, "rootType", "reportType", 
              "parentId", level, "isGroup", "isActive", 
              balance, currency, "accountType", nature,
              "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), '1.3.1', 'الذمم المدينة', 'asset', 'Asset', 'Balance Sheet',
              '${currentAssetsParent[0].id}', 3, true, true,
              0, 'LYD', 'sub', 'debit',
              NOW(), NOW()
            ) RETURNING id
          `);
          
          arAccountId = newArAccount[0].id;
          console.log('   ✅ تم إنشاء حساب الذمم المدينة (1.3.1)');
          fixes.push('إنشاء حساب الذمم المدينة');
        }
      } else {
        arAccountId = arAccount[0].id;
        console.log('   ✅ حساب الذمم المدينة موجود');
      }
      
      // ربط حسابات العملاء الموجودة
      if (arAccountId) {
        const [customerAccounts] = await sequelize.query(`
          UPDATE accounts 
          SET "parentId" = '${arAccountId}', level = 4
          WHERE code LIKE 'AR-%' AND ("parentId" IS NULL OR "parentId" != '${arAccountId}')
          RETURNING code, name
        `);
        
        if (customerAccounts.length > 0) {
          console.log(`   ✅ تم ربط ${customerAccounts.length} حساب عميل بالحساب الرئيسي`);
          fixes.push(`ربط ${customerAccounts.length} حساب عميل`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح حسابات العملاء: ${error.message}`);
      errors.push(`خطأ في إصلاح حسابات العملاء: ${error.message}`);
    }

    // 4. اختبار إنشاء أصل ثابت
    console.log('\n🧪 4. اختبار إنشاء أصل ثابت...');
    
    try {
      // التحقق من وجود الحسابات المطلوبة
      const [requiredAccounts] = await sequelize.query(`
        SELECT code, name FROM accounts 
        WHERE code IN ('1.2.1', '1.2.5.1', '2.1.5')
        ORDER BY code
      `);
      
      console.log('   الحسابات المطلوبة للأصول الثابتة:');
      requiredAccounts.forEach(acc => {
        console.log(`     ✅ ${acc.code}: ${acc.name}`);
      });
      
      if (requiredAccounts.length >= 3) {
        console.log('   ✅ جميع الحسابات المطلوبة متوفرة لإنشاء الأصول الثابتة');
        fixes.push('تجهيز حسابات الأصول الثابتة');
      } else {
        console.log(`   ⚠️ ينقص ${3 - requiredAccounts.length} حساب لإنشاء الأصول الثابتة`);
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في اختبار الأصول الثابتة: ${error.message}`);
      errors.push(`خطأ في اختبار الأصول الثابتة: ${error.message}`);
    }

    // 5. التحقق النهائي
    console.log('\n✅ 5. التحقق النهائي من النظام...');
    
    try {
      // عدد الحسابات الجديد
      const [accountCount] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`   إجمالي الحسابات: ${accountCount[0].count}`);
      
      // فحص حسابات الأصول الثابتة
      const [fixedAssetAccounts] = await sequelize.query(`
        SELECT COUNT(*) as count FROM accounts 
        WHERE code LIKE '1.2.%' AND code != '1.2'
      `);
      console.log(`   حسابات الأصول الثابتة الفرعية: ${fixedAssetAccounts[0].count}`);
      
      // فحص حسابات مصروفات الإهلاك
      const [depreciationExpenseAccounts] = await sequelize.query(`
        SELECT COUNT(*) as count FROM accounts 
        WHERE name LIKE '%مصروف إهلاك%'
      `);
      console.log(`   حسابات مصروفات الإهلاك: ${depreciationExpenseAccounts[0].count}`);
      
      // فحص حسابات العملاء
      const [customerAccounts] = await sequelize.query(`
        SELECT COUNT(*) as count FROM accounts 
        WHERE code LIKE 'AR-%'
      `);
      console.log(`   حسابات العملاء: ${customerAccounts[0].count}`);
      
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
    
    const successRate = fixes.length > 0 ? ((fixes.length / (fixes.length + errors.length)) * 100) : 0;
    console.log(`\n🎯 معدل نجاح الإصلاحات: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('🎉 تم إصلاح معظم المشاكل بنجاح!');
    } else if (successRate >= 70) {
      console.log('✅ تم إصلاح أغلب المشاكل مع بعض التحديات');
    } else if (fixes.length > 0) {
      console.log('⚠️ تم إصلاح بعض المشاكل، لكن هناك مشاكل أخرى تحتاج مراجعة');
    } else {
      console.log('❌ لم يتم إصلاح أي مشاكل');
    }

    return { fixes, errors, successRate };

  } catch (error) {
    console.error('❌ خطأ عام في الإصلاح:', error);
    return { fixes, errors: [...errors, `خطأ عام: ${error.message}`], successRate: 0 };
  } finally {
    await sequelize.close();
  }
}

// تشغيل إصلاح المشاكل
fixSystemIssuesCorrect()
  .then((result) => {
    console.log('\n✅ انتهى إصلاح مشاكل النظام');
    console.log(`📊 النتيجة النهائية: ${result.successRate.toFixed(1)}% نجاح`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل في إصلاح المشاكل:', error);
    process.exit(1);
  });
