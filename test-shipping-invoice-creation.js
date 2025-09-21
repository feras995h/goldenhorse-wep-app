import axios from 'axios';

async function testShippingInvoiceCreation() {
  console.log('🔧 اختبار إنشاء فاتورة شحن...\n');

  const baseURL = 'http://localhost:5001/api';

  try {
    // 1. اختبار إنشاء فاتورة شحن
    console.log('1️⃣ اختبار إنشاء فاتورة شحن...');
    
    const shippingInvoiceData = {
      customerId: 'test-customer-id', // سيتم رفضه لأن العميل غير موجود
      date: '2025-09-22',
      dueDate: '2025-10-22',
      itemDescription: 'بضائع تجريبية للاختبار',
      originLocation: 'طرابلس، ليبيا',
      destinationLocation: 'بنغازي، ليبيا',
      shippingCost: 100.00,
      handlingFee: 20.00,
      storageFee: 10.00,
      customsClearanceFee: 15.00,
      insuranceFee: 5.00,
      additionalFees: 0.00,
      discountAmount: 0.00,
      taxAmount: 15.00,
      quantity: 1,
      weight: 2.5,
      volume: 0.1,
      currency: 'LYD',
      exchangeRate: 1.0,
      notes: 'فاتورة شحن تجريبية'
    };

    try {
      const response = await axios.post(`${baseURL}/sales/shipping-invoices`, shippingInvoiceData);
      console.log('✅ إنشاء فاتورة الشحن نجح - Status:', response.status);
      console.log('📊 البيانات المرجعة:', {
        id: response.data.id,
        invoiceNumber: response.data.invoiceNumber,
        total: response.data.total,
        outstandingAmount: response.data.outstandingAmount
      });
    } catch (error) {
      console.log('❌ إنشاء فاتورة الشحن فشل:', error.response?.status);
      console.log('📝 رسالة الخطأ:', error.response?.data?.message);
      
      if (error.response?.status === 400) {
        console.log('✅ هذا متوقع - العميل غير موجود');
      }
    }

    // 2. اختبار جلب فواتير الشحن
    console.log('\n2️⃣ اختبار جلب فواتير الشحن...');
    try {
      const response = await axios.get(`${baseURL}/sales/shipping-invoices?page=1&limit=5`);
      console.log('✅ جلب فواتير الشحن نجح - Status:', response.status);
      
      if (response.data.data && response.data.data.length > 0) {
        const invoice = response.data.data[0];
        console.log('📊 عينة من البيانات:');
        console.log(`  - Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`  - Total: ${invoice.total}`);
        console.log(`  - Outstanding Amount: ${invoice.outstandingAmount}`);
        console.log(`  - Customer: ${invoice.customer?.name || 'غير محدد'}`);
      }
    } catch (error) {
      console.log('❌ جلب فواتير الشحن فشل:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ خطأ عام:', error.message);
  }

  console.log('\n🎯 انتهى الاختبار');
}

testShippingInvoiceCreation();
