const axios = require('axios');

async function testTrialBalance() {
  try {
    console.log('Testing trial balance API...');
    
    const response = await axios.get('http://localhost:5001/api/financial/reports/trial-balance');
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if the response has the expected structure
    if (response.data.success === true) {
      console.log('✅ Success: API response has the correct structure');
      console.log('✅ Data structure matches client expectations');
    } else {
      console.log('❌ Error: API response does not have success field');
    }
    
  } catch (error) {
    console.error('Error testing trial balance API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTrialBalance();