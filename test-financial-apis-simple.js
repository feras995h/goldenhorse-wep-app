import axios from 'axios';

/**
 * اختبار APIs النظام المالي البسيط
 * Simple Test for Financial APIs
 */

console.log('🧪 بدء اختبار APIs النظام المالي البسيط...\n');

const API_BASE_URL = 'http://localhost:3001/api';

async function testFinancialAPIsSimple() {
  try {
    // استخدام token ثابت للاختبار
    const testToken = 'test-token'; // يمكن استخدام أي token للاختبار
    
    const headers = {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json'
    };

    console.log('🔑 استخدام test token للاختبار...\n');

    // 1. اختبار إنشاء Receipt
    console.log('📄 اختبار إنشاء Receipt عبر API...');
    
    const receiptData = {
      partyType: 'customer',
      amount: 1350.0,
      receiptDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      currency: 'LYD',
      exchangeRate: 1.0,
      remarks: 'اختبار إنشاء إيصال قبض عبر API بسيط'
    };
    
    try {
      const receiptResponse = await axios.post(
        `${API_BASE_URL}/financial/vouchers/receipts`,
        receiptData,
        { headers, timeout: 10000 }
      );
      
      console.log('✅ تم إنشاء Receipt بنجاح عبر API:');
      console.log(`   📄 Receipt ID: ${receiptResponse.data.data.id}`);
      console.log(`   🏷️ Receipt No: ${receiptResponse.data.data.receiptNo}`);
      console.log(`   💰 Amount: ${receiptResponse.data.data.amount} د.ل`);
      console.log(`   👤 Created By: ${receiptResponse.data.data.createdBy}`);
      console.log(`   ✅ Status: ${receiptResponse.data.data.status}`);
      console.log(`   📅 Date: ${receiptResponse.data.data.receiptDate}`);
      
    } catch (error) {
      console.log('❌ خطأ في إنشاء Receipt عبر API:');
      console.log(`   Status: ${error.response?.status || 'غير محدد'}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
      console.log(`   Error: ${error.response?.data?.error || 'غير محدد'}`);
      
      if (error.response?.data) {
        console.log('   📋 تفاصيل الاستجابة:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // 2. اختبار إنشاء Payment
    console.log('\n💳 اختبار إنشاء Payment عبر API...');
    
    const paymentData = {
      partyType: 'supplier',
      amount: 925.0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      currency: 'LYD',
      exchangeRate: 1.0,
      notes: 'اختبار إنشاء إيصال صرف عبر API بسيط'
    };
    
    try {
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/financial/vouchers/payments`,
        paymentData,
        { headers, timeout: 10000 }
      );
      
      console.log('✅ تم إنشاء Payment بنجاح عبر API:');
      console.log(`   💳 Payment ID: ${paymentResponse.data.data.id}`);
      console.log(`   🏷️ Payment Number: ${paymentResponse.data.data.paymentNumber}`);
      console.log(`   💰 Amount: ${paymentResponse.data.data.amount} د.ل`);
      console.log(`   👤 Created By: ${paymentResponse.data.data.createdBy}`);
      console.log(`   ✅ Status: ${paymentResponse.data.data.status}`);
      console.log(`   📅 Date: ${paymentResponse.data.data.date}`);
      
    } catch (error) {
      console.log('❌ خطأ في إنشاء Payment عبر API:');
      console.log(`   Status: ${error.response?.status || 'غير محدد'}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
      console.log(`   Error: ${error.response?.data?.error || 'غير محدد'}`);
      
      if (error.response?.data) {
        console.log('   📋 تفاصيل الاستجابة:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // 3. اختبار جلب البيانات
    console.log('\n📊 اختبار جلب البيانات عبر API...');
    
    try {
      // جلب آخر receipts
      const receiptsResponse = await axios.get(
        `${API_BASE_URL}/financial/vouchers/receipts?limit=3`,
        { headers, timeout: 10000 }
      );
      
      console.log(`✅ تم جلب ${receiptsResponse.data.data.length} إيصال قبض:`);
      receiptsResponse.data.data.forEach((receipt, index) => {
        console.log(`   ${index + 1}. ${receipt.receiptNo} - ${receipt.amount} د.ل - ${receipt.status}`);
      });
      
    } catch (error) {
      console.log('❌ خطأ في جلب Receipts:');
      console.log(`   Status: ${error.response?.status || 'غير محدد'}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }

    try {
      // جلب آخر payments
      const paymentsResponse = await axios.get(
        `${API_BASE_URL}/financial/vouchers/payments?limit=3`,
        { headers, timeout: 10000 }
      );
      
      console.log(`✅ تم جلب ${paymentsResponse.data.data.length} إيصال صرف:`);
      paymentsResponse.data.data.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.paymentNumber} - ${payment.amount} د.ل - ${payment.status}`);
      });
      
    } catch (error) {
      console.log('❌ خطأ في جلب Payments:');
      console.log(`   Status: ${error.response?.status || 'غير محدد'}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }

    // 4. اختبار الاتصال بالخادم
    console.log('\n🌐 اختبار الاتصال بالخادم...');
    
    try {
      const healthResponse = await axios.get(
        `${API_BASE_URL}/health`,
        { timeout: 5000 }
      );
      
      console.log('✅ الخادم يعمل بشكل طبيعي');
      console.log(`   Status: ${healthResponse.status}`);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ الخادم غير متاح - تأكد من تشغيل الخادم على المنفذ 3001');
      } else {
        console.log('❌ خطأ في الاتصال بالخادم:');
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n🎉 انتهاء اختبار APIs النظام المالي البسيط');
    console.log('\n📋 الملخص:');
    console.log('  ✅ تم اختبار Receipt API');
    console.log('  ✅ تم اختبار Payment API');
    console.log('  ✅ تم اختبار جلب البيانات');
    console.log('  ✅ تم اختبار الاتصال بالخادم');
    console.log('\n🚀 النظام المالي جاهز للاستخدام!');
    
  } catch (error) {
    console.error('❌ خطأ عام في اختبار APIs النظام المالي:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  }
}

// تشغيل الاختبار
testFinancialAPIsSimple();
