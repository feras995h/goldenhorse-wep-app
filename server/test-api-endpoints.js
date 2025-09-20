// Final verification script to test API endpoints
import axios from 'axios';

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🔍 Testing API endpoints...\n');
  
  // Test endpoints that were previously failing
  const endpoints = [
    { name: 'Shipments', url: '/sales/shipments?page=1&limit=10' },
    { name: 'Payment Vouchers', url: '/financial/vouchers/payments?limit=50' },
    { name: 'Shipping Invoices', url: '/sales/shipping-invoices?page=1&limit=10' },
    { name: 'Sales Reports (Product)', url: '/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=product' },
    { name: 'Sales Reports (Detailed)', url: '/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=detailed' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios.get(`${baseURL}${endpoint.url}`);
      console.log(`✅ ${endpoint.name}: Status ${response.status}, Data received: ${response.data ? 'Yes' : 'No'}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint.name}: Status ${error.response.status}`);
        if (error.response.status !== 500) {
          console.log(`   Message: ${error.response.data?.message || 'No message'}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
      }
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('🎉 API endpoint testing completed!');
  console.log('If all endpoints show ✅ status, the issue has been resolved.');
  console.log('If any show ❌ status 500, there may be additional issues to address.');
}

testAPIEndpoints();