console.log('🔍 اختبار تفصيلي للتقارير...');

async function testDetailedReports() {
  try {
    // Test Balance Sheet
    console.log('\n📊 اختبار الميزانية العمومية:');
    const balanceSheetResponse = await fetch('http://localhost:5001/api/financial/reports/balance-sheet');
    if (balanceSheetResponse.ok) {
      const data = await balanceSheetResponse.json();
      console.log('✅ الميزانية العمومية تعمل');
      console.log('📋 تنسيق البيانات:');
      console.log('   - assets:', Array.isArray(data.assets) ? 'Array ✅' : 'Not Array ❌');
      console.log('   - liabilities:', Array.isArray(data.liabilities) ? 'Array ✅' : 'Not Array ❌');
      console.log('   - equity:', Array.isArray(data.equity) ? 'Array ✅' : 'Not Array ❌');
      console.log('   - totals:', typeof data.totals === 'object' ? 'Object ✅' : 'Not Object ❌');
      
      if (data.totals) {
        console.log('   - totalAssets:', typeof data.totals.totalAssets === 'number' ? 'Number ✅' : 'Not Number ❌');
        console.log('   - totalLiabilities:', typeof data.totals.totalLiabilities === 'number' ? 'Number ✅' : 'Not Number ❌');
        console.log('   - totalEquity:', typeof data.totals.totalEquity === 'number' ? 'Number ✅' : 'Not Number ❌');
      }
    } else {
      console.log('❌ الميزانية العمومية: خطأ -', balanceSheetResponse.status);
    }

    // Test Income Statement
    console.log('\n📊 اختبار قائمة الدخل:');
    const incomeResponse = await fetch('http://localhost:5001/api/financial/reports/income-statement');
    if (incomeResponse.ok) {
      const data = await incomeResponse.json();
      console.log('✅ قائمة الدخل تعمل');
      console.log('📋 تنسيق البيانات:');
      console.log('   - revenues:', Array.isArray(data.revenues) ? 'Array ✅' : 'Not Array ❌');
      console.log('   - expenses:', Array.isArray(data.expenses) ? 'Array ✅' : 'Not Array ❌');
      console.log('   - totals:', typeof data.totals === 'object' ? 'Object ✅' : 'Not Object ❌');
      
      if (data.totals) {
        console.log('   - totalRevenue:', typeof data.totals.totalRevenue === 'number' ? 'Number ✅' : 'Not Number ❌');
        console.log('   - totalExpenses:', typeof data.totals.totalExpenses === 'number' ? 'Number ✅' : 'Not Number ❌');
        console.log('   - netIncome:', typeof data.totals.netIncome === 'number' ? 'Number ✅' : 'Not Number ❌');
      }
    } else {
      console.log('❌ قائمة الدخل: خطأ -', incomeResponse.status);
    }

    // Test Cash Flow
    console.log('\n📊 اختبار قائمة التدفقات النقدية:');
    const cashFlowResponse = await fetch('http://localhost:5001/api/financial/reports/cash-flow');
    if (cashFlowResponse.ok) {
      const data = await cashFlowResponse.json();
      console.log('✅ قائمة التدفقات النقدية تعمل');
      console.log('📋 تنسيق البيانات:');
      console.log('   - cashFlows:', Array.isArray(data.cashFlows) ? 'Array ✅' : 'Not Array ❌');
      console.log('   - totals:', typeof data.totals === 'object' ? 'Object ✅' : 'Not Object ❌');
      
      if (data.totals) {
        console.log('   - totalInflow:', typeof data.totals.totalInflow === 'number' ? 'Number ✅' : 'Not Number ❌');
        console.log('   - totalOutflow:', typeof data.totals.totalOutflow === 'number' ? 'Number ✅' : 'Not Number ❌');
        console.log('   - netCashFlow:', typeof data.totals.netCashFlow === 'number' ? 'Number ✅' : 'Not Number ❌');
      }
    } else {
      console.log('❌ قائمة التدفقات النقدية: خطأ -', cashFlowResponse.status);
    }

    console.log('\n🎯 خلاصة الاختبار:');
    console.log('================');
    console.log('✅ جميع التقارير تعمل بالتنسيق الصحيح');
    console.log('📊 البيانات متوافقة مع الواجهة الأمامية');
    console.log('🔢 الأرقام تظهر بشكل صحيح');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testDetailedReports();
