import fetch from 'node-fetch';

console.log('🔍 TESTING PRODUCTION API ENDPOINTS');
console.log('===================================');

const baseURL = 'https://web.goldenhorse-ly.com';

async function testEndpoints() {
  try {
    // First test if the server is responsive
    console.log('1️⃣ Testing server health...');
    try {
      const healthResponse = await fetch(`${baseURL}/api/health`);
      console.log(`   Status: ${healthResponse.status}`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('   ✅ Server is responding');
        console.log('   Database status:', healthData.database?.status || 'unknown');
      } else {
        console.log('   ❌ Server health check failed');
      }
    } catch (error) {
      console.log('   ❌ Server unreachable:', error.message);
      return;
    }

    // Test login to get a token
    console.log('\n2️⃣ Testing authentication...');
    let token = null;
    try {
      console.log('   Attempting login with username: admin, password: admin123');
      const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: '123456'
        })
      });
      
      console.log(`   Login status: ${loginResponse.status}`);
      console.log(`   Login headers:`, loginResponse.headers.raw());
      
      const responseText = await loginResponse.text();
      console.log(`   Response body: ${responseText}`);
      
      if (loginResponse.ok) {
        const loginData = JSON.parse(responseText);
        token = loginData.accessToken || loginData.token;
        console.log('   ✅ Authentication successful');
        console.log(`   Token received: ${token ? 'Yes' : 'No'}`);
      } else {
        console.log('   ❌ Authentication failed:', responseText);
        
        // Try alternative credentials
        console.log('\n   🔄 Trying alternative login methods...');
        
        const altLogins = [
          { username: 'admin', password: 'password' },
          { username: 'admin', password: '123456' },
          { username: 'testuser', password: 'admin123' }
        ];
        
        for (const creds of altLogins) {
          console.log(`   Trying: ${creds.username} / ${creds.password}`);
          const altResponse = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(creds)
          });
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            token = altData.accessToken || altData.token;
            console.log(`   ✅ Login successful with ${creds.username}`);
            break;
          } else {
            const altError = await altResponse.text();
            console.log(`   ❌ Failed: ${altError}`);
          }
        }
      }
    } catch (error) {
      console.log('   ❌ Authentication error:', error.message);
    }

    if (!token) {
      console.log('\n❌ Cannot proceed without authentication token');
      return;
    }

    // Test the problematic endpoints
    console.log('\n3️⃣ Testing problematic endpoints...');
    
    const problemEndpoints = [
      { 
        name: 'Shipments', 
        url: '/api/sales/shipments?page=1&limit=10' 
      },
      { 
        name: 'Payment Vouchers', 
        url: '/api/financial/vouchers/payments?limit=50' 
      },
      { 
        name: 'Sales Reports Summary', 
        url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=summary' 
      },
      { 
        name: 'Sales Reports Customer', 
        url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=customer' 
      },
      { 
        name: 'Sales Reports Detailed', 
        url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=detailed' 
      },
      { 
        name: 'Sales Reports Product', 
        url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=product' 
      }
    ];

    for (const endpoint of problemEndpoints) {
      console.log(`\n   Testing ${endpoint.name}...`);
      try {
        const response = await fetch(`${baseURL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint.name} working`);
          if (data.data && Array.isArray(data.data)) {
            console.log(`   Data count: ${data.data.length}`);
          } else if (data.total !== undefined) {
            console.log(`   Total records: ${data.total}`);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ ${endpoint.name} failed: ${response.status}`);
          console.log(`   Error: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name} error: ${error.message}`);
      }
    }

    // Test a working endpoint for comparison
    console.log('\n4️⃣ Testing known working endpoints...');
    
    const workingEndpoints = [
      { name: 'Accounts', url: '/api/financial/accounts?page=1&limit=10' },
      { name: 'Financial Summary', url: '/api/financial/summary' }
    ];

    for (const endpoint of workingEndpoints) {
      console.log(`\n   Testing ${endpoint.name}...`);
      try {
        const response = await fetch(`${baseURL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint.name} working`);
        } else {
          console.log(`   ❌ ${endpoint.name} failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name} error: ${error.message}`);
      }
    }

    console.log('\n🎯 ENDPOINT TESTING COMPLETE');
    console.log('=============================');

  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

testEndpoints();