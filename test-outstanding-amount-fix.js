import axios from 'axios';

async function testOutstandingAmountFix() {
  console.log('🔧 اختبار إصلاح outstandingAmount...\n');

  const baseURL = 'http://localhost:5001/api';

  try {
    // 1. اختبار Sales Invoices
    console.log('1️⃣ اختبار Sales Invoices...');
    try {
      const response = await axios.get(`${baseURL}/sales/invoices?page=1&limit=5`);
      console.log('✅ Sales Invoices يعمل - Status:', response.status);
      
      if (response.data.data && response.data.data.length > 0) {
        const invoice = response.data.data[0];
        console.log('📊 عينة من البيانات:');
        console.log(`  - Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`  - Total: ${invoice.total}`);
        console.log(`  - Paid Amount: ${invoice.paidAmount}`);
        console.log(`  - Outstanding Amount: ${invoice.outstandingAmount}`);
        
        if (invoice.outstandingAmount !== undefined) {
          console.log('✅ outstandingAmount موجود ويعمل بشكل صحيح');
        } else {
          console.log('❌ outstandingAmount غير موجود');
        }
      }
    } catch (error) {
      console.log('❌ Sales Invoices فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 2. اختبار Financial Invoices
    console.log('\n2️⃣ اختبار Financial Invoices...');
    try {
      const response = await axios.get(`${baseURL}/financial/invoices-for-allocation`);
      console.log('✅ Financial Invoices يعمل - Status:', response.status);
      
      if (response.data && response.data.length > 0) {
        const invoice = response.data[0];
        console.log('📊 عينة من البيانات:');
        console.log(`  - Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`  - Outstanding Amount: ${invoice.outstandingAmount}`);
      }
    } catch (error) {
      console.log('❌ Financial Invoices فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ خطأ عام:', error.message);
  }

  console.log('\n🎯 انتهى الاختبار');
}

testOutstandingAmountFix();
