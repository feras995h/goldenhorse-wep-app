import fetch from 'node-fetch';

async function testJournalEntries() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing Journal Entries endpoint...\n');

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

    // Test 2: Get accounts first (we need account IDs)
    console.log('\n2️⃣ Getting accounts...');
    const accountsResponse = await fetch(`${baseURL}/api/financial/accounts`, {
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

    // Test 3: Create a journal entry
    console.log('\n3️⃣ Testing journal entry creation...');
    const journalEntryData = {
      date: new Date().toISOString().split('T')[0],
      description: 'قيد تجريبي للاختبار',
      reference: 'TEST-001',
      type: 'manual',
      lines: [
        {
          accountId: accounts[0].id,
          description: 'مدين تجريبي',
          debit: 1000,
          credit: 0
        },
        {
          accountId: accounts[1].id,
          description: 'دائن تجريبي',
          debit: 0,
          credit: 1000
        }
      ]
    };

    console.log('Journal entry data:', JSON.stringify(journalEntryData, null, 2));

    const createResponse = await fetch(`${baseURL}/api/financial/journal-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(journalEntryData)
    });

    if (createResponse.ok) {
      const createdEntry = await createResponse.json();
      console.log('✅ Journal entry created successfully');
      console.log('Entry number:', createdEntry.entryNumber);
      console.log('Total debit:', createdEntry.totalDebit);
      console.log('Total credit:', createdEntry.totalCredit);
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Journal entry creation failed:', createResponse.status);
      console.log('Error:', errorText);
    }

    // Test 4: Get journal entries
    console.log('\n4️⃣ Testing get journal entries...');
    const getEntriesResponse = await fetch(`${baseURL}/api/financial/journal-entries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (getEntriesResponse.ok) {
      const entriesData = await getEntriesResponse.json();
      console.log('✅ Get journal entries successful');
      console.log('Total entries:', entriesData.data?.length || 0);
    } else {
      const errorText = await getEntriesResponse.text();
      console.log('❌ Get journal entries failed:', getEntriesResponse.status);
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
  }
}

testJournalEntries();
