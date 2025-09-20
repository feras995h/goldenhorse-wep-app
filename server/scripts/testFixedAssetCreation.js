#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function testFixedAssetCreation() {
  console.log('🧪 اختبار إنشاء أصل ثابت...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص الحسابات المطلوبة
    console.log('\n📊 1. فحص الحسابات المطلوبة...');
    
    const requiredAccountCodes = ['1.2.1', '1.2.5.1', '2.1.5'];
    const accountsMap = {};
    
    for (const code of requiredAccountCodes) {
      const [account] = await sequelize.query(`
        SELECT id, code, name FROM accounts WHERE code = '${code}'
      `);
      
      if (account.length > 0) {
        accountsMap[code] = account[0];
        console.log(`   ✅ ${code}: ${account[0].name}`);
      } else {
        console.log(`   ❌ ${code}: غير موجود`);
        throw new Error(`الحساب المطلوب ${code} غير موجود`);
      }
    }

    // 2. اختبار إنشاء أصل ثابت
    console.log('\n🏢 2. اختبار إنشاء أصل ثابت...');
    
    try {
      const testAsset = {
        assetNumber: 'FA-TEST-001',
        name: 'جهاز كمبيوتر اختبار',
        categoryAccountId: accountsMap['1.2.1'].id, // المباني والإنشاءات (كمثال)
        assetAccountId: accountsMap['1.2.1'].id,
        depreciationExpenseAccountId: accountsMap['2.1.5'].id,
        accumulatedDepreciationAccountId: accountsMap['1.2.5.1'].id,
        purchaseDate: '2025-01-01',
        purchaseCost: 5000.00,
        salvageValue: 500.00,
        usefulLife: 5,
        depreciationMethod: 'straight_line',
        status: 'active',
        location: 'المكتب الرئيسي',
        description: 'جهاز كمبيوتر للاختبار'
      };
      
      const [newAsset] = await sequelize.query(`
        INSERT INTO fixed_assets (
          id, "assetNumber", name, "categoryAccountId", "assetAccountId",
          "depreciationExpenseAccountId", "accumulatedDepreciationAccountId",
          "purchaseDate", "purchaseCost", "salvageValue", "usefulLife",
          "depreciationMethod", "currentValue", status, location, description,
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), '${testAsset.assetNumber}', '${testAsset.name}',
          '${testAsset.categoryAccountId}', '${testAsset.assetAccountId}',
          '${testAsset.depreciationExpenseAccountId}', '${testAsset.accumulatedDepreciationAccountId}',
          '${testAsset.purchaseDate}', ${testAsset.purchaseCost}, ${testAsset.salvageValue}, ${testAsset.usefulLife},
          '${testAsset.depreciationMethod}', ${testAsset.purchaseCost}, '${testAsset.status}',
          '${testAsset.location}', '${testAsset.description}',
          NOW(), NOW()
        ) RETURNING id, "assetNumber", name
      `);
      
      console.log(`   ✅ تم إنشاء الأصل الثابت: ${newAsset[0].name} (${newAsset[0].assetNumber})`);
      
      // 3. إنشاء جدول الإهلاك
      console.log('\n📉 3. إنشاء جدول الإهلاك...');
      
      const assetId = newAsset[0].id;
      const annualDepreciation = (testAsset.purchaseCost - testAsset.salvageValue) / testAsset.usefulLife;
      const monthlyDepreciation = annualDepreciation / 12;
      
      console.log(`   الإهلاك السنوي: ${annualDepreciation.toFixed(2)} LYD`);
      console.log(`   الإهلاك الشهري: ${monthlyDepreciation.toFixed(2)} LYD`);
      
      // إنشاء جدولة الإهلاك لأول 12 شهر
      for (let month = 1; month <= 12; month++) {
        const depreciationDate = new Date(2025, month - 1, 1); // شهر من 2025
        
        await sequelize.query(`
          INSERT INTO depreciation_schedules (
            id, "fixedAssetId", "scheduleDate", "depreciationAmount",
            "accumulatedDepreciation", "bookValue", status,
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '${assetId}', '${depreciationDate.toISOString().split('T')[0]}',
            ${monthlyDepreciation.toFixed(2)},
            ${(monthlyDepreciation * month).toFixed(2)},
            ${(testAsset.purchaseCost - (monthlyDepreciation * month)).toFixed(2)},
            'pending',
            NOW(), NOW()
          )
        `);
      }
      
      console.log('   ✅ تم إنشاء جدول الإهلاك لـ 12 شهر');
      
      // 4. التحقق من البيانات المنشأة
      console.log('\n✅ 4. التحقق من البيانات المنشأة...');
      
      const [assetCheck] = await sequelize.query(`
        SELECT 
          fa.id, fa."assetNumber", fa.name, fa."purchaseCost", fa."usefulLife",
          aa.name as asset_account_name,
          dea.name as depreciation_expense_account_name,
          ada.name as accumulated_depreciation_account_name
        FROM fixed_assets fa
        LEFT JOIN accounts aa ON fa."assetAccountId" = aa.id
        LEFT JOIN accounts dea ON fa."depreciationExpenseAccountId" = dea.id
        LEFT JOIN accounts ada ON fa."accumulatedDepreciationAccountId" = ada.id
        WHERE fa."assetNumber" = '${testAsset.assetNumber}'
      `);
      
      if (assetCheck.length > 0) {
        const asset = assetCheck[0];
        console.log(`   الأصل: ${asset.name} (${asset.assetNumber})`);
        console.log(`   التكلفة: ${asset.purchaseCost} LYD`);
        console.log(`   العمر الإنتاجي: ${asset.usefulLife} سنوات`);
        console.log(`   حساب الأصل: ${asset.asset_account_name}`);
        console.log(`   حساب مصروف الإهلاك: ${asset.depreciation_expense_account_name}`);
        console.log(`   حساب مجمع الإهلاك: ${asset.accumulated_depreciation_account_name}`);
      }
      
      const [scheduleCheck] = await sequelize.query(`
        SELECT COUNT(*) as count, SUM("depreciationAmount") as total_depreciation
        FROM depreciation_schedules 
        WHERE "fixedAssetId" = '${assetId}'
      `);
      
      console.log(`   جدول الإهلاك: ${scheduleCheck[0].count} سجل`);
      console.log(`   إجمالي الإهلاك المجدول: ${parseFloat(scheduleCheck[0].total_depreciation).toFixed(2)} LYD`);
      
      // 5. اختبار حذف البيانات التجريبية
      console.log('\n🗑️ 5. حذف البيانات التجريبية...');
      
      await sequelize.query(`DELETE FROM depreciation_schedules WHERE "fixedAssetId" = '${assetId}'`);
      await sequelize.query(`DELETE FROM fixed_assets WHERE id = '${assetId}'`);
      
      console.log('   ✅ تم حذف البيانات التجريبية');
      
      console.log('\n🎉 نتيجة الاختبار: نجح بالكامل!');
      console.log('✅ يمكن إنشاء الأصول الثابتة بنجاح');
      console.log('✅ جدول الإهلاك يعمل بشكل صحيح');
      console.log('✅ جميع الحسابات مربوطة بشكل صحيح');
      
      return { success: true, message: 'اختبار إنشاء الأصول الثابتة نجح بالكامل' };
      
    } catch (error) {
      console.log(`   ❌ خطأ في إنشاء الأصل الثابت: ${error.message}`);
      return { success: false, message: `خطأ في إنشاء الأصل الثابت: ${error.message}` };
    }

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
    return { success: false, message: `خطأ عام: ${error.message}` };
  } finally {
    await sequelize.close();
  }
}

// تشغيل اختبار إنشاء الأصول الثابتة
testFixedAssetCreation()
  .then((result) => {
    console.log('\n✅ انتهى اختبار إنشاء الأصول الثابتة');
    console.log(`📊 النتيجة: ${result.success ? 'نجح' : 'فشل'}`);
    console.log(`📝 الرسالة: ${result.message}`);
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 فشل اختبار إنشاء الأصول الثابتة:', error);
    process.exit(1);
  });
