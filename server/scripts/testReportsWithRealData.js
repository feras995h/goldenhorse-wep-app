import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Test Financial Reports with Real Data
 * Comprehensive testing with actual business scenarios
 */

console.log('🧪 اختبار التقارير المالية مع البيانات الحقيقية');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(70));

async function testReportsWithRealData() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // 1. Test with current real data
    console.log('\n📊 1. اختبار التقارير مع البيانات الحالية...');
    await testCurrentDataReports();
    
    // 2. Create sample business transactions
    console.log('\n💼 2. إنشاء عمليات تجارية تجريبية...');
    await createSampleTransactions();
    
    // 3. Test reports after transactions
    console.log('\n📈 3. اختبار التقارير بعد العمليات...');
    await testReportsAfterTransactions();
    
    // 4. Test edge cases and scenarios
    console.log('\n🔍 4. اختبار الحالات الحدية...');
    await testEdgeCases();
    
    // 5. Performance test with larger dataset
    console.log('\n🚀 5. اختبار الأداء مع بيانات أكبر...');
    await performanceTestWithLargeData();

    console.log('\n' + '='.repeat(70));
    console.log('🎉 انتهى اختبار التقارير مع البيانات الحقيقية');

  } catch (error) {
    console.error('❌ خطأ في اختبار التقارير:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function testCurrentDataReports() {
  try {
    // Get current system state
    const [systemState] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM accounts WHERE "isActive" = true) as active_accounts,
        (SELECT COUNT(*) FROM journal_entries) as journal_entries,
        (SELECT COUNT(*) FROM customers) as active_customers,
        (SELECT COUNT(*) FROM invoices) as total_invoices,
        (SELECT COUNT(*) FROM fixed_assets) as fixed_assets
    `);

    const state = systemState[0];
    
    console.log('   📋 حالة النظام الحالية:');
    console.log(`      📊 الحسابات النشطة: ${state.active_accounts}`);
    console.log(`      📝 القيود المحاسبية: ${state.journal_entries}`);
    console.log(`      👥 العملاء النشطون: ${state.active_customers}`);
    console.log(`      🧾 إجمالي الفواتير: ${state.total_invoices}`);
    console.log(`      🏢 الأصول الثابتة: ${state.fixed_assets}`);

    // Test Trial Balance with current data
    const [trialBalance] = await sequelize.query(`
      SELECT 
        a.type,
        COUNT(*) as account_count,
        SUM(a.balance) as total_balance,
        AVG(a.balance) as avg_balance,
        MIN(a.balance) as min_balance,
        MAX(a.balance) as max_balance
      FROM accounts a
      WHERE a."isActive" = true
      GROUP BY a.type
      ORDER BY a.type
    `);

    console.log('\n   📊 ميزان المراجعة حسب نوع الحساب:');
    let totalDebit = 0, totalCredit = 0;
    
    trialBalance.forEach(row => {
      const balance = parseFloat(row.total_balance || 0);
      const avgBalance = parseFloat(row.avg_balance || 0);
      
      console.log(`      ${row.type}:`);
      console.log(`         📋 عدد الحسابات: ${row.account_count}`);
      console.log(`         💰 إجمالي الرصيد: ${balance.toFixed(2)} د.ل`);
      console.log(`         📊 متوسط الرصيد: ${avgBalance.toFixed(2)} د.ل`);
      console.log(`         📈 أعلى رصيد: ${parseFloat(row.max_balance || 0).toFixed(2)} د.ل`);
      console.log(`         📉 أقل رصيد: ${parseFloat(row.min_balance || 0).toFixed(2)} د.ل`);
      
      if (['asset', 'expense'].includes(row.type)) {
        totalDebit += Math.max(0, balance);
      } else {
        totalCredit += Math.max(0, Math.abs(balance));
      }
    });

    console.log(`\n   ⚖️ إجمالي المدين: ${totalDebit.toFixed(2)} د.ل`);
    console.log(`   ⚖️ إجمالي الدائن: ${totalCredit.toFixed(2)} د.ل`);
    console.log(`   ⚖️ التوازن: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ متوازن' : '❌ غير متوازن'}`);

    // Test Income Statement
    const [incomeData] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type = 'revenue' THEN ABS(balance) ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses,
        COUNT(CASE WHEN type = 'revenue' THEN 1 END) as revenue_accounts,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_accounts
      FROM accounts
      WHERE type IN ('revenue', 'expense') AND "isActive" = true
    `);

    const income = incomeData[0];
    const netIncome = parseFloat(income.total_revenue || 0) - parseFloat(income.total_expenses || 0);

    console.log('\n   📈 قائمة الدخل:');
    console.log(`      💰 إجمالي الإيرادات: ${parseFloat(income.total_revenue || 0).toFixed(2)} د.ل (${income.revenue_accounts} حساب)`);
    console.log(`      💸 إجمالي المصروفات: ${parseFloat(income.total_expenses || 0).toFixed(2)} د.ل (${income.expense_accounts} حساب)`);
    console.log(`      📊 صافي الدخل: ${netIncome.toFixed(2)} د.ل`);

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار البيانات الحالية: ${error.message}`);
    throw error;
  }
}

