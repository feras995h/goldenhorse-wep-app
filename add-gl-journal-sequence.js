import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function addGLJournalSequence() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إضافة تسلسل gl_journal...\n');

    // إضافة تسلسل gl_journal
    const existingSequence = await client.query(`
      SELECT id FROM document_sequences
      WHERE document_type = 'gl_journal' AND fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    if (existingSequence.rows.length === 0) {
      await client.query(`
        INSERT INTO document_sequences (document_type, prefix, current_number, fiscal_year)
        VALUES ('gl_journal', 'JE-', 1, EXTRACT(YEAR FROM CURRENT_DATE))
      `);
      console.log('✅ تم إنشاء تسلسل gl_journal جديد');
    } else {
      console.log('✅ تسلسل gl_journal موجود مسبقاً');
    }



    // التحقق من التسلسلات الموجودة
    const sequences = await client.query(`
      SELECT document_type, prefix, current_number, fiscal_year
      FROM document_sequences
      ORDER BY document_type, fiscal_year
    `);

    console.log('\n📋 التسلسلات الموجودة:');
    for (const seq of sequences.rows) {
      console.log(`- ${seq.document_type}: ${seq.prefix}${seq.current_number.toString().padStart(6, '0')} (${seq.fiscal_year})`);
    }

    // اختبار توليد رقم اليومية
    console.log('\n🧪 اختبار توليد رقم اليومية...');
    
    const testJournalNo = await client.query(
      "SELECT generate_document_number('gl_journal') as journal_no"
    );

    console.log(`✅ رقم اليومية التجريبي: ${testJournalNo.rows[0].journal_no}`);

    console.log('\n🎉 تم إعداد تسلسل gl_journal بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

addGLJournalSequence().catch(console.error);
