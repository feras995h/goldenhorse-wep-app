const axios = require('axios');

async function testFixes() {
  console.log('🔧 اختبار الإصلاحات...\n');

  const baseURL = 'http://localhost:5001/api';

  try {
    // 1. اختبار Fixed Assets
    console.log('1️⃣ اختبار Fixed Assets...');
    try {
      const response = await axios.get(`${baseURL}/financial/fixed-assets?page=1&limit=10`);
      console.log('✅ Fixed Assets يعمل - Status:', response.status);
      console.log('📊 البيانات:', response.data.data?.length || 0, 'سجل');
    } catch (error) {
      console.log('❌ Fixed Assets فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 2. اختبار Receipt Voucher
    console.log('\n2️⃣ اختبار Receipt Voucher...');
    try {
      const receiptData = {
        amount: 1000,
        description: 'اختبار إيصال قبض',
        accountId: 1,
        customerId: 1
      };
      const response = await axios.post(`${baseURL}/financial/vouchers/receipts`, receiptData);
      console.log('✅ Receipt Voucher يعمل - Status:', response.status);
    } catch (error) {
      console.log('❌ Receipt Voucher فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 3. اختبار Payment Voucher
    console.log('\n3️⃣ اختبار Payment Voucher...');
    try {
      const paymentData = {
        amount: 500,
        description: 'اختبار إيصال صرف',
        accountId: 1,
        supplierId: 1
      };
      const response = await axios.post(`${baseURL}/financial/vouchers/payments`, paymentData);
      console.log('✅ Payment Voucher يعمل - Status:', response.status);
    } catch (error) {
      console.log('❌ Payment Voucher فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 4. اختبار Financial Summary
    console.log('\n4️⃣ اختبار Financial Summary...');
    try {
      const response = await axios.get(`${baseURL}/financial/summary`);
      console.log('✅ Financial Summary يعمل - Status:', response.status);
    } catch (error) {
      console.log('❌ Financial Summary فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 5. اختبار Sales Summary
    console.log('\n5️⃣ اختبار Sales Summary...');
    try {
      const response = await axios.get(`${baseURL}/sales/summary`);
      console.log('✅ Sales Summary يعمل - Status:', response.status);
    } catch (error) {
      console.log('❌ Sales Summary فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ خطأ عام:', error.message);
  }

  console.log('\n🎯 انتهى الاختبار');
}

testFixes();
