#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function fixFixedAssetAccountLevels() {
  console.log('🔧 إصلاح مستويات حسابات الأصول الثابتة...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  const fixes = [];
  const errors = [];
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص الحسابات الحالية
    console.log('\n📊 1. فحص حسابات الأصول الثابتة...');
    
    const [fixedAssetAccounts] = await sequelize.query(`
      SELECT id, code, name, level, "parentId", "isActive"
      FROM accounts 
      WHERE code LIKE '1.2%' AND "isActive" = true
      ORDER BY code
    `);
    
    console.log(`   الحسابات الموجودة: ${fixedAssetAccounts.length}`);
    fixedAssetAccounts.forEach(acc => {
      console.log(`     ${acc.code}: ${acc.name} (مستوى ${acc.level})`);
    });

    // 2. إصلاح مستويات الحسابات
    console.log('\n🔧 2. إصلاح مستويات الحسابات...');
    
    try {
      // إصلاح الحساب الرئيسي 1.2 (يجب أن يكون مستوى 2)
      const [mainFixedAssetResult] = await sequelize.query(`
        UPDATE accounts 
        SET level = 2
        WHERE code = '1.2' AND level != 2
      `);
      
      if (mainFixedAssetResult.rowCount > 0) {
        console.log('   ✅ تم إصلاح مستوى الحساب الرئيسي 1.2');
        fixes.push('إصلاح مستوى الحساب الرئيسي 1.2');
      }
      
      // إصلاح الحسابات الفرعية (يجب أن تكون مستوى 3)
      const subAccountCodes = ['1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '1.2.6'];
      
      for (const code of subAccountCodes) {
        const [result] = await sequelize.query(`
          UPDATE accounts 
          SET level = 3
          WHERE code = '${code}' AND level != 3
        `);
        
        if (result.rowCount > 0) {
          console.log(`   ✅ تم إصلاح مستوى الحساب ${code}`);
          fixes.push(`إصلاح مستوى الحساب ${code}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إصلاح المستويات: ${error.message}`);
      errors.push(`خطأ في إصلاح المستويات: ${error.message}`);
    }

    // 3. التأكد من ربط الحسابات الفرعية بالحساب الرئيسي
    console.log('\n🔗 3. ربط الحسابات الفرعية بالحساب الرئيسي...');
    
    try {
      // الحصول على معرف الحساب الرئيسي 1.2
      const [mainAccount] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '1.2'
      `);
      
      if (mainAccount.length > 0) {
        const mainAccountId = mainAccount[0].id;
        console.log(`   ✅ معرف الحساب الرئيسي: ${mainAccountId}`);
        
        // ربط الحسابات الفرعية
        const [linkResult] = await sequelize.query(`
          UPDATE accounts 
          SET "parentId" = '${mainAccountId}'
          WHERE code LIKE '1.2.%' AND code != '1.2' AND ("parentId" IS NULL OR "parentId" != '${mainAccountId}')
        `);
        
        if (linkResult.rowCount > 0) {
          console.log(`   ✅ تم ربط ${linkResult.rowCount} حساب فرعي`);
          fixes.push(`ربط ${linkResult.rowCount} حساب فرعي`);
        } else {
          console.log('   ✅ جميع الحسابات الفرعية مربوطة بالفعل');
        }
        
      } else {
        console.log('   ❌ لم يتم العثور على الحساب الرئيسي 1.2');
        errors.push('لم يتم العثور على الحساب الرئيسي 1.2');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في ربط الحسابات: ${error.message}`);
      errors.push(`خطأ في ربط الحسابات: ${error.message}`);
    }

    // 4. إنشاء حسابات إضافية إذا لزم الأمر
    console.log('\n➕ 4. إنشاء حسابات إضافية...');
    
    try {
      // الحصول على معرف الحساب الرئيسي
      const [mainAccount] = await sequelize.query(`
        SELECT id FROM accounts WHERE code = '1.2'
      `);
      
      if (mainAccount.length > 0) {
        const mainAccountId = mainAccount[0].id;
        
        // قائمة الحسابات المطلوبة
        const requiredAccounts = [
          { code: '1.2.7', name: 'وسائل النقل', nameEn: 'Transportation' },
          { code: '1.2.8', name: 'معدات المكتب', nameEn: 'Office Equipment' }
        ];
        
        for (const account of requiredAccounts) {
          // فحص إذا كان الحساب موجود
          const [existing] = await sequelize.query(`
            SELECT id FROM accounts WHERE code = '${account.code}'
          `);
          
          if (existing.length === 0) {
            // إنشاء الحساب
            await sequelize.query(`
              INSERT INTO accounts (
                id, code, name, "nameEn", type, "rootType", "reportType",
                "parentId", level, "isGroup", "isActive", balance, currency,
                "accountType", nature, description, "isSystemAccount",
                "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), '${account.code}', '${account.name}', '${account.nameEn}',
                'asset', 'Asset', 'Balance Sheet', '${mainAccountId}', 3,
                false, true, 0, 'LYD', 'sub', 'debit',
                'فئة أصل ثابت: ${account.name}', true, NOW(), NOW()
              )
            `);
            
            console.log(`   ✅ تم إنشاء الحساب ${account.code}: ${account.name}`);
            fixes.push(`إنشاء الحساب ${account.code}: ${account.name}`);
          }
        }
        
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إنشاء الحسابات الإضافية: ${error.message}`);
      errors.push(`خطأ في إنشاء الحسابات الإضافية: ${error.message}`);
    }

    // 5. التحقق النهائي
    console.log('\n✅ 5. التحقق النهائي...');
    
    try {
      const [finalCheck] = await sequelize.query(`
        SELECT id, code, name, level, "parentId"
        FROM accounts 
        WHERE code LIKE '1.2%' AND "isActive" = true
        ORDER BY code
      `);
      
      console.log(`   إجمالي حسابات الأصول الثابتة: ${finalCheck.length}`);
      
      let level2Count = 0;
      let level3Count = 0;
      
      finalCheck.forEach(acc => {
        if (acc.level === 2) level2Count++;
        if (acc.level === 3) level3Count++;
        console.log(`     ${acc.code}: ${acc.name} (مستوى ${acc.level})`);
      });
      
      console.log(`   الحسابات الرئيسية (مستوى 2): ${level2Count}`);
      console.log(`   الحسابات الفرعية (مستوى 3): ${level3Count}`);
      
      if (level3Count > 0) {
        console.log('   ✅ يوجد حسابات فرعية متاحة لإنشاء الأصول الثابتة');
        fixes.push('تأكيد وجود حسابات فرعية متاحة');
      } else {
        console.log('   ❌ لا توجد حسابات فرعية متاحة');
        errors.push('لا توجد حسابات فرعية متاحة');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في التحقق النهائي: ${error.message}`);
      errors.push(`خطأ في التحقق النهائي: ${error.message}`);
    }

    // 6. اختبار إنشاء أصل ثابت
    console.log('\n🧪 6. اختبار إنشاء أصل ثابت...');
    
    try {
      // الحصول على أول حساب فرعي متاح
      const [categoryAccount] = await sequelize.query(`
        SELECT id, code, name FROM accounts 
        WHERE code LIKE '1.2.%' AND level = 3 AND "isActive" = true
        ORDER BY code
        LIMIT 1
      `);
      
      if (categoryAccount.length > 0) {
        const category = categoryAccount[0];
        console.log(`   ✅ استخدام فئة: ${category.name} (${category.code})`);
        
        // بيانات الأصل التجريبي
        const testAsset = {
          assetNumber: `TEST-${Date.now()}`,
          name: 'جهاز كمبيوتر تجريبي',
          category: 'computers', // استخدام enum value
          categoryAccountId: category.id,
          purchaseDate: '2025-01-01',
          purchaseCost: 5000.00,
          salvageValue: 500.00,
          usefulLife: 5,
          depreciationMethod: 'straight_line',
          currentValue: 5000.00,
          status: 'active',
          location: 'المكتب الرئيسي',
          description: 'جهاز كمبيوتر للاختبار'
        };
        
        // محاولة الإنشاء
        const [result] = await sequelize.query(`
          INSERT INTO fixed_assets (
            id, "assetNumber", name, category, "categoryAccountId",
            "purchaseDate", "purchaseCost", "salvageValue", "usefulLife",
            "depreciationMethod", "currentValue", status, location, description,
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), 
            '${testAsset.assetNumber}', 
            '${testAsset.name}', 
            '${testAsset.category}',
            '${testAsset.categoryAccountId}',
            '${testAsset.purchaseDate}', 
            ${testAsset.purchaseCost}, 
            ${testAsset.salvageValue}, 
            ${testAsset.usefulLife},
            '${testAsset.depreciationMethod}', 
            ${testAsset.currentValue}, 
            '${testAsset.status}', 
            '${testAsset.location}', 
            '${testAsset.description}',
            NOW(), NOW()
          ) RETURNING id, "assetNumber", name
        `);
        
        if (result.length > 0) {
          console.log(`   ✅ تم إنشاء الأصل الثابت بنجاح!`);
          console.log(`     الاسم: ${result[0].name}`);
          console.log(`     رقم الأصل: ${result[0].assetNumber}`);
          fixes.push('نجح اختبار إنشاء الأصل الثابت');
          
          // حذف الأصل التجريبي
          await sequelize.query(`DELETE FROM fixed_assets WHERE id = '${result[0].id}'`);
          console.log(`   🗑️ تم حذف الأصل التجريبي`);
          
        } else {
          console.log('   ❌ فشل في إنشاء الأصل الثابت');
          errors.push('فشل في إنشاء الأصل الثابت');
        }
        
      } else {
        console.log('   ❌ لا توجد فئة أصول ثابتة متاحة');
        errors.push('لا توجد فئة أصول ثابتة متاحة');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في اختبار إنشاء الأصل: ${error.message}`);
      errors.push(`خطأ في اختبار إنشاء الأصل: ${error.message}`);
    }

    // 7. تلخيص النتائج
    console.log('\n📊 7. تلخيص النتائج...');
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
      console.log('🎉 تم إصلاح مشكلة إنشاء الأصول الثابتة بنجاح!');
    } else if (successRate >= 70) {
      console.log('✅ تم إصلاح معظم مشاكل الأصول الثابتة');
    } else {
      console.log('⚠️ تم إصلاح بعض المشاكل، لكن هناك مشاكل أخرى');
    }

    return { fixes, errors, successRate };

  } catch (error) {
    console.error('❌ خطأ عام في إصلاح مستويات الحسابات:', error);
    return { fixes, errors: [...errors, `خطأ عام: ${error.message}`], successRate: 0 };
  } finally {
    await sequelize.close();
  }
}

// تشغيل إصلاح مستويات الحسابات
fixFixedAssetAccountLevels()
  .then((result) => {
    console.log('\n✅ انتهى إصلاح مستويات حسابات الأصول الثابتة');
    console.log(`📊 النتيجة النهائية: ${result.successRate.toFixed(1)}% نجاح`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل في إصلاح مستويات الحسابات:', error);
    process.exit(1);
  });
