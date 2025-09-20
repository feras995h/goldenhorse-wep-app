#!/usr/bin/env node

import AccountingAuditService from '../src/services/AccountingAuditService.js';
import models, { sequelize } from '../src/models/index.js';
import fs from 'fs';
import path from 'path';

async function runAudit() {
  console.log('🔍 بدء التدقيق المحاسبي الشامل...');

  try {
    // التأكد من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // تشغيل التدقيق
    const report = await AccountingAuditService.run({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      agingDays: 30
    });

    // طباعة النتائج
    console.log('\n📊 نتائج التدقيق المحاسبي:');
    console.log('='.repeat(50));
    console.log(`إجمالي الفحوصات: ${report.total_tests}`);
    console.log(`نجح: ${report.passed}`);
    console.log(`فشل: ${report.failed}`);
    console.log(`عدد المخالفات: ${report.failures.length}`);

    if (report.failures.length > 0) {
      console.log('\n❌ المخالفات المكتشفة:');
      console.log('-'.repeat(50));
      
      // تجميع المخالفات حسب الخطورة
      const bySeverity = report.failures.reduce((acc, failure) => {
        acc[failure.severity] = acc[failure.severity] || [];
        acc[failure.severity].push(failure);
        return acc;
      }, {});

      Object.entries(bySeverity).forEach(([severity, failures]) => {
        console.log(`\n🔴 ${severity.toUpperCase()} (${failures.length}):`);
        failures.forEach((failure, index) => {
          console.log(`  ${index + 1}. ${failure.description}`);
          console.log(`     الحل: ${failure.remediation}`);
          if (failure.sql && failure.sql !== 'N/A') {
            console.log(`     SQL: ${failure.sql}`);
          }
          console.log('');
        });
      });
    } else {
      console.log('\n✅ لم يتم العثور على مخالفات محاسبية!');
    }

    // طباعة الملخص
    console.log('\n📈 ملخص البيانات:');
    console.log('-'.repeat(30));
    const summary = report.summary.counts;
    console.log(`القيود المعلنة: ${summary.postedJournalEntries}`);
    console.log(`القيود غير المتوازنة: ${summary.unbalancedJournalEntries}`);
    console.log(`الفواتير المفحوصة: ${summary.invoicesChecked}`);
    console.log(`الفواتير بدون GL: ${summary.invoicesMissingGL}`);
    console.log(`المدفوعات المفحوصة: ${summary.paymentsChecked}`);
    console.log(`المدفوعات بدون GL: ${summary.paymentsMissingGL}`);
    console.log(`العملاء بدون حسابات: ${summary.customersMissingAccount}`);
    console.log(`الحسابات غير النشطة ذات أرصدة: ${summary.inactiveAccountsWithBalance}`);
    console.log(`الأصول الثابتة المفحوصة: ${summary.fixedAssetsChecked}`);
    console.log(`مخالفات حدود الائتمان: ${summary.creditLimitBreaches}`);
    console.log(`الفواتير المتأخرة: ${summary.overdueInvoices}`);
    console.log(`العملة الأساسية: ${summary.baseCurrency}`);
    
    if (Math.abs(summary.glTotals.diff) > 0.01) {
      console.log(`\n⚠️  عدم توازن في ميزان المراجعة:`);
      console.log(`   المدين: ${summary.glTotals.debit}`);
      console.log(`   الدائن: ${summary.glTotals.credit}`);
      console.log(`   الفرق: ${summary.glTotals.diff}`);
    } else {
      console.log(`\n✅ ميزان المراجعة متوازن`);
    }

    // حفظ التقرير في ملف
    const reportPath = path.join(process.cwd(), 'audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n💾 تم حفظ التقرير الكامل في: ${reportPath}`);

    return report;
  } catch (error) {
    console.error('❌ خطأ في تشغيل التدقيق:', error);
    throw error;
  }
}

// تشغيل التدقيق إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit()
    .then(async () => {
      console.log('\n✅ انتهى التدقيق بنجاح');
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ فشل التدقيق:', error);
      await sequelize.close();
      process.exit(1);
    });
}

export default runAudit;