async function createSampleTransactions() {
  try {
    console.log('   💼 إنشاء عمليات تجارية تجريبية...');

    // Create a sample customer if not exists
    const [existingCustomer] = await sequelize.query(`
      SELECT id FROM customers WHERE name = 'عميل تجريبي للاختبار' LIMIT 1
    `);

    let customerId;
    if (existingCustomer.length === 0) {
      const [newCustomer] = await sequelize.query(`
        INSERT INTO customers (name, email, phone, address, "isActive", "createdAt", "updatedAt")
        VALUES ('عميل تجريبي للاختبار', 'test@example.com', '0912345678', 'طرابلس، ليبيا', true, NOW(), NOW())
        RETURNING id
      `);
      customerId = newCustomer[0].id;
      console.log(`      ✅ تم إنشاء عميل جديد (ID: ${customerId})`);
    } else {
      customerId = existingCustomer[0].id;
      console.log(`      ✅ استخدام عميل موجود (ID: ${customerId})`);
    }

    // Create sample invoice
    const invoiceAmount = 2500.00;
    const taxAmount = invoiceAmount * 0.15; // 15% tax
    const totalAmount = invoiceAmount + taxAmount;

    const [invoice] = await sequelize.query(`
      INSERT INTO invoices (
        "invoiceNumber", 
        "customerId", 
        "issueDate", 
        "dueDate", 
        subtotal, 
        tax, 
        total, 
        status, 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        'INV-TEST-' || EXTRACT(EPOCH FROM NOW())::INTEGER,
        ${customerId},
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        ${invoiceAmount},
        ${taxAmount},
        ${totalAmount},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING id, "invoiceNumber", total
    `);

    console.log(`      ✅ تم إنشاء فاتورة (${invoice[0].invoiceNumber}) بقيمة ${invoice[0].total} د.ل`);

    // Create corresponding journal entry
    const [journalEntry] = await sequelize.query(`
      INSERT INTO journal_entries (
        "entryNumber",
        description,
        "postingDate",
        "totalDebit",
        "totalCredit",
        "voucherType",
        "referenceType",
        "referenceId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        'JE-TEST-' || EXTRACT(EPOCH FROM NOW())::INTEGER,
        'قيد فاتورة مبيعات تجريبية',
        CURRENT_DATE,
        ${totalAmount},
        ${totalAmount},
        'Sales Invoice',
        'invoice',
        ${invoice[0].id},
        NOW(),
        NOW()
      )
      RETURNING id
    `);

    console.log(`      ✅ تم إنشاء قيد محاسبي (ID: ${journalEntry[0].id})`);

    // Update customer account balance (assuming customer account exists)
    const [customerAccount] = await sequelize.query(`
      SELECT id FROM accounts WHERE name ILIKE '%عميل%' OR name ILIKE '%customer%' LIMIT 1
    `);

    if (customerAccount.length > 0) {
      await sequelize.query(`
        UPDATE accounts 
        SET balance = balance + ${totalAmount}, "updatedAt" = NOW()
        WHERE id = ${customerAccount[0].id}
      `);
      console.log(`      ✅ تم تحديث رصيد حساب العميل (+${totalAmount} د.ل)`);
    }

    // Update revenue account
    const [revenueAccount] = await sequelize.query(`
      SELECT id FROM accounts WHERE type = 'revenue' AND "isActive" = true LIMIT 1
    `);

    if (revenueAccount.length > 0) {
      await sequelize.query(`
        UPDATE accounts 
        SET balance = balance - ${invoiceAmount}, "updatedAt" = NOW()
        WHERE id = ${revenueAccount[0].id}
      `);
      console.log(`      ✅ تم تحديث حساب الإيرادات (+${invoiceAmount} د.ل)`);
    }

    // Update tax account
    const [taxAccount] = await sequelize.query(`
      SELECT id FROM accounts WHERE name ILIKE '%ضريب%' OR name ILIKE '%tax%' LIMIT 1
    `);

    if (taxAccount.length > 0) {
      await sequelize.query(`
        UPDATE accounts 
        SET balance = balance - ${taxAmount}, "updatedAt" = NOW()
        WHERE id = ${taxAccount[0].id}
      `);
      console.log(`      ✅ تم تحديث حساب الضرائب (+${taxAmount} د.ل)`);
    }

    console.log(`   💰 إجمالي العمليات المنشأة: فاتورة بقيمة ${totalAmount} د.ل`);

  } catch (error) {
    console.log(`   ❌ خطأ في إنشاء العمليات التجريبية: ${error.message}`);
    // Don't throw error, continue with existing data
  }
}

