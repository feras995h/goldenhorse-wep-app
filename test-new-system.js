import axios from 'axios';

async function testNewSystem() {
  console.log('🔧 اختبار النظام المحدث...\n');

  const baseURL = 'http://localhost:5001/api';

  try {
    // 1. اختبار جلب إيصالات القبض
    console.log('1️⃣ اختبار جلب إيصالات القبض...');
    try {
      const response = await axios.get(`${baseURL}/vouchers/receipts?page=1&limit=5`);
      console.log('✅ جلب إيصالات القبض نجح - Status:', response.status);
      console.log('📊 عدد الإيصالات:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ جلب إيصالات القبض فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 2. اختبار جلب إيصالات الصرف
    console.log('\n2️⃣ اختبار جلب إيصالات الصرف...');
    try {
      const response = await axios.get(`${baseURL}/vouchers/payments?page=1&limit=5`);
      console.log('✅ جلب إيصالات الصرف نجح - Status:', response.status);
      console.log('📊 عدد الإيصالات:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ جلب إيصالات الصرف فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 3. اختبار جلب فواتير المبيعات
    console.log('\n3️⃣ اختبار جلب فواتير المبيعات...');
    try {
      const response = await axios.get(`${baseURL}/sales/invoices?page=1&limit=5`);
      console.log('✅ جلب فواتير المبيعات نجح - Status:', response.status);
      console.log('📊 عدد الفواتير:', response.data.data?.length || 0);
      
      if (response.data.data && response.data.data.length > 0) {
        const invoice = response.data.data[0];
        console.log('📋 عينة من البيانات:');
        console.log(`  - Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`  - Total: ${invoice.total}`);
        console.log(`  - Outstanding Amount: ${invoice.outstandingAmount}`);
        console.log(`  - Service Description: ${invoice.serviceDescription || 'غير محدد'}`);
        console.log(`  - Service Type: ${invoice.serviceType || 'غير محدد'}`);
      }
    } catch (error) {
      console.log('❌ جلب فواتير المبيعات فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 4. اختبار جلب فواتير الشحن
    console.log('\n4️⃣ اختبار جلب فواتير الشحن...');
    try {
      const response = await axios.get(`${baseURL}/sales/shipping-invoices?page=1&limit=5`);
      console.log('✅ جلب فواتير الشحن نجح - Status:', response.status);
      console.log('📊 عدد الفواتير:', response.data.data?.length || 0);
      
      if (response.data.data && response.data.data.length > 0) {
        const invoice = response.data.data[0];
        console.log('📋 عينة من البيانات:');
        console.log(`  - Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`  - Total: ${invoice.total}`);
        console.log(`  - Outstanding Amount: ${invoice.outstandingAmount}`);
        console.log(`  - Item Description: ${invoice.itemDescription || 'غير محدد'}`);
      }
    } catch (error) {
      console.log('❌ جلب فواتير الشحن فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 5. اختبار جلب العملاء
    console.log('\n5️⃣ اختبار جلب العملاء...');
    try {
      const response = await axios.get(`${baseURL}/sales/customers?page=1&limit=5`);
      console.log('✅ جلب العملاء نجح - Status:', response.status);
      console.log('📊 عدد العملاء:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ جلب العملاء فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 6. اختبار جلب الموردين
    console.log('\n6️⃣ اختبار جلب الموردين...');
    try {
      const response = await axios.get(`${baseURL}/admin/suppliers?page=1&limit=5`);
      console.log('✅ جلب الموردين نجح - Status:', response.status);
      console.log('📊 عدد الموردين:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ جلب الموردين فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 7. اختبار جلب الحسابات
    console.log('\n7️⃣ اختبار جلب الحسابات...');
    try {
      const response = await axios.get(`${baseURL}/financial/accounts?page=1&limit=10`);
      console.log('✅ جلب الحسابات نجح - Status:', response.status);
      console.log('📊 عدد الحسابات:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ جلب الحسابات فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ خطأ عام:', error.message);
  }

  console.log('\n🎯 انتهى اختبار النظام');
}

testNewSystem();
