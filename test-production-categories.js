import axios from 'axios';

// Test the fixed asset categories API endpoint on production
async function testProductionCategories() {
  try {
    console.log('🧪 Testing Fixed Asset Categories API on Production...');
    console.log('📅 Date:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    // Production URL - replace with your actual production URL
    const PRODUCTION_URL = 'https://your-production-url.com'; // Replace with actual URL
    
    console.log('⚠️  Note: Please update PRODUCTION_URL with your actual production URL');
    console.log('🔗 Production URL:', PRODUCTION_URL);
    
    // Test without authentication first
    console.log('\n1️⃣ Testing categories endpoint without authentication...');
    try {
      const response = await axios.get(`${PRODUCTION_URL}/api/financial/fixed-assets/categories`);
      console.log('✅ Categories accessible without auth:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication required (expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    // Test with authentication
    console.log('\n2️⃣ Testing with authentication...');
    
    // First, try to login
    const loginData = {
      username: 'admin',
      password: '123456'
    };
    
    console.log('🔐 Attempting login...');
    const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, loginData);
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Test categories endpoint with auth
      console.log('\n📋 Testing categories endpoint with authentication...');
      const categoriesResponse = await axios.get(`${PRODUCTION_URL}/api/financial/fixed-assets/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Categories response:', categoriesResponse.data);
      
      if (categoriesResponse.data.success && categoriesResponse.data.data) {
        const categories = categoriesResponse.data.data;
        console.log(`\n📊 Found ${categories.length} categories:`);
        categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
        });
        
        if (categories.length === 0) {
          console.log('\n⚠️  No categories found! This is the issue.');
          console.log('💡 The system should create default categories automatically.');
          console.log('🔧 Possible solutions:');
          console.log('   1. Check if ensureFixedAssetsStructure() is working');
          console.log('   2. Check if the main Assets account (code: 1) exists');
          console.log('   3. Check database permissions');
        }
      } else {
        console.log('❌ Unexpected response format:', categoriesResponse.data);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📝 Response data:', error.response.data);
      console.error('📝 Status:', error.response.status);
    }
  }
}

// Run the test
testProductionCategories();
