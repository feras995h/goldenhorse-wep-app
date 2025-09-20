import fetch from 'node-fetch';

async function testAPI() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test 1: Login
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

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('User:', loginData.user.username, '(' + loginData.user.role + ')');
      
      const token = loginData.accessToken;

      // Test 2: Create user
      console.log('\n2️⃣ Testing create user...');
      const createUserResponse = await fetch(`${baseURL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: 'testuser' + Date.now(),
          password: 'password123',
          name: 'مستخدم تجريبي',
          role: 'operations',
          email: 'test@example.com'
        })
      });

      if (createUserResponse.ok) {
        const userData = await createUserResponse.json();
        console.log('✅ User created successfully');
        console.log('New user:', userData.username, '(' + userData.role + ')');
      } else {
        const error = await createUserResponse.text();
        console.log('❌ Create user failed:', createUserResponse.status);
        console.log('Error:', error);
      }

      // Test 3: Get users
      console.log('\n3️⃣ Testing get users...');
      const getUsersResponse = await fetch(`${baseURL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (getUsersResponse.ok) {
        const usersData = await getUsersResponse.json();
        console.log('✅ Users fetched successfully');
        console.log('Total users:', usersData.total);
        usersData.data.forEach(user => {
          console.log(`- ${user.username} (${user.role}) - Active: ${user.isActive}`);
        });
      } else {
        console.log('❌ Get users failed:', getUsersResponse.status);
      }

    } else {
      const error = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status);
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
    console.log('Run: npm run dev');
  }
}

testAPI();
