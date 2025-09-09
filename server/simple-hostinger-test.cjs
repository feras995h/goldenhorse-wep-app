const axios = require('axios');

const API_KEY = 'zYGtnkJs0gRPDkyr7WBekM4JPSWTTD0aH3qKbk6M2e612820';

console.log('🔍 اختبار Hostinger API...');
console.log('API Key:', API_KEY.substring(0, 10) + '...');

async function testHostingerAPI() {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  console.log('\n📡 اختبار الاتصال بـ Hostinger API...');

  try {
    // اختبار endpoint الأساسي
    console.log('🔄 محاولة الوصول إلى معلومات الحساب...');
    
    const accountResponse = await axios.get('https://api.hostinger.com/v1/account', {
      headers: headers,
      timeout: 15000
    });
    
    console.log('✅ تم الاتصال بنجاح!');
    console.log('معلومات الحساب:', JSON.stringify(accountResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ خطأ في معلومات الحساب:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }

  try {
    // اختبار VPS
    console.log('\n🖥️  محاولة الحصول على معلومات VPS...');
    
    const vpsResponse = await axios.get('https://api.hostinger.com/v1/vps', {
      headers: headers,
      timeout: 15000
    });
    
    console.log('✅ VPS API يعمل!');
    const vpsData = vpsResponse.data;
    
    if (vpsData.data && vpsData.data.length > 0) {
      console.log(`📊 عدد الخوادم المتاحة: ${vpsData.data.length}`);
      
      vpsData.data.forEach((server, index) => {
        console.log(`\n🖥️  الخادم ${index + 1}:`);
        console.log(`   ID: ${server.id}`);
        console.log(`   الاسم: ${server.name || 'غير محدد'}`);
        console.log(`   IP: ${server.public_ip || server.ip || 'غير متاح'}`);
        console.log(`   الحالة: ${server.status}`);
        console.log(`   نظام التشغيل: ${server.os || 'غير محدد'}`);
        console.log(`   المنطقة: ${server.location || 'غير محدد'}`);
      });
      
      // اختيار الخادم الأول
      const firstServer = vpsData.data[0];
      const serverIP = firstServer.public_ip || firstServer.ip;
      
      if (serverIP) {
        console.log(`\n🎯 سيتم استخدام الخادم الأول:`);
        console.log(`   IP: ${serverIP}`);
        console.log(`   ID: ${firstServer.id}`);
        
        // حفظ IP في متغير للاستخدام لاحقاً
        console.log(`\n📝 أضف هذا السطر إلى ملف .env:`);
        console.log(`VPS_IP=${serverIP}`);
        console.log(`VPS_ID=${firstServer.id}`);
      }
      
    } else {
      console.log('⚠️  لم يتم العثور على خوادم VPS');
    }
    
  } catch (error) {
    console.log('❌ خطأ في VPS API:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }

  try {
    // اختبار Hosting
    console.log('\n🌐 محاولة الحصول على معلومات Hosting...');
    
    const hostingResponse = await axios.get('https://api.hostinger.com/v1/hosting', {
      headers: headers,
      timeout: 15000
    });
    
    console.log('✅ Hosting API يعمل!');
    console.log('معلومات Hosting:', JSON.stringify(hostingResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ خطأ في Hosting API:', error.response?.status, error.response?.statusText);
  }

  try {
    // اختبار Domains
    console.log('\n🌍 محاولة الحصول على معلومات Domains...');
    
    const domainsResponse = await axios.get('https://api.hostinger.com/v1/domains', {
      headers: headers,
      timeout: 15000
    });
    
    console.log('✅ Domains API يعمل!');
    const domainsData = domainsResponse.data;
    
    if (domainsData.data && domainsData.data.length > 0) {
      console.log(`📊 عدد الدومينات: ${domainsData.data.length}`);
      domainsData.data.forEach((domain, index) => {
        console.log(`   ${index + 1}. ${domain.domain_name} - ${domain.status}`);
      });
    }
    
  } catch (error) {
    console.log('❌ خطأ في Domains API:', error.response?.status, error.response?.statusText);
  }
}

// تشغيل الاختبار
testHostingerAPI().catch(error => {
  console.error('💥 خطأ عام:', error.message);
});
