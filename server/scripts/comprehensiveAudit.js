#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';

// تحميل متغيرات البيئة
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function comprehensiveAudit() {
  console.log('🔍 بدء التدقيق الشامل النهائي...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    const results = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      summary: {},
      details: {},
      recommendations: []
    };

    // 1. فحص توازن ميزان المراجعة العام
    console.log('📊 فحص توازن ميزان المراجعة العام...');
    const [glTotals] = await sequelize.query(`
      SELECT 
        ROUND(SUM(debit), 2) as total_debit,
        ROUND(SUM(credit), 2) as total_credit,
        ROUND(SUM(debit) - SUM(credit), 2) as difference,
        COUNT(*) as total_entries
      FROM gl_entries 
      WHERE "isCancelled" = false
    `);
    
    results.summary.glBalance = glTotals[0];
    console.log(`   المدين: ${glTotals[0].total_debit} LYD`);
    console.log(`   الدائن: ${glTotals[0].total_credit} LYD`);
    console.log(`   الفرق: ${glTotals[0].difference} LYD`);
    console.log(`   إجمالي القيود: ${glTotals[0].total_entries}`);

    // 2. فحص توازن أرصدة الحسابات
    console.log('\n💰 فحص توازن أرصدة الحسابات...');
    const [accountBalances] = await sequelize.query(`
      SELECT 
        type,
        ROUND(SUM(balance), 2) as total_balance,
        COUNT(*) as account_count
      FROM accounts 
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type
    `);
    
    results.details.accountBalances = accountBalances;
    console.log('   توزيع الأرصدة حسب نوع الحساب:');
    accountBalances.forEach(balance => {
      console.log(`   ${balance.type}: ${balance.total_balance} LYD (${balance.account_count} حساب)`);
    });

    // 3. فحص اكتمال ربط الفواتير
    console.log('\n🧾 فحص اكتمال ربط الفواتير...');
    const [invoiceStats] = await sequelize.query(`
      SELECT 
        i.status,
        COUNT(i.id) as invoice_count,
        ROUND(SUM(i.total), 2) as total_amount,
        COUNT(gl.id) as gl_entries_count
      FROM invoices i
      LEFT JOIN gl_entries gl ON gl."voucherType" = 'Sales Invoice' AND gl."voucherNo" = i."invoiceNumber"
      WHERE i.status != 'cancelled'
      GROUP BY i.status
      ORDER BY i.status
    `);
    
    results.details.invoiceStats = invoiceStats;
    console.log('   إحصائيات الفواتير:');
    invoiceStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.invoice_count} فاتورة بقيمة ${stat.total_amount} LYD`);
      console.log(`   قيود GL مرتبطة: ${stat.gl_entries_count}`);
    });

    // 4. فحص اكتمال ربط العملاء
    console.log('\n👥 فحص اكتمال ربط العملاء...');
    const [customerStats] = await sequelize.query(`
      SELECT 
        CASE WHEN "accountId" IS NOT NULL THEN 'مرتبط' ELSE 'غير مرتبط' END as link_status,
        COUNT(*) as customer_count,
        ROUND(SUM(balance), 2) as total_balance
      FROM customers
      WHERE "isActive" = true
      GROUP BY CASE WHEN "accountId" IS NOT NULL THEN 'مرتبط' ELSE 'غير مرتبط' END
    `);
    
    results.details.customerStats = customerStats;
    console.log('   إحصائيات ربط العملاء:');
    customerStats.forEach(stat => {
      console.log(`   ${stat.link_status}: ${stat.customer_count} عميل برصيد ${stat.total_balance} LYD`);
    });

    // 5. فحص سجلات التدقيق
    console.log('\n📋 فحص سجلات التدقيق...');
    const [auditStats] = await sequelize.query(`
      SELECT 
        category,
        action,
        COUNT(*) as log_count
      FROM audit_logs
      GROUP BY category, action
      ORDER BY category, action
    `);
    
    results.details.auditStats = auditStats;
    console.log('   إحصائيات سجلات التدقيق:');
    auditStats.forEach(stat => {
      console.log(`   ${stat.category} - ${stat.action}: ${stat.log_count} سجل`);
    });

    // 6. فحص الأصول الثابتة
    console.log('\n🏢 فحص الأصول الثابتة...');
    const [assetStats] = await sequelize.query(`
      SELECT
        COUNT(*) as total_assets,
        ROUND(SUM("purchaseCost"), 2) as total_purchase_cost,
        ROUND(SUM("currentValue"), 2) as total_current_value,
        ROUND(SUM("salvageValue"), 2) as total_salvage_value
      FROM fixed_assets
      WHERE status = 'active'
    `);
    
    results.details.assetStats = assetStats[0];
    console.log(`   إجمالي الأصول: ${assetStats[0].total_assets}`);
    console.log(`   تكلفة الشراء: ${assetStats[0].total_purchase_cost} LYD`);
    console.log(`   القيمة الحالية: ${assetStats[0].total_current_value} LYD`);
    console.log(`   قيمة الإنقاذ: ${assetStats[0].total_salvage_value} LYD`);

    // 7. التحقق من المعادلة المحاسبية
    console.log('\n⚖️ التحقق من المعادلة المحاسبية...');
    const [equationCheck] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN type = 'asset' THEN balance ELSE 0 END) as total_assets,
        SUM(CASE WHEN type = 'liability' THEN balance ELSE 0 END) as total_liabilities,
        SUM(CASE WHEN type = 'equity' THEN balance ELSE 0 END) as total_equity,
        SUM(CASE WHEN type = 'revenue' THEN balance ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
      FROM accounts
      WHERE "isActive" = true
    `);
    
    const equation = equationCheck[0];
    const assetsTotal = parseFloat(equation.total_assets);
    const liabilitiesEquityTotal = parseFloat(equation.total_liabilities) + parseFloat(equation.total_equity);
    const equationBalance = Math.abs(assetsTotal - liabilitiesEquityTotal);
    
    results.details.accountingEquation = {
      assets: equation.total_assets,
      liabilities: equation.total_liabilities,
      equity: equation.total_equity,
      revenue: equation.total_revenue,
      expenses: equation.total_expenses,
      equation_balance: equationBalance,
      is_balanced: equationBalance < 0.01
    };

    console.log(`   الأصول: ${equation.total_assets} LYD`);
    console.log(`   الالتزامات: ${equation.total_liabilities} LYD`);
    console.log(`   حقوق الملكية: ${equation.total_equity} LYD`);
    console.log(`   الإيرادات: ${equation.total_revenue} LYD`);
    console.log(`   المصروفات: ${equation.total_expenses} LYD`);
    console.log(`   توازن المعادلة: ${equationBalance < 0.01 ? '✅ متوازنة' : '❌ غير متوازنة'}`);

    // 8. تقييم الحالة العامة
    console.log('\n🎯 تقييم الحالة العامة...');
    
    let score = 100;
    const issues = [];

    // خصم نقاط للمشاكل
    if (Math.abs(parseFloat(glTotals[0].difference)) > 0.01) {
      score -= 30;
      issues.push('عدم توازن ميزان المراجعة');
    }

    if (equationBalance >= 0.01) {
      score -= 25;
      issues.push('عدم توازن المعادلة المحاسبية');
    }

    const unlinkedCustomers = customerStats.find(s => s.link_status === 'غير مرتبط');
    if (unlinkedCustomers && unlinkedCustomers.customer_count > 0) {
      score -= 10;
      issues.push(`${unlinkedCustomers.customer_count} عميل غير مرتبط بحسابات`);
    }

    results.summary.overallScore = score;
    results.summary.issues = issues;
    results.summary.status = score >= 95 ? 'ممتاز' : score >= 85 ? 'جيد جداً' : score >= 70 ? 'جيد' : score >= 50 ? 'مقبول' : 'يحتاج تحسين';

    // التوصيات
    if (score < 100) {
      results.recommendations.push('مراجعة وإصلاح المشاكل المحددة أعلاه');
    }
    
    results.recommendations.push('تفعيل المراقبة التلقائية للتوازن المحاسبي');
    results.recommendations.push('إجراء تدقيق دوري شهري');
    results.recommendations.push('تدريب المستخدمين على أفضل الممارسات المحاسبية');

    // طباعة النتائج النهائية
    console.log('\n🏆 النتائج النهائية:');
    console.log('='.repeat(50));
    console.log(`النتيجة الإجمالية: ${score}/100 (${results.summary.status})`);
    
    if (issues.length > 0) {
      console.log('\n❌ المشاكل المكتشفة:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ لا توجد مشاكل محاسبية!');
    }

    console.log('\n💡 التوصيات:');
    results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // حفظ التقرير الشامل
    const reportPath = 'comprehensive-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 تم حفظ التقرير الشامل في: ${reportPath}`);

    return results;

  } catch (error) {
    console.error('❌ خطأ في التدقيق الشامل:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل التدقيق الشامل
comprehensiveAudit()
  .then((results) => {
    console.log(`\n🎉 انتهى التدقيق الشامل بنجاح - النتيجة: ${results.summary.overallScore}/100`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل التدقيق الشامل:', error);
    process.exit(1);
  });
