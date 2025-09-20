import fetch from 'node-fetch';

async function testAccountUpdate() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing Account Update...\n');

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

    // Test 2: Get accounts to find one to update
    console.log('\n2️⃣ Getting accounts...');
    const getAccountsResponse = await fetch(`${baseURL}/api/financial/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!getAccountsResponse.ok) {
      console.log('❌ Failed to get accounts');
      return;
    }

    const accountsData = await getAccountsResponse.json();
    const accounts = accountsData.data || [];
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found to update');
      return;
    }

    const accountToUpdate = accounts[0];
    console.log('✅ Found account to update:', accountToUpdate.code, accountToUpdate.name);

    // Test 3: Update the account
    console.log('\n3️⃣ Testing account update...');
    const updateData = {
      code: accountToUpdate.code,
      name: accountToUpdate.name + ' (محدث)',
      nameEn: accountToUpdate.nameEn || '',
      type: accountToUpdate.type,
      accountType: accountToUpdate.accountType || 'main',
      level: accountToUpdate.level,
      parentId: accountToUpdate.parentId || '',
      isActive: accountToUpdate.isActive,
      currency: accountToUpdate.currency || 'LYD',
      nature: accountToUpdate.nature || 'debit',
      description: accountToUpdate.description || 'تم التحديث',
      notes: accountToUpdate.notes || 'تم التحديث من الاختبار'
    };

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`${baseURL}/api/financial/accounts/${accountToUpdate.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (updateResponse.ok) {
      const updatedAccount = await updateResponse.json();
      console.log('✅ Account updated successfully');
      console.log('Updated account:', updatedAccount.code, updatedAccount.name);
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Account update failed:', updateResponse.status);
      console.log('Error:', errorText);
    }

    // Test 4: Create a new account and then update it
    console.log('\n4️⃣ Testing create then update...');
    const newAccount = {
      code: 'UPDATE_TEST',
      name: 'حساب اختبار التحديث',
      type: 'asset',
      isGroup: false,
      level: 1,
      nature: 'debit',
      accountType: 'main'
    };

    const createResponse = await fetch(`${baseURL}/api/financial/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newAccount)
    });

    if (createResponse.ok) {
      const createdAccount = await createResponse.json();
      console.log('✅ New account created:', createdAccount.data.code);

      // Now update it
      const updateNewData = {
        ...newAccount,
        name: 'حساب اختبار التحديث (محدث)',
        description: 'تم التحديث بنجاح'
      };

      const updateNewResponse = await fetch(`${baseURL}/api/financial/accounts/${createdAccount.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateNewData)
      });

      if (updateNewResponse.ok) {
        const updatedNewAccount = await updateNewResponse.json();
        console.log('✅ New account updated successfully:', updatedNewAccount.name);
      } else {
        const errorText = await updateNewResponse.text();
        console.log('❌ New account update failed:', updateNewResponse.status);
        console.log('Error:', errorText);
      }
    } else {
      console.log('❌ Failed to create new account for update test');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAccountUpdate();
