import fetch from 'node-fetch';

async function testJournalApproval() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing Journal Entry Approval...\n');

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

    // Test 2: Get journal entries to find one to approve
    console.log('\n2️⃣ Getting journal entries...');
    const getEntriesResponse = await fetch(`${baseURL}/api/financial/journal-entries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!getEntriesResponse.ok) {
      console.log('❌ Failed to get journal entries');
      return;
    }

    const entriesData = await getEntriesResponse.json();
    const entries = entriesData.data || [];
    
    if (entries.length === 0) {
      console.log('❌ No journal entries found to approve');
      return;
    }

    // Find a draft entry
    const draftEntry = entries.find(entry => entry.status === 'draft');
    if (!draftEntry) {
      console.log('❌ No draft entries found to approve');
      console.log('Available entries:', entries.map(e => ({ id: e.id, status: e.status, entryNumber: e.entryNumber })));
      return;
    }

    console.log(`✅ Found draft entry to approve: ${draftEntry.entryNumber}`);

    // Test 3: Approve the journal entry
    console.log('\n3️⃣ Testing journal entry approval...');
    const approveResponse = await fetch(`${baseURL}/api/financial/journal-entries/${draftEntry.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (approveResponse.ok) {
      const result = await approveResponse.json();
      console.log('✅ Journal entry approved successfully');
      console.log('Message:', result.message);
    } else {
      const errorText = await approveResponse.text();
      console.log('❌ Journal entry approval failed:', approveResponse.status);
      console.log('Error:', errorText);
    }

    // Test 4: Verify the entry status changed
    console.log('\n4️⃣ Verifying entry status...');
    const verifyResponse = await fetch(`${baseURL}/api/financial/journal-entries/${draftEntry.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (verifyResponse.ok) {
      const updatedEntry = await verifyResponse.json();
      console.log('✅ Entry status verified');
      console.log('Status:', updatedEntry.status);
      console.log('Posted at:', updatedEntry.postedAt);
    } else {
      console.log('❌ Failed to verify entry status');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
  }
}

testJournalApproval();
