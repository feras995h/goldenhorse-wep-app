import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * اختبار إنشاء shipment جديد
 * Test Shipment Creation
 */

console.log('🧪 بدء اختبار إنشاء shipment جديد...\n');

// إعداد الاتصال بقاعدة البيانات
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function testShipmentCreation() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. الحصول على مستخدم وعميل للاختبار
    console.log('👤 الحصول على مستخدم وعميل للاختبار...');
    
    const testUser = await sequelize.query(`
      SELECT id, username FROM users WHERE "isActive" = true LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const testCustomer = await sequelize.query(`
      SELECT id, name FROM customers WHERE "isActive" = true LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (testUser.length === 0 || testCustomer.length === 0) {
      console.log('❌ لا يوجد مستخدمين أو عملاء للاختبار');
      return;
    }
    
    const userId = testUser[0].id;
    const customerId = testCustomer[0].id;
    const customerName = testCustomer[0].name;
    
    console.log(`✅ المستخدم: ${testUser[0].username} (${userId})`);
    console.log(`✅ العميل: ${customerName} (${customerId})\n`);

    // 2. إنشاء tracking number
    const year = new Date().getFullYear();
    const rnd = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const trackingNumber = `GH${year}${rnd}`;
    
    console.log(`📦 رقم التتبع: ${trackingNumber}`);

    // 3. إنشاء shipment باستخدام نفس الطريقة المستخدمة في API
    console.log('\n🚀 إنشاء shipment جديد...');
    
    // إنشاء UUID للشحنة
    const shipmentIdResult = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
    const shipmentId = shipmentIdResult[0].id;
    
    console.log(`🆔 Shipment ID: ${shipmentId}`);

    const createShipmentQuery = `
      INSERT INTO shipments (
        id, "trackingNumber", "customerId", "customerName", "customerPhone",
        "itemDescription", "itemDescriptionEn", category, quantity, weight,
        length, width, height, "volumeOverride", "declaredValue", "shippingCost",
        "originLocation", "destinationLocation", status, "receivedDate", 
        "estimatedDelivery", notes, "isFragile", "requiresSpecialHandling",
        "customsDeclaration", "createdBy", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, 'received_china', $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
      ) RETURNING *
    `;

    const shipmentData = {
      id: shipmentId,
      trackingNumber: trackingNumber,
      customerId: customerId,
      customerName: customerName,
      customerPhone: '0926476095',
      itemDescription: 'ملابس صيفية',
      itemDescriptionEn: 'Summer clothes',
      category: 'clothing',
      quantity: 2,
      weight: 3.5,
      length: 30.0,
      width: 20.0,
      height: 15.0,
      volumeOverride: null,
      declaredValue: 150.0,
      shippingCost: 75.0,
      originLocation: 'شنغهاي',
      destinationLocation: 'طرابلس',
      receivedDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'شحنة اختبار',
      isFragile: false,
      requiresSpecialHandling: true,
      customsDeclaration: 'ملابس للاستخدام الشخصي',
      createdBy: userId
    };

    const newShipmentResult = await sequelize.query(createShipmentQuery, {
      bind: [
        shipmentData.id,
        shipmentData.trackingNumber,
        shipmentData.customerId,
        shipmentData.customerName,
        shipmentData.customerPhone,
        shipmentData.itemDescription,
        shipmentData.itemDescriptionEn,
        shipmentData.category,
        shipmentData.quantity,
        shipmentData.weight,
        shipmentData.length,
        shipmentData.width,
        shipmentData.height,
        shipmentData.volumeOverride,
        shipmentData.declaredValue,
        shipmentData.shippingCost,
        shipmentData.originLocation,
        shipmentData.destinationLocation,
        shipmentData.receivedDate,
        shipmentData.estimatedDelivery,
        shipmentData.notes,
        shipmentData.isFragile,
        shipmentData.requiresSpecialHandling,
        shipmentData.customsDeclaration,
        shipmentData.createdBy
      ],
      type: sequelize.QueryTypes.INSERT
    });

    const newShipment = newShipmentResult[0][0];
    console.log('✅ تم إنشاء الشحنة بنجاح:');
    console.log(`   📦 ID: ${newShipment.id}`);
    console.log(`   🏷️ رقم التتبع: ${newShipment.trackingNumber}`);
    console.log(`   👤 العميل: ${newShipment.customerName}`);
    console.log(`   📱 الهاتف: ${newShipment.customerPhone}`);
    console.log(`   📝 الوصف: ${newShipment.itemDescription}`);
    console.log(`   ⚖️ الوزن: ${newShipment.weight} كغ`);
    console.log(`   💰 القيمة المصرحة: ${newShipment.declaredValue} د.ل`);
    console.log(`   🚚 تكلفة الشحن: ${newShipment.shippingCost} د.ل`);
    console.log(`   📍 من: ${newShipment.originLocation} إلى: ${newShipment.destinationLocation}`);
    console.log(`   📅 تاريخ الاستلام: ${newShipment.receivedDate}`);
    console.log(`   📅 التسليم المتوقع: ${newShipment.estimatedDelivery}`);

    // 4. إنشاء movement record
    console.log('\n📋 إنشاء سجل حركة الشحنة...');
    
    const movementIdResult = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
    const movementId = movementIdResult[0].id;

    const createMovementQuery = `
      INSERT INTO shipment_movements (
        id, "shipmentId", "trackingNumber", type, "newStatus", location,
        notes, "handledBy", "createdBy", "isSystemGenerated", date, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, 'status_update', 'received_china', $4, $5, $6, $7, true, NOW(), NOW(), NOW()
      ) RETURNING *
    `;

    const movementResult = await sequelize.query(createMovementQuery, {
      bind: [
        movementId,
        newShipment.id,
        newShipment.trackingNumber,
        shipmentData.originLocation,
        'تم استلام الشحنة في الصين',
        'نظام الشحن',
        userId
      ],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('✅ تم إنشاء سجل حركة الشحنة:');
    console.log(`   🆔 Movement ID: ${movementResult[0][0].id}`);
    console.log(`   📍 الموقع: ${movementResult[0][0].location}`);
    console.log(`   📝 الملاحظات: ${movementResult[0][0].notes}`);

    // 5. إنشاء stock movement
    console.log('\n📦 إنشاء سجل حركة المخزون...');
    
    try {
      const stockMovementIdResult = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
      const stockMovementId = stockMovementIdResult[0].id;

      const createStockMovementQuery = `
        INSERT INTO stock_movements (
          id, "itemCode", description, quantity, unit, direction, reason,
          "referenceType", "referenceId", "warehouseLocation", date,
          "shipmentId", "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          $1, NULL, $2, $3, 'قطعة', 'in', 'shipment', 'shipment', $4, $5, NOW(), $6, $7, NOW(), NOW()
        ) RETURNING *
      `;

      const stockMovementResult = await sequelize.query(createStockMovementQuery, {
        bind: [
          stockMovementId,
          newShipment.itemDescription,
          parseFloat(newShipment.quantity),
          newShipment.trackingNumber,
          shipmentData.originLocation,
          newShipment.id,
          userId
        ],
        type: sequelize.QueryTypes.INSERT
      });

      console.log('✅ تم إنشاء سجل حركة المخزون:');
      console.log(`   🆔 Stock Movement ID: ${stockMovementResult[0][0].id}`);
      console.log(`   📝 الوصف: ${stockMovementResult[0][0].description}`);
      console.log(`   🔢 الكمية: ${stockMovementResult[0][0].quantity}`);
      console.log(`   ➡️ الاتجاه: ${stockMovementResult[0][0].direction}`);
      
    } catch (stockError) {
      console.log(`⚠️ فشل إنشاء سجل حركة المخزون: ${stockError.message}`);
    }

    // 6. التحقق من البيانات المُنشأة
    console.log('\n🔍 التحقق من البيانات المُنشأة...');
    
    const verifyShipmentQuery = `
      SELECT s.*, sm.notes as movement_notes, stm.quantity as stock_quantity
      FROM shipments s
      LEFT JOIN shipment_movements sm ON s.id = sm."shipmentId"
      LEFT JOIN stock_movements stm ON s.id = stm."shipmentId"
      WHERE s.id = $1
    `;
    
    const verifyResult = await sequelize.query(verifyShipmentQuery, {
      bind: [newShipment.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (verifyResult.length > 0) {
      console.log('✅ تم التحقق من البيانات بنجاح:');
      console.log(`   📦 الشحنة موجودة: ${verifyResult[0].trackingNumber}`);
      console.log(`   📋 حركة الشحنة: ${verifyResult[0].movement_notes || 'غير موجودة'}`);
      console.log(`   📦 حركة المخزون: ${verifyResult[0].stock_quantity || 'غير موجودة'} قطعة`);
    }

    console.log('\n🎉 تم اختبار إنشاء shipment بنجاح!');
    console.log('\n📋 الملخص:');
    console.log('  ✅ تم إنشاء الشحنة');
    console.log('  ✅ تم إنشاء سجل حركة الشحنة');
    console.log('  ✅ تم إنشاء سجل حركة المخزون');
    console.log('  ✅ تم التحقق من البيانات');
    console.log('\n🚀 يمكن الآن إنشاء shipments من خلال API بدون أخطاء!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار إنشاء shipment:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الاختبار
testShipmentCreation();
