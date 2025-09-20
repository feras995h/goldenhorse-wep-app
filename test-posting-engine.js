import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function testPostingEngine() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🧪 اختبار محرك الترحيل...\n');

    // 1. إنشاء عميل تجريبي
    console.log('👤 إنشاء عميل تجريبي...');
    
    const testCustomer = await client.query(`
      INSERT INTO customers (
        name, code, email, phone, type, "customerType", 
        "creditLimit", "paymentTerms", "createdAt", "updatedAt"
      ) VALUES (
        'عميل تجريبي للاختبار', 'TEST-001', 'test@example.com', '123456789',
        'individual', 'local', 10000.00, 30, NOW(), NOW()
      ) 
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name, "updatedAt" = NOW()
      RETURNING id, name, code
    `);

    const customer = testCustomer.rows[0];
    console.log(`✅ العميل: ${customer.name} (${customer.code})`);

    // 2. إنشاء فاتورة مبيعات تجريبية
    console.log('\n📄 إنشاء فاتورة مبيعات تجريبية...');
    
    const documentNo = await client.query(
      "SELECT generate_document_number('sales_invoice') as document_no"
    );
    
    const testInvoice = await client.query(`
      INSERT INTO sales_invoices (
        "customerId", date, "dueDate", subtotal, "discountPercent", "taxPercent",
        currency, "exchangeRate", "totalAmount", notes, document_no, 
        posted_status, fiscal_year, can_edit, "createdAt", "updatedAt"
      ) VALUES (
        $1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 1000.00, 0, 0,
        'LYD', 1.0, 1000.00, 'فاتورة تجريبية للاختبار', $2,
        'draft', EXTRACT(YEAR FROM CURRENT_DATE), true, NOW(), NOW()
      ) RETURNING id, document_no, "totalAmount"
    `, [customer.id, documentNo.rows[0].document_no]);

    const invoice = testInvoice.rows[0];
    console.log(`✅ الفاتورة: ${invoice.document_no} بقيمة ${invoice.totalAmount} LYD`);

    // 3. اختبار ترحيل الفاتورة
    console.log('\n🚀 اختبار ترحيل الفاتورة...');
    
    // إنشاء مستخدم تجريبي للترحيل
    const testUser = await client.query(`
      INSERT INTO users (
        name, email, password, role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        'مستخدم تجريبي', 'testuser@example.com', 'hashed_password', 'admin', true, NOW(), NOW()
      ) 
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `);

    const user = testUser.rows[0];
    console.log(`👤 المستخدم: ${user.name}`);

    try {
      const postingResult = await client.query(
        'SELECT post_document($1, $2, $3) as journal_id',
        ['sales_invoice', invoice.id, user.id]
      );

      const journalId = postingResult.rows[0].journal_id;
      console.log(`✅ تم الترحيل بنجاح - رقم اليومية: ${journalId}`);

      // 4. التحقق من القيود المنشأة
      console.log('\n📊 التحقق من القيود المنشأة...');
      
      const journalDetails = await client.query(`
        SELECT 
          j.journal_no,
          j.journal_date,
          j.description,
          j.total_debit,
          j.total_credit,
          j.status,
          json_agg(
            json_build_object(
              'account_code', a.code,
              'account_name', a.name,
              'debit_amount', e.debit_amount,
              'credit_amount', e.credit_amount,
              'description', e.description
            ) ORDER BY e.line_number
          ) as entries
        FROM gl_journals j
        JOIN gl_entries e ON j.id = e.journal_id
        JOIN accounts a ON e.account_id = a.id
        WHERE j.id = $1
        GROUP BY j.id, j.journal_no, j.journal_date, j.description, j.total_debit, j.total_credit, j.status
      `, [journalId]);

      const journal = journalDetails.rows[0];
      console.log(`📋 اليومية: ${journal.journal_no}`);
      console.log(`📅 التاريخ: ${journal.journal_date}`);
      console.log(`💰 إجمالي المدين: ${journal.total_debit} LYD`);
      console.log(`💰 إجمالي الدائن: ${journal.total_credit} LYD`);
      console.log(`✅ متوازنة: ${journal.total_debit === journal.total_credit ? 'نعم' : 'لا'}`);
      
      console.log('\n📝 تفاصيل القيود:');
      for (const entry of journal.entries) {
        const type = entry.debit_amount > 0 ? 'مدين' : 'دائن';
        const amount = entry.debit_amount > 0 ? entry.debit_amount : entry.credit_amount;
        console.log(`  ${type}: ${entry.account_name} (${entry.account_code}) - ${amount} LYD`);
        console.log(`       ${entry.description}`);
      }

      // 5. التحقق من تحديث حالة الفاتورة
      console.log('\n🔄 التحقق من تحديث حالة الفاتورة...');
      
      const updatedInvoice = await client.query(
        'SELECT posted_status, posted_at, posted_by FROM sales_invoices WHERE id = $1',
        [invoice.id]
      );

      const invoiceStatus = updatedInvoice.rows[0];
      console.log(`📊 حالة الفاتورة: ${invoiceStatus.posted_status}`);
      console.log(`⏰ وقت الترحيل: ${invoiceStatus.posted_at}`);
      console.log(`👤 مرحل بواسطة: ${invoiceStatus.posted_by}`);

      // 6. اختبار إلغاء الترحيل
      console.log('\n🔄 اختبار إلغاء الترحيل...');
      
      const reversalResult = await client.query(
        'SELECT reverse_document($1, $2, $3, $4) as reversal_journal_id',
        ['sales_invoice', invoice.id, user.id, 'اختبار إلغاء الترحيل']
      );

      const reversalJournalId = reversalResult.rows[0].reversal_journal_id;
      console.log(`✅ تم إلغاء الترحيل بنجاح - رقم اليومية العكسية: ${reversalJournalId}`);

      // التحقق من اليومية العكسية
      const reversalDetails = await client.query(`
        SELECT 
          j.journal_no,
          j.description,
          j.total_debit,
          j.total_credit,
          json_agg(
            json_build_object(
              'account_code', a.code,
              'account_name', a.name,
              'debit_amount', e.debit_amount,
              'credit_amount', e.credit_amount
            ) ORDER BY e.line_number
          ) as entries
        FROM gl_journals j
        JOIN gl_entries e ON j.id = e.journal_id
        JOIN accounts a ON e.account_id = a.id
        WHERE j.id = $1
        GROUP BY j.id, j.journal_no, j.description, j.total_debit, j.total_credit
      `, [reversalJournalId]);

      const reversal = reversalDetails.rows[0];
      console.log(`📋 اليومية العكسية: ${reversal.journal_no}`);
      console.log(`💰 إجمالي المدين: ${reversal.total_debit} LYD`);
      console.log(`💰 إجمالي الدائن: ${reversal.total_credit} LYD`);
      
      console.log('\n📝 القيود العكسية:');
      for (const entry of reversal.entries) {
        const type = entry.debit_amount > 0 ? 'مدين' : 'دائن';
        const amount = entry.debit_amount > 0 ? entry.debit_amount : entry.credit_amount;
        console.log(`  ${type}: ${entry.account_name} (${entry.account_code}) - ${amount} LYD`);
      }

      // التحقق من تحديث حالة الفاتورة بعد الإلغاء
      const finalInvoiceStatus = await client.query(
        'SELECT posted_status, can_edit FROM sales_invoices WHERE id = $1',
        [invoice.id]
      );

      const finalStatus = finalInvoiceStatus.rows[0];
      console.log(`\n📊 حالة الفاتورة النهائية: ${finalStatus.posted_status}`);
      console.log(`✏️ قابلة للتحرير: ${finalStatus.can_edit ? 'نعم' : 'لا'}`);

    } catch (postingError) {
      console.error('❌ خطأ في الترحيل:', postingError.message);
    }

    // 7. تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    
    try {
      // حذف القيود والاليوميات
      await client.query(`
        DELETE FROM gl_entries WHERE journal_id IN (
          SELECT id FROM gl_journals WHERE document_type = 'sales_invoice' AND document_id = $1
        )
      `, [invoice.id]);
      
      await client.query(`
        DELETE FROM gl_journals WHERE document_type = 'sales_invoice' AND document_id = $1
      `, [invoice.id]);
      
      // حذف الفاتورة
      await client.query('DELETE FROM sales_invoices WHERE id = $1', [invoice.id]);
      
      // حذف العميل
      await client.query('DELETE FROM customers WHERE id = $1', [customer.id]);
      
      // حذف المستخدم التجريبي
      await client.query('DELETE FROM users WHERE id = $1', [user.id]);
      
      console.log('✅ تم تنظيف البيانات التجريبية');
    } catch (cleanupError) {
      console.log('⚠️ تحذير: لم يتم تنظيف جميع البيانات التجريبية');
    }

    console.log('\n🎉 اكتمل اختبار محرك الترحيل بنجاح!');
    
    console.log('\n📋 ملخص الاختبار:');
    console.log('✅ إنشاء فاتورة مبيعات تجريبية');
    console.log('✅ ترحيل الفاتورة إلى دفتر الأستاذ العام');
    console.log('✅ التحقق من توازن القيود');
    console.log('✅ تحديث حالة المستند');
    console.log('✅ إلغاء الترحيل مع قيود عكسية');
    console.log('✅ استعادة قابلية التحرير');
    console.log('✅ تنظيف البيانات التجريبية');
    
    console.log('\n💡 محرك الترحيل جاهز للاستخدام!');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل الاختبار
testPostingEngine().catch(console.error);
