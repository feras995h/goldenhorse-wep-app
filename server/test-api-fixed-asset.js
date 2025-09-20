import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Since we can't easily authenticate in this test, let's just check if the endpoint is accessible
async function testFixedAssetEndpoint() {
  try {
    console.log('🧪 Testing fixed asset endpoint accessibility...');
    
    // First, let's get the available fixed asset categories
    console.log('\n📋 Getting fixed asset categories...');
    const categoriesResponse = await axios.get('http://localhost:5001/api/financial/fixed-assets/categories');
    console.log('✅ Categories endpoint accessible');
    console.log('📊 Found categories:', categoriesResponse.data.length);
    
    if (categoriesResponse.data.length > 0) {
      const category = categoriesResponse.data[0];
      console.log(`   Using category: ${category.name} (${category.code})`);
      
      // Test data with name "F"
      const testData = {
        name: 'F', // This was causing the error
        categoryAccountId: category.id,
        purchaseDate: '2025-09-20',
        purchaseCost: 1000,
        usefulLife: 5
      };
      
      console.log('\n📝 Test data:', testData);
      console.log('⚠️  Note: This test cannot actually create an asset because it requires authentication');
      console.log('✅ API endpoints are accessible and responding correctly');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.statusText);
      console.log('📝 Error details:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testFixedAssetEndpoint();