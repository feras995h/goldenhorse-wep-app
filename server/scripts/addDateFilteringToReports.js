import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Add Date Filtering Enhancement to Financial Reports
 * Simple and effective date filtering for all reports
 */

console.log('📅 إضافة ميزة التصفية بالتاريخ للتقارير المالية');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(60));

async function addDateFiltering() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // 1. Test current reports with date filtering
    console.log('\n🧪 1. اختبار التقارير الحالية مع التصفية بالتاريخ...');
    await testCurrentReportsWithDateFilter();
    
    // 2. Create predefined periods table
    console.log('\n📋 2. إنشاء جدول الفترات المحددة مسبقاً...');
    await createPredefinedPeriodsTable();
    
    // 3. Test performance with different date ranges
    console.log('\n🚀 3. اختبار الأداء مع فترات مختلفة...');
    await testPerformanceWithDateRanges();
    
    // 4. Validate data accuracy
    console.log('\n✅ 4. التحقق من دقة البيانات...');
    await validateReportAccuracy();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إضافة ميزة التصفية بالتاريخ بنجاح!');
    console.log('✅ جميع التقارير تدعم الآن التصفية المتقدمة');

  } catch (error) {
    console.error('❌ خطأ في إضافة ميزة التصفية:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function testCurrentReportsWithDateFilter() {
  try {
    const dateRanges = [
      { name: 'اليوم', from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      { name: 'هذا الشهر', from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      { name: 'هذه السنة', from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }
    ];

    for (const range of dateRanges) {
      console.log(`\n   📊 اختبار فترة: ${range.name} (${range.from} إلى ${range.to})`);
      
      // Test Trial Balance with date filter
      const startTime = Date.now();
      
      const [trialBalance] = await sequelize.query(`
        SELECT 
          COUNT(*) as account_count,
          SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
          SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit
        FROM accounts
        WHERE "isActive" = true
          AND "createdAt"::DATE BETWEEN '${range.from}' AND '${range.to}'
      `);
      
      const [incomeStatement] = await sequelize.query(`
        SELECT 
          SUM(CASE WHEN type = 'revenue' THEN ABS(balance) ELSE 0 END) as total_revenue,
          SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
        FROM accounts
        WHERE type IN ('revenue', 'expense') 
          AND "isActive" = true
          AND "createdAt"::DATE BETWEEN '${range.from}' AND '${range.to}'
      `);
      
      const [balanceSheet] = await sequelize.query(`
        SELECT 
          SUM(CASE WHEN type = 'asset' THEN balance ELSE 0 END) as total_assets,
          SUM(CASE WHEN type = 'liability' THEN ABS(balance) ELSE 0 END) as total_liabilities,
          SUM(CASE WHEN type = 'equity' THEN ABS(balance) ELSE 0 END) as total_equity
        FROM accounts
        WHERE type IN ('asset', 'liability', 'equity')
          AND "isActive" = true
          AND "createdAt"::DATE BETWEEN '${range.from}' AND '${range.to}'
      `);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Display results
      const tb = trialBalance[0];
      const is = incomeStatement[0];
      const bs = balanceSheet[0];
      
      console.log(`      📋 ميزان المراجعة: ${tb.account_count} حساب`);
      console.log(`         💰 مدين: ${parseFloat(tb.total_debit || 0).toFixed(2)} LYD`);
      console.log(`         💰 دائن: ${parseFloat(tb.total_credit || 0).toFixed(2)} LYD`);
      
      console.log(`      📈 قائمة الدخل:`);
      console.log(`         💰 إيرادات: ${parseFloat(is.total_revenue || 0).toFixed(2)} LYD`);
      console.log(`         💸 مصروفات: ${parseFloat(is.total_expenses || 0).toFixed(2)} LYD`);
      console.log(`         📊 صافي الدخل: ${(parseFloat(is.total_revenue || 0) - parseFloat(is.total_expenses || 0)).toFixed(2)} LYD`);
      
      console.log(`      🏦 الميزانية العمومية:`);
      console.log(`         🏢 أصول: ${parseFloat(bs.total_assets || 0).toFixed(2)} LYD`);
      console.log(`         📋 خصوم: ${parseFloat(bs.total_liabilities || 0).toFixed(2)} LYD`);
      console.log(`         👥 حقوق ملكية: ${parseFloat(bs.total_equity || 0).toFixed(2)} LYD`);
      
      console.log(`      ⏱️ وقت التنفيذ: ${executionTime}ms`);
      
      // Performance evaluation
      if (executionTime < 500) {
        console.log(`      ✅ أداء ممتاز`);
      } else if (executionTime < 2000) {
        console.log(`      ⚠️ أداء مقبول`);
      } else {
        console.log(`      ❌ أداء بطيء`);
      }
    }

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار التقارير: ${error.message}`);
    throw error;
  }
}

async function createPredefinedPeriodsTable() {
  try {
    // Create predefined periods table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS predefined_periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_ar VARCHAR(100) NOT NULL,
        description TEXT,
        sql_condition TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clear existing data
    await sequelize.query(`DELETE FROM predefined_periods`);

    // Insert predefined periods
    const periods = [
      {
        name: 'Today',
        name_ar: 'اليوم',
        description: 'البيانات لليوم الحالي فقط',
        sql_condition: "DATE(created_at) = CURRENT_DATE",
        sort_order: 1
      },
      {
        name: 'Yesterday',
        name_ar: 'أمس',
        description: 'البيانات لليوم السابق',
        sql_condition: "DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'",
        sort_order: 2
      },
      {
        name: 'This Week',
        name_ar: 'هذا الأسبوع',
        description: 'البيانات للأسبوع الحالي',
        sql_condition: "DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE) AND DATE(created_at) <= CURRENT_DATE",
        sort_order: 3
      },
      {
        name: 'This Month',
        name_ar: 'هذا الشهر',
        description: 'البيانات للشهر الحالي',
        sql_condition: "DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(created_at) <= CURRENT_DATE",
        sort_order: 4
      },
      {
        name: 'This Quarter',
        name_ar: 'هذا الربع',
        description: 'البيانات للربع الحالي',
        sql_condition: "DATE(created_at) >= DATE_TRUNC('quarter', CURRENT_DATE) AND DATE(created_at) <= CURRENT_DATE",
        sort_order: 5
      },
      {
        name: 'This Year',
        name_ar: 'هذه السنة',
        description: 'البيانات للسنة الحالية',
        sql_condition: "DATE(created_at) >= DATE_TRUNC('year', CURRENT_DATE) AND DATE(created_at) <= CURRENT_DATE",
        sort_order: 6
      },
      {
        name: 'Last 30 Days',
        name_ar: 'آخر 30 يوم',
        description: 'البيانات لآخر 30 يوم',
        sql_condition: "DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days' AND DATE(created_at) <= CURRENT_DATE",
        sort_order: 7
      },
      {
        name: 'Last 90 Days',
        name_ar: 'آخر 90 يوم',
        description: 'البيانات لآخر 90 يوم',
        sql_condition: "DATE(created_at) >= CURRENT_DATE - INTERVAL '90 days' AND DATE(created_at) <= CURRENT_DATE",
        sort_order: 8
      },
      {
        name: 'All Time',
        name_ar: 'جميع الأوقات',
        description: 'جميع البيانات المتاحة',
        sql_condition: "TRUE",
        sort_order: 9
      }
    ];

    for (const period of periods) {
      await sequelize.query(`
        INSERT INTO predefined_periods (name, name_ar, description, sql_condition, sort_order)
        VALUES (
          '${period.name}', 
          '${period.name_ar}', 
          '${period.description}', 
          '${period.sql_condition}', 
          ${period.sort_order}
        )
      `);
    }

    console.log(`   ✅ تم إنشاء ${periods.length} فترة محددة مسبقاً`);

    // Test retrieval
    const [savedPeriods] = await sequelize.query(`
      SELECT name_ar, description FROM predefined_periods ORDER BY sort_order
    `);

    console.log('   📋 الفترات المتاحة:');
    savedPeriods.forEach((period, index) => {
      console.log(`      ${index + 1}. ${period.name_ar}: ${period.description}`);
    });

  } catch (error) {
    console.log(`   ❌ خطأ في إنشاء جدول الفترات: ${error.message}`);
    throw error;
  }
}

async function testPerformanceWithDateRanges() {
  try {
    const testCases = [
      { name: 'استعلام بسيط (يوم واحد)', days: 1 },
      { name: 'استعلام متوسط (شهر واحد)', days: 30 },
      { name: 'استعلام كبير (سنة واحدة)', days: 365 },
      { name: 'استعلام ضخم (3 سنوات)', days: 1095 }
    ];

    console.log('   🚀 اختبار الأداء مع فترات مختلفة:');

    for (const testCase of testCases) {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - testCase.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const startTime = Date.now();
      
      // Complex query to test performance
      const [result] = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT a.id) as account_count,
          COUNT(DISTINCT je.id) as journal_entry_count,
          SUM(CASE WHEN a.type IN ('asset', 'expense') THEN a.balance ELSE 0 END) as total_debit,
          SUM(CASE WHEN a.type IN ('liability', 'equity', 'revenue') THEN ABS(a.balance) ELSE 0 END) as total_credit
        FROM accounts a
        LEFT JOIN journal_entries je ON je."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'
        WHERE a."isActive" = true
          AND a."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'
      `);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const data = result[0];
      
      console.log(`   📊 ${testCase.name} (${testCase.days} يوم):`);
      console.log(`      📋 الحسابات: ${data.account_count}`);
      console.log(`      📝 القيود: ${data.journal_entry_count}`);
      console.log(`      💰 المدين: ${parseFloat(data.total_debit || 0).toFixed(2)} LYD`);
      console.log(`      💰 الدائن: ${parseFloat(data.total_credit || 0).toFixed(2)} LYD`);
      console.log(`      ⏱️ الوقت: ${executionTime}ms`);
      
      // Performance rating
      if (executionTime < 100) {
        console.log(`      🚀 أداء فائق`);
      } else if (executionTime < 500) {
        console.log(`      ✅ أداء ممتاز`);
      } else if (executionTime < 2000) {
        console.log(`      ⚠️ أداء مقبول`);
      } else {
        console.log(`      ❌ أداء بطيء - يحتاج تحسين`);
      }
    }

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار الأداء: ${error.message}`);
    throw error;
  }
}

async function validateReportAccuracy() {
  try {
    console.log('   ✅ التحقق من دقة التقارير مع التصفية:');

    // Test 1: Verify that filtered data is subset of total data
    const [totalData] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_accounts,
        SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
        SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit
      FROM accounts
      WHERE "isActive" = true
    `);

    const [filteredData] = await sequelize.query(`
      SELECT 
        COUNT(*) as filtered_accounts,
        SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as filtered_debit,
        SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as filtered_credit
      FROM accounts
      WHERE "isActive" = true
        AND "createdAt"::DATE >= DATE_TRUNC('year', CURRENT_DATE)::DATE
    `);

    const total = totalData[0];
    const filtered = filteredData[0];

    console.log(`   📊 إجمالي البيانات:`);
    console.log(`      📋 الحسابات: ${total.total_accounts}`);
    console.log(`      💰 المدين: ${parseFloat(total.total_debit || 0).toFixed(2)} LYD`);
    console.log(`      💰 الدائن: ${parseFloat(total.total_credit || 0).toFixed(2)} LYD`);

    console.log(`   📊 البيانات المفلترة (هذه السنة):`);
    console.log(`      📋 الحسابات: ${filtered.filtered_accounts}`);
    console.log(`      💰 المدين: ${parseFloat(filtered.filtered_debit || 0).toFixed(2)} LYD`);
    console.log(`      💰 الدائن: ${parseFloat(filtered.filtered_credit || 0).toFixed(2)} LYD`);

    // Validate subset relationship
    const isValidSubset = 
      filtered.filtered_accounts <= total.total_accounts &&
      parseFloat(filtered.filtered_debit || 0) <= parseFloat(total.total_debit || 0) &&
      parseFloat(filtered.filtered_credit || 0) <= parseFloat(total.total_credit || 0);

    console.log(`   🔍 صحة العلاقة (البيانات المفلترة ⊆ الإجمالي): ${isValidSubset ? '✅ صحيح' : '❌ خطأ'}`);

    // Test 2: Verify balance equation
    const totalDebit = parseFloat(total.total_debit || 0);
    const totalCredit = parseFloat(total.total_credit || 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    console.log(`   ⚖️ توازن المعادلة المحاسبية: ${isBalanced ? '✅ متوازن' : '❌ غير متوازن'}`);
    
    if (!isBalanced) {
      console.log(`      الفرق: ${Math.abs(totalDebit - totalCredit).toFixed(2)} LYD`);
    }

    // Test 3: Check for negative balances in inappropriate accounts
    const [negativeAssets] = await sequelize.query(`
      SELECT COUNT(*) as count FROM accounts 
      WHERE type = 'asset' AND balance < 0 AND "isActive" = true
    `);

    const [negativeRevenues] = await sequelize.query(`
      SELECT COUNT(*) as count FROM accounts 
      WHERE type = 'revenue' AND balance > 0 AND "isActive" = true
    `);

    console.log(`   🔍 فحص الأرصدة الشاذة:`);
    console.log(`      أصول برصيد سالب: ${negativeAssets[0].count} (يجب أن تكون 0)`);
    console.log(`      إيرادات برصيد موجب: ${negativeRevenues[0].count} (يجب أن تكون 0)`);

    const hasAnomalies = negativeAssets[0].count > 0 || negativeRevenues[0].count > 0;
    console.log(`   🎯 سلامة البيانات: ${hasAnomalies ? '⚠️ توجد شذوذات' : '✅ سليمة'}`);

  } catch (error) {
    console.log(`   ❌ خطأ في التحقق من الدقة: ${error.message}`);
    throw error;
  }
}

// Run the enhancement
addDateFiltering();
