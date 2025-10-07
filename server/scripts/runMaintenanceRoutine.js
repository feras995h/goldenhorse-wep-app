#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// تحميل متغيرات البيئة
dotenv.config();

// استخدم متغيرات البيئة بدلاً من hardcoded credentials
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@host:5432/database';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function runMaintenanceRoutine() {
  console.log('🔧 بدء تشغيل روتين الصيانة الدورية...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  
  const maintenanceReport = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    routines: [],
    summary: {
      total: 0,
      successful: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. تشغيل التدقيق السريع
    console.log('\n🔍 تشغيل التدقيق السريع...');
    maintenanceReport.routines.push({
      name: 'التدقيق السريع',
      startTime: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const { stdout, stderr } = await execAsync('node scripts/quickAudit.js');
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'success',
        endTime: new Date().toISOString(),
        output: stdout,
        errors: stderr || null
      };
      maintenanceReport.summary.successful++;
      console.log('✅ التدقيق السريع مكتمل');
    } catch (error) {
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message
      };
      maintenanceReport.summary.failed++;
      console.log('❌ فشل التدقيق السريع:', error.message);
    }
    maintenanceReport.summary.total++;

    // 2. تشغيل تقارير المراجعة
    console.log('\n📊 تشغيل تقارير المراجعة...');
    maintenanceReport.routines.push({
      name: 'تقارير المراجعة',
      startTime: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const { stdout, stderr } = await execAsync('node scripts/generateControlReports.js');
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'success',
        endTime: new Date().toISOString(),
        output: stdout,
        errors: stderr || null
      };
      maintenanceReport.summary.successful++;
      console.log('✅ تقارير المراجعة مكتملة');
    } catch (error) {
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message
      };
      maintenanceReport.summary.failed++;
      console.log('❌ فشل تقارير المراجعة:', error.message);
    }
    maintenanceReport.summary.total++;

    // 3. فحص سجلات التدقيق
    console.log('\n📝 فحص سجلات التدقيق...');
    maintenanceReport.routines.push({
      name: 'فحص سجلات التدقيق',
      startTime: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const [auditStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as today_logs,
          COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_logs,
          COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as delete_logs,
          COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as update_logs,
          COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as create_logs
        FROM audit_logs
      `);
      
      const stats = auditStats[0];
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'success',
        endTime: new Date().toISOString(),
        data: {
          totalLogs: parseInt(stats.total_logs),
          todayLogs: parseInt(stats.today_logs),
          weekLogs: parseInt(stats.week_logs),
          deleteLogs: parseInt(stats.delete_logs),
          updateLogs: parseInt(stats.update_logs),
          createLogs: parseInt(stats.create_logs)
        }
      };
      
      if (parseInt(stats.today_logs) === 0) {
        maintenanceReport.summary.warnings++;
        console.log('⚠️ لا توجد سجلات تدقيق اليوم');
      } else {
        console.log(`✅ يوجد ${stats.today_logs} سجل تدقيق اليوم`);
      }
      
      maintenanceReport.summary.successful++;
    } catch (error) {
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message
      };
      maintenanceReport.summary.failed++;
      console.log('❌ فشل فحص سجلات التدقيق:', error.message);
    }
    maintenanceReport.summary.total++;

    // 4. فحص أسعار الصرف
    console.log('\n💱 فحص أسعار الصرف...');
    maintenanceReport.routines.push({
      name: 'فحص أسعار الصرف',
      startTime: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const [exchangeRateStats] = await sequelize.query(`
        SELECT
          COUNT(DISTINCT c.id) as total_currencies,
          COUNT(DISTINCT er."fromCurrencyId") as currencies_with_rates,
          COUNT(CASE WHEN er."effectiveDate" = CURRENT_DATE THEN 1 END) as today_rates,
          COUNT(CASE WHEN er."effectiveDate" >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_rates
        FROM currencies c
        LEFT JOIN exchange_rates er ON c.id = er."fromCurrencyId"
        WHERE c."isActive" = TRUE
      `);
      
      const stats = exchangeRateStats[0];
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'success',
        endTime: new Date().toISOString(),
        data: {
          totalCurrencies: parseInt(stats.total_currencies),
          currenciesWithRates: parseInt(stats.currencies_with_rates),
          todayRates: parseInt(stats.today_rates),
          weekRates: parseInt(stats.week_rates)
        }
      };
      
      const missingRates = parseInt(stats.total_currencies) - parseInt(stats.currencies_with_rates);
      if (missingRates > 1) { // استثناء العملة الأساسية
        maintenanceReport.summary.warnings++;
        console.log(`⚠️ يوجد ${missingRates} عملة بدون أسعار صرف`);
      } else {
        console.log('✅ أسعار الصرف محدثة');
      }
      
      maintenanceReport.summary.successful++;
    } catch (error) {
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message
      };
      maintenanceReport.summary.failed++;
      console.log('❌ فشل فحص أسعار الصرف:', error.message);
    }
    maintenanceReport.summary.total++;

    // 5. فحص الفترات المحاسبية
    console.log('\n📅 فحص الفترات المحاسبية...');
    maintenanceReport.routines.push({
      name: 'فحص الفترات المحاسبية',
      startTime: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const [periodStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_periods,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_periods,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_periods,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_periods
        FROM accounting_periods
      `);
      
      const stats = periodStats[0];
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'success',
        endTime: new Date().toISOString(),
        data: {
          totalPeriods: parseInt(stats.total_periods),
          openPeriods: parseInt(stats.open_periods),
          closedPeriods: parseInt(stats.closed_periods),
          archivedPeriods: parseInt(stats.archived_periods)
        }
      };
      
      if (parseInt(stats.open_periods) > 2) {
        maintenanceReport.summary.warnings++;
        console.log(`⚠️ يوجد ${stats.open_periods} فترة مفتوحة - يُنصح بإقفال الفترات القديمة`);
      } else {
        console.log(`✅ يوجد ${stats.open_periods} فترة مفتوحة`);
      }
      
      maintenanceReport.summary.successful++;
    } catch (error) {
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message
      };
      maintenanceReport.summary.failed++;
      console.log('❌ فشل فحص الفترات المحاسبية:', error.message);
    }
    maintenanceReport.summary.total++;

    // 6. فحص الأصول الثابتة والإهلاك
    console.log('\n🏢 فحص الأصول الثابتة والإهلاك...');
    maintenanceReport.routines.push({
      name: 'فحص الأصول الثابتة والإهلاك',
      startTime: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const [assetStats] = await sequelize.query(`
        SELECT
          COUNT(fa.*) as total_assets,
          COUNT(ds.id) as assets_with_depreciation,
          COUNT(CASE WHEN ds.status = 'active' THEN 1 END) as active_depreciation,
          COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) as completed_depreciation
        FROM fixed_assets fa
        LEFT JOIN depreciation_schedules ds ON fa.id = ds."fixedAssetId"
        WHERE fa.status = 'active'
      `);
      
      const stats = assetStats[0];
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'success',
        endTime: new Date().toISOString(),
        data: {
          totalAssets: parseInt(stats.total_assets),
          assetsWithDepreciation: parseInt(stats.assets_with_depreciation),
          activeDepreciation: parseInt(stats.active_depreciation),
          completedDepreciation: parseInt(stats.completed_depreciation)
        }
      };
      
      const assetsWithoutDepreciation = parseInt(stats.total_assets) - parseInt(stats.assets_with_depreciation);
      if (assetsWithoutDepreciation > 0) {
        maintenanceReport.summary.warnings++;
        console.log(`⚠️ يوجد ${assetsWithoutDepreciation} أصل ثابت بدون جدولة إهلاك`);
      } else {
        console.log('✅ جميع الأصول الثابتة لها جدولة إهلاك');
      }
      
      maintenanceReport.summary.successful++;
    } catch (error) {
      maintenanceReport.routines[maintenanceReport.routines.length - 1] = {
        ...maintenanceReport.routines[maintenanceReport.routines.length - 1],
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message
      };
      maintenanceReport.summary.failed++;
      console.log('❌ فشل فحص الأصول الثابتة:', error.message);
    }
    maintenanceReport.summary.total++;

    // حفظ تقرير الصيانة
    const reportFileName = `maintenance-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(maintenanceReport, null, 2), 'utf8');
    
    // عرض الملخص النهائي
    console.log('\n🎉 انتهى روتين الصيانة الدورية!');
    console.log(`📊 الملخص: ${maintenanceReport.summary.successful}/${maintenanceReport.summary.total} نجح`);
    
    if (maintenanceReport.summary.warnings > 0) {
      console.log(`⚠️ تحذيرات: ${maintenanceReport.summary.warnings}`);
    }
    
    if (maintenanceReport.summary.failed > 0) {
      console.log(`❌ فشل: ${maintenanceReport.summary.failed}`);
    }
    
    console.log(`📄 تم حفظ تقرير الصيانة في: ${reportFileName}`);
    
    // تحديد حالة النظام العامة
    let systemStatus = 'ممتاز';
    if (maintenanceReport.summary.failed > 0) {
      systemStatus = 'يحتاج مراجعة';
    } else if (maintenanceReport.summary.warnings > 2) {
      systemStatus = 'جيد مع ملاحظات';
    }
    
    console.log(`🎯 حالة النظام: ${systemStatus}`);
    
    return maintenanceReport;

  } catch (error) {
    console.error('❌ خطأ في تشغيل روتين الصيانة:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل روتين الصيانة
runMaintenanceRoutine()
  .then((report) => {
    const exitCode = report.summary.failed > 0 ? 1 : 0;
    console.log(`\n🎉 انتهى روتين الصيانة بنجاح`);
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n💥 فشل روتين الصيانة:', error);
    process.exit(1);
  });
