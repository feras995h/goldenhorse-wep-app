import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = 'zYGtnkJs0gRPDkyr7WBekM4JPSWTTD0aH3qKbk6M2e612820';

console.log('🔍 اختبار Hostinger API...');
console.log('API Key:', API_KEY.substring(0, 10) + '...');

async function testAPI() {
  try {
    // محاولة الوصول إلى domains endpoint
    console.log('🔄 محاولة الوصول إلى domains...');
    const domainsResponse = await axios.get('https://api.hostinger.com/v1/domains', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Domains API يعمل');
    console.log('عدد الدومينات:', domainsResponse.data?.data?.length || 0);
    
  } catch (error) {
    console.log('❌ خطأ في Domains API:', error.response?.status, error.response?.statusText);
  }

  try {
    // محاولة الوصول إلى VPS endpoint
    console.log('🔄 محاولة الوصول إلى VPS...');
    const vpsResponse = await axios.get('https://api.hostinger.com/v1/vps', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ VPS API يعمل');
    console.log('البيانات المستلمة:', JSON.stringify(vpsResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ خطأ في VPS API:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }

  try {
    // محاولة الوصول إلى hosting endpoint
    console.log('🔄 محاولة الوصول إلى hosting...');
    const hostingResponse = await axios.get('https://api.hostinger.com/v1/hosting', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Hosting API يعمل');
    console.log('البيانات المستلمة:', JSON.stringify(hostingResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ خطأ في Hosting API:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPI();
