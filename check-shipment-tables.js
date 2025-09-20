import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function checkShipmentTables() {
  try {
    await client.connect();
    console.log('🔍 فحص جداول الشحنات في قاعدة البيانات السحابية...\n');

    // Check if shipment-related tables exist
    const tables = [
      'shipments',
      'shipment_movements', 
      'warehouse_release_orders',
      'stock_movements'
    ];

    console.log('📋 فحص وجود الجداول:');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ ${table}: ${result.rows[0].count} سجل`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }

    // Check shipments table structure
    console.log('\n📊 هيكل جدول shipments:');
    try {
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'shipments' 
        ORDER BY ordinal_position
      `);
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log(`  ❌ خطأ في فحص هيكل جدول shipments: ${error.message}`);
    }

    // Check shipment_movements table structure
    console.log('\n📊 هيكل جدول shipment_movements:');
    try {
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'shipment_movements' 
        ORDER BY ordinal_position
      `);
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log(`  ❌ خطأ في فحص هيكل جدول shipment_movements: ${error.message}`);
    }

    // Check warehouse_release_orders table structure
    console.log('\n📊 هيكل جدول warehouse_release_orders:');
    try {
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'warehouse_release_orders' 
        ORDER BY ordinal_position
      `);
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log(`  ❌ خطأ في فحص هيكل جدول warehouse_release_orders: ${error.message}`);
    }

    // Check stock_movements table structure
    console.log('\n📊 هيكل جدول stock_movements:');
    try {
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        ORDER BY ordinal_position
      `);
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log(`  ❌ خطأ في فحص هيكل جدول stock_movements: ${error.message}`);
    }

    // Test creating a sample shipment
    console.log('\n🧪 اختبار إنشاء شحنة تجريبية:');
    try {
      const testShipment = await client.query(`
        INSERT INTO shipments (
          id, "trackingNumber", "customerId", "customerName", "customerPhone",
          "itemDescription", category, quantity, weight, "originLocation",
          "destinationLocation", "receivedDate", status, "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'TEST-001', 
          (SELECT id FROM customers LIMIT 1),
          'عميل تجريبي', '1234567890',
          'بضاعة تجريبية', 'other', 1, 1.0,
          'الصين', 'طرابلس', CURRENT_DATE, 'received_china',
          (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
          NOW(), NOW()
        ) RETURNING id, "trackingNumber"
      `);
      
      console.log(`  ✅ تم إنشاء شحنة تجريبية: ${testShipment.rows[0].trackingNumber}`);
      
      // Clean up test data
      await client.query(`DELETE FROM shipments WHERE "trackingNumber" = 'TEST-001'`);
      console.log(`  🧹 تم حذف البيانات التجريبية`);
      
    } catch (error) {
      console.log(`  ❌ خطأ في اختبار إنشاء الشحنة: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات السحابية:', error.message);
  } finally {
    await client.end();
  }
}

checkShipmentTables();
