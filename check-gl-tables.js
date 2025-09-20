import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function checkGLTables() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔍 فحص جداول GL...\n');

    // فحص الجداول الموجودة
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%gl_%' 
        OR table_name LIKE '%journal%'
        OR table_name LIKE '%posting%'
      ORDER BY table_name
    `);

    console.log('📋 الجداول الموجودة:');
    for (const table of tables.rows) {
      console.log(`- ${table.table_name}`);
    }

    // فحص هيكل gl_journals إذا كان موجوداً
    const journalsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_journals'
      )
    `);

    if (journalsExists.rows[0].exists) {
      console.log('\n📊 هيكل جدول gl_journals:');
      const journalColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'gl_journals'
        ORDER BY ordinal_position
      `);

      for (const col of journalColumns.rows) {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
      }
    } else {
      console.log('\n❌ جدول gl_journals غير موجود');
    }

    // فحص هيكل gl_entries إذا كان موجوداً
    const entriesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_entries'
      )
    `);

    if (entriesExists.rows[0].exists) {
      console.log('\n📊 هيكل جدول gl_entries:');
      const entryColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'gl_entries'
        ORDER BY ordinal_position
      `);

      for (const col of entryColumns.rows) {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
      }
    } else {
      console.log('\n❌ جدول gl_entries غير موجود');
      
      console.log('\n🔧 إنشاء جداول GL...');
      
      // إنشاء جدول gl_journals
      await client.query(`
        CREATE TABLE IF NOT EXISTS gl_journals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          journal_no VARCHAR(50) UNIQUE NOT NULL,
          journal_date DATE NOT NULL DEFAULT CURRENT_DATE,
          description TEXT NOT NULL,
          document_type VARCHAR(50) NOT NULL,
          document_id UUID NOT NULL,
          document_no VARCHAR(50),
          total_debit DECIMAL(15,2) DEFAULT 0,
          total_credit DECIMAL(15,2) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'posted',
          fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
          posted_by UUID,
          posted_at TIMESTAMP DEFAULT NOW(),
          reversed_by UUID,
          reversed_at TIMESTAMP,
          reversal_reason TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('✅ تم إنشاء جدول gl_journals');

      // إنشاء جدول gl_entries
      await client.query(`
        CREATE TABLE IF NOT EXISTS gl_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          journal_id UUID NOT NULL REFERENCES gl_journals(id) ON DELETE CASCADE,
          account_id UUID NOT NULL REFERENCES accounts(id),
          debit_amount DECIMAL(15,2) DEFAULT 0,
          credit_amount DECIMAL(15,2) DEFAULT 0,
          description TEXT NOT NULL,
          line_number INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('✅ تم إنشاء جدول gl_entries');

      // إنشاء الفهارس
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_gl_journals_document ON gl_journals(document_type, document_id);
        CREATE INDEX IF NOT EXISTS idx_gl_journals_date ON gl_journals(journal_date);
        CREATE INDEX IF NOT EXISTS idx_gl_journals_status ON gl_journals(status);
        CREATE INDEX IF NOT EXISTS idx_gl_entries_journal ON gl_entries(journal_id);
        CREATE INDEX IF NOT EXISTS idx_gl_entries_account ON gl_entries(account_id);
      `);

      console.log('✅ تم إنشاء الفهارس');
    }

    console.log('\n🎉 تم التحقق من جداول GL بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkGLTables().catch(console.error);
