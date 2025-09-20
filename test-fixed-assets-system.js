import models, { sequelize } from './server/src/models/index.js';
import { generateHierarchicalAssetNumber, createFixedAssetAccounts, formatCurrency } from './server/src/utils/fixedAssetHelpers.js';

const { Account, FixedAsset } = models;

/**
 * Test script for the new Fixed Assets automatic numbering and account creation system
 */

async function testFixedAssetsSystem() {
  try {
    console.log('🧪 اختبار نظام الأصول الثابتة الجديد...\n');

    // 1. Test database connection
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح');

    // 2. Check if required tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 الجداول الموجودة: ${tables.length}`);
    
    if (!tables.includes('accounts')) {
      console.log('❌ جدول الحسابات غير موجود');
      return;
    }
    
    if (!tables.includes('fixed_assets')) {
      console.log('❌ جدول الأصول الثابتة غير موجود');
      return;
    }

    // 3. Check for main accounts structure
    const mainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });
    
    console.log('\n📋 الحسابات الرئيسية:');
    mainAccounts.forEach(account => {
      console.log(`  ${account.code} - ${account.name} (${account.type})`);
    });

    // 4. Look for Fixed Assets categories
    const fixedAssetCategories = await Account.findAll({
      where: {
        type: 'asset',
        isActive: true,
        isGroup: false
      },
      order: [['code', 'ASC']]
    });

    console.log('\n🏢 فئات الأصول الثابتة المتاحة:');
    if (fixedAssetCategories.length === 0) {
      console.log('  ⚠️  لا توجد فئات أصول ثابتة. سيتم إنشاء فئة تجريبية...');
      
      // Create a test fixed asset category
      const testCategory = await Account.create({
        code: '1.2.1',
        name: 'السيارات',
        nameEn: 'Vehicles',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        level: 3,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: 'فئة تجريبية للسيارات'
      });
      
      console.log(`  ✅ تم إنشاء فئة تجريبية: ${testCategory.code} - ${testCategory.name}`);
      fixedAssetCategories.push(testCategory);
    } else {
      fixedAssetCategories.forEach(category => {
        console.log(`  ${category.code} - ${category.name}`);
      });
    }

    // 5. Test hierarchical asset number generation
    console.log('\n🔢 اختبار توليد الأرقام الهرمية:');
    const testCategory = fixedAssetCategories[0];
    
    for (let i = 1; i <= 3; i++) {
      const assetNumber = await generateHierarchicalAssetNumber(testCategory.id);
      console.log(`  الأصل ${i}: ${assetNumber}`);
    }

    // 6. Test creating a complete fixed asset with accounts
    console.log('\n🏗️  اختبار إنشاء أصل ثابت كامل مع الحسابات...');
    
    const transaction = await sequelize.transaction();
    
    try {
      // Create test fixed asset
      const testAsset = await FixedAsset.create({
        assetNumber: await generateHierarchicalAssetNumber(testCategory.id),
        name: 'هونداي النترا 2023',
        nameEn: 'Hyundai Elantra 2023',
        categoryAccountId: testCategory.id,
        purchaseDate: '2023-01-15',
        purchaseCost: 45000,
        salvageValue: 5000,
        usefulLife: 5,
        depreciationMethod: 'straight_line',
        currentValue: 45000,
        status: 'active',
        location: 'المكتب الرئيسي',
        currency: 'LYD',
        description: 'سيارة للاختبار'
      }, { transaction });

      console.log(`  ✅ تم إنشاء الأصل: ${testAsset.assetNumber} - ${testAsset.name}`);

      // Create related accounts
      const createdAccounts = await createFixedAssetAccounts(testAsset, testCategory, transaction);

      console.log('\n📊 الحسابات المُنشأة:');
      if (createdAccounts.assetAccount) {
        console.log(`  • حساب الأصل: ${createdAccounts.assetAccount.code} - ${createdAccounts.assetAccount.name}`);
      }
      if (createdAccounts.depreciationExpenseAccount) {
        console.log(`  • حساب مصروف الإهلاك: ${createdAccounts.depreciationExpenseAccount.code} - ${createdAccounts.depreciationExpenseAccount.name}`);
      }
      if (createdAccounts.accumulatedDepreciationAccount) {
        console.log(`  • حساب مخصص الإهلاك: ${createdAccounts.accumulatedDepreciationAccount.code} - ${createdAccounts.accumulatedDepreciationAccount.name}`);
      }

      // Update asset with account references
      await testAsset.update({
        assetAccountId: createdAccounts.assetAccount?.id,
        depreciationExpenseAccountId: createdAccounts.depreciationExpenseAccount?.id,
        accumulatedDepreciationAccountId: createdAccounts.accumulatedDepreciationAccount?.id
      }, { transaction });

      await transaction.commit();
      console.log('\n✅ تم إنشاء الأصل والحسابات بنجاح!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ خطأ في إنشاء الأصل:', error.message);
    }

    // 7. Test currency formatting
    console.log('\n💰 اختبار تنسيق العملة:');
    const testAmounts = [1000, 1500.50, 2000.00, 999.99];
    testAmounts.forEach(amount => {
      console.log(`  ${amount} -> ${formatCurrency(amount)}`);
    });

    // 8. Show final statistics
    console.log('\n📈 الإحصائيات النهائية:');
    const totalAccounts = await Account.count();
    const totalAssets = await FixedAsset.count();
    
    console.log(`  إجمالي الحسابات: ${totalAccounts}`);
    console.log(`  إجمالي الأصول الثابتة: ${totalAssets}`);

    console.log('\n🎉 اكتمل الاختبار بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testFixedAssetsSystem().catch(console.error);