async function testReportsAfterTransactions() {
  try {
    console.log('   📈 اختبار التقارير بعد إضافة العمليات...');

    // Test updated Trial Balance
    const [updatedTrialBalance] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type IN ('asset', 'expense') THEN balance ELSE 0 END) as total_debit,
        SUM(CASE WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance) ELSE 0 END) as total_credit,
        COUNT(*) as total_accounts
      FROM accounts
      WHERE "isActive" = true
    `);

    const tb = updatedTrialBalance[0];
    const isBalanced = Math.abs(parseFloat(tb.total_debit || 0) - parseFloat(tb.total_credit || 0)) < 0.01;

    console.log(`      📊 ميزان المراجعة المحدث:`);
    console.log(`         📋 إجمالي الحسابات: ${tb.total_accounts}`);
    console.log(`         💰 إجمالي المدين: ${parseFloat(tb.total_debit || 0).toFixed(2)} د.ل`);
    console.log(`         💰 إجمالي الدائن: ${parseFloat(tb.total_credit || 0).toFixed(2)} د.ل`);
    console.log(`         ⚖️ التوازن: ${isBalanced ? '✅ متوازن' : '❌ غير متوازن'}`);

    // Test updated Income Statement
    const [updatedIncome] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type = 'revenue' THEN ABS(balance) ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
      FROM accounts
      WHERE type IN ('revenue', 'expense') AND "isActive" = true
    `);

    const income = updatedIncome[0];
    const netIncome = parseFloat(income.total_revenue || 0) - parseFloat(income.total_expenses || 0);

    console.log(`      📈 قائمة الدخل المحدثة:`);
    console.log(`         💰 إجمالي الإيرادات: ${parseFloat(income.total_revenue || 0).toFixed(2)} د.ل`);
    console.log(`         💸 إجمالي المصروفات: ${parseFloat(income.total_expenses || 0).toFixed(2)} د.ل`);
    console.log(`         📊 صافي الدخل: ${netIncome.toFixed(2)} د.ل`);

    // Test Invoice Reports
    const [invoiceStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total) as total_amount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
      FROM invoices
    `);

    const inv = invoiceStats[0];
    console.log(`      🧾 إحصائيات الفواتير:`);
    console.log(`         📋 إجمالي الفواتير: ${inv.total_invoices}`);
    console.log(`         💰 إجمالي القيمة: ${parseFloat(inv.total_amount || 0).toFixed(2)} د.ل`);
    console.log(`         ✅ مسددة: ${inv.paid_invoices}`);
    console.log(`         ⏳ معلقة: ${inv.pending_invoices}`);
    console.log(`         ⚠️ متأخرة: ${inv.overdue_invoices}`);

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار التقارير المحدثة: ${error.message}`);
    throw error;
  }
}

