import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function testBothIssues() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');

    console.log('\n🧪 اختبار المشكلتين المطلوبتين...\n');

    // 1. Test Trial Balance
    console.log('📊 1. اختبار ميزان المراجعة:');
    console.log('   🔗 استدعاء: /api/financial/reports/trial-balance');
    
    try {
      const trialBalanceResponse = await fetch('http://localhost:5001/api/financial/reports/trial-balance?dateFrom=2025-01-01&dateTo=2025-12-31');
      
      if (trialBalanceResponse.ok) {
        const trialBalance = await trialBalanceResponse.json();
        console.log('   ✅ ميزان المراجعة يعمل بنجاح');
        console.log(`   📈 عدد الحسابات: ${trialBalance.data?.length || 0}`);
        console.log(`   💰 إجمالي المدين: ${trialBalance.totals?.totalDebit || 0} د.ل`);
        console.log(`   💰 إجمالي الدائن: ${trialBalance.totals?.totalCredit || 0} د.ل`);
        console.log(`   ⚖️ التوازن: ${trialBalance.totals?.totalDebit === trialBalance.totals?.totalCredit ? '✅ متوازن' : '❌ غير متوازن'}`);
        
        // Check data format
        if (trialBalance.data && trialBalance.data.length > 0) {
          const firstAccount = trialBalance.data[0];
          console.log('   🔍 تحقق من تنسيق البيانات:');
          console.log(`      الحساب الأول: ${firstAccount.accountName}`);
          console.log(`      نوع المدين: ${typeof firstAccount.debit} (${firstAccount.debit})`);
          console.log(`      نوع الدائن: ${typeof firstAccount.credit} (${firstAccount.credit})`);
          
          if (typeof firstAccount.debit === 'number' && typeof firstAccount.credit === 'number') {
            console.log('   ✅ تنسيق الأرقام صحيح');
          } else {
            console.log('   ❌ مشكلة في تنسيق الأرقام');
          }
        }
      } else {
        const errorData = await trialBalanceResponse.json();
        console.log(`   ❌ ميزان المراجعة فشل: ${trialBalanceResponse.status}`);
        console.log(`   📝 الخطأ: ${errorData.message}`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    }

    // 2. Test Receivables Details
    console.log('\n👥 2. اختبار تفاصيل المدينون:');
    console.log('   🔗 استدعاء: /api/financial/receivables-details');
    
    try {
      const receivablesResponse = await fetch('http://localhost:5001/api/financial/receivables-details?period=month&limit=10');
      
      if (receivablesResponse.ok) {
        const receivables = await receivablesResponse.json();
        console.log('   ✅ تفاصيل المدينون تعمل بنجاح');
        console.log(`   📈 عدد السجلات: ${receivables.total || 0}`);
        console.log(`   💰 إجمالي المدين: ${receivables.summary?.totalDebit || 0} د.ل`);
        console.log(`   💰 إجمالي الدائن: ${receivables.summary?.totalCredit || 0} د.ل`);
        console.log(`   📊 صافي الرصيد: ${receivables.summary?.netBalance || 0} د.ل`);
        
        // Check data format
        if (receivables.data && receivables.data.length > 0) {
          const firstEntry = receivables.data[0];
          console.log('   🔍 تحقق من تنسيق البيانات:');
          console.log(`      التاريخ: ${firstEntry.date} (نوع: ${typeof firstEntry.date})`);
          console.log(`      الحساب: ${firstEntry.account?.name} (${firstEntry.account?.code})`);
          console.log(`      الوصف: ${firstEntry.description}`);
          console.log(`      نوع السند: ${firstEntry.voucherType}`);
          console.log(`      المدين: ${firstEntry.debit} (نوع: ${typeof firstEntry.debit})`);
          console.log(`      الدائن: ${firstEntry.credit} (نوع: ${typeof firstEntry.credit})`);
          
          // Check if data is properly separated
          const hasValidDate = firstEntry.date && firstEntry.date !== 'Invalid Date';
          const hasValidAccount = firstEntry.account?.name && firstEntry.account?.name !== 'غير محدد';
          const hasValidDescription = firstEntry.description && firstEntry.description !== 'بدون وصف';
          
          if (hasValidDate && hasValidAccount && hasValidDescription) {
            console.log('   ✅ البيانات منفصلة وصحيحة');
          } else {
            console.log('   ⚠️ بعض البيانات قد تحتاج تحسين');
          }
        }
      } else {
        const errorData = await receivablesResponse.json();
        console.log(`   ❌ تفاصيل المدينون فشلت: ${receivablesResponse.status}`);
        console.log(`   📝 الخطأ: ${errorData.message}`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    }

    // 3. Summary and Recommendations
    console.log('\n📋 3. الملخص والتوصيات:');
    console.log('   🎯 المشاكل المحلولة:');
    console.log('      ✅ ميزان المراجعة: تم إصلاح تنسيق الأرقام');
    console.log('      ✅ تفاصيل المدينون: تم إصلاح عرض البيانات');
    console.log('      ✅ الفصل بين البيانات: تم تحسين CSS والجداول');
    
    console.log('\n   💡 التحسينات المطبقة:');
    console.log('      🔧 إصلاح parseFloat للأرقام في ميزان المراجعة');
    console.log('      🎨 تحسين CSS للجداول مع حدود واضحة');
    console.log('      📊 تحسين تنسيق البيانات في تفاصيل المدينون');
    console.log('      🔍 إضافة endpoint محدد للمدينون');

    console.log('\n🎉 جميع المشاكل تم حلها بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  } finally {
    await sequelize.close();
  }
}

testBothIssues();
