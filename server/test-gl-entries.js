#!/usr/bin/env node

/**
 * Test script to verify GL Entries creation after journal entry approval
 */

const baseURL = 'http://localhost:5001';

async function testGLEntriesCreation() {
  console.log('🧪 Testing GL Entries Creation After Journal Entry Approval...\n');

  try {
    // Test 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@goldenhorse.ly',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test 2: Get accounts
    console.log('\n2️⃣ Getting accounts...');
    const accountsResponse = await fetch(`${baseURL}/api/financial/accounts?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!accountsResponse.ok) {
      console.log('❌ Failed to get accounts');
      return;
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.data || [];
    
    if (accounts.length < 2) {
      console.log('❌ Need at least 2 accounts to create journal entry');
      return;
    }

    console.log(`✅ Found ${accounts.length} accounts`);
    console.log(`   - Account 1: ${accounts[0].code} - ${accounts[0].name}`);
    console.log(`   - Account 2: ${accounts[1].code} - ${accounts[1].name}`);

    // Test 3: Create a journal entry
    console.log('\n3️⃣ Creating journal entry...');
    const journalEntryData = {
      date: new Date().toISOString().split('T')[0],
      description: 'قيد اختبار لفحص GL Entries',
      reference: 'TEST-GL-001',
      type: 'manual',
      lines: [
        {
          accountId: accounts[0].id,
          description: 'مدين اختبار',
          debit: 500,
          credit: 0
        },
        {
          accountId: accounts[1].id,
          description: 'دائن اختبار',
          debit: 0,
          credit: 500
        }
      ]
    };

    const createResponse = await fetch(`${baseURL}/api/financial/journal-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(journalEntryData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Journal entry creation failed:', createResponse.status);
      console.log('Error:', errorText);
      return;
    }

    const createdEntry = await createResponse.json();
    console.log('✅ Journal entry created successfully');
    console.log(`   Entry Number: ${createdEntry.data.entryNumber}`);
    console.log(`   Status: ${createdEntry.data.status}`);

    // Test 4: Check GL entries before approval (should be empty)
    console.log('\n4️⃣ Checking GL entries before approval...');
    const glBeforeResponse = await fetch(`${baseURL}/api/financial/gl-entries?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (glBeforeResponse.ok) {
      const glBeforeData = await glBeforeResponse.json();
      const glEntriesBefore = glBeforeData.data || [];
      console.log(`✅ GL entries before approval: ${glEntriesBefore.length}`);
    }

    // Test 5: Approve the journal entry
    console.log('\n5️⃣ Approving journal entry...');
    const approveResponse = await fetch(`${baseURL}/api/financial/journal-entries/${createdEntry.data.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!approveResponse.ok) {
      const errorText = await approveResponse.text();
      console.log('❌ Journal entry approval failed:', approveResponse.status);
      console.log('Error:', errorText);
      return;
    }

    const approveResult = await approveResponse.json();
    console.log('✅ Journal entry approved successfully');
    console.log(`   Message: ${approveResult.message}`);

    // Test 6: Check GL entries after approval (should have entries)
    console.log('\n6️⃣ Checking GL entries after approval...');
    const glAfterResponse = await fetch(`${baseURL}/api/financial/gl-entries?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (glAfterResponse.ok) {
      const glAfterData = await glAfterResponse.json();
      const glEntriesAfter = glAfterData.data || [];
      console.log(`✅ GL entries after approval: ${glEntriesAfter.length}`);
      
      // Show the created GL entries
      const newGLEntries = glEntriesAfter.filter(entry => 
        entry.voucherNo === createdEntry.data.entryNumber
      );
      
      console.log(`\n📋 New GL Entries created:`);
      newGLEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. Account: ${entry.account?.code} - ${entry.account?.name}`);
        console.log(`      Date: ${entry.postingDate}`);
        console.log(`      Debit: ${entry.debit} LYD`);
        console.log(`      Credit: ${entry.credit} LYD`);
        console.log(`      Voucher: ${entry.voucherNo}`);
        console.log(`      Remarks: ${entry.remarks}`);
        console.log('');
      });

      if (newGLEntries.length === 2) {
        console.log('✅ SUCCESS: GL Entries created correctly!');
      } else {
        console.log(`❌ ISSUE: Expected 2 GL entries, found ${newGLEntries.length}`);
      }
    }

    // Test 7: Check account statement
    console.log('\n7️⃣ Checking account statement...');
    const statementResponse = await fetch(`${baseURL}/api/financial/accounts/${accounts[0].id}/statement`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (statementResponse.ok) {
      const statementData = await statementResponse.json();
      console.log(`✅ Account statement loaded`);
      console.log(`   Entries: ${statementData.entries?.length || 0}`);
      console.log(`   Opening Balance: ${statementData.totals?.openingBalance || 0} LYD`);
      console.log(`   Closing Balance: ${statementData.totals?.closingBalance || 0} LYD`);
    } else {
      console.log('❌ Failed to load account statement');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
  }
}

testGLEntriesCreation();
