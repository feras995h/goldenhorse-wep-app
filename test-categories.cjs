const axios = require('axios');

async function testCategories() {
  try {
    console.log('Testing fixed asset categories endpoint...');
    
    // Get the fixed asset categories
    const response = await axios.get('http://localhost:5001/api/financial/fixed-assets/categories');
    
    console.log('Response status:', response.status);
    console.log('Categories found:', response.data.length);
    console.log('Categories:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing categories:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCategories();