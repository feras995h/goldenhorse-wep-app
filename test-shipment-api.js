import pkg from 'node-fetch';
const fetch = pkg;

const API_BASE_URL = 'http://localhost:5000/api';

// Test shipment API endpoints
async function testShipmentAPI() {
  console.log('🧪 اختبار API الشحنات...\n');

  try {
    // First, get a token by logging in
    console.log('🔐 تسجيل الدخول للحصول على token...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // Test GET /api/sales/shipments
    console.log('📋 اختبار جلب قائمة الشحنات...');
    const getShipmentsResponse = await fetch(`${API_BASE_URL}/sales/shipments?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (getShipmentsResponse.ok) {
      const shipmentsData = await getShipmentsResponse.json();
      console.log(`✅ تم جلب الشحنات بنجاح: ${shipmentsData.data.length} شحنة`);
      console.log(`📊 إجمالي الصفحات: ${shipmentsData.pagination.totalPages}`);
    } else {
      const errorText = await getShipmentsResponse.text();
      console.log(`❌ خطأ في جلب الشحنات: ${getShipmentsResponse.status} - ${errorText}`);
    }

    // Test POST /api/sales/shipments - Create new shipment
    console.log('\n📦 اختبار إنشاء شحنة جديدة...');
    const newShipment = {
      customerName: 'عميل تجريبي',
      customerPhone: '1234567890',
      itemDescription: 'بضاعة تجريبية للاختبار',
      itemDescriptionEn: 'Test shipment item',
      category: 'other',
      quantity: 1,
      weight: 1.5,
      length: 10,
      width: 10,
      height: 10,
      declaredValue: 100,
      shippingCost: 50,
      originLocation: 'الصين',
      destinationLocation: 'طرابلس',
      receivedDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'شحنة تجريبية للاختبار',
      isFragile: false,
      requiresSpecialHandling: false
    };

    const createShipmentResponse = await fetch(`${API_BASE_URL}/sales/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newShipment)
    });

    if (createShipmentResponse.ok) {
      const createdShipment = await createShipmentResponse.json();
      console.log(`✅ تم إنشاء الشحنة بنجاح: ${createdShipment.shipment.trackingNumber}`);
      console.log(`🆔 معرف الشحنة: ${createdShipment.shipment.id}`);
      
      // Test GET /api/sales/shipments/:id
      console.log('\n🔍 اختبار جلب شحنة محددة...');
      const getShipmentResponse = await fetch(`${API_BASE_URL}/sales/shipments/${createdShipment.shipment.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (getShipmentResponse.ok) {
        const shipmentData = await getShipmentResponse.json();
        console.log(`✅ تم جلب الشحنة بنجاح: ${shipmentData.trackingNumber}`);
        console.log(`📦 وصف البضاعة: ${shipmentData.itemDescription}`);
      } else {
        const errorText = await getShipmentResponse.text();
        console.log(`❌ خطأ في جلب الشحنة: ${getShipmentResponse.status} - ${errorText}`);
      }

      // Test PUT /api/sales/shipments/:id - Update shipment
      console.log('\n✏️ اختبار تحديث الشحنة...');
      const updateData = {
        notes: 'تم تحديث الشحنة للاختبار',
        status: 'in_transit'
      };

      const updateShipmentResponse = await fetch(`${API_BASE_URL}/sales/shipments/${createdShipment.shipment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (updateShipmentResponse.ok) {
        const updatedShipment = await updateShipmentResponse.json();
        console.log(`✅ تم تحديث الشحنة بنجاح`);
        console.log(`📝 الملاحظات: ${updatedShipment.shipment.notes}`);
      } else {
        const errorText = await updateShipmentResponse.text();
        console.log(`❌ خطأ في تحديث الشحنة: ${updateShipmentResponse.status} - ${errorText}`);
      }

      // Test DELETE /api/sales/shipments/:id - Delete shipment
      console.log('\n🗑️ اختبار حذف الشحنة...');
      const deleteShipmentResponse = await fetch(`${API_BASE_URL}/sales/shipments/${createdShipment.shipment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (deleteShipmentResponse.ok) {
        console.log(`✅ تم حذف الشحنة بنجاح`);
      } else {
        const errorText = await deleteShipmentResponse.text();
        console.log(`❌ خطأ في حذف الشحنة: ${deleteShipmentResponse.status} - ${errorText}`);
      }

    } else {
      const errorText = await createShipmentResponse.text();
      console.log(`❌ خطأ في إنشاء الشحنة: ${createShipmentResponse.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار API الشحنات:', error.message);
  }
}

testShipmentAPI();
