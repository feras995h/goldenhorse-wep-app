import { Sequelize } from 'sequelize';

/**
 * فحص هيكل جدول shipments لمعرفة الأعمدة الموجودة
 */

console.log('🔍 فحص هيكل جدول shipments...\n');

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

async function checkShipmentsTable() {
  try {
    console.log('📊 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال ناجح\n');

    // فحص أعمدة جدول shipments
    console.log('📋 فحص أعمدة جدول shipments:');
    const columns = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'shipments' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 إجمالي الأعمدة: ${columns.length}`);
    columns.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? '' : ' (NOT NULL)';
      const length = col.character_maximum_length ? ` (${col.character_maximum_length})` : '';
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type}${length}${nullable}`);
    });

    // البحث عن أعمدة المبلغ المحتملة
    console.log('\n🔍 البحث عن أعمدة المبلغ:');
    const amountColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('amount') ||
      col.column_name.toLowerCase().includes('total') ||
      col.column_name.toLowerCase().includes('cost') ||
      col.column_name.toLowerCase().includes('price') ||
      col.column_name.toLowerCase().includes('fee')
    );

    if (amountColumns.length > 0) {
      console.log('✅ أعمدة المبلغ الموجودة:');
      amountColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ لا توجد أعمدة مبلغ في جدول shipments');
    }

    // فحص عينة من البيانات
    console.log('\n📊 فحص عينة من البيانات:');
    const sampleData = await sequelize.query(`
      SELECT * FROM shipments LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });

    if (sampleData.length > 0) {
      console.log(`✅ عدد الشحنات: ${sampleData.length}`);
      sampleData.forEach((shipment, index) => {
        console.log(`\n  شحنة ${index + 1}:`);
        Object.keys(shipment).forEach(key => {
          if (shipment[key] !== null && shipment[key] !== undefined) {
            console.log(`    ${key}: ${shipment[key]}`);
          }
        });
      });
    } else {
      console.log('⚠️ لا توجد بيانات في جدول shipments');
    }

    // اقتراح الحل
    console.log('\n🎯 الحل المقترح:');
    if (amountColumns.length > 0) {
      console.log('✅ استخدام العمود الموجود:');
      amountColumns.forEach(col => {
        console.log(`  - يمكن استخدام s."${col.column_name}" بدلاً من s."totalAmount"`);
      });
    } else {
      console.log('🔧 إزالة shipping_revenue من الاستعلام أو استخدام قيمة افتراضية:');
      console.log('  - COALESCE(0, 0) as shipping_revenue');
      console.log('  - أو حذف السطر كاملاً');
    }

  } catch (error) {
    console.error('❌ خطأ في فحص جدول shipments:', error.message);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الفحص
checkShipmentsTable();
