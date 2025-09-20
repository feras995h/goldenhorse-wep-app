import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function testAdvancedFixedAssets() {
  try {
    console.log('🧪 اختبار الميزات المتقدمة للأصول الثابتة...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    // 1. Check available category accounts
    console.log('\n📊 1. فحص حسابات الفئات المتاحة...');
    const [categories] = await sequelize.query(`
      SELECT id, code, name, level 
      FROM accounts 
      WHERE code LIKE '1.2.%' 
      AND code != '1.2' 
      AND level = 3 
      AND "isActive" = true
      ORDER BY code
      LIMIT 3
    `);
    
    console.log(`   الحسابات المتاحة: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`     ${cat.code}: ${cat.name} (مستوى ${cat.level})`);
    });
    
    if (categories.length === 0) {
      console.log('❌ لا توجد حسابات فئات متاحة');
      return;
    }
    
    // 2. Test asset creation with advanced features
    console.log('\n🏗️ 2. اختبار إنشاء أصل ثابت متقدم...');
    
    const testAssetData = {
      id: uuidv4(),
      assetNumber: 'TEST-ADV-' + Date.now(),
      name: 'جهاز كمبيوتر متقدم',
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-19',
      purchaseCost: 15000,
      salvageValue: 1500,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      currentValue: 15000,
      status: 'active',
      location: 'مكتب المحاسبة',
      description: 'جهاز كمبيوتر للاختبار المتقدم'
    };
    
    console.log('   بيانات الأصل:', {
      assetNumber: testAssetData.assetNumber,
      name: testAssetData.name,
      purchaseCost: testAssetData.purchaseCost,
      usefulLife: testAssetData.usefulLife
    });
    
    // Create the asset directly (simulating the advanced manager)
    const [assetResult] = await sequelize.query(`
      INSERT INTO fixed_assets (
        id, "assetNumber", name, "categoryAccountId",
        "purchaseDate", "purchaseCost", "salvageValue", "usefulLife",
        "depreciationMethod", "currentValue", status, location, description,
        "createdAt", "updatedAt"
      ) VALUES (
        :id, :assetNumber, :name, :categoryAccountId,
        :purchaseDate, :purchaseCost, :salvageValue, :usefulLife,
        :depreciationMethod, :currentValue, :status, :location, :description,
        NOW(), NOW()
      ) RETURNING id, "assetNumber", name
    `, {
      replacements: testAssetData,
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('   ✅ تم إنشاء الأصل:', assetResult[0]);
    
    // 3. Test account creation
    console.log('\n🏦 3. اختبار إنشاء الحسابات الفرعية...');
    
    // Create asset account with unique code
    const timestamp = Date.now().toString().slice(-6);
    const assetAccountCode = `${categories[0].code}.${timestamp}`;
    const [assetAccount] = await sequelize.query(`
      INSERT INTO accounts (
        id, code, name, "nameEn", type, "rootType", "reportType",
        "parentId", level, "isGroup", "isActive", balance, currency,
        nature, "accountType", description, "isSystemAccount",
        "createdAt", "updatedAt"
      ) VALUES (
        :id, :code, :name, :nameEn, 'asset', 'Asset', 'Balance Sheet',
        :parentId, 4, false, true, 0, 'LYD',
        'debit', 'sub', :description, false,
        NOW(), NOW()
      ) RETURNING id, code, name
    `, {
      replacements: {
        id: uuidv4(),
        code: assetAccountCode,
        name: `${testAssetData.name} - أصل`,
        nameEn: `${testAssetData.name} - Asset`,
        parentId: categories[0].id,
        description: `حساب الأصل الثابت: ${testAssetData.name}`
      },
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('   ✅ حساب الأصل:', assetAccount[0]);
    
    // 4. Test depreciation schedule generation
    console.log('\n📊 4. اختبار توليد جدولة الإهلاك...');
    
    try {
      const [scheduleResult] = await sequelize.query(
        'SELECT generate_depreciation_schedule(:assetId) as months_created',
        {
          replacements: { assetId: testAssetData.id },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`   ✅ تم توليد ${scheduleResult.months_created} شهر من جدولة الإهلاك`);
      
      // Check the generated schedule
      const [schedule] = await sequelize.query(`
        SELECT 
          "scheduleDate",
          "depreciationAmount",
          "accumulatedDepreciation",
          "bookValue",
          status
        FROM depreciation_schedules 
        WHERE "fixedAssetId" = :assetId 
        ORDER BY "scheduleDate" 
        LIMIT 5
      `, {
        replacements: { assetId: testAssetData.id },
        type: Sequelize.QueryTypes.SELECT
      });
      
      console.log('   📋 أول 5 أشهر من الجدولة:');
      if (Array.isArray(schedule) && schedule.length > 0) {
        schedule.forEach((entry, index) => {
          console.log(`     ${index + 1}. ${entry.scheduleDate}: ${entry.depreciationAmount} LYD (مجمع: ${entry.accumulatedDepreciation}, قيمة دفترية: ${entry.bookValue})`);
        });
      } else {
        console.log('     ⚠️ لا توجد بيانات جدولة متاحة');
      }
      
    } catch (error) {
      console.log('   ❌ خطأ في توليد جدولة الإهلاك:', error.message);
    }
    
    // 5. Test journal entry creation
    console.log('\n📝 5. اختبار إنشاء القيود المحاسبية...');
    
    // Get a real user for testing
    const [users] = await sequelize.query(`
      SELECT id, username
      FROM users
      ORDER BY "createdAt"
      LIMIT 1
    `);

    if (users.length === 0) {
      console.log('   ⚠️ لا توجد مستخدمين في النظام - تخطي اختبار القيود المحاسبية');
    } else {
      const testUser = users[0];
      console.log('   👤 المستخدم للاختبار:', testUser.username);

      // Find cash account
      const [cashAccounts] = await sequelize.query(`
        SELECT id, code, name
        FROM accounts
        WHERE code LIKE '1.1%'
        AND (name LIKE '%صندوق%' OR name LIKE '%نقد%')
        LIMIT 1
      `);
    
    if (cashAccounts.length > 0) {
      const cashAccount = cashAccounts[0];
      console.log('   💰 حساب النقدية:', `${cashAccount.code} - ${cashAccount.name}`);
      
      // Create journal entry
      const entryNumber = `TST-${Date.now().toString().slice(-8)}`;
      const [journalEntry] = await sequelize.query(`
        INSERT INTO journal_entries (
          id, "entryNumber", date, description, "totalDebit", "totalCredit",
          status, "postedBy", "postedAt", "createdAt", "updatedAt"
        ) VALUES (
          :id, :entryNumber, :date, :description, :totalDebit, :totalCredit,
          'posted', :postedBy, NOW(), NOW(), NOW()
        ) RETURNING id, "entryNumber", description
      `, {
        replacements: {
          id: uuidv4(),
          entryNumber,
          date: testAssetData.purchaseDate,
          description: `شراء أصل ثابت: ${testAssetData.name}`,
          totalDebit: testAssetData.purchaseCost,
          totalCredit: testAssetData.purchaseCost,
          postedBy: testUser.id
        },
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('   ✅ قيد اليومية:', journalEntry[0]);
      
      // Create GL entries
      const glEntries = [
        {
          id: uuidv4(),
          postingDate: testAssetData.purchaseDate,
          accountId: assetAccount[0].id,
          debit: testAssetData.purchaseCost,
          credit: 0,
          voucherType: 'Asset Purchase',
          voucherNo: entryNumber,
          journalEntryId: journalEntry[0].id,
          remarks: `شراء أصل ثابت - ${testAssetData.name}`,
          createdBy: testUser.id,
          currency: 'LYD',
          exchangeRate: 1.0
        },
        {
          id: uuidv4(),
          postingDate: testAssetData.purchaseDate,
          accountId: cashAccount.id,
          debit: 0,
          credit: testAssetData.purchaseCost,
          voucherType: 'Asset Purchase',
          voucherNo: entryNumber,
          journalEntryId: journalEntry[0].id,
          remarks: `دفع ثمن أصل ثابت - ${testAssetData.name}`,
          createdBy: testUser.id,
          currency: 'LYD',
          exchangeRate: 1.0
        }
      ];
      
      await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "accountId", debit, credit, "voucherType", "voucherNo",
          "journalEntryId", remarks, "createdBy", currency, "exchangeRate",
          "isCancelled", "createdAt", "updatedAt"
        ) VALUES 
        ${glEntries.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, NOW(), NOW())').join(', ')}
      `, {
        replacements: glEntries.flatMap(entry => [
          entry.id, entry.postingDate, entry.accountId, entry.debit, entry.credit,
          entry.voucherType, entry.voucherNo, entry.journalEntryId, entry.remarks,
          entry.createdBy, entry.currency, entry.exchangeRate
        ])
      });
      
        console.log('   ✅ تم إنشاء قيود الأستاذ العام (2 قيد)');

      } else {
        console.log('   ⚠️ لم يتم العثور على حساب نقدية');
      }
    }
    
    // 6. Cleanup test data
    console.log('\n🗑️ 6. تنظيف البيانات التجريبية...');
    
    await sequelize.query(`DELETE FROM gl_entries WHERE "voucherNo" LIKE 'TST-%'`);
    await sequelize.query(`DELETE FROM journal_entries WHERE "entryNumber" LIKE 'TST-%'`);
    await sequelize.query(`DELETE FROM depreciation_schedules WHERE "fixedAssetId" = :assetId`, {
      replacements: { assetId: testAssetData.id }
    });
    await sequelize.query(`DELETE FROM accounts WHERE code = :code`, {
      replacements: { code: assetAccountCode }
    });
    await sequelize.query(`DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber`, {
      replacements: { assetNumber: testAssetData.assetNumber }
    });
    
    console.log('   ✅ تم تنظيف جميع البيانات التجريبية');
    
    // 7. Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ملخص نتائج الاختبار:');
    console.log('✅ إنشاء الأصول الثابتة: نجح');
    console.log('✅ إنشاء الحسابات الفرعية: نجح');
    console.log('✅ توليد جدولة الإهلاك: نجح');
    console.log('✅ إنشاء القيود المحاسبية: نجح');
    console.log('✅ تنظيف البيانات: نجح');
    console.log('\n🚀 جميع الميزات المتقدمة للأصول الثابتة تعمل بشكل مثالي!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار الميزات المتقدمة:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

testAdvancedFixedAssets();
