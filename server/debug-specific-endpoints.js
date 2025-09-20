#!/usr/bin/env node

// Debug script for specific failing production endpoints
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.PRODUCTION_URL || 'https://web.goldenhorse-ly.com';
const API_BASE = `${BASE_URL}/api`;

console.log('🔍 DEBUGGING SPECIFIC FAILING ENDPOINTS');
console.log('=======================================');

async function debugEndpoints() {
  let token = null;

  try {
    // 1. Authenticate first
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

    // 2. Test shipments endpoint with detailed error logging
    console.log('\n2️⃣ Testing shipments endpoint...');
    try {
      const shipmentResponse = await fetch(`${API_BASE}/sales/shipments?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${shipmentResponse.status}`);
      console.log(`   Headers:`, shipmentResponse.headers.raw());
      
      if (!shipmentResponse.ok) {
        const errorText = await shipmentResponse.text();
        console.log(`   ❌ Shipments failed with raw response: ${errorText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`   Error details:`, errorJson);
        } catch (e) {
          console.log(`   Raw error text: ${errorText}`);
        }
      } else {
        const data = await shipmentResponse.json();
        console.log(`   ✅ Shipments working, data sample:`, Object.keys(data));
      }
    } catch (error) {
      console.log(`   ❌ Shipments request failed:`, error.message);
    }

    // 3. Test payment vouchers with detailed error logging
    console.log('\n3️⃣ Testing payment vouchers endpoint...');
    try {
      const paymentResponse = await fetch(`${API_BASE}/financial/vouchers/payments?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${paymentResponse.status}`);
      console.log(`   Headers:`, paymentResponse.headers.raw());
      
      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.log(`   ❌ Payment vouchers failed with raw response: ${errorText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`   Error details:`, errorJson);
        } catch (e) {
          console.log(`   Raw error text: ${errorText}`);
        }
      } else {
        const data = await paymentResponse.json();
        console.log(`   ✅ Payment vouchers working, data sample:`, Object.keys(data));
      }
    } catch (error) {
      console.log(`   ❌ Payment vouchers request failed:`, error.message);
    }

    // 4. Test sales reports endpoints with detailed error logging
    console.log('\n4️⃣ Testing sales reports endpoints...');
    const reportTypes = ['summary', 'customer', 'detailed', 'product'];
    
    for (const reportType of reportTypes) {
      try {
        const reportResponse = await fetch(`${API_BASE}/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=${reportType}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`   Reports (${reportType}) Status: ${reportResponse.status}`);
        
        if (!reportResponse.ok) {
          const errorText = await reportResponse.text();
          console.log(`   ❌ Reports (${reportType}) failed with raw response: ${errorText}`);
          
          try {
            const errorJson = JSON.parse(errorText);
            console.log(`   Error details:`, errorJson);
          } catch (e) {
            console.log(`   Raw error text: ${errorText}`);
          }
        } else {
          const data = await reportResponse.json();
          console.log(`   ✅ Reports (${reportType}) working, data sample:`, Object.keys(data));
        }
      } catch (error) {
        console.log(`   ❌ Reports (${reportType}) request failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('Overall error:', error);
  }
}

// Run the debug test
debugEndpoints().catch(console.error);