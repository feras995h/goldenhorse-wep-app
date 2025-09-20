const axios = require('axios');

async function testFixedAssetWithAccounts() {
  try {
    console.log('Testing fixed asset creation with accounts...');
    
    // First, get the fixed asset categories
    const categoriesResponse = await axios.get('http://localhost:5001/api/financial/fixed-assets/categories');
    console.log('Categories:', categoriesResponse.data);
    
    if (categoriesResponse.data.length === 0) {
      console.log('No categories found');
      return;
    }
    
    const category = categoriesResponse.data[0];
    console.log('Using category:', category);
    
    // Create a fixed asset
    const fixedAssetData = {
      name: 'Test Asset ' + Date.now(),
      categoryAccountId: category.id,
      purchaseDate: '2025-09-20',
      purchaseCost: 5000,
      usefulLife: 5,
      salvageValue: 500,
      depreciationMethod: 'straight_line',
      status: 'active',
      location: 'Main Office',
      description: 'Test asset for verification'
    };
    
    const response = await axios.post('http://localhost:5001/api/financial/fixed-assets', fixedAssetData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success === true) {
      console.log('✅ Success: Fixed asset created with accounts');
      console.log('✅ Asset ID:', response.data.data.asset.id);
      console.log('✅ Asset accounts created:', Object.keys(response.data.data.accounts).length);
    } else {
      console.log('❌ Error: Fixed asset creation failed');
    }
    
  } catch (error) {
    console.error('Error testing fixed asset creation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFixedAssetWithAccounts();