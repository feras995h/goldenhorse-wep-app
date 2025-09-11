import fetch from 'node-fetch';

async function testEndpoints() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing API endpoints...\n');

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

    // Test 2: Settings endpoint
    console.log('\n2️⃣ Testing /api/settings...');
    const settingsResponse = await fetch(`${baseURL}/api/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json();
      console.log('✅ Settings endpoint working');
      console.log('Settings:', JSON.stringify(settingsData, null, 2));
    } else {
      console.log('❌ Settings endpoint failed:', settingsResponse.status);
    }

    // Test 3: Financial summary endpoint
    console.log('\n3️⃣ Testing /api/financial/summary...');
    const financialResponse = await fetch(`${baseURL}/api/financial/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (financialResponse.ok) {
      const financialData = await financialResponse.json();
      console.log('✅ Financial summary endpoint working');
      console.log('Financial summary:', JSON.stringify(financialData, null, 2));
    } else {
      console.log('❌ Financial summary endpoint failed:', financialResponse.status);
    }

    // Test 4: Sales summary endpoint
    console.log('\n4️⃣ Testing /api/sales/summary...');
    const salesResponse = await fetch(`${baseURL}/api/sales/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      console.log('✅ Sales summary endpoint working');
      console.log('Sales summary:', JSON.stringify(salesData, null, 2));
    } else {
      console.log('❌ Sales summary endpoint failed:', salesResponse.status);
    }

    // Test 5: Health check
    console.log('\n5️⃣ Testing /health...');
    const healthResponse = await fetch(`${baseURL}/health`);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working');
      console.log('Health:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
    console.log('Run: node start-server.js');
  }
}

testEndpoints();
