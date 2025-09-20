#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5001/api';

// بيانات تسجيل الدخول
const loginData = {
  email: 'admin@goldenhorse.ly',
  password: 'admin123'
};

async function testIncomeStatementAPI() {
  console.log('💰 اختبار قائمة الدخل عبر API...');
  console.log(`📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  
  let authToken = null;
  
  try {
    // 1. تسجيل الدخول للحصول على token
    console.log('\n🔐 تسجيل الدخول...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginResult = await loginResponse.json();
    authToken = loginResult.token;
    console.log('✅ تم تسجيل الدخول بنجاح');

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 2. اختبار قائمة الدخل
    console.log('\n📈 اختبار قائمة الدخل...');
    
    const dateFrom = '2025-01-01';
    const dateTo = '2025-12-31';
    
    try {
      const incomeStatementResponse = await fetch(`${API_BASE}/financial/reports/income-statement?dateFrom=${dateFrom}&dateTo=${dateTo}&currency=LYD`, {
        headers
      });
      
      console.log(`📡 استجابة API: ${incomeStatementResponse.status}`);
      
      if (incomeStatementResponse.ok) {
        const incomeStatement = await incomeStatementResponse.json();
        console.log('✅ قائمة الدخل تعمل');
        
        // عرض البيانات المستلمة
        console.log('\n📊 بيانات قائمة الدخل:');
        console.log('=====================================');
        
        if (incomeStatement.success) {
          // الـ route الجديد
          const data = incomeStatement.data;
          console.log(`الإيرادات: ${data.totals.totalRevenue} LYD`);
          console.log(`المصروفات: ${data.totals.totalExpenses} LYD`);
          console.log(`صافي الدخل: ${data.totals.netIncome} LYD`);
          console.log(`نسبة صافي الدخل: ${data.totals.netIncomePercentage?.toFixed(2)}%`);
          
          // التحقق من صحة البيانات
          const netIncomeCheck = data.totals.totalRevenue - data.totals.totalExpenses;
          const isNetIncomeCorrect = Math.abs(netIncomeCheck - data.totals.netIncome) < 0.01;
          
          console.log(`\n🔍 التحقق من الحسابات:`);
          console.log(`   حساب صافي الدخل: ${netIncomeCheck.toFixed(2)} LYD`);
          console.log(`   صافي الدخل المعروض: ${data.totals.netIncome} LYD`);
          console.log(`   صحة الحساب: ${isNetIncomeCorrect ? '✅' : '❌'}`);
          
          // عرض تفاصيل الحسابات
          if (data.accounts && data.accounts.length > 0) {
            console.log(`\n📋 تفاصيل الحسابات (${data.accounts.length} حساب):`);
            console.log('الكود | الاسم | النوع | الرصيد');
            console.log('-----|------|------|-------');
            
            data.accounts.forEach(account => {
              if (account.balance > 0) {
                console.log(`${account.code} | ${account.name.substring(0, 20)} | ${account.type} | ${account.balance.toFixed(2)}`);
              }
            });
          }
          
        } else {
          // الـ route القديم
          console.log(`الإيرادات: ${incomeStatement.totals?.totalRevenue || 0} LYD`);
          console.log(`المصروفات: ${incomeStatement.totals?.totalExpenses || 0} LYD`);
          console.log(`صافي الدخل: ${incomeStatement.totals?.netIncome || 0} LYD`);
          
          // عرض تفاصيل الإيرادات
          if (incomeStatement.revenues && incomeStatement.revenues.length > 0) {
            console.log(`\n💰 الإيرادات (${incomeStatement.revenues.length} حساب):`);
            incomeStatement.revenues.forEach(rev => {
              console.log(`   ${rev.accountName}: ${rev.amount.toFixed(2)} LYD`);
            });
          }
          
          // عرض تفاصيل المصروفات
          if (incomeStatement.expenses && incomeStatement.expenses.length > 0) {
            console.log(`\n💸 المصروفات (${incomeStatement.expenses.length} حساب):`);
            incomeStatement.expenses.forEach(exp => {
              console.log(`   ${exp.accountName}: ${exp.amount.toFixed(2)} LYD`);
            });
          }
        }
        
        console.log('=====================================');
        
        // التحقق من أن صافي الدخل رقم صحيح
        const netIncome = incomeStatement.success ? 
          incomeStatement.data.totals.netIncome : 
          incomeStatement.totals?.netIncome;
          
        if (typeof netIncome === 'number' && !isNaN(netIncome) && isFinite(netIncome)) {
          console.log(`✅ صافي الدخل رقم صحيح: ${netIncome.toFixed(2)} LYD`);
        } else {
          console.log(`❌ صافي الدخل ليس رقماً صحيحاً: ${netIncome}`);
          console.log(`   النوع: ${typeof netIncome}`);
          console.log(`   isNaN: ${isNaN(netIncome)}`);
          console.log(`   isFinite: ${isFinite(netIncome)}`);
        }
        
      } else {
        const errorText = await incomeStatementResponse.text();
        console.log(`❌ قائمة الدخل فشلت: ${incomeStatementResponse.status}`);
        console.log(`   الخطأ: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ خطأ في قائمة الدخل: ${error.message}`);
    }

    // 3. اختبار مع معاملات مختلفة
    console.log('\n🔄 اختبار مع معاملات مختلفة...');
    
    const testParams = [
      { fromDate: '2025-01-01', toDate: '2025-09-18', desc: 'من بداية السنة حتى اليوم' },
      { fromDate: '2025-09-01', toDate: '2025-09-18', desc: 'الشهر الحالي' },
      { includeHierarchy: 'true', desc: 'مع التسلسل الهرمي' }
    ];
    
    for (const params of testParams) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE}/financial/reports/income-statement?${queryString}`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          const netIncome = data.success ? data.data.totals.netIncome : data.totals?.netIncome;
          console.log(`   ${params.desc}: صافي الدخل = ${netIncome?.toFixed(2) || 'غير محدد'} LYD`);
        } else {
          console.log(`   ${params.desc}: فشل (${response.status})`);
        }
      } catch (error) {
        console.log(`   ${params.desc}: خطأ - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام في اختبار API:', error.message);
  }
}

// تشغيل اختبار API
testIncomeStatementAPI()
  .then(() => {
    console.log('\n✅ انتهى اختبار قائمة الدخل عبر API');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل اختبار قائمة الدخل عبر API:', error);
    process.exit(1);
  });
