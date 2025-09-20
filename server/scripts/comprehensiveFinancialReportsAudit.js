import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const API_BASE = 'http://localhost:5001/api';

async function comprehensiveFinancialReportsAudit() {
  try {
    await sequelize.authenticate();
    console.log('🔍 بدء الفحص الشامل للتقارير المالية...\n');

    // 1. فحص endpoints التقارير المالية
    console.log('📊 1. فحص endpoints التقارير المالية:');
    console.log('=' .repeat(50));

    const reportEndpoints = [
      { name: 'ميزان المراجعة', url: '/financial/reports/trial-balance?dateFrom=2025-01-01&dateTo=2025-12-31' },
      { name: 'ميزان المراجعة الافتتاحي', url: '/financial/reports/opening-trial-balance?asOfDate=2025-12-31&currency=LYD' },
      { name: 'قائمة الدخل', url: '/financial/reports/income-statement?dateFrom=2025-01-01&dateTo=2025-12-31' },
      { name: 'الميزانية العمومية', url: '/financial/reports/balance-sheet?asOfDate=2025-12-31' },
      { name: 'قيود دفتر الأستاذ', url: '/financial/reports/gl-entries?limit=10' },
      { name: 'التقارير الفورية', url: '/financial/instant-reports?period=month' },
      { name: 'تفاصيل المدينون', url: '/financial/receivables-details?period=month&limit=10' },
      { name: 'ميزان المراجعة الديناميكي', url: '/financial/reports/trial-balance-dynamic?asOfDate=2025-12-31' }
    ];

    const results = [];

    for (const endpoint of reportEndpoints) {
      try {
        console.log(`\n🔗 اختبار: ${endpoint.name}`);
        const response = await fetch(`${API_BASE}${endpoint.url}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint.name}: يعمل بنجاح`);
          
          // تحليل البيانات
          if (data.data) {
            if (Array.isArray(data.data)) {
              console.log(`   📈 عدد السجلات: ${data.data.length}`);
            } else if (data.data.accounts) {
              console.log(`   📈 عدد الحسابات: ${data.data.accounts.length}`);
              if (data.data.totals) {
                console.log(`   💰 إجمالي المدين: ${data.data.totals.totalDebit || 0}`);
                console.log(`   💰 إجمالي الدائن: ${data.data.totals.totalCredit || 0}`);
                console.log(`   ⚖️ متوازن: ${data.data.totals.isBalanced ? 'نعم' : 'لا'}`);
              }
            }
          }
          
          results.push({ name: endpoint.name, status: 'success', data: data });
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.log(`   ❌ ${endpoint.name}: فشل (${response.status})`);
          console.log(`   📝 الخطأ: ${errorData.message || 'خطأ غير معروف'}`);
          results.push({ name: endpoint.name, status: 'error', error: errorData.message, code: response.status });
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: خطأ في الاتصال`);
        console.log(`   📝 الخطأ: ${error.message}`);
        results.push({ name: endpoint.name, status: 'connection_error', error: error.message });
      }
    }

    // 2. فحص قاعدة البيانات
    console.log('\n\n🗄️ 2. فحص قاعدة البيانات:');
    console.log('=' .repeat(50));

    // فحص الجداول المطلوبة
    const requiredTables = ['accounts', 'gl_entries', 'customers', 'invoices'];
    console.log('\n📋 فحص الجداول المطلوبة:');
    
    for (const table of requiredTables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${result[0].count} سجل`);
      } catch (error) {
        console.log(`   ❌ ${table}: غير موجود أو خطأ - ${error.message}`);
      }
    }

    // فحص أنواع القسائم
    console.log('\n📝 فحص أنواع القسائم المسموحة:');
    try {
      const [voucherTypes] = await sequelize.query(`
        SELECT enumlabel as voucher_type
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'enum_gl_entries_voucherType'
        )
        ORDER BY enumsortorder
      `);
      
      console.log('   📋 الأنواع المسموحة:');
      voucherTypes.forEach(type => {
        console.log(`      - ${type.voucher_type}`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في جلب أنواع القسائم: ${error.message}`);
    }

    // فحص القيود الموجودة
    console.log('\n💼 فحص القيود الموجودة:');
    try {
      const [entriesStats] = await sequelize.query(`
        SELECT 
          "voucherType", 
          COUNT(*) as count,
          SUM(CAST(debit AS DECIMAL)) as total_debit,
          SUM(CAST(credit AS DECIMAL)) as total_credit
        FROM gl_entries 
        WHERE "isCancelled" = false
        GROUP BY "voucherType"
        ORDER BY count DESC
      `);
      
      entriesStats.forEach(stat => {
        console.log(`   📊 ${stat.voucherType}: ${stat.count} قيد - مدين: ${parseFloat(stat.total_debit || 0).toFixed(2)} - دائن: ${parseFloat(stat.total_credit || 0).toFixed(2)}`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في إحصائيات القيود: ${error.message}`);
    }

    // 3. فحص التوازن المحاسبي
    console.log('\n\n⚖️ 3. فحص التوازن المحاسبي:');
    console.log('=' .repeat(50));

    try {
      const [balanceCheck] = await sequelize.query(`
        SELECT 
          SUM(CAST(debit AS DECIMAL)) as total_debit,
          SUM(CAST(credit AS DECIMAL)) as total_credit,
          SUM(CAST(debit AS DECIMAL)) - SUM(CAST(credit AS DECIMAL)) as difference
        FROM gl_entries 
        WHERE "isCancelled" = false
      `);
      
      const balance = balanceCheck[0];
      const totalDebit = parseFloat(balance.total_debit || 0);
      const totalCredit = parseFloat(balance.total_credit || 0);
      const difference = parseFloat(balance.difference || 0);
      
      console.log(`   💰 إجمالي المدين: ${totalDebit.toFixed(2)} د.ل`);
      console.log(`   💰 إجمالي الدائن: ${totalCredit.toFixed(2)} د.ل`);
      console.log(`   📊 الفرق: ${difference.toFixed(2)} د.ل`);
      
      if (Math.abs(difference) < 0.01) {
        console.log('   ✅ النظام متوازن محاسبياً');
      } else {
        console.log('   ❌ النظام غير متوازن محاسبياً - يحتاج مراجعة');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص التوازن: ${error.message}`);
    }

    // 4. ملخص النتائج
    console.log('\n\n📋 4. ملخص نتائج الفحص:');
    console.log('=' .repeat(50));

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const connectionErrorCount = results.filter(r => r.status === 'connection_error').length;

    console.log(`\n📊 إحصائيات الفحص:`);
    console.log(`   ✅ تقارير تعمل بنجاح: ${successCount}/${results.length}`);
    console.log(`   ❌ تقارير بها أخطاء: ${errorCount}/${results.length}`);
    console.log(`   🔌 أخطاء اتصال: ${connectionErrorCount}/${results.length}`);

    if (errorCount > 0 || connectionErrorCount > 0) {
      console.log(`\n🚨 التقارير التي تحتاج إصلاح:`);
      results.filter(r => r.status !== 'success').forEach(result => {
        console.log(`   ❌ ${result.name}: ${result.error || 'خطأ غير معروف'}`);
      });
    }

    console.log('\n🎯 التوصيات:');
    if (errorCount === 0 && connectionErrorCount === 0) {
      console.log('   🎉 جميع التقارير تعمل بشكل صحيح!');
    } else {
      console.log('   🔧 يجب إصلاح التقارير المعطلة');
      console.log('   📊 مراجعة البيانات والتوازن المحاسبي');
      console.log('   🔍 فحص logs الخادم للأخطاء التفصيلية');
    }

  } catch (error) {
    console.error('❌ خطأ عام في الفحص:', error.message);
  } finally {
    await sequelize.close();
  }
}

comprehensiveFinancialReportsAudit();
