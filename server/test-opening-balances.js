import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api';

// Test login first
async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Login successful');
      return data.token;
    } else {
      console.error('❌ Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

// Test get opening balances
async function testGetOpeningBalances(token) {
  try {
    const response = await fetch(`${BASE_URL}/financial/opening-balances`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Get opening balances successful');
      console.log('📊 Found', data.data?.length || 0, 'opening balance entries');
      return true;
    } else {
      console.error('❌ Get opening balances failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Get opening balances error:', error.message);
    return false;
  }
}

// Test create opening balance entry
async function testCreateOpeningBalanceEntry(token) {
  try {
    // First get some accounts
    const accountsResponse = await fetch(`${BASE_URL}/financial/accounts?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const accountsData = await accountsResponse.json();
    if (!accountsResponse.ok || !accountsData.data || accountsData.data.length < 2) {
      console.error('❌ Need at least 2 accounts to test opening balance entry');
      return false;
    }

    const accounts = accountsData.data;
    console.log('📋 Using accounts:', accounts.slice(0, 2).map(a => `${a.code} - ${a.name}`));

    // Create test opening balance entry
    const testEntry = {
      date: new Date().toISOString().split('T')[0],
      description: 'قيد افتتاحي تجريبي',
      reference: `TEST-OB-${Date.now()}`,
      currency: 'LYD',
      lines: [
        {
          accountId: accounts[0].id,
          debit: 1000,
          credit: 0,
          description: 'رصيد افتتاحي مدين',
          notes: 'اختبار'
        },
        {
          accountId: accounts[1].id,
          debit: 0,
          credit: 1000,
          description: 'رصيد افتتاحي دائن',
          notes: 'اختبار'
        }
      ]
    };

    const response = await fetch(`${BASE_URL}/financial/opening-balance-entry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEntry)
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Create opening balance entry successful');
      console.log('📄 Voucher No:', data.voucherNo);
      console.log('💰 Total Debit:', data.totalDebit, 'LYD');
      console.log('💰 Total Credit:', data.totalCredit, 'LYD');
      console.log('📝 Lines Count:', data.linesCount);
      return true;
    } else {
      console.error('❌ Create opening balance entry failed:', data.message);
      if (data.error) console.error('🔍 Error details:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Create opening balance entry error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing Opening Balance API endpoints...\n');

  const token = await login();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  console.log('\n--- Testing GET /api/financial/opening-balances ---');
  await testGetOpeningBalances(token);

  console.log('\n--- Testing POST /api/financial/opening-balance-entry ---');
  await testCreateOpeningBalanceEntry(token);

  console.log('\n🎉 Opening Balance API tests completed!');
}

runTests().catch(console.error);
