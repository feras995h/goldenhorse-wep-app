import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function checkSalesInvoicesStructure() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔍 فحص هيكل جدول sales_invoices...\n');

    // فحص أعمدة الجدول
    const columns = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices'
      ORDER BY ordinal_position
    `);

    console.log('📊 أعمدة جدول sales_invoices:');
    for (const col of columns.rows) {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
      if (col.column_default) {
        console.log(`  القيمة الافتراضية: ${col.column_default}`);
      }
    }

    // فحص عينة من البيانات
    console.log('\n📋 عينة من البيانات الموجودة:');
    const sampleData = await client.query(`
      SELECT * FROM sales_invoices LIMIT 3
    `);

    if (sampleData.rows.length > 0) {
      console.log(`عدد السجلات: ${sampleData.rows.length}`);
      for (const row of sampleData.rows) {
        console.log(`- ID: ${row.id}`);
        console.log(`  العميل: ${row.customerId}`);
        console.log(`  التاريخ: ${row.date}`);
        console.log(`  المجموع: ${row.total || row.totalAmount || 'غير محدد'}`);
        console.log(`  الحالة: ${row.posted_status || 'غير محدد'}`);
        console.log('');
      }
    } else {
      console.log('لا توجد بيانات في الجدول');
    }

    // فحص الفهارس
    console.log('\n🔍 الفهارس الموجودة:');
    const indexes = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'sales_invoices'
    `);

    for (const idx of indexes.rows) {
      console.log(`- ${idx.indexname}`);
      console.log(`  ${idx.indexdef}`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

checkSalesInvoicesStructure().catch(console.error);
