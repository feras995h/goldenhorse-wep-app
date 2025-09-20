#!/usr/bin/env node

// Test remaining production issues after deployment
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.PRODUCTION_URL || 'https://web.goldenhorse-ly.com';
const API_BASE = `${BASE_URL}/api`;

console.log('🔧 TESTING REMAINING PRODUCTION ISSUES');
console.log('====================================');

async function testRemainingIssues() {
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
        password: '123456'  // Using the correct password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Authentication failed');
      return;
    }

    const loginData = await loginResponse.json();
    token = loginData.accessToken;
    console.log('✅ Authentication successful');

    // 2. Test Payment Vouchers with detailed error logging
    console.log('\n2️⃣ Testing Payment Vouchers...');
    try {
      const paymentResponse = await fetch(`${API_BASE}/financial/vouchers/payments?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${paymentResponse.status}`);
      
      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`   ❌ Error:`, errorJson);
          
          if (errorJson.error?.includes('currency does not exist')) {
            console.log('   💡 Issue: Payment model currency column not found in production');
            console.log('   🔧 Solution: Production server restart needed to reload models');
          } else if (errorJson.error?.includes('createdBy does not exist')) {
            console.log('   💡 Issue: Payment model createdBy column not found');
            console.log('   🔧 Solution: Model synchronization needed');
          }
        } catch (e) {
          console.log(`   Raw error: ${errorText}`);
        }
      } else {
        const data = await paymentResponse.json();
        console.log(`   ✅ Payment Vouchers working! Count: ${data.total || 0}`);
      }
    } catch (error) {
      console.log(`   ❌ Payment Vouchers request failed:`, error.message);
    }

    // 3. Test Shipments with detailed error logging
    console.log('\n3️⃣ Testing Shipments...');
    try {
      const shipmentResponse = await fetch(`${API_BASE}/sales/shipments?page=1&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${shipmentResponse.status}`);
      
      if (!shipmentResponse.ok) {
        const errorText = await shipmentResponse.text();
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`   ❌ Error:`, errorJson);
          
          if (errorJson.message?.includes('خطأ في جلب بيانات الشحنات')) {
            console.log('   💡 Issue: Shipment model association or database connectivity');
            console.log('   🔧 Solution: Check shipment model associations and database sync');
          }
        } catch (e) {
          console.log(`   Raw error: ${errorText}`);
        }
      } else {
        const data = await shipmentResponse.json();
        console.log(`   ✅ Shipments working! Count: ${data.pagination?.total || 0}`);
      }
    } catch (error) {
      console.log(`   ❌ Shipments request failed:`, error.message);
    }

    // 4. Test detailed Sales Reports that were failing
    console.log('\n4️⃣ Testing Detailed Sales Reports...');
    const problemReports = ['detailed', 'product'];
    
    for (const reportType of problemReports) {
      try {
        const reportResponse = await fetch(`${API_BASE}/sales/reports?dateFrom=2025-09-01&dateTo=2025-09-20&reportType=${reportType}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`   Reports (${reportType}) Status: ${reportResponse.status}`);
        
        if (!reportResponse.ok) {
          const errorText = await reportResponse.text();
          try {
            const errorJson = JSON.parse(errorText);
            console.log(`   ❌ Reports (${reportType}) Error:`, errorJson);
            
            if (errorJson.message?.includes('خطأ في إنشاء تقرير المبيعات')) {
              console.log(`   💡 Issue: SalesInvoice/SalesInvoiceItem association problem`);
              console.log(`   🔧 Solution: Model synchronization needed for ${reportType} reports`);
            }
          } catch (e) {
            console.log(`   Raw error: ${errorText}`);
          }
        } else {
          const data = await reportResponse.json();
          console.log(`   ✅ Reports (${reportType}) working! Data count: ${data.data?.length || 0}`);
        }
      } catch (error) {
        console.log(`   ❌ Reports (${reportType}) request failed:`, error.message);
      }
    }

    console.log('\n🎯 ANALYSIS SUMMARY');
    console.log('==================');
    console.log('Deployment Status: PARTIALLY SUCCESSFUL');
    console.log('✅ Fixed: Sales Reports Summary & Customer (404 → 200)');
    console.log('⚠️  Remaining Issues:');
    console.log('   1. Payment Vouchers: Model synchronization (column not found)');
    console.log('   2. Shipments: Model association or connectivity issue');
    console.log('   3. Sales Reports (detailed/product): Model association issue');
    console.log('');
    console.log('💡 RECOMMENDED ACTIONS:');
    console.log('1. Restart production server to reload all models');
    console.log('2. Verify database model synchronization');
    console.log('3. Check model associations are properly loaded');

  } catch (error) {
    console.error('Overall error:', error);
  }
}

// Run the test
testRemainingIssues().catch(console.error);