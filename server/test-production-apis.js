import fetch from 'node-fetch';

console.log('🔍 اختبار APIs الإنتاج...');

const BASE_URL = 'https://web.goldenhorse-ly.com/api';

async function testAPI(endpoint, method = 'GET', headers = {}, body = null) {
  try {
    console.log(`\n🔗 اختبار: ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Response (JSON):', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      } else if (contentType && contentType.includes('image/')) {
        console.log('✅ Response: Image data received');
      } else {
        const text = await response.text();
        console.log('✅ Response (Text):', text.substring(0, 200) + '...');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText.substring(0, 500));
    }
    
    return response;
    
  } catch (error) {
    console.error(`❌ Network Error: ${error.message}`);
    return null;
  }
}

async function testProductionAPIs() {
  console.log('🚀 بدء اختبار APIs الإنتاج...');
  
  // اختبار 1: Health Check
  await testAPI('/health');
  
  // اختبار 2: Database Health
  await testAPI('/health/database');
  
  // اختبار 3: Logo Endpoint
  await testAPI('/settings/logo');
  
  // اختبار 4: Settings Endpoint (يحتاج token)
  await testAPI('/settings');
  
  // اختبار 5: Notifications Endpoint (يحتاج token)
  await testAPI('/notifications?limit=20&unreadOnly=false');
  
  // اختبار 6: Accounts Endpoint (يحتاج token)
  await testAPI('/financial/accounts?limit=1000');
  
  // اختبار 7: Login Endpoint
  await testAPI('/auth/login', 'POST', {}, {
    username: 'admin',
    password: 'admin123'
  });
  
  console.log('\n🎉 انتهى اختبار APIs الإنتاج');
  
  console.log('\n💡 ملاحظات:');
  console.log('  - إذا كانت APIs تعطي 401/403، فهذا طبيعي (تحتاج token)');
  console.log('  - إذا كانت تعطي 500، فهناك مشكلة في الخادم');
  console.log('  - إذا كانت تعطي 404، فالـ endpoint مفقود');
  console.log('  - إذا كان هناك Network Error، فمشكلة في الاتصال');
}

testProductionAPIs();
