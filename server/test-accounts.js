import fetch from 'node-fetch';

async function testAccountsEndpoint() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing Accounts endpoint...\n');

  try {
    // Test 1: Login to get token
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    const token = loginData.accessToken;

    // Test 2: Get accounts
    console.log('\n2️⃣ Testing GET /api/financial/accounts...');
    const getAccountsResponse = await fetch(`${baseURL}/api/financial/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (getAccountsResponse.ok) {
      const accountsData = await getAccountsResponse.json();
      console.log('✅ GET accounts successful');
      console.log('Accounts count:', accountsData.data?.length || 0);
    } else {
      const errorText = await getAccountsResponse.text();
      console.log('❌ GET accounts failed:', getAccountsResponse.status);
      console.log('Error:', errorText);
    }

    // Test 3: Create a simple account
    console.log('\n3️⃣ Testing POST /api/financial/accounts...');
    const testAccount = {
      code: 'TEST001',
      name: 'حساب تجريبي',
      type: 'asset',
      isGroup: false,
      level: 1,
      nature: 'debit',
      accountType: 'main'
    };

    const createAccountResponse = await fetch(`${baseURL}/api/financial/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testAccount)
    });

    if (createAccountResponse.ok) {
      const createdAccount = await createAccountResponse.json();
      console.log('✅ POST account successful');
      console.log('Created account:', createdAccount.data?.code, createdAccount.data?.name);
    } else {
      const errorText = await createAccountResponse.text();
      console.log('❌ POST account failed:', createAccountResponse.status);
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
  }
}

testAccountsEndpoint();
