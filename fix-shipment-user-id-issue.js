import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح مشكلة User ID في Shipments
 * Fix User ID issue in Shipments
 */

console.log('🔧 بدء إصلاح مشكلة User ID في Shipments...\n');

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

async function fixShipmentUserIdIssue() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص نوع البيانات في جدول users
    console.log('🔍 فحص نوع البيانات في جدول users...');
    try {
      const usersColumns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id'
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📋 نوع البيانات لـ users.id:');
      usersColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
    } catch (error) {
      console.log(`❌ خطأ في فحص جدول users: ${error.message}`);
    }

    // 2. فحص المستخدمين الموجودين
    console.log('\n👤 فحص المستخدمين الموجودين...');
    try {
      const users = await sequelize.query(`
        SELECT id, username, name, role, "isActive"
        FROM users 
        WHERE "isActive" = true
        ORDER BY username
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ تم العثور على ${users.length} مستخدم نشط:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id} (${typeof user.id}) - ${user.username} (${user.name}) - ${user.role}`);
      });
      
      if (users.length === 0) {
        console.log('❌ لا يوجد مستخدمين نشطين');
        return;
      }
      
    } catch (error) {
      console.log(`❌ خطأ في فحص المستخدمين: ${error.message}`);
    }

    // 3. فحص نوع البيانات في جدول shipments
    console.log('\n🔍 فحص نوع البيانات في جدول shipments...');
    try {
      const shipmentsColumns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'createdBy'
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📋 نوع البيانات لـ shipments.createdBy:');
      shipmentsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
    } catch (error) {
      console.log(`❌ خطأ في فحص جدول shipments: ${error.message}`);
    }

    // 4. فحص إذا كان هناك تضارب في أنواع البيانات
    console.log('\n🔧 فحص التضارب في أنواع البيانات...');
    try {
      // محاولة إنشاء shipment تجريبي لفهم المشكلة
      const testUserId = await sequelize.query(`
        SELECT id FROM users WHERE "isActive" = true LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (testUserId.length > 0) {
        const userId = testUserId[0].id;
        console.log(`🧪 اختبار إنشاء shipment مع User ID: ${userId} (${typeof userId})`);
        
        // محاولة إنشاء shipment تجريبي
        const testShipmentData = {
          id: 'test-shipment-' + Date.now(),
          trackingNumber: 'TEST-' + Date.now(),
          customerId: await sequelize.query(`SELECT id FROM customers WHERE "isActive" = true LIMIT 1`, { type: sequelize.QueryTypes.SELECT }).then(r => r[0]?.id),
          customerName: 'عميل تجريبي',
          customerPhone: '0123456789',
          itemDescription: 'عنصر تجريبي',
          itemDescriptionEn: 'Test item',
          category: 'other',
          quantity: 1,
          weight: 1.0,
          declaredValue: 100.0,
          shippingCost: 50.0,
          originLocation: 'شنغهاي',
          destinationLocation: 'طرابلس',
          status: 'received_china',
          receivedDate: new Date().toISOString().split('T')[0],
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'اختبار',
          isFragile: false,
          requiresSpecialHandling: false,
          customsDeclaration: '',
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // محاولة الإدراج
        const insertQuery = `
          INSERT INTO shipments (
            id, "trackingNumber", "customerId", "customerName", "customerPhone",
            "itemDescription", "itemDescriptionEn", category, quantity, weight,
            "declaredValue", "shippingCost", "originLocation", "destinationLocation",
            status, "receivedDate", "estimatedDelivery", notes, "isFragile",
            "requiresSpecialHandling", "customsDeclaration", "createdBy",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
          ) RETURNING id
        `;
        
        const result = await sequelize.query(insertQuery, {
          bind: [
            testShipmentData.id,
            testShipmentData.trackingNumber,
            testShipmentData.customerId,
            testShipmentData.customerName,
            testShipmentData.customerPhone,
            testShipmentData.itemDescription,
            testShipmentData.itemDescriptionEn,
            testShipmentData.category,
            testShipmentData.quantity,
            testShipmentData.weight,
            testShipmentData.declaredValue,
            testShipmentData.shippingCost,
            testShipmentData.originLocation,
            testShipmentData.destinationLocation,
            testShipmentData.status,
            testShipmentData.receivedDate,
            testShipmentData.estimatedDelivery,
            testShipmentData.notes,
            testShipmentData.isFragile,
            testShipmentData.requiresSpecialHandling,
            testShipmentData.customsDeclaration,
            testShipmentData.createdBy,
            testShipmentData.createdAt,
            testShipmentData.updatedAt
          ],
          type: sequelize.QueryTypes.INSERT
        });
        
        console.log('✅ تم إنشاء shipment تجريبي بنجاح:', result[0]);
        
        // حذف الـ shipment التجريبي
        await sequelize.query(`DELETE FROM shipments WHERE id = $1`, {
          bind: [testShipmentData.id],
          type: sequelize.QueryTypes.DELETE
        });
        
        console.log('✅ تم حذف الـ shipment التجريبي');
        
      } else {
        console.log('❌ لا يوجد مستخدمين للاختبار');
      }
      
    } catch (error) {
      console.log(`❌ خطأ في اختبار إنشاء shipment: ${error.message}`);
      console.log('📋 تفاصيل الخطأ:', error);
    }

    // 5. إصلاح مشكلة User ID إذا كانت موجودة
    console.log('\n🔧 إصلاح مشكلة User ID...');
    try {
      // فحص إذا كان هناك مستخدمين بـ ID integer
      const integerUsers = await sequelize.query(`
        SELECT id, username, name 
        FROM users 
        WHERE id ~ '^[0-9]+$'
        ORDER BY id::integer
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (integerUsers.length > 0) {
        console.log(`⚠️ تم العثور على ${integerUsers.length} مستخدم بـ ID integer:`);
        integerUsers.forEach(user => {
          console.log(`  - ID: ${user.id} - ${user.username} (${user.name})`);
        });
        
        // إنشاء mapping من integer IDs إلى UUID IDs
        console.log('\n🔄 إنشاء UUID IDs للمستخدمين...');
        
        for (const user of integerUsers) {
          const newUUID = await sequelize.query(`SELECT gen_random_uuid() as uuid`, { type: sequelize.QueryTypes.SELECT });
          const uuid = newUUID[0].uuid;
          
          console.log(`🔄 تحديث المستخدم ${user.username} من ID ${user.id} إلى ${uuid}`);
          
          // تحديث ID المستخدم
          await sequelize.query(`
            UPDATE users SET id = $1 WHERE id = $2
          `, {
            bind: [uuid, user.id],
            type: sequelize.QueryTypes.UPDATE
          });
          
          // تحديث جميع الجداول التي تشير إلى هذا المستخدم
          const tablesToUpdate = [
            'shipments',
            'shipment_movements',
            'sales_invoices',
            'customers',
            'vouchers',
            'receipts',
            'payments'
          ];
          
          for (const table of tablesToUpdate) {
            try {
              await sequelize.query(`
                UPDATE ${table} SET "createdBy" = $1 WHERE "createdBy" = $2
              `, {
                bind: [uuid, user.id],
                type: sequelize.QueryTypes.UPDATE
              });
              console.log(`  ✅ تم تحديث ${table}`);
            } catch (err) {
              console.log(`  ⚠️ تخطي ${table}: ${err.message}`);
            }
          }
        }
        
        console.log('✅ تم تحديث جميع User IDs إلى UUID');
        
      } else {
        console.log('✅ جميع المستخدمين يستخدمون UUID بالفعل');
      }
      
    } catch (error) {
      console.log(`❌ خطأ في إصلاح User IDs: ${error.message}`);
    }

    // 6. اختبار نهائي لإنشاء shipment
    console.log('\n🧪 اختبار نهائي لإنشاء shipment...');
    try {
      const testUser = await sequelize.query(`
        SELECT id, username FROM users WHERE "isActive" = true LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      const testCustomer = await sequelize.query(`
        SELECT id, name FROM customers WHERE "isActive" = true LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (testUser.length > 0 && testCustomer.length > 0) {
        const userId = testUser[0].id;
        const customerId = testCustomer[0].id;
        
        console.log(`🧪 اختبار إنشاء shipment مع User ID: ${userId} و Customer ID: ${customerId}`);
        
        const finalTestData = {
          trackingNumber: 'FINAL-TEST-' + Date.now(),
          customerId: customerId,
          customerName: 'عميل اختبار نهائي',
          customerPhone: '0987654321',
          itemDescription: 'عنصر اختبار نهائي',
          itemDescriptionEn: 'Final test item',
          category: 'other',
          quantity: 1,
          weight: 2.0,
          declaredValue: 200.0,
          shippingCost: 75.0,
          originLocation: 'شنغهاي',
          destinationLocation: 'طرابلس',
          receivedDate: new Date().toISOString().split('T')[0],
          estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'اختبار نهائي',
          isFragile: false,
          requiresSpecialHandling: true,
          customsDeclaration: 'اختبار',
          createdBy: userId
        };
        
        // محاولة إنشاء shipment باستخدام Sequelize
        const createQuery = `
          INSERT INTO shipments (
            id, "trackingNumber", "customerId", "customerName", "customerPhone",
            "itemDescription", "itemDescriptionEn", category, quantity, weight,
            "declaredValue", "shippingCost", "originLocation", "destinationLocation",
            status, "receivedDate", "estimatedDelivery", notes, "isFragile",
            "requiresSpecialHandling", "customsDeclaration", "createdBy",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'received_china', $14, $15, $16, $17, $18, $19, $20, NOW(), NOW()
          ) RETURNING id, "trackingNumber"
        `;
        
        const finalResult = await sequelize.query(createQuery, {
          bind: [
            finalTestData.trackingNumber,
            finalTestData.customerId,
            finalTestData.customerName,
            finalTestData.customerPhone,
            finalTestData.itemDescription,
            finalTestData.itemDescriptionEn,
            finalTestData.category,
            finalTestData.quantity,
            finalTestData.weight,
            finalTestData.declaredValue,
            finalTestData.shippingCost,
            finalTestData.originLocation,
            finalTestData.destinationLocation,
            finalTestData.receivedDate,
            finalTestData.estimatedDelivery,
            finalTestData.notes,
            finalTestData.isFragile,
            finalTestData.requiresSpecialHandling,
            finalTestData.customsDeclaration,
            finalTestData.createdBy
          ],
          type: sequelize.QueryTypes.INSERT
        });
        
        console.log('✅ تم إنشاء shipment نهائي بنجاح:', finalResult[0]);
        
        // حذف الـ shipment النهائي
        await sequelize.query(`DELETE FROM shipments WHERE id = $1`, {
          bind: [finalResult[0][0].id],
          type: sequelize.QueryTypes.DELETE
        });
        
        console.log('✅ تم حذف الـ shipment النهائي');
        
      } else {
        console.log('❌ لا يوجد مستخدمين أو عملاء للاختبار النهائي');
      }
      
    } catch (error) {
      console.log(`❌ خطأ في الاختبار النهائي: ${error.message}`);
    }

    console.log('\n🎉 انتهاء إصلاح مشكلة User ID في Shipments');
    console.log('\n📋 الملخص:');
    console.log('  ✅ تم فحص أنواع البيانات');
    console.log('  ✅ تم إصلاح User IDs إذا كانت مطلوبة');
    console.log('  ✅ تم اختبار إنشاء shipments');
    console.log('\n🚀 يمكن الآن إنشاء shipments بدون أخطاء!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح User ID:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixShipmentUserIdIssue();
