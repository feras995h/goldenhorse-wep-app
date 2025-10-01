import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
  ssl: false
});

async function checkEnums() {
  try {
    await client.connect();
    console.log('✅ متصل\n');

    // فحص ENUM types
    const result = await client.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE 'enum_accounts%'
      ORDER BY t.typname, e.enumsortorder
    `);

    console.log('📊 ENUM Values:\n');
    
    let currentEnum = '';
    for (const row of result.rows) {
      if (row.enum_name !== currentEnum) {
        if (currentEnum) console.log('');
        console.log(`${row.enum_name}:`);
        currentEnum = row.enum_name;
      }
      console.log(`  - ${row.enum_value}`);
    }

    // فحص حساب موجود
    console.log('\n📊 مثال من حساب موجود:\n');
    const account = await client.query(`
      SELECT code, name, type, "rootType", "reportType"
      FROM accounts 
      WHERE type = 'revenue'
      LIMIT 1
    `);
    
    if (account.rows.length > 0) {
      console.table(account.rows);
    } else {
      console.log('لا يوجد حساب revenue');
    }

  } catch (error) {
    console.error('❌', error.message);
  } finally {
    await client.end();
  }
}

checkEnums();
