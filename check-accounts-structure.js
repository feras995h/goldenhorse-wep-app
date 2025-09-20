import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function checkAccountsStructure() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔍 فحص هيكل جدول accounts...\n');

    // فحص أعمدة الجدول
    const columns = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position
    `);

    console.log('📊 أعمدة جدول accounts:');
    for (const col of columns.rows) {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
      if (col.column_default) {
        console.log(`  القيمة الافتراضية: ${col.column_default}`);
      }
    }

    // فحص عينة من البيانات
    console.log('\n📋 عينة من حسابات الإيرادات:');
    const revenueAccounts = await client.query(`
      SELECT * FROM accounts WHERE type = 'revenue' LIMIT 3
    `);

    if (revenueAccounts.rows.length > 0) {
      for (const row of revenueAccounts.rows) {
        console.log(`- ${row.code}: ${row.name}`);
        console.log(`  النوع: ${row.type}, الجذر: ${row.rootType || 'غير محدد'}`);
        console.log(`  المستوى: ${row.level}, نشط: ${row.isActive}`);
        console.log('');
      }
    } else {
      console.log('لا توجد حسابات إيرادات');
    }

    // استخدام حساب إيرادات المبيعات الموجود
    console.log('\n🔧 استخدام حساب إيرادات المبيعات الموجود...');
    
    const existingSalesAccount = await client.query(`
      SELECT id, code, name, type, "rootType" 
      FROM accounts 
      WHERE code = '4.1.1' AND name = 'إيرادات المبيعات'
    `);

    if (existingSalesAccount.rows.length > 0) {
      const acc = existingSalesAccount.rows[0];
      console.log(`✅ سيتم استخدام: ${acc.code} - ${acc.name}`);
      console.log(`   ID: ${acc.id}`);
      console.log(`   النوع: ${acc.type}, الجذر: ${acc.rootType || 'غير محدد'}`);
    } else {
      console.log('❌ حساب إيرادات المبيعات غير موجود');
    }

    // تحديث دالة post_document لتستخدم الحساب الموجود
    console.log('\n🔧 تحديث دالة post_document للحساب الموجود...');

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
        INSERT INTO gl_entries (
          journal_id, account_id, debit_amount, credit_amount, 
          description, line_number
        ) VALUES (
          v_journal_id, v_customer_account_id, v_amount, 0,
          'مدين العملاء - ' || v_description, v_line_number
        );
        v_total_debit := v_total_debit + v_amount;
        v_line_number := v_line_number + 1;

        -- دائن: إيرادات المبيعات
        INSERT INTO gl_entries (
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

    console.log('\n🎉 تم إعداد محرك الترحيل للحسابات الموجودة!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkAccountsStructure().catch(console.error);
