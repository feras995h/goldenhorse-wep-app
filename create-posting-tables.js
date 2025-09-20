import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function createPostingTables() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إنشاء جداول الترحيل الجديدة...\n');

    // إنشاء جدول posting_journal_entries للترحيل
    await client.query(`
      CREATE TABLE IF NOT EXISTS posting_journal_entries (
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

    console.log('✅ تم إنشاء جدول posting_journal_entries');

    // إنشاء الفهارس
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posting_journal_entries_journal ON posting_journal_entries(journal_id);
      CREATE INDEX IF NOT EXISTS idx_posting_journal_entries_account ON posting_journal_entries(account_id);
    `);

    console.log('✅ تم إنشاء الفهارس');

    // تحديث دالة post_document لتستخدم الجدول الجديد
    await client.query(`
      CREATE OR REPLACE FUNCTION post_document(
        p_document_type TEXT,
        p_document_id UUID,
        p_posted_by UUID
      ) RETURNS UUID AS $$
      DECLARE
        v_journal_id UUID;
        v_journal_no TEXT;
        v_doc_record RECORD;
        v_amount DECIMAL;
        v_description TEXT;
        v_line_number INTEGER := 1;
        v_total_debit DECIMAL := 0;
        v_total_credit DECIMAL := 0;
        v_customer_account_id UUID;
        v_sales_account_id UUID;
      BEGIN
        -- التحقق من صحة نوع المستند
        IF p_document_type != 'sales_invoice' THEN
          RAISE EXCEPTION 'نوع المستند غير مدعوم: %', p_document_type;
        END IF;

        -- الحصول على بيانات المستند
        SELECT * INTO v_doc_record 
        FROM sales_invoices 
        WHERE id = p_document_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'فاتورة المبيعات غير موجودة';
        END IF;
        
        IF v_doc_record.posted_status = 'posted' THEN
          RAISE EXCEPTION 'الفاتورة مرحلة مسبقاً';
        END IF;
        
        v_amount := v_doc_record.total;
        v_description := 'فاتورة مبيعات رقم ' || v_doc_record."invoiceNumber";

        -- إنشاء رقم اليومية
        SELECT generate_document_number('gl_journal') INTO v_journal_no;

        -- إنشاء اليومية
        INSERT INTO gl_journals (
          journal_no, journal_date, description, document_type, 
          document_id, document_no, status, fiscal_year, posted_by, posted_at
        ) VALUES (
          v_journal_no, 
          CURRENT_DATE, 
          v_description,
          p_document_type,
          p_document_id,
          v_doc_record."invoiceNumber",
          'posted',
          EXTRACT(YEAR FROM CURRENT_DATE),
          p_posted_by,
          NOW()
        ) RETURNING id INTO v_journal_id;

        -- الحصول على الحسابات المطلوبة
        SELECT id INTO v_customer_account_id 
        FROM accounts 
        WHERE code = '1.1.2' AND name = 'العملاء والمدينون';
        
        SELECT id INTO v_sales_account_id 
        FROM accounts 
        WHERE code = '4.1.1' AND name = 'إيرادات المبيعات';

        -- التحقق من وجود الحسابات
        IF v_customer_account_id IS NULL THEN
          RAISE EXCEPTION 'حساب العملاء والمدينون غير موجود';
        END IF;
        
        IF v_sales_account_id IS NULL THEN
          RAISE EXCEPTION 'حساب إيرادات المبيعات غير موجود';
        END IF;

        -- إنشاء القيود للمبيعات
        -- مدين: العملاء والمدينون
        INSERT INTO posting_journal_entries (
          journal_id, account_id, debit_amount, credit_amount, 
          description, line_number
        ) VALUES (
          v_journal_id, v_customer_account_id, v_amount, 0,
          'مدين العملاء - ' || v_description, v_line_number
        );
        v_total_debit := v_total_debit + v_amount;
        v_line_number := v_line_number + 1;

        -- دائن: إيرادات المبيعات
        INSERT INTO posting_journal_entries (
          journal_id, account_id, debit_amount, credit_amount, 
          description, line_number
        ) VALUES (
          v_journal_id, v_sales_account_id, 0, v_amount,
          'دائن المبيعات - ' || v_description, v_line_number
        );
        v_total_credit := v_total_credit + v_amount;

        -- تحديث إجماليات اليومية
        UPDATE gl_journals 
        SET total_debit = v_total_debit, total_credit = v_total_credit
        WHERE id = v_journal_id;

        -- التحقق من التوازن
        IF v_total_debit != v_total_credit THEN
          RAISE EXCEPTION 'القيود غير متوازنة: مدين % != دائن %', v_total_debit, v_total_credit;
        END IF;

        -- تحديث حالة المستند
        UPDATE sales_invoices 
        SET posted_status = 'posted', posted_at = NOW(), posted_by = p_posted_by, can_edit = false
        WHERE id = p_document_id;

        RETURN v_journal_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم تحديث دالة post_document');

    // تحديث دالة reverse_document
    await client.query(`
      CREATE OR REPLACE FUNCTION reverse_document(
        p_document_type TEXT,
        p_document_id UUID,
        p_reversed_by UUID,
        p_reason TEXT DEFAULT 'Manual reversal'
      ) RETURNS UUID AS $$
      DECLARE
        v_original_journal_id UUID;
        v_reversal_journal_id UUID;
        v_journal_no TEXT;
        v_doc_record RECORD;
        v_entry RECORD;
        v_description TEXT;
        v_line_number INTEGER := 1;
      BEGIN
        -- التحقق من صحة نوع المستند
        IF p_document_type != 'sales_invoice' THEN
          RAISE EXCEPTION 'نوع المستند غير مدعوم: %', p_document_type;
        END IF;

        -- الحصول على بيانات المستند
        SELECT * INTO v_doc_record 
        FROM sales_invoices 
        WHERE id = p_document_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'فاتورة المبيعات غير موجودة';
        END IF;
        
        IF v_doc_record.posted_status != 'posted' THEN
          RAISE EXCEPTION 'الفاتورة غير مرحلة';
        END IF;
        
        v_description := 'عكس فاتورة مبيعات رقم ' || v_doc_record."invoiceNumber";

        -- البحث عن اليومية الأصلية
        SELECT id INTO v_original_journal_id
        FROM gl_journals
        WHERE document_type = p_document_type AND document_id = p_document_id AND status = 'posted';

        IF NOT FOUND THEN
          RAISE EXCEPTION 'اليومية الأصلية غير موجودة';
        END IF;

        -- إنشاء رقم اليومية العكسية
        SELECT generate_document_number('gl_journal') INTO v_journal_no;

        -- إنشاء اليومية العكسية
        INSERT INTO gl_journals (
          journal_no, journal_date, description, document_type, 
          document_id, document_no, status, fiscal_year, posted_by, posted_at,
          reversal_reason
        ) VALUES (
          v_journal_no, 
          CURRENT_DATE, 
          v_description || ' - ' || p_reason,
          p_document_type,
          p_document_id,
          v_doc_record."invoiceNumber",
          'posted',
          EXTRACT(YEAR FROM CURRENT_DATE),
          p_reversed_by,
          NOW(),
          p_reason
        ) RETURNING id INTO v_reversal_journal_id;

        -- إنشاء القيود العكسية
        FOR v_entry IN 
          SELECT account_id, debit_amount, credit_amount, description
          FROM posting_journal_entries 
          WHERE journal_id = v_original_journal_id
          ORDER BY line_number
        LOOP
          INSERT INTO posting_journal_entries (
            journal_id, account_id, debit_amount, credit_amount, 
            description, line_number
          ) VALUES (
            v_reversal_journal_id, 
            v_entry.account_id, 
            v_entry.credit_amount,  -- عكس المبالغ
            v_entry.debit_amount,   -- عكس المبالغ
            'عكس: ' || v_entry.description, 
            v_line_number
          );
          v_line_number := v_line_number + 1;
        END LOOP;

        -- تحديث إجماليات اليومية العكسية
        UPDATE gl_journals 
        SET 
          total_debit = (SELECT COALESCE(SUM(debit_amount), 0) FROM posting_journal_entries WHERE journal_id = v_reversal_journal_id),
          total_credit = (SELECT COALESCE(SUM(credit_amount), 0) FROM posting_journal_entries WHERE journal_id = v_reversal_journal_id)
        WHERE id = v_reversal_journal_id;

        -- تحديث اليومية الأصلية
        UPDATE gl_journals 
        SET status = 'reversed', reversed_at = NOW(), reversed_by = p_reversed_by, reversal_reason = p_reason
        WHERE id = v_original_journal_id;

        -- تحديث حالة المستند
        UPDATE sales_invoices 
        SET posted_status = 'reversed', can_edit = true, void_reason = p_reason
        WHERE id = p_document_id;

        RETURN v_reversal_journal_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم تحديث دالة reverse_document');

    console.log('\n🎉 تم إنشاء جداول الترحيل بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

createPostingTables().catch(console.error);
