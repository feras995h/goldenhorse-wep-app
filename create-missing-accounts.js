import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function createMissingAccounts() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🔧 إنشاء الحسابات المفقودة...\n');

    // حساب إيرادات المبيعات
    const salesAccount = await client.query(`
      SELECT id FROM accounts WHERE code = '4.1' AND name = 'إيرادات المبيعات'
    `);

    if (salesAccount.rows.length === 0) {
      console.log('⚠️ حساب إيرادات المبيعات غير موجود - سيتم إنشاؤه');
      
      // البحث عن حساب الإيرادات كحساب أب
      const revenueAccount = await client.query(`
        SELECT id FROM accounts WHERE code = '4' AND name = 'الإيرادات'
      `);

      if (revenueAccount.rows.length > 0) {
        await client.query(`
          INSERT INTO accounts (id, code, name, type, "parentId", level, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), '4.1', 'إيرادات المبيعات', 'revenue', $1, 2, true, NOW(), NOW())
        `, [revenueAccount.rows[0].id]);
        console.log('✅ تم إنشاء حساب إيرادات المبيعات');
      } else {
        console.log('❌ حساب الإيرادات الأب غير موجود');
      }
    } else {
      console.log('✅ حساب إيرادات المبيعات موجود مسبقاً');
    }

    // التحقق من حساب الصندوق
    const cashAccount = await client.query(`
      SELECT id FROM accounts WHERE code = '1.1.1' AND name = 'الصندوق'
    `);

    if (cashAccount.rows.length === 0) {
      console.log('⚠️ حساب الصندوق غير موجود - سيتم استخدام الصندوق الرئيسي');
      
      // البحث عن الصندوق الرئيسي
      const mainCashAccount = await client.query(`
        SELECT id FROM accounts WHERE code = '1.1.1.001' AND name = 'الصندوق الرئيسي'
      `);

      if (mainCashAccount.rows.length > 0) {
        console.log('✅ سيتم استخدام الصندوق الرئيسي للترحيل');
      } else {
        console.log('❌ لا يوجد حساب صندوق مناسب');
      }
    } else {
      console.log('✅ حساب الصندوق موجود');
    }

    // عرض الحسابات النهائية المتاحة للترحيل
    console.log('\n📋 الحسابات المتاحة للترحيل:');
    
    const availableAccounts = await client.query(`
      SELECT id, code, name, type 
      FROM accounts 
      WHERE (code = '1.1.2' AND name = 'العملاء والمدينون')
         OR (code = '4.1' AND name = 'إيرادات المبيعات')
         OR (code = '4.1.1' AND name = 'إيرادات المبيعات')
         OR (code = '1.1.1' AND name = 'الصندوق')
         OR (code = '1.1.1.001' AND name = 'الصندوق الرئيسي')
      ORDER BY code
    `);

    for (const acc of availableAccounts.rows) {
      console.log(`✅ ${acc.code}: ${acc.name} (${acc.type}) - ID: ${acc.id}`);
    }

    // تحديث دالة post_document لتستخدم الحسابات المتاحة
    console.log('\n🔧 تحديث دالة post_document...');

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
        v_cash_account_id UUID;
      BEGIN
        -- التحقق من صحة نوع المستند
        IF p_document_type NOT IN ('sales_invoice', 'receipt') THEN
          RAISE EXCEPTION 'نوع المستند غير مدعوم: %', p_document_type;
        END IF;

        -- الحصول على بيانات المستند
        IF p_document_type = 'sales_invoice' THEN
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
          
        ELSIF p_document_type = 'receipt' THEN
          -- للإيصالات - سنضيفها لاحقاً
          RAISE EXCEPTION 'ترحيل الإيصالات غير مدعوم حالياً';
        END IF;

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
        
        -- البحث عن حساب إيرادات المبيعات (أولوية للحساب الجديد ثم القديم)
        SELECT id INTO v_sales_account_id 
        FROM accounts 
        WHERE (code = '4.1' AND name = 'إيرادات المبيعات')
           OR (code = '4.1.1' AND name = 'إيرادات المبيعات')
        ORDER BY code
        LIMIT 1;

        -- البحث عن حساب الصندوق
        SELECT id INTO v_cash_account_id 
        FROM accounts 
        WHERE (code = '1.1.1' AND name = 'الصندوق')
           OR (code = '1.1.1.001' AND name = 'الصندوق الرئيسي')
        ORDER BY code
        LIMIT 1;

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

    console.log('\n🎉 تم إعداد جميع الحسابات المطلوبة للترحيل!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

createMissingAccounts().catch(console.error);
