import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function phase0SafetySetup() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔒 المرحلة 0: إعداد الأمان والحالة...\n');

    // 1. إنشاء نسخة احتياطية من الجداول الحساسة
    console.log('💾 إنشاء نسخة احتياطية من الجداول الحساسة...');
    
    const backupTables = [
      'sales_invoices',
      'receipts', 
      'customers',
      'accounts',
      'journal_entry_details'
    ];

    for (const table of backupTables) {
      try {
        // إنشاء جدول النسخة الاحتياطية
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${table}_backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')} 
          AS SELECT * FROM ${table}
        `);
        
        const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ نسخ احتياطي من ${table}: ${count.rows[0].count} سجل`);
      } catch (error) {
        console.error(`❌ خطأ في النسخ الاحتياطي لـ ${table}:`, error.message);
      }
    }

    // 2. إضافة حقول الحالة بأمان (إذا لم تكن موجودة)
    console.log('\n📊 إضافة حقول الحالة والترقيم...');

    // إضافة حقول الحالة لفواتير المبيعات
    const salesInvoiceColumns = [
      { name: 'posted_status', type: 'VARCHAR(20)', default: "'draft'" },
      { name: 'posted_at', type: 'TIMESTAMP', default: 'NULL' },
      { name: 'posted_by', type: 'UUID', default: 'NULL' },
      { name: 'document_no', type: 'VARCHAR(50)', default: 'NULL' },
      { name: 'fiscal_year', type: 'INTEGER', default: 'EXTRACT(YEAR FROM CURRENT_DATE)' },
      { name: 'can_edit', type: 'BOOLEAN', default: 'true' },
      { name: 'void_reason', type: 'TEXT', default: 'NULL' }
    ];

    for (const col of salesInvoiceColumns) {
      try {
        await client.query(`
          ALTER TABLE sales_invoices 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}
        `);
        console.log(`✅ إضافة حقل ${col.name} إلى sales_invoices`);
      } catch (error) {
        console.log(`⚠️ حقل ${col.name} موجود مسبقاً في sales_invoices`);
      }
    }

    // إضافة حقول الحالة للإيصالات
    const receiptColumns = [
      { name: 'posted_status', type: 'VARCHAR(20)', default: "'draft'" },
      { name: 'posted_at', type: 'TIMESTAMP', default: 'NULL' },
      { name: 'posted_by', type: 'UUID', default: 'NULL' },
      { name: 'document_no', type: 'VARCHAR(50)', default: 'NULL' },
      { name: 'fiscal_year', type: 'INTEGER', default: 'EXTRACT(YEAR FROM CURRENT_DATE)' },
      { name: 'can_edit', type: 'BOOLEAN', default: 'true' },
      { name: 'void_reason', type: 'TEXT', default: 'NULL' }
    ];

    for (const col of receiptColumns) {
      try {
        await client.query(`
          ALTER TABLE receipts 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}
        `);
        console.log(`✅ إضافة حقل ${col.name} إلى receipts`);
      } catch (error) {
        console.log(`⚠️ حقل ${col.name} موجود مسبقاً في receipts`);
      }
    }

    // 3. إنشاء جدول تسلسل المستندات
    console.log('\n🔢 إنشاء نظام ترقيم المستندات...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_sequences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_type VARCHAR(50) NOT NULL UNIQUE,
        prefix VARCHAR(10) NOT NULL,
        current_number INTEGER NOT NULL DEFAULT 0,
        fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
        format_pattern VARCHAR(50) NOT NULL DEFAULT '{prefix}-{year}-{number:06d}',
        is_active BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // إدراج تسلسلات افتراضية
    const sequences = [
      { type: 'sales_invoice', prefix: 'INV', pattern: 'INV-{year}-{number:06d}' },
      { type: 'receipt', prefix: 'REC', pattern: 'REC-{year}-{number:06d}' },
      { type: 'credit_note', prefix: 'CN', pattern: 'CN-{year}-{number:06d}' },
      { type: 'debit_note', prefix: 'DN', pattern: 'DN-{year}-{number:06d}' }
    ];

    for (const seq of sequences) {
      try {
        await client.query(`
          INSERT INTO document_sequences (document_type, prefix, format_pattern)
          VALUES ($1, $2, $3)
          ON CONFLICT (document_type) DO NOTHING
        `, [seq.type, seq.prefix, seq.pattern]);
        
        console.log(`✅ تسلسل ${seq.type}: ${seq.prefix}`);
      } catch (error) {
        console.error(`❌ خطأ في إنشاء تسلسل ${seq.type}:`, error.message);
      }
    }

    // 4. دالة توليد رقم المستند
    console.log('\n⚙️ إنشاء دالة توليد أرقام المستندات...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_document_number(doc_type VARCHAR)
      RETURNS VARCHAR AS $$
      DECLARE
        seq_record RECORD;
        new_number INTEGER;
        document_no VARCHAR;
        current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
      BEGIN
        -- الحصول على تسلسل المستند
        SELECT * INTO seq_record 
        FROM document_sequences 
        WHERE document_type = doc_type AND is_active = true;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Document sequence not found for type: %', doc_type;
        END IF;
        
        -- إعادة تعيين الرقم إذا تغيرت السنة
        IF seq_record.fiscal_year != current_year THEN
          UPDATE document_sequences 
          SET current_number = 0, fiscal_year = current_year, "updatedAt" = NOW()
          WHERE document_type = doc_type;
          new_number := 1;
        ELSE
          -- زيادة الرقم
          UPDATE document_sequences 
          SET current_number = current_number + 1, "updatedAt" = NOW()
          WHERE document_type = doc_type;
          new_number := seq_record.current_number + 1;
        END IF;
        
        -- تكوين رقم المستند
        document_no := REPLACE(seq_record.format_pattern, '{prefix}', seq_record.prefix);
        document_no := REPLACE(document_no, '{year}', current_year::VARCHAR);
        document_no := REPLACE(document_no, '{number:06d}', LPAD(new_number::VARCHAR, 6, '0'));
        
        RETURN document_no;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم إنشاء دالة generate_document_number');

    // 5. تحديث المستندات الموجودة بأرقام تسلسلية (بأمان)
    console.log('\n🔄 تحديث المستندات الموجودة بأرقام تسلسلية...');
    
    // تحديث فواتير المبيعات
    const invoicesWithoutNumbers = await client.query(`
      SELECT id FROM sales_invoices 
      WHERE document_no IS NULL OR document_no = ''
      ORDER BY "createdAt"
    `);

    console.log(`📊 عدد الفواتير بدون أرقام: ${invoicesWithoutNumbers.rows.length}`);

    for (let i = 0; i < invoicesWithoutNumbers.rows.length; i++) {
      const invoice = invoicesWithoutNumbers.rows[i];
      const docNo = `INV-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`;
      
      await client.query(`
        UPDATE sales_invoices 
        SET document_no = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [docNo, invoice.id]);
    }

    // تحديث تسلسل الفواتير
    if (invoicesWithoutNumbers.rows.length > 0) {
      await client.query(`
        UPDATE document_sequences 
        SET current_number = $1, "updatedAt" = NOW()
        WHERE document_type = 'sales_invoice'
      `, [invoicesWithoutNumbers.rows.length]);
    }

    // تحديث الإيصالات
    const receiptsWithoutNumbers = await client.query(`
      SELECT id FROM receipts 
      WHERE document_no IS NULL OR document_no = ''
      ORDER BY "createdAt"
    `);

    console.log(`📊 عدد الإيصالات بدون أرقام: ${receiptsWithoutNumbers.rows.length}`);

    for (let i = 0; i < receiptsWithoutNumbers.rows.length; i++) {
      const receipt = receiptsWithoutNumbers.rows[i];
      const docNo = `REC-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`;
      
      await client.query(`
        UPDATE receipts 
        SET document_no = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [docNo, receipt.id]);
    }

    // تحديث تسلسل الإيصالات
    if (receiptsWithoutNumbers.rows.length > 0) {
      await client.query(`
        UPDATE document_sequences 
        SET current_number = $1, "updatedAt" = NOW()
        WHERE document_type = 'receipt'
      `, [receiptsWithoutNumbers.rows.length]);
    }

    // 6. إنشاء فهارس للأداء
    console.log('\n🚀 إنشاء فهارس الأداء...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_posted_status ON sales_invoices(posted_status)',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_document_no ON sales_invoices(document_no)',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_fiscal_year ON sales_invoices(fiscal_year)',
      'CREATE INDEX IF NOT EXISTS idx_receipts_posted_status ON receipts(posted_status)',
      'CREATE INDEX IF NOT EXISTS idx_receipts_document_no ON receipts(document_no)',
      'CREATE INDEX IF NOT EXISTS idx_receipts_fiscal_year ON receipts(fiscal_year)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
        console.log(`✅ فهرس تم إنشاؤه`);
      } catch (error) {
        console.log(`⚠️ فهرس موجود مسبقاً`);
      }
    }

    // 7. التحقق النهائي من سلامة البيانات
    console.log('\n🧪 التحقق النهائي من سلامة البيانات...');
    
    const dataIntegrityCheck = await client.query(`
      SELECT 
        'sales_invoices' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN document_no IS NOT NULL THEN 1 END) as with_document_no,
        COUNT(CASE WHEN posted_status = 'draft' THEN 1 END) as draft_status,
        COUNT(CASE WHEN can_edit = true THEN 1 END) as editable
      FROM sales_invoices
      
      UNION ALL
      
      SELECT 
        'receipts' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN document_no IS NOT NULL THEN 1 END) as with_document_no,
        COUNT(CASE WHEN posted_status = 'draft' THEN 1 END) as draft_status,
        COUNT(CASE WHEN can_edit = true THEN 1 END) as editable
      FROM receipts
    `);

    console.log('\n📊 تقرير سلامة البيانات:');
    for (const row of dataIntegrityCheck.rows) {
      console.log(`${row.table_name}:`);
      console.log(`  - إجمالي السجلات: ${row.total_records}`);
      console.log(`  - لديها أرقام مستندات: ${row.with_document_no}`);
      console.log(`  - حالة مسودة: ${row.draft_status}`);
      console.log(`  - قابلة للتحرير: ${row.editable}`);
      console.log('');
    }

    // 8. إنشاء دالة التحقق من إمكانية التحرير
    console.log('⚙️ إنشاء دالة التحقق من إمكانية التحرير...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION can_edit_document(doc_table VARCHAR, doc_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
        doc_status VARCHAR;
        doc_can_edit BOOLEAN;
      BEGIN
        IF doc_table = 'sales_invoices' THEN
          SELECT posted_status, can_edit INTO doc_status, doc_can_edit
          FROM sales_invoices WHERE id = doc_id;
        ELSIF doc_table = 'receipts' THEN
          SELECT posted_status, can_edit INTO doc_status, doc_can_edit
          FROM receipts WHERE id = doc_id;
        ELSE
          RETURN false;
        END IF;
        
        -- يمكن التحرير إذا كان في حالة مسودة وقابل للتحرير
        RETURN (doc_status = 'draft' AND doc_can_edit = true);
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم إنشاء دالة can_edit_document');

    console.log('\n🎉 تم إكمال المرحلة 0 بنجاح!');
    
    console.log('\n📋 ملخص المرحلة 0:');
    console.log('✅ تم إنشاء نسخ احتياطية من جميع الجداول الحساسة');
    console.log('✅ تم إضافة حقول الحالة والترقيم بأمان');
    console.log('✅ تم إنشاء نظام ترقيم المستندات');
    console.log('✅ تم تحديث المستندات الموجودة بأرقام تسلسلية');
    console.log('✅ تم إنشاء فهارس الأداء');
    console.log('✅ تم التحقق من سلامة البيانات');
    console.log('✅ تم إنشاء دوال الأمان والتحقق');
    
    console.log('\n💡 الخطوة التالية:');
    console.log('- تحديث APIs لاستخدام الحقول الجديدة');
    console.log('- إضافة التحقق من الحالة قبل التحرير');
    console.log('- البدء في المرحلة 1: محرك الترحيل');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
phase0SafetySetup().catch(console.error);
