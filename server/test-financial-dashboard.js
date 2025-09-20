#!/usr/bin/env node

// Test financial admin dashboard endpoints for similar issues
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.PRODUCTION_URL || 'https://web.goldenhorse-ly.com';
const API_BASE = `${BASE_URL}/api`;

console.log('🔍 CHECKING FINANCIAL ADMIN DASHBOARD FOR SIMILAR ISSUES');
console.log('======================================================');

async function testFinancialDashboard() {
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

    // 2. Test Financial Dashboard Endpoints
    console.log('\n2️⃣ Testing Financial Dashboard Endpoints...');
    
    const financialEndpoints = [
      { name: 'Accounts', url: '/financial/accounts?limit=5' },
      { name: 'Journal Entries', url: '/financial/journal-entries?limit=5' },
      { name: 'GL Entries', url: '/financial/gl-entries?limit=5' },
      { name: 'Suppliers', url: '/financial/suppliers?limit=5' },
      { name: 'Customers', url: '/financial/customers?limit=5' },
      { name: 'Fixed Assets', url: '/financial/fixed-assets?limit=5' },
      { name: 'Receipts', url: '/financial/vouchers/receipts?limit=5' },
      { name: 'Payment Vouchers', url: '/financial/vouchers/payments?limit=5' },
      { name: 'Financial Summary', url: '/financial/summary' },
      { name: 'Chart of Accounts', url: '/financial/chart-of-accounts' },
      { name: 'Trial Balance', url: '/financial/trial-balance' },
      { name: 'Balance Sheet', url: '/financial/balance-sheet' },
      { name: 'Profit & Loss', url: '/financial/profit-loss' }
    ];

    for (const endpoint of financialEndpoints) {
      try {
        console.log(`\n   Testing ${endpoint.name}...`);
        const response = await fetch(`${API_BASE}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`   Status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            console.log(`   ❌ ${endpoint.name} failed:`, errorJson);
            
            // Check for specific database column issues
            if (errorJson.error || errorJson.message) {
              const errorMsg = errorJson.error || errorJson.message;
              if (errorMsg.includes('does not exist')) {
                console.log(`   🚨 DATABASE COLUMN ISSUE DETECTED: ${errorMsg}`);
              } else if (errorMsg.includes('association')) {
                console.log(`   🚨 MODEL ASSOCIATION ISSUE DETECTED: ${errorMsg}`);
              }
            }
          } catch (e) {
            console.log(`   ❌ ${endpoint.name} failed - Raw error:`, errorText.substring(0, 200));
          }
        } else {
          const data = await response.json();
          console.log(`   ✅ ${endpoint.name} working - Records: ${data.total || data.data?.length || 'N/A'}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name} request failed:`, error.message);
      }
    }

    // 3. Test Financial Operations (Create/Update)
    console.log('\n3️⃣ Testing Financial Operations...');
    
    // Test creating a simple journal entry (if possible)
    try {
      console.log('\n   Testing Journal Entry Creation...');
      // Just test the endpoint without actually creating to see if there are validation issues
      const jeResponse = await fetch(`${API_BASE}/financial/journal-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Minimal test data to trigger validation
          description: 'Test entry'
        })
      });

      if (jeResponse.status === 400) {
        const jeError = await jeResponse.json();
        console.log(`   ℹ️ Journal Entry validation working (expected 400):`, jeError.message);
      } else if (jeResponse.status === 500) {
        const jeError = await jeResponse.json();
        console.log(`   ❌ Journal Entry has server error:`, jeError);
        if (jeError.error && jeError.error.includes('does not exist')) {
          console.log(`   🚨 DATABASE COLUMN ISSUE IN JOURNAL ENTRIES: ${jeError.error}`);
        }
      } else {
        console.log(`   ⚠️ Unexpected response from Journal Entry creation: ${jeResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Journal Entry test failed:`, error.message);
    }

    console.log('\n🎯 FINANCIAL DASHBOARD ANALYSIS');
    console.log('===============================');
    console.log('Summary of issues found in financial admin dashboard:');
    console.log('- Check the output above for any "DATABASE COLUMN ISSUE" or "MODEL ASSOCIATION ISSUE"');
    console.log('- These would indicate similar problems to the sales dashboard');

  } catch (error) {
    console.error('Overall error:', error);
  }
}

// Run the financial dashboard test
testFinancialDashboard().catch(console.error);