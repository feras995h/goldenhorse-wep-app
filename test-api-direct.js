// Test the API directly using fetch
console.log('🧪 Testing Fixed Asset Categories API directly...');
console.log('📅 Date:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(60));

// Replace with your actual production URL
const PRODUCTION_URL = 'https://your-production-url.com';

async function testAPIDirect() {
  try {
    console.log('🔐 Step 1: Testing login...');
    
    const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
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
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    if (!loginData.token) {
      throw new Error('No token received from login');
    }
    
    const token = loginData.token;
    console.log('🔑 Token received:', token.substring(0, 20) + '...');
    
    console.log('\n📋 Step 2: Testing categories API...');
    
    const categoriesResponse = await fetch(`${PRODUCTION_URL}/api/financial/fixed-assets/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📊 Categories response status:', categoriesResponse.status);
    console.log('📊 Categories response headers:', Object.fromEntries(categoriesResponse.headers.entries()));
    
    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.log('❌ Categories API failed:', errorText);
      throw new Error(`Categories API failed: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }
    
    const categoriesData = await categoriesResponse.json();
    console.log('✅ Categories API successful');
    console.log('📊 Response data:', JSON.stringify(categoriesData, null, 2));
    
    if (categoriesData.success && categoriesData.data) {
      const categories = categoriesData.data;
      console.log(`\n🎉 Found ${categories.length} categories:`);
      categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
      });
      
      if (categories.length === 0) {
        console.log('\n⚠️  No categories found! This is the issue.');
        console.log('💡 You need to run the SQL script to create categories.');
      } else {
        console.log('\n✅ Categories are available! The issue might be in the frontend.');
      }
    } else {
      console.log('❌ Unexpected response format:', categoriesData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Network error - check if the production URL is correct');
      console.log('   Update PRODUCTION_URL in this script with your actual URL');
    }
  }
}

// Instructions
console.log('📝 Instructions:');
console.log('1. Update PRODUCTION_URL with your actual production URL');
console.log('2. Make sure the server is running');
console.log('3. Run this script: node test-api-direct.js');
console.log('');

// Run the test
testAPIDirect();
