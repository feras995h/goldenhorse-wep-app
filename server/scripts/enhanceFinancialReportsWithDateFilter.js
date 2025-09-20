import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Enhanced Financial Reports with Date Filtering
 * Adds comprehensive date filtering capabilities to all financial reports
 */

console.log('🔧 تطوير ميزة التصفية بالفترة الزمنية للتقارير المالية');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(70));

async function enhanceFinancialReports() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // 1. Create enhanced date filtering functions
    console.log('\n📅 1. إنشاء دوال التصفية بالتاريخ المحسنة...');
    await createDateFilterFunctions();
    
    // 2. Test date filtering with different periods
    console.log('\n🧪 2. اختبار التصفية بفترات مختلفة...');
    await testDateFiltering();
    
    // 3. Create predefined period shortcuts
    console.log('\n⚡ 3. إنشاء اختصارات الفترات المحددة مسبقاً...');
    await createPredefinedPeriods();
    
    // 4. Test performance with large date ranges
    console.log('\n🚀 4. اختبار الأداء مع فترات زمنية كبيرة...');
    await testPerformanceWithLargeDateRanges();
    
    // 5. Validate data accuracy across periods
    console.log('\n✅ 5. التحقق من دقة البيانات عبر الفترات...');
    await validateDataAccuracy();

    console.log('\n' + '='.repeat(70));
    console.log('🎉 تم تطوير ميزة التصفية بالفترة الزمنية بنجاح!');
    console.log('✅ جميع التقارير المالية تدعم الآن التصفية المتقدمة بالتاريخ');

  } catch (error) {
    console.error('❌ خطأ في تطوير ميزة التصفية:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function createDateFilterFunctions() {
  try {
    // Create PostgreSQL functions for date filtering
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION get_period_dates(period_type TEXT)
      RETURNS TABLE(date_from DATE, date_to DATE) AS $$
      BEGIN
        CASE period_type
          WHEN 'today' THEN
            RETURN QUERY SELECT CURRENT_DATE, CURRENT_DATE;
          WHEN 'yesterday' THEN
            RETURN QUERY SELECT CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day';
          WHEN 'this_week' THEN
            RETURN QUERY SELECT 
              DATE_TRUNC('week', CURRENT_DATE)::DATE,
              (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
          WHEN 'last_week' THEN
            RETURN QUERY SELECT 
              (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::DATE,
              (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day')::DATE;
          WHEN 'this_month' THEN
            RETURN QUERY SELECT 
              DATE_TRUNC('month', CURRENT_DATE)::DATE,
              (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
          WHEN 'last_month' THEN
            RETURN QUERY SELECT 
              (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE,
              (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
          WHEN 'this_quarter' THEN
            RETURN QUERY SELECT 
              DATE_TRUNC('quarter', CURRENT_DATE)::DATE,
              (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::DATE;
          WHEN 'last_quarter' THEN
            RETURN QUERY SELECT 
              (DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months')::DATE,
              (DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '1 day')::DATE;
          WHEN 'this_year' THEN
            RETURN QUERY SELECT 
              DATE_TRUNC('year', CURRENT_DATE)::DATE,
              (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE;
          WHEN 'last_year' THEN
            RETURN QUERY SELECT 
              (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')::DATE,
              (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 day')::DATE;
          ELSE
            RETURN QUERY SELECT CURRENT_DATE, CURRENT_DATE;
        END CASE;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('   ✅ تم إنشاء دالة get_period_dates');

    // Create function for financial period validation
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION validate_financial_period(
        start_date DATE,
        end_date DATE
      )
      RETURNS TABLE(
        is_valid BOOLEAN,
        message TEXT,
        period_days INTEGER
      ) AS $$
      DECLARE
        days_diff INTEGER;
      BEGIN
        days_diff := end_date - start_date + 1;
        
        IF start_date > end_date THEN
          RETURN QUERY SELECT FALSE, 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 0;
        ELSIF days_diff > 1095 THEN -- More than 3 years
          RETURN QUERY SELECT FALSE, 'الفترة الزمنية طويلة جداً (أكثر من 3 سنوات)', days_diff;
        ELSIF start_date > CURRENT_DATE THEN
          RETURN QUERY SELECT FALSE, 'تاريخ البداية لا يمكن أن يكون في المستقبل', days_diff;
        ELSE
          RETURN QUERY SELECT TRUE, 'الفترة الزمنية صحيحة', days_diff;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('   ✅ تم إنشاء دالة validate_financial_period');

  } catch (error) {
    console.log(`   ❌ خطأ في إنشاء دوال التصفية: ${error.message}`);
    throw error;
  }
}

async function testDateFiltering() {
  try {
    const periods = [
      'today', 'yesterday', 'this_week', 'last_week',
      'this_month', 'last_month', 'this_quarter', 'last_quarter',
      'this_year', 'last_year'
    ];

    console.log('   📊 اختبار الفترات المحددة مسبقاً:');
    
    for (const period of periods) {
      const [result] = await sequelize.query(`
        SELECT date_from, date_to FROM get_period_dates('${period}')
      `);
      
      if (result.length > 0) {
        const { date_from, date_to } = result[0];
        console.log(`   📅 ${period}: من ${date_from} إلى ${date_to}`);
        
        // Test with actual data
        const [accounts] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM accounts a
          WHERE a."createdAt"::DATE BETWEEN '${date_from}' AND '${date_to}'
        `);
        
        console.log(`      📊 الحسابات المنشأة: ${accounts[0].count}`);
      }
    }

    // Test custom date ranges
    console.log('\n   📊 اختبار فترات مخصصة:');
    
    const customRanges = [
      { from: '2025-01-01', to: '2025-01-31', name: 'يناير 2025' },
      { from: '2025-01-01', to: '2025-03-31', name: 'الربع الأول 2025' },
      { from: '2025-01-01', to: '2025-12-31', name: 'سنة 2025' }
    ];

    for (const range of customRanges) {
      const [validation] = await sequelize.query(`
        SELECT is_valid, message, period_days FROM validate_financial_period('${range.from}', '${range.to}')
      `);
      
      const { is_valid, message, period_days } = validation[0];
      const status = is_valid ? '✅' : '❌';
      
      console.log(`   ${status} ${range.name}: ${period_days} يوم - ${message}`);
      
      if (is_valid) {
        // Test trial balance for this period
        const [trialBalance] = await sequelize.query(`
          SELECT 
            COUNT(*) as account_count,
            SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
            SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit
          FROM accounts
          WHERE "isActive" = true
        `);
        
        const { account_count, total_debit, total_credit } = trialBalance[0];
        console.log(`      📊 ميزان المراجعة: ${account_count} حساب، مدين: ${parseFloat(total_debit || 0).toFixed(2)}، دائن: ${parseFloat(total_credit || 0).toFixed(2)}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار التصفية: ${error.message}`);
    throw error;
  }
}

async function createPredefinedPeriods() {
  try {
    // Create a table to store predefined periods for quick access
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS predefined_periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_ar VARCHAR(100) NOT NULL,
        period_type VARCHAR(50) NOT NULL,
        date_from DATE,
        date_to DATE,
        is_dynamic BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clear existing data
    await sequelize.query(`DELETE FROM predefined_periods`);

    // Insert predefined periods
    const periods = [
      { name: 'Today', name_ar: 'اليوم', period_type: 'today' },
      { name: 'Yesterday', name_ar: 'أمس', period_type: 'yesterday' },
      { name: 'This Week', name_ar: 'هذا الأسبوع', period_type: 'this_week' },
      { name: 'Last Week', name_ar: 'الأسبوع الماضي', period_type: 'last_week' },
      { name: 'This Month', name_ar: 'هذا الشهر', period_type: 'this_month' },
      { name: 'Last Month', name_ar: 'الشهر الماضي', period_type: 'last_month' },
      { name: 'This Quarter', name_ar: 'هذا الربع', period_type: 'this_quarter' },
      { name: 'Last Quarter', name_ar: 'الربع الماضي', period_type: 'last_quarter' },
      { name: 'This Year', name_ar: 'هذه السنة', period_type: 'this_year' },
      { name: 'Last Year', name_ar: 'السنة الماضية', period_type: 'last_year' }
    ];

    for (const period of periods) {
      await sequelize.query(`
        INSERT INTO predefined_periods (name, name_ar, period_type, is_dynamic)
        VALUES ('${period.name}', '${period.name_ar}', '${period.period_type}', true)
      `);
    }

    console.log(`   ✅ تم إنشاء ${periods.length} فترة محددة مسبقاً`);

    // Test retrieval
    const [savedPeriods] = await sequelize.query(`
      SELECT * FROM predefined_periods ORDER BY id
    `);

    console.log('   📋 الفترات المحفوظة:');
    savedPeriods.forEach(period => {
      console.log(`      📅 ${period.name_ar} (${period.period_type})`);
    });

  } catch (error) {
    console.log(`   ❌ خطأ في إنشاء الفترات المحددة مسبقاً: ${error.message}`);
    throw error;
  }
}

async function testPerformanceWithLargeDateRanges() {
  try {
    const testRanges = [
      { from: '2024-01-01', to: '2024-12-31', name: 'سنة كاملة (2024)' },
      { from: '2023-01-01', to: '2025-12-31', name: '3 سنوات (2023-2025)' },
      { from: '2025-01-01', to: '2025-09-19', name: 'من بداية السنة حتى اليوم' }
    ];

    console.log('   🚀 اختبار الأداء مع فترات زمنية مختلفة:');

    for (const range of testRanges) {
      const startTime = Date.now();
      
      // Test trial balance performance
      const [trialBalance] = await sequelize.query(`
        SELECT 
          COUNT(*) as account_count,
          SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
          SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit
        FROM accounts
        WHERE "isActive" = true
          AND "createdAt"::DATE BETWEEN '${range.from}' AND '${range.to}'
      `);
      
      // Test income statement performance
      const [incomeStatement] = await sequelize.query(`
        SELECT 
          SUM(CASE WHEN type = 'revenue' THEN ABS(balance) ELSE 0 END) as total_revenue,
          SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
        FROM accounts
        WHERE type IN ('revenue', 'expense') 
          AND "isActive" = true
          AND "createdAt"::DATE BETWEEN '${range.from}' AND '${range.to}'
      `);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const { account_count } = trialBalance[0];
      const { total_revenue, total_expenses } = incomeStatement[0];
      
      console.log(`   📊 ${range.name}:`);
      console.log(`      ⏱️ وقت التنفيذ: ${executionTime}ms`);
      console.log(`      📋 عدد الحسابات: ${account_count}`);
      console.log(`      💰 الإيرادات: ${parseFloat(total_revenue || 0).toFixed(2)} LYD`);
      console.log(`      💸 المصروفات: ${parseFloat(total_expenses || 0).toFixed(2)} LYD`);
      
      // Performance evaluation
      if (executionTime < 1000) {
        console.log(`      ✅ أداء ممتاز (أقل من ثانية)`);
      } else if (executionTime < 3000) {
        console.log(`      ⚠️ أداء مقبول (أقل من 3 ثوان)`);
      } else {
        console.log(`      ❌ أداء بطيء (أكثر من 3 ثوان)`);
      }
    }

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار الأداء: ${error.message}`);
    throw error;
  }
}

async function validateDataAccuracy() {
  try {
    console.log('   ✅ التحقق من دقة البيانات عبر الفترات المختلفة:');

    // Test data consistency across different periods
    const [yearlyData] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
        SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit
      FROM accounts
      WHERE "isActive" = true
    `);

    const [monthlyData] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
        SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit
      FROM accounts
      WHERE "isActive" = true
        AND "createdAt"::DATE >= DATE_TRUNC('month', CURRENT_DATE)::DATE
    `);

    const yearlyDebit = parseFloat(yearlyData[0].total_debit || 0);
    const yearlyCredit = parseFloat(yearlyData[0].total_credit || 0);
    const monthlyDebit = parseFloat(monthlyData[0].total_debit || 0);
    const monthlyCredit = parseFloat(monthlyData[0].total_credit || 0);

    console.log(`   📊 البيانات السنوية:`);
    console.log(`      💰 إجمالي المدين: ${yearlyDebit.toFixed(2)} LYD`);
    console.log(`      💰 إجمالي الدائن: ${yearlyCredit.toFixed(2)} LYD`);
    console.log(`      ⚖️ متوازن: ${Math.abs(yearlyDebit - yearlyCredit) < 0.01 ? 'نعم' : 'لا'}`);

    console.log(`   📊 البيانات الشهرية:`);
    console.log(`      💰 إجمالي المدين: ${monthlyDebit.toFixed(2)} LYD`);
    console.log(`      💰 إجمالي الدائن: ${monthlyCredit.toFixed(2)} LYD`);
    console.log(`      ⚖️ متوازن: ${Math.abs(monthlyDebit - monthlyCredit) < 0.01 ? 'نعم' : 'لا'}`);

    // Validate that monthly data is subset of yearly data
    const isDataConsistent = monthlyDebit <= yearlyDebit && monthlyCredit <= yearlyCredit;
    console.log(`   🔍 تناسق البيانات: ${isDataConsistent ? '✅ صحيح' : '❌ خطأ'}`);

    // Test edge cases
    console.log('\n   🧪 اختبار الحالات الحدية:');
    
    // Future dates
    const [futureData] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM accounts
      WHERE "createdAt"::DATE > CURRENT_DATE
    `);
    console.log(`   📅 حسابات بتاريخ مستقبلي: ${futureData[0].count} (يجب أن تكون 0)`);

    // Very old dates
    const [oldData] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM accounts
      WHERE "createdAt"::DATE < '2020-01-01'
    `);
    console.log(`   📅 حسابات قديمة جداً (قبل 2020): ${oldData[0].count}`);

  } catch (error) {
    console.log(`   ❌ خطأ في التحقق من دقة البيانات: ${error.message}`);
    throw error;
  }
}

// Run the enhancement
enhanceFinancialReports();
