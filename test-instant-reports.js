// Test script for instant reports endpoint
import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

async function testInstantReports() {
  console.log('🧪 Testing Instant Reports Endpoint...\n');

  try {
    // Test 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@goldenhorse.ly',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test 2: Get instant reports for today
    console.log('\n2️⃣ Testing instant reports for today...');
    const todayResponse = await fetch(`${baseURL}/api/financial/instant-reports?period=today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!todayResponse.ok) {
      const errorText = await todayResponse.text();
      console.log('❌ Today reports failed:', todayResponse.status);
      console.log('Error:', errorText);
      return;
    }

    const todayData = await todayResponse.json();
    console.log('✅ Today reports loaded successfully');
    console.log(`   Period: ${todayData.period?.label} (${todayData.period?.dateFrom} to ${todayData.period?.dateTo})`);
    
    // Check receipts
    if (todayData.receipts) {
      console.log(`   📈 Receipts: ${todayData.receipts.totalAmount} LYD (${todayData.receipts.count} transactions)`);
      console.log(`      Trend: ${todayData.receipts.trend}%`);
      console.log(`      Details: ${todayData.receipts.details?.length || 0} items`);
    }
    
    // Check payments
    if (todayData.payments) {
      console.log(`   📉 Payments: ${todayData.payments.totalAmount} LYD (${todayData.payments.count} transactions)`);
      console.log(`      Trend: ${todayData.payments.trend}%`);
      console.log(`      Details: ${todayData.payments.details?.length || 0} items`);
    }
    
    // Check revenue
    if (todayData.revenue) {
      console.log(`   💰 Revenue: ${todayData.revenue.totalAmount} LYD (${todayData.revenue.count} entries)`);
      console.log(`      Trend: ${todayData.revenue.trend}%`);
      console.log(`      Details: ${todayData.revenue.details?.length || 0} items`);
    }
    
    // Check receivables
    if (todayData.receivables) {
      console.log(`   🏦 Receivables: ${todayData.receivables.totalAmount} LYD (${todayData.receivables.count} accounts)`);
      console.log(`      Details: ${todayData.receivables.details?.length || 0} items`);
    }
    
    // Check payables
    if (todayData.payables) {
      console.log(`   📋 Payables: ${todayData.payables.totalAmount} LYD (${todayData.payables.count} accounts)`);
      console.log(`      Details: ${todayData.payables.details?.length || 0} items`);
    }
    
    // Check cash flow
    if (todayData.cashFlow) {
      console.log(`   💸 Cash Flow: ${todayData.cashFlow.totalAmount} LYD (${todayData.cashFlow.count} transactions)`);
      console.log(`      Trend: ${todayData.cashFlow.trend}%`);
      console.log(`      Details: ${todayData.cashFlow.details?.length || 0} items`);
    }

    // Test 3: Get instant reports for this month
    console.log('\n3️⃣ Testing instant reports for this month...');
    const monthResponse = await fetch(`${baseURL}/api/financial/instant-reports?period=month`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!monthResponse.ok) {
      const errorText = await monthResponse.text();
      console.log('❌ Month reports failed:', monthResponse.status);
      console.log('Error:', errorText);
      return;
    }

    const monthData = await monthResponse.json();
    console.log('✅ Month reports loaded successfully');
    console.log(`   Period: ${monthData.period?.label} (${monthData.period?.dateFrom} to ${monthData.period?.dateTo})`);
    console.log(`   Revenue: ${monthData.revenue?.totalAmount || 0} LYD`);
    console.log(`   Cash Flow: ${monthData.cashFlow?.totalAmount || 0} LYD`);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInstantReports();
