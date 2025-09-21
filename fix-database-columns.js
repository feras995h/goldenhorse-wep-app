import { Sequelize } from 'sequelize';

async function fixDatabaseColumns() {
  console.log('🔧 إصلاح أعمدة قاعدة البيانات...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Check and add missing columns to sales_invoices
    const salesInvoicesColumns = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices'
    `);

    const existingColumns = salesInvoicesColumns[0].map(col => col.column_name);
    console.log('📋 الأعمدة الموجودة في sales_invoices:', existingColumns);

    // Add missing columns
    const columnsToAdd = [
      { name: 'serviceDescription', type: 'TEXT' },
      { name: 'serviceDescriptionEn', type: 'TEXT' },
      { name: 'shipmentNumbers', type: 'JSON DEFAULT \'[]\'' },
      { name: 'serviceType', type: 'VARCHAR(20) DEFAULT \'sea_freight\'' },
      { name: 'weight', type: 'DECIMAL(10,3)' },
      { name: 'volume', type: 'DECIMAL(15,3)' },
      { name: 'cbm', type: 'DECIMAL(15,3)' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          await sequelize.query(`
            ALTER TABLE sales_invoices ADD COLUMN "${column.name}" ${column.type}
          `);
          console.log(`✅ تم إضافة ${column.name} إلى sales_invoices`);
        } catch (error) {
          console.log(`⚠️ خطأ في إضافة ${column.name}:`, error.message);
        }
      } else {
        console.log(`ℹ️ ${column.name} موجود بالفعل`);
      }
    }

    // Check if sales_invoices has invoiceNumber column
    if (!existingColumns.includes('invoiceNumber')) {
      console.log('❌ عمود invoiceNumber غير موجود في sales_invoices');
      
      // Check what columns exist
      const allColumns = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales_invoices' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 جميع أعمدة sales_invoices:');
      allColumns[0].forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Check other tables
    const tables = ['suppliers', 'receipt_vouchers', 'payment_vouchers', 'purchase_invoices', 'warehouse'];
    
    for (const table of tables) {
      try {
        const tableExists = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${table}'
          )
        `);
        
        if (tableExists[0][0].exists) {
          console.log(`✅ جدول ${table} موجود`);
        } else {
          console.log(`❌ جدول ${table} غير موجود`);
        }
      } catch (error) {
        console.log(`⚠️ خطأ في فحص جدول ${table}:`, error.message);
      }
    }

    console.log('🎉 انتهى فحص قاعدة البيانات');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixDatabaseColumns();