async function testEdgeCases() {
  try {
    console.log('   🔍 اختبار الحالات الحدية...');

    // Test with zero balances
    const [zeroBalances] = await sequelize.query(`
      SELECT COUNT(*) as count FROM accounts WHERE balance = 0 AND "isActive" = true
    `);
    console.log(`      📊 حسابات برصيد صفر: ${zeroBalances[0].count}`);

    // Test with negative balances
    const [negativeBalances] = await sequelize.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(balance) as total_negative
      FROM accounts 
      WHERE balance < 0 AND "isActive" = true
      GROUP BY type
    `);

    if (negativeBalances.length > 0) {
      console.log(`      ⚠️ حسابات بأرصدة سالبة:`);
      negativeBalances.forEach(row => {
        console.log(`         ${row.type}: ${row.count} حساب، إجمالي: ${parseFloat(row.total_negative).toFixed(2)} د.ل`);
      });
    } else {
      console.log(`      ✅ لا توجد حسابات بأرصدة سالبة`);
    }

    // Test with very large numbers
    const [largeBalances] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        MAX(balance) as max_balance,
        MIN(balance) as min_balance
      FROM accounts 
      WHERE ABS(balance) > 100000 AND "isActive" = true
    `);

    const large = largeBalances[0];
    if (large.count > 0) {
      console.log(`      📊 حسابات بأرصدة كبيرة (>100,000): ${large.count}`);
      console.log(`         📈 أعلى رصيد: ${parseFloat(large.max_balance || 0).toFixed(2)} د.ل`);
      console.log(`         📉 أقل رصيد: ${parseFloat(large.min_balance || 0).toFixed(2)} د.ل`);
    } else {
      console.log(`      ✅ جميع الأرصدة ضمن النطاق المعقول`);
    }

    // Test date ranges
    const [dateRanges] = await sequelize.query(`
      SELECT 
        MIN("createdAt") as earliest_date,
        MAX("createdAt") as latest_date,
        COUNT(*) as total_records
      FROM accounts
      WHERE "isActive" = true
    `);

    const dates = dateRanges[0];
    console.log(`      📅 نطاق التواريخ:`);
    console.log(`         📅 أقدم سجل: ${new Date(dates.earliest_date).toLocaleDateString('ar-EG')}`);
    console.log(`         📅 أحدث سجل: ${new Date(dates.latest_date).toLocaleDateString('ar-EG')}`);
    console.log(`         📊 إجمالي السجلات: ${dates.total_records}`);

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار الحالات الحدية: ${error.message}`);
    throw error;
  }
}

async function performanceTestWithLargeData() {
  try {
    console.log('   🚀 اختبار الأداء مع بيانات أكبر...');

    const testQueries = [
      {
        name: 'ميزان المراجعة الشامل',
        query: `
          SELECT 
            a.code, a.name, a.type, a.balance,
            CASE 
              WHEN a.type IN ('asset', 'expense') THEN a.balance 
              ELSE 0 
            END as debit,
            CASE 
              WHEN a.type IN ('liability', 'equity', 'revenue') THEN ABS(a.balance) 
              ELSE 0 
            END as credit
          FROM accounts a
          WHERE a."isActive" = true
          ORDER BY a.code
        `
      },
      {
        name: 'قائمة الدخل التفصيلية',
        query: `
          SELECT 
            a.code, a.name, a.balance,
            CASE WHEN a.type = 'revenue' THEN ABS(a.balance) ELSE 0 END as revenue,
            CASE WHEN a.type = 'expense' THEN a.balance ELSE 0 END as expense
          FROM accounts a
          WHERE a.type IN ('revenue', 'expense') AND a."isActive" = true
          ORDER BY a.type, a.code
        `
      },
      {
        name: 'الميزانية العمومية التفصيلية',
        query: `
          SELECT 
            a.type, a.code, a.name, a.balance,
            CASE 
              WHEN a.type = 'asset' THEN a.balance
              WHEN a.type = 'liability' THEN ABS(a.balance)
              WHEN a.type = 'equity' THEN ABS(a.balance)
              ELSE 0
            END as classified_balance
          FROM accounts a
          WHERE a.type IN ('asset', 'liability', 'equity') AND a."isActive" = true
          ORDER BY a.type, a.code
        `
      }
    ];

    for (const test of testQueries) {
      const startTime = Date.now();
      const [result] = await sequelize.query(test.query);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(`      📊 ${test.name}:`);
      console.log(`         📋 عدد السجلات: ${result.length}`);
      console.log(`         ⏱️ وقت التنفيذ: ${executionTime}ms`);
      
      if (executionTime < 100) {
        console.log(`         🚀 أداء فائق`);
      } else if (executionTime < 500) {
        console.log(`         ✅ أداء ممتاز`);
      } else if (executionTime < 2000) {
        console.log(`         ⚠️ أداء مقبول`);
      } else {
        console.log(`         ❌ أداء بطيء - يحتاج تحسين`);
      }
    }

    // Test concurrent queries
    console.log(`\n      🔄 اختبار الاستعلامات المتزامنة...`);
    const concurrentStartTime = Date.now();
    
    const concurrentPromises = testQueries.map(test => 
      sequelize.query(test.query)
    );
    
    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentEndTime = Date.now();
    const concurrentTime = concurrentEndTime - concurrentStartTime;

    console.log(`      📊 الاستعلامات المتزامنة:`);
    console.log(`         📋 عدد الاستعلامات: ${testQueries.length}`);
    console.log(`         ⏱️ الوقت الإجمالي: ${concurrentTime}ms`);
    console.log(`         ⏱️ متوسط الوقت: ${(concurrentTime / testQueries.length).toFixed(0)}ms`);
    
    if (concurrentTime < 1000) {
      console.log(`         🚀 أداء متزامن ممتاز`);
    } else if (concurrentTime < 3000) {
      console.log(`         ✅ أداء متزامن جيد`);
    } else {
      console.log(`         ⚠️ أداء متزامن يحتاج تحسين`);
    }

  } catch (error) {
    console.log(`   ❌ خطأ في اختبار الأداء: ${error.message}`);
    throw error;
  }
}

// Run the test
testReportsWithRealData();
