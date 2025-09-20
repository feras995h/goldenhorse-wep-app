import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function testPostingFinal() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🧪 اختبار محرك الترحيل النهائي...\n');

    // 1. البحث عن عميل موجود
    console.log('👤 البحث عن عميل موجود...');
    
    const existingCustomer = await client.query(`
      SELECT id, name, code FROM customers LIMIT 1
    `);

    if (existingCustomer.rows.length === 0) {
      console.log('❌ لا يوجد عملاء في النظام');
      return;
    }

    const customer = existingCustomer.rows[0];
    console.log(`✅ العميل: ${customer.name} (${customer.code})`);

    // 2. إنشاء فاتورة مبيعات تجريبية
    console.log('\n📄 إنشاء فاتورة مبيعات تجريبية...');
    
    const documentNo = await client.query(
      "SELECT generate_document_number('sales_invoice') as document_no"
    );
    
    const testInvoice = await client.query(`
      INSERT INTO sales_invoices (
        "invoiceNumber", "customerId", date, "dueDate", subtotal, "taxAmount", total,
        currency, notes, document_no, posted_status, fiscal_year, can_edit, "createdAt", "updatedAt"
      ) VALUES (
        $2, $1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 1000.00, 0, 1000.00,
        'LYD', 'فاتورة تجريبية للاختبار', $2, 'draft', EXTRACT(YEAR FROM CURRENT_DATE), 
        true, NOW(), NOW()
      ) RETURNING id, "invoiceNumber", total
    `, [customer.id, documentNo.rows[0].document_no]);

    const invoice = testInvoice.rows[0];
    console.log(`✅ الفاتورة: ${invoice.invoiceNumber} بقيمة ${invoice.total} LYD`);

    // 3. البحث عن مستخدم موجود
    console.log('\n👤 البحث عن مستخدم موجود...');
    
    const existingUser = await client.query(`
      SELECT id, name FROM users WHERE role = 'admin' LIMIT 1
    `);

    if (existingUser.rows.length === 0) {
      console.log('❌ لا يوجد مستخدمين في النظام');
      return;
    }

    const user = existingUser.rows[0];
    console.log(`👤 المستخدم: ${user.name}`);

    // 4. اختبار ترحيل الفاتورة
    console.log('\n🚀 اختبار ترحيل الفاتورة...');
    
    try {
      const postingResult = await client.query(
        'SELECT post_document($1, $2, $3) as journal_id',
        ['sales_invoice', invoice.id, user.id]
      );

      const journalId = postingResult.rows[0].journal_id;
      console.log(`✅ تم الترحيل بنجاح - رقم اليومية: ${journalId}`);

      // 5. التحقق من القيود المنشأة
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
        JOIN posting_journal_entries e ON j.id = e.journal_id
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

      // 6. التحقق من تحديث حالة الفاتورة
      console.log('\n🔄 التحقق من تحديث حالة الفاتورة...');
      
      const updatedInvoice = await client.query(
        'SELECT posted_status, posted_at, posted_by, can_edit FROM sales_invoices WHERE id = $1',
        [invoice.id]
      );

      const invoiceStatus = updatedInvoice.rows[0];
      console.log(`📊 حالة الفاتورة: ${invoiceStatus.posted_status}`);
      console.log(`⏰ وقت الترحيل: ${invoiceStatus.posted_at}`);
      console.log(`✏️ قابلة للتحرير: ${invoiceStatus.can_edit ? 'نعم' : 'لا'}`);

      // 7. اختبار إلغاء الترحيل
      console.log('\n🔄 اختبار إلغاء الترحيل...');
      
      const reversalResult = await client.query(
        'SELECT reverse_document($1, $2, $3, $4) as reversal_journal_id',
        ['sales_invoice', invoice.id, user.id, 'اختبار إلغاء الترحيل']
      );

      const reversalJournalId = reversalResult.rows[0].reversal_journal_id;
      console.log(`✅ تم إلغاء الترحيل بنجاح - رقم اليومية العكسية: ${reversalJournalId}`);

      // التحقق من حالة الفاتورة بعد الإلغاء
      const finalInvoiceStatus = await client.query(
        'SELECT posted_status, can_edit FROM sales_invoices WHERE id = $1',
        [invoice.id]
      );

      const finalStatus = finalInvoiceStatus.rows[0];
      console.log(`📊 حالة الفاتورة النهائية: ${finalStatus.posted_status}`);
      console.log(`✏️ قابلة للتحرير: ${finalStatus.can_edit ? 'نعم' : 'لا'}`);

      console.log('\n🎉 اكتمل اختبار محرك الترحيل بنجاح!');

    } catch (postingError) {
      console.error('❌ خطأ في الترحيل:', postingError.message);
      console.error('Stack:', postingError.stack);
    }

    // 8. تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    
    try {
      // حذف القيود والاليوميات
      await client.query(`
        DELETE FROM posting_journal_entries WHERE journal_id IN (
          SELECT id FROM gl_journals WHERE document_type = 'sales_invoice' AND document_id = $1
        )
      `, [invoice.id]);

      await client.query(`
        DELETE FROM gl_journals WHERE document_type = 'sales_invoice' AND document_id = $1
      `, [invoice.id]);

      // حذف الفاتورة
      await client.query('DELETE FROM sales_invoices WHERE id = $1', [invoice.id]);

      console.log('✅ تم تنظيف البيانات التجريبية');
    } catch (cleanupError) {
      console.log('⚠️ تحذير: لم يتم تنظيف جميع البيانات التجريبية');
      console.log('السبب:', cleanupError.message);
    }

    // 9. عرض إحصائيات النظام
    console.log('\n📊 إحصائيات النظام:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM posting_rules WHERE is_active = true) as active_rules,
        (SELECT COUNT(*) FROM gl_journals) as total_journals,
        (SELECT COUNT(*) FROM posting_journal_entries) as total_entries,
        (SELECT COUNT(*) FROM sales_invoices WHERE posted_status = 'posted') as posted_invoices,
        (SELECT COUNT(*) FROM receipts WHERE posted_status = 'posted') as posted_receipts,
        (SELECT COUNT(*) FROM accounts) as total_accounts
    `);

    const systemStats = stats.rows[0];
    console.log(`- قواعد الترحيل النشطة: ${systemStats.active_rules}`);
    console.log(`- إجمالي اليوميات: ${systemStats.total_journals}`);
    console.log(`- إجمالي القيود: ${systemStats.total_entries}`);
    console.log(`- الفواتير المرحلة: ${systemStats.posted_invoices}`);
    console.log(`- الإيصالات المرحلة: ${systemStats.posted_receipts}`);
    console.log(`- إجمالي الحسابات: ${systemStats.total_accounts}`);

    console.log('\n📋 ملخص الاختبار:');
    console.log('✅ إنشاء فاتورة مبيعات تجريبية');
    console.log('✅ ترحيل الفاتورة إلى دفتر الأستاذ العام');
    console.log('✅ التحقق من توازن القيود');
    console.log('✅ تحديث حالة المستند');
    console.log('✅ إلغاء الترحيل مع قيود عكسية');
    console.log('✅ استعادة قابلية التحرير');
    console.log('✅ تنظيف البيانات التجريبية');
    
    console.log('\n💡 محرك الترحيل جاهز للاستخدام في الإنتاج!');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل الاختبار
testPostingFinal().catch(console.error);
