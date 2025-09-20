#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function debugFixedAssetCreation() {
  console.log('🔍 تشخيص مشكلة إنشاء الأصول الثابتة...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص جدول fixed_assets
    console.log('\n🏢 1. فحص جدول fixed_assets...');
    
    try {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'fixed_assets' 
        ORDER BY ordinal_position
      `);
      
      console.log('   الأعمدة الموجودة:');
      columns.forEach(col => {
        console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
      });
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول fixed_assets: ${error.message}`);
      return;
    }

    // 2. فحص enum values
    console.log('\n🔍 2. فحص enum values...');
    
    try {
      const [enums] = await sequelize.query(`
        SELECT 
          t.typname as enum_name,
          e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname LIKE '%fixed%' OR t.typname LIKE '%depreciation%' OR t.typname LIKE '%status%'
        ORDER BY t.typname, e.enumsortorder
      `);
      
      const enumGroups = {};
      enums.forEach(e => {
        if (!enumGroups[e.enum_name]) enumGroups[e.enum_name] = [];
        enumGroups[e.enum_name].push(e.enum_value);
      });
      
      console.log('   قيم Enum المتاحة:');
      Object.keys(enumGroups).forEach(enumName => {
        console.log(`     ${enumName}: ${enumGroups[enumName].join(', ')}`);
      });
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص enum values: ${error.message}`);
    }

    // 3. فحص الحسابات المتاحة للأصول الثابتة
    console.log('\n📊 3. فحص حسابات الأصول الثابتة...');
    
    try {
      const [fixedAssetAccounts] = await sequelize.query(`
        SELECT id, code, name, level, "isActive"
        FROM accounts 
        WHERE code LIKE '1.2%' AND "isActive" = true
        ORDER BY code
      `);
      
      console.log(`   الحسابات المتاحة: ${fixedAssetAccounts.length}`);
      fixedAssetAccounts.forEach(acc => {
        console.log(`     ${acc.code}: ${acc.name} (مستوى ${acc.level})`);
      });
      
      if (fixedAssetAccounts.length === 0) {
        console.log('   ❌ لا توجد حسابات أصول ثابتة');
        return;
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص حسابات الأصول الثابتة: ${error.message}`);
      return;
    }

    // 4. محاولة إنشاء أصل ثابت تجريبي
    console.log('\n🧪 4. محاولة إنشاء أصل ثابت تجريبي...');
    
    try {
      // الحصول على أول حساب أصول ثابتة متاح
      const [categoryAccount] = await sequelize.query(`
        SELECT id, code, name FROM accounts 
        WHERE code LIKE '1.2.%' AND level = 3 AND "isActive" = true
        ORDER BY code
        LIMIT 1
      `);
      
      if (categoryAccount.length === 0) {
        console.log('   ❌ لا توجد فئة أصول ثابتة متاحة');
        return;
      }
      
      const category = categoryAccount[0];
      console.log(`   ✅ استخدام فئة: ${category.name} (${category.code})`);
      
      // بيانات الأصل التجريبي
      const testAsset = {
        assetNumber: `TEST-${Date.now()}`,
        name: 'جهاز كمبيوتر تجريبي',
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
          id, "assetNumber", name, "categoryAccountId",
          "purchaseDate", "purchaseCost", "salvageValue", "usefulLife",
          "depreciationMethod", "currentValue", status, location, description,
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 
          '${testAsset.assetNumber}', 
          '${testAsset.name}', 
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
        console.log(`     المعرف: ${result[0].id}`);
        
        // حذف الأصل التجريبي
        await sequelize.query(`DELETE FROM fixed_assets WHERE id = '${result[0].id}'`);
        console.log(`   🗑️ تم حذف الأصل التجريبي`);
        
      } else {
        console.log('   ❌ فشل في إنشاء الأصل الثابت');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في إنشاء الأصل التجريبي: ${error.message}`);
      if (error.original) {
        console.log(`     التفاصيل: ${error.original.message}`);
      }
    }

    // 5. فحص middleware validation
    console.log('\n🔍 5. فحص middleware validation...');
    
    try {
      // محاولة فهم سبب فشل validation
      const requiredFields = [
        'assetNumber', 'name', 'categoryAccountId', 'purchaseDate', 
        'purchaseCost', 'usefulLife', 'depreciationMethod'
      ];
      
      console.log('   الحقول المطلوبة:');
      requiredFields.forEach(field => {
        console.log(`     - ${field}`);
      });
      
      // فحص قيم enum المطلوبة
      const validDepreciationMethods = ['straight_line', 'declining_balance', 'units_of_production'];
      const validStatuses = ['active', 'inactive', 'disposed', 'sold'];
      
      console.log('   قيم depreciationMethod المقبولة:');
      validDepreciationMethods.forEach(method => {
        console.log(`     - ${method}`);
      });
      
      console.log('   قيم status المقبولة:');
      validStatuses.forEach(status => {
        console.log(`     - ${status}`);
      });
      
    } catch (error) {
      console.log(`   ❌ خطأ في فحص validation: ${error.message}`);
    }

    // 6. اختبار API endpoint مباشرة
    console.log('\n🌐 6. اختبار API endpoint...');
    
    try {
      // محاولة محاكاة طلب API
      const sampleRequest = {
        assetNumber: 'API-TEST-001',
        name: 'أصل تجريبي للـ API',
        categoryAccountId: null, // سيتم تعيينه
        purchaseDate: '2025-01-01',
        purchaseCost: 3000,
        salvageValue: 300,
        usefulLife: 5,
        depreciationMethod: 'straight_line',
        status: 'active',
        location: 'المكتب',
        description: 'اختبار API'
      };
      
      // الحصول على categoryAccountId
      const [category] = await sequelize.query(`
        SELECT id FROM accounts 
        WHERE code LIKE '1.2.%' AND level = 3 AND "isActive" = true
        ORDER BY code
        LIMIT 1
      `);
      
      if (category.length > 0) {
        sampleRequest.categoryAccountId = category[0].id;
        console.log('   ✅ تم تحديد categoryAccountId');
        console.log('   📝 بيانات الطلب التجريبي:');
        Object.keys(sampleRequest).forEach(key => {
          console.log(`     ${key}: ${sampleRequest[key]}`);
        });
      } else {
        console.log('   ❌ لا يمكن العثور على categoryAccountId');
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في اختبار API: ${error.message}`);
    }

    console.log('\n✅ انتهى تشخيص مشكلة إنشاء الأصول الثابتة');

  } catch (error) {
    console.error('❌ خطأ عام في التشخيص:', error.message);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التشخيص
debugFixedAssetCreation()
  .then(() => {
    console.log('\n🎯 تم إكمال التشخيص');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل في التشخيص:', error);
    process.exit(1);
  });
