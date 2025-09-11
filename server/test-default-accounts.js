import fetch from 'node-fetch';

async function testDefaultAccounts() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing Default Accounts Creation...\n');

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

    // Test 2: Create default accounts
    console.log('\n2️⃣ Creating default accounts...');
    
    const defaultAccounts = [
      {
        code: '1000',
        name: 'الأصول',
        type: 'asset',
        isGroup: true,
        level: 1,
        nature: 'debit',
        accountType: 'main'
      },
      {
        code: '1100',
        name: 'الأصول المتداولة',
        type: 'asset',
        isGroup: true,
        level: 2,
        nature: 'debit',
        accountType: 'main',
        parentId: null // Will be set after creating parent
      },
      {
        code: '1110',
        name: 'النقدية',
        type: 'asset',
        isGroup: false,
        level: 3,
        nature: 'debit',
        accountType: 'sub'
      },
      {
        code: '2000',
        name: 'الخصوم',
        type: 'liability',
        isGroup: true,
        level: 1,
        nature: 'credit',
        accountType: 'main'
      },
      {
        code: '3000',
        name: 'حقوق الملكية',
        type: 'equity',
        isGroup: true,
        level: 1,
        nature: 'credit',
        accountType: 'main'
      },
      {
        code: '4000',
        name: 'الإيرادات',
        type: 'revenue',
        isGroup: true,
        level: 1,
        nature: 'credit',
        accountType: 'main'
      },
      {
        code: '5000',
        name: 'المصروفات',
        type: 'expense',
        isGroup: true,
        level: 1,
        nature: 'debit',
        accountType: 'main'
      }
    ];

    const createdAccounts = [];

    for (const account of defaultAccounts) {
      console.log(`Creating account: ${account.code} - ${account.name}`);
      
      const createResponse = await fetch(`${baseURL}/api/financial/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(account)
      });

      if (createResponse.ok) {
        const createdAccount = await createResponse.json();
        console.log(`✅ Created: ${createdAccount.data.code} - ${createdAccount.data.name}`);
        createdAccounts.push(createdAccount.data);
      } else {
        const errorText = await createResponse.text();
        console.log(`❌ Failed to create ${account.code}: ${createResponse.status}`);
        console.log('Error:', errorText);
      }
    }

    console.log(`\n📊 Summary: ${createdAccounts.length}/${defaultAccounts.length} accounts created successfully`);

    // Test 3: Get all accounts to verify
    console.log('\n3️⃣ Verifying created accounts...');
    const getAccountsResponse = await fetch(`${baseURL}/api/financial/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (getAccountsResponse.ok) {
      const accountsData = await getAccountsResponse.json();
      console.log('✅ Total accounts in database:', accountsData.data?.length || 0);
      
      if (accountsData.data && accountsData.data.length > 0) {
        console.log('\nAccounts list:');
        accountsData.data.forEach(acc => {
          console.log(`  ${acc.code} - ${acc.name} (${acc.type})`);
        });
      }
    } else {
      console.log('❌ Failed to get accounts for verification');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDefaultAccounts();
