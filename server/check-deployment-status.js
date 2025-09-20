#!/usr/bin/env node

// Check if the production server has the latest code fixes
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.PRODUCTION_URL || 'https://web.goldenhorse-ly.com';
const API_BASE = `${BASE_URL}/api`;

console.log('🚀 CHECKING PRODUCTION DEPLOYMENT STATUS');
console.log('==========================================');

async function checkDeploymentStatus() {
  let token = null;

  try {
    // 1. Authenticate
    console.log('1️⃣ Authenticating...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Authentication failed');
      return;
    }

    const loginData = await loginResponse.json();
    token = loginData.accessToken;
    console.log('✅ Authentication successful');

    // 2. Check server health and version info
    console.log('\n2️⃣ Checking server health...');
    try {
      const healthResponse = await fetch(`${API_BASE}/admin/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Server health data:', healthData);
      } else {
        console.log('❌ Health check failed');
      }
    } catch (e) {
      console.log('❌ Health check error:', e.message);
    }

    // 3. Test a simple endpoint to see if routes are properly registered
    console.log('\n3️⃣ Testing basic route registration...');
    try {
      const accountsResponse = await fetch(`${API_BASE}/financial/accounts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Accounts endpoint status: ${accountsResponse.status}`);
      if (accountsResponse.ok) {
        console.log('   ✅ Basic routes working');
      } else {
        console.log('   ❌ Basic routes failing');
      }
    } catch (e) {
      console.log('   ❌ Basic routes error:', e.message);
    }

    // 4. Check if the sales routes are registered at all
    console.log('\n4️⃣ Testing sales route registration...');
    try {
      // Try different endpoints to see which ones are registered
      const endpoints = [
        '/sales/customers?limit=1',
        '/sales/invoices?limit=1', 
        '/sales/analytics?period=month',
        '/sales/shipments?limit=1',
        '/sales/reports?reportType=summary&dateFrom=2025-09-01&dateTo=2025-09-20'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log(`   ${endpoint}: ${response.status} ${response.status === 404 ? '(NOT FOUND)' : response.status < 400 ? '(OK)' : '(ERROR)'}`);
        } catch (e) {
          console.log(`   ${endpoint}: ERROR - ${e.message}`);
        }
      }
    } catch (e) {
      console.log('   ❌ Sales routes test error:', e.message);
    }

    // 5. Check database model synchronization
    console.log('\n5️⃣ Testing database model synchronization...');
    try {
      // Try to access an endpoint that would fail if models are not synced
      const paymentResponse = await fetch(`${API_BASE}/financial/vouchers/payments?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Payment vouchers endpoint status: ${paymentResponse.status}`);
      
      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.log(`   Error details: ${errorText}`);
        
        if (errorText.includes('createdBy does not exist')) {
          console.log('   ❌ Production database models are NOT synchronized with current codebase');
          console.log('   ℹ️  This suggests production is running an older version of the code');
        }
      } else {
        console.log('   ✅ Database models appear synchronized');
      }
    } catch (e) {
      console.log('   ❌ Model sync test error:', e.message);
    }

    console.log('\n🎯 DEPLOYMENT STATUS SUMMARY');
    console.log('============================');
    console.log('Based on the test results above:');
    console.log('1. If sales/reports returns 404: Routes are not deployed');
    console.log('2. If payment vouchers fails with createdBy error: Models are not synced');
    console.log('3. If shipments fails with generic error: Possible model association issues');
    console.log('\n💡 RECOMMENDED ACTIONS:');
    console.log('1. Deploy the latest code fixes to production server');
    console.log('2. Restart the production application to load new routes');
    console.log('3. Ensure database models are synchronized with latest schema');

  } catch (error) {
    console.error('Overall error:', error);
  }
}

// Run the deployment check
checkDeploymentStatus().catch(console.error);