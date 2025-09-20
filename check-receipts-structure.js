import pkg from 'pg';
const { Client } = pkg;

const dbConfig = {
  connectionString:
    'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
};

async function checkReceiptsStructure() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');

    console.log('\n🔎 أعمدة جدول receipts:');
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'receipts'
      ORDER BY ordinal_position
    `);
    for (const c of cols.rows) {
      console.log(`- ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}${c.column_default ? ' | افتراضي: ' + c.column_default : ''}`);
    }

    console.log('\n📄 عينة سجلات:');
    const sample = await client.query('SELECT * FROM receipts ORDER BY "createdAt" DESC NULLS LAST LIMIT 3');
    for (const r of sample.rows) {
      console.log(`- id=${r.id}, customerId=${r.customerId || r.customerid}, amount=${r.amount ?? r.totalAmount ?? r.total ?? r.value ?? 'n/a'}, status=${r.posted_status ?? r.status ?? 'n/a'}`);
    }
  } catch (e) {
    console.error('❌ خطأ:', e.message);
  } finally {
    await client.end();
  }
}

checkReceiptsStructure().catch(console.error);

