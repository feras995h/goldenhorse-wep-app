/**
 * اختبار سريع لـ warehouse release order endpoint
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testWarehouseReleaseOrder() {
  try {
    console.log('🔐 تسجيل الدخول...');
    
    // تسجيل الدخول للحصول على token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ تم تسجيل الدخول بنجاح');
    
    // إعداد headers للطلبات
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📦 جلب الشحنات...');
    
    // جلب الشحنات أولاً
    const shipmentsResponse = await axios.get(`${BASE_URL}/sales/shipments`, { headers });
    const shipments = shipmentsResponse.data.data || shipmentsResponse.data;
    
    if (!shipments || shipments.length === 0) {
      console.log('⚠️  لا توجد شحنات متاحة للاختبار');
      return;
    }
    
    const firstShipment = shipments[0];
    console.log(`✅ تم العثور على ${shipments.length} شحنة`);
    console.log(`📋 سيتم اختبار الشحنة: ${firstShipment.trackingNumber}`);
    
    console.log('🏭 إنشاء warehouse release order...');
    
    // إنشاء warehouse release order
    const releaseOrderData = {
      shipmentId: firstShipment.id,
      trackingNumber: firstShipment.trackingNumber,
      requestedBy: 'أحمد محمد',
      requestedByPhone: '+218912345678',
      warehouseLocation: 'المخزن الرئيسي - طرابلس',
      storageFeesAmount: 50.00,
      handlingFeesAmount: 25.00,
      paymentMethod: 'cash',
      paymentReference: 'CASH-001',
      notes: 'اختبار إنشاء أمر صرف'
    };
    
    const createResponse = await axios.post(
      `${BASE_URL}/sales/warehouse-release-orders`, 
      releaseOrderData, 
      { headers }
    );
    
    console.log('✅ تم إنشاء warehouse release order بنجاح!');
    console.log(`📄 رقم الأمر: ${createResponse.data.releaseOrder.orderNumber}`);
    console.log(`💰 إجمالي الرسوم: ${createResponse.data.releaseOrder.totalFeesAmount} د.ل`);
    
    if (createResponse.data.payments && createResponse.data.payments.length > 0) {
      console.log('💳 تم إنشاء إيصالات الدفع التلقائية:');
      createResponse.data.payments.forEach(payment => {
        console.log(`   - إيصال رقم: ${payment.paymentNumber} - المبلغ: ${payment.amount} د.ل`);
      });
    }
    
    console.log('📋 جلب قائمة warehouse release orders...');
    
    // جلب قائمة warehouse release orders
    const listResponse = await axios.get(`${BASE_URL}/sales/warehouse-release-orders`, { headers });
    const releaseOrders = listResponse.data.data || listResponse.data;
    
    console.log(`✅ تم العثور على ${releaseOrders.length} أمر صرف`);
    
    console.log('\n🎉 جميع الاختبارات نجحت!');
    console.log('✅ warehouse release order endpoint يعمل بشكل صحيح');
    
  } catch (error) {
    console.error('❌ فشل الاختبار:', error.message);
    
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📄 Response:`, error.response.data);
    }
    
    console.error('📄 Stack:', error.stack);
  }
}

// تشغيل الاختبار
testWarehouseReleaseOrder();
