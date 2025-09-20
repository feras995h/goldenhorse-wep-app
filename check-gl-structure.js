import { Client } from 'pg';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkGLStructure() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('🔗 متصل بقاعدة البيانات\n');

    // فحص بنية جدول gl_entries
    console.log('📋 بنية جدول gl_entries:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'gl_entries'
      ORDER BY ordinal_position;
    `);

    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // فحص عينة من البيانات
    console.log('\n📊 عينة من البيانات:');
    const sample = await client.query('SELECT * FROM gl_entries LIMIT 3');
    
    if (sample.rows.length > 0) {
      console.log('   الأعمدة الموجودة:', Object.keys(sample.rows[0]).join(', '));
      
      sample.rows.forEach((row, index) => {
        console.log(`\n   السجل ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      });
    }

  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    await client.end();
  }
}

checkGLStructure();
