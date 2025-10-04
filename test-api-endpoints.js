/**
 * Test API Endpoints
 * This script tests the API endpoints that were showing 500 errors
 */

import http from 'http';

const baseUrl = 'http://localhost:5001';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test endpoints
async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  const tests = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Settings Logo', path: '/api/settings/logo' },
    { name: 'Sales Summary', path: '/api/sales/summary' },
    { name: 'Current Accounting Period', path: '/api/accounting-periods/current' },
    { name: 'All Accounting Periods', path: '/api/accounting-periods' },
    { name: 'Fixed Assets', path: '/api/financial/fixed-assets?page=1&limit=10' },
    { name: 'Sales Shipments ETA Metrics', path: '/api/sales/shipments/eta-metrics' },
    { name: 'Top Delayed Shipments', path: '/api/sales/shipments/top-delays?limit=10' },
    { name: 'Receipt Vouchers', path: '/api/financial/vouchers/receipts?limit=5' },
    { name: 'Payment Vouchers', path: '/api/financial/vouchers/payments?limit=5' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const result = await makeRequest(test.path);
      
      const status = result.status === 200 ? '✅' : result.status === 401 ? '🔐' : '❌';
      console.log(`  ${status} Status: ${result.status}`);
      
      if (result.status !== 200 && result.status !== 401) {
        console.log(`  Error: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
      
      results.push({
        name: test.name,
        path: test.path,
        status: result.status,
        success: result.status === 200 || result.status === 401 // 401 is expected for auth-protected routes
      });
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        name: test.name,
        path: test.path,
        status: 'ERROR',
        error: error.message,
        success: false
      });
    }
    console.log('');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Successful: ${successful}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.status}`);
    });
  }
  
  console.log('\n✅ Test completed!');
}

// Run tests
testEndpoints().catch(console.error);
