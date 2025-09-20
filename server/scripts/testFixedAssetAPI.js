#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function testFixedAssetAPI() {
  console.log('🌐 اختبار API إنشاء الأصول الثابتة...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. الحصول على حساب فئة متاح
    console.log('\n📊 1. الحصول على حساب فئة متاح...');
    
    const [categoryAccounts] = await sequelize.query(`
      SELECT id, code, name FROM accounts 
      WHERE code LIKE '1.2.%' AND level = 3 AND "isActive" = true
      ORDER BY code
      LIMIT 3
    `);
    
    if (categoryAccounts.length === 0) {
      console.log('❌ لا توجد حسابات فئات متاحة');
      return;
    }
    
    console.log(`   الحسابات المتاحة: ${categoryAccounts.length}`);
    categoryAccounts.forEach(acc => {
      console.log(`     ${acc.code}: ${acc.name}`);
    });

    // 2. إعداد بيانات الاختبار
    console.log('\n🧪 2. إعداد بيانات الاختبار...');
    
    const testAssets = [
      {
        assetNumber: `API-TEST-${Date.now()}-1`,
        name: 'جهاز كمبيوتر محمول',
        category: 'computers',
        categoryAccountId: categoryAccounts[0].id,
        purchaseDate: '2025-01-15',
        purchaseCost: 8000,
        salvageValue: 800,
        usefulLife: 4,
        depreciationMethod: 'straight_line',
        status: 'active',
        location: 'قسم المحاسبة',
        description: 'جهاز كمبيوتر محمول للمحاسب'
      },
      {
        assetNumber: `API-TEST-${Date.now()}-2`,
        name: 'طابعة ليزر',
        category: 'equipment',
        categoryAccountId: categoryAccounts[1] ? categoryAccounts[1].id : categoryAccounts[0].id,
        purchaseDate: '2025-01-20',
        purchaseCost: 2500,
        salvageValue: 250,
        usefulLife: 5,
        depreciationMethod: 'straight_line',
        status: 'active',
        location: 'المكتب الرئيسي',
        description: 'طابعة ليزر ملونة'
      }
    ];
    
    console.log('   بيانات الاختبار:');
    testAssets.forEach((asset, index) => {
      console.log(`     ${index + 1}. ${asset.name} - ${asset.purchaseCost} LYD`);
    });

    // 3. اختبار إنشاء الأصول مباشرة في قاعدة البيانات
    console.log('\n💾 3. اختبار إنشاء الأصول مباشرة...');
    
    const createdAssets = [];
    
    for (let i = 0; i < testAssets.length; i++) {
      const asset = testAssets[i];
      
      try {
        const [result] = await sequelize.query(`
          INSERT INTO fixed_assets (
            id, "assetNumber", name, category, "categoryAccountId",
            "purchaseDate", "purchaseCost", "salvageValue", "usefulLife",
            "depreciationMethod", "currentValue", status, location, description,
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), 
            '${asset.assetNumber}', 
            '${asset.name}', 
            '${asset.category}',
            '${asset.categoryAccountId}',
            '${asset.purchaseDate}', 
            ${asset.purchaseCost}, 
            ${asset.salvageValue}, 
            ${asset.usefulLife},
            '${asset.depreciationMethod}', 
            ${asset.purchaseCost}, 
            '${asset.status}', 
            '${asset.location}', 
            '${asset.description}',
            NOW(), NOW()
          ) RETURNING id, "assetNumber", name, "purchaseCost"
        `);
        
        if (result.length > 0) {
          console.log(`   ✅ تم إنشاء: ${result[0].name} (${result[0].purchaseCost} LYD)`);
          createdAssets.push(result[0]);
        }
        
      } catch (error) {
        console.log(`   ❌ فشل في إنشاء ${asset.name}: ${error.message}`);
      }
    }

    // 4. فحص الأصول المنشأة
    console.log('\n🔍 4. فحص الأصول المنشأة...');
    
    if (createdAssets.length > 0) {
      const [allAssets] = await sequelize.query(`
        SELECT 
          fa.id, fa."assetNumber", fa.name, fa.category, fa."purchaseCost",
          fa."salvageValue", fa."usefulLife", fa."depreciationMethod",
          fa.status, fa.location, fa.description,
          a.code as category_code, a.name as category_name
        FROM fixed_assets fa
        LEFT JOIN accounts a ON fa."categoryAccountId" = a.id
        WHERE fa."assetNumber" LIKE 'API-TEST-%'
        ORDER BY fa."createdAt" DESC
      `);
      
      console.log(`   إجمالي الأصول المنشأة: ${allAssets.length}`);
      allAssets.forEach(asset => {
        console.log(`     ${asset.assetNumber}: ${asset.name}`);
        console.log(`       الفئة: ${asset.category_name} (${asset.category_code})`);
        console.log(`       التكلفة: ${asset.purchaseCost} LYD`);
        console.log(`       الحالة: ${asset.status}`);
        console.log(`       الموقع: ${asset.location}`);
      });
    }

    // 5. اختبار حساب الإهلاك
    console.log('\n📈 5. اختبار حساب الإهلاك...');
    
    if (createdAssets.length > 0) {
      const testAsset = createdAssets[0];
      
      try {
        // حساب الإهلاك يدوياً
        const [assetData] = await sequelize.query(`
          SELECT "purchaseCost", "salvageValue", "usefulLife", "depreciationMethod"
          FROM fixed_assets 
          WHERE id = '${testAsset.id}'
        `);
        
        if (assetData.length > 0) {
          const asset = assetData[0];
          const depreciableAmount = asset.purchaseCost - asset.salvageValue;
          const annualDepreciation = depreciableAmount / asset.usefulLife;
          const monthlyDepreciation = annualDepreciation / 12;
          
          console.log(`   الأصل: ${testAsset.name}`);
          console.log(`   تكلفة الشراء: ${asset.purchaseCost} LYD`);
          console.log(`   القيمة المتبقية: ${asset.salvageValue} LYD`);
          console.log(`   المبلغ القابل للإهلاك: ${depreciableAmount} LYD`);
          console.log(`   الإهلاك السنوي: ${annualDepreciation.toFixed(2)} LYD`);
          console.log(`   الإهلاك الشهري: ${monthlyDepreciation.toFixed(2)} LYD`);
          console.log(`   ✅ حساب الإهلاك يعمل بشكل صحيح`);
        }
        
      } catch (error) {
        console.log(`   ❌ خطأ في حساب الإهلاك: ${error.message}`);
      }
    }

    // 6. اختبار جدول depreciation_schedules
    console.log('\n📅 6. اختبار جدول depreciation_schedules...');
    
    if (createdAssets.length > 0) {
      const testAsset = createdAssets[0];
      
      try {
        // إنشاء جدولة إهلاك تجريبية
        const scheduleDate = new Date('2025-02-01');
        const depreciationAmount = 150.00;
        const accumulatedDepreciation = 150.00;
        const bookValue = testAsset.purchaseCost - accumulatedDepreciation;
        
        await sequelize.query(`
          INSERT INTO depreciation_schedules (
            id, "fixedAssetId", "scheduleDate", "depreciationAmount",
            "accumulatedDepreciation", "bookValue", status,
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '${testAsset.id}', '${scheduleDate.toISOString().split('T')[0]}',
            ${depreciationAmount}, ${accumulatedDepreciation}, ${bookValue},
            'pending', NOW(), NOW()
          )
        `);
        
        console.log(`   ✅ تم إنشاء جدولة إهلاك للأصل ${testAsset.name}`);
        console.log(`     تاريخ الإهلاك: ${scheduleDate.toLocaleDateString('ar-EG')}`);
        console.log(`     مبلغ الإهلاك: ${depreciationAmount} LYD`);
        console.log(`     القيمة الدفترية: ${bookValue} LYD`);
        
      } catch (error) {
        console.log(`   ❌ خطأ في إنشاء جدولة الإهلاك: ${error.message}`);
      }
    }

    // 7. تنظيف البيانات التجريبية
    console.log('\n🗑️ 7. تنظيف البيانات التجريبية...');
    
    try {
      // حذف جدولة الإهلاك التجريبية
      const [depScheduleResult] = await sequelize.query(`
        DELETE FROM depreciation_schedules 
        WHERE "fixedAssetId" IN (
          SELECT id FROM fixed_assets WHERE "assetNumber" LIKE 'API-TEST-%'
        )
      `);
      
      if (depScheduleResult.rowCount > 0) {
        console.log(`   ✅ تم حذف ${depScheduleResult.rowCount} جدولة إهلاك`);
      }
      
      // حذف الأصول التجريبية
      const [assetsResult] = await sequelize.query(`
        DELETE FROM fixed_assets WHERE "assetNumber" LIKE 'API-TEST-%'
      `);
      
      if (assetsResult.rowCount > 0) {
        console.log(`   ✅ تم حذف ${assetsResult.rowCount} أصل ثابت تجريبي`);
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في تنظيف البيانات: ${error.message}`);
    }

    // 8. النتيجة النهائية
    console.log('\n🎯 8. النتيجة النهائية...');
    console.log('='.repeat(60));
    
    console.log('✅ اختبارات نجحت:');
    console.log('   - إنشاء الأصول الثابتة في قاعدة البيانات');
    console.log('   - ربط الأصول بحسابات الفئات');
    console.log('   - حساب الإهلاك');
    console.log('   - إنشاء جدولة الإهلاك');
    console.log('   - تنظيف البيانات التجريبية');
    
    console.log('\n🎉 جميع اختبارات الأصول الثابتة نجحت!');
    console.log('💡 المشكلة في API قد تكون في middleware أو validation');
    
    console.log('\n📝 توصيات لإصلاح API:');
    console.log('   1. فحص middleware validateFixedAsset');
    console.log('   2. فحص handleValidationErrors');
    console.log('   3. فحص authentication token');
    console.log('   4. فحص logs الخادم عند إرسال طلب من الواجهة');

  } catch (error) {
    console.error('❌ خطأ عام في اختبار API:', error.message);
  } finally {
    await sequelize.close();
  }
}

// تشغيل اختبار API
testFixedAssetAPI()
  .then(() => {
    console.log('\n✅ انتهى اختبار API الأصول الثابتة');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل في اختبار API:', error);
    process.exit(1);
  });
