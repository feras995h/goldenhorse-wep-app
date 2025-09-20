import pkg from 'pg';
const { Client } = pkg;

const dbConfig = {
  connectionString:
    'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
};

async function run() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // 1) اختر عميل موجود
    const custRes = await client.query(`SELECT id, name FROM customers ORDER BY name ASC LIMIT 1`);
    if (custRes.rows.length === 0) throw new Error('لا يوجد عملاء');
    const customer = custRes.rows[0];
    console.log('👤 العميل:', customer.name);

    // 2) اختر مستخدم موجود
    const userRes = await client.query(`SELECT id, name FROM users ORDER BY name ASC LIMIT 1`);
    if (userRes.rows.length === 0) throw new Error('لا يوجد مستخدمين');
    const user = userRes.rows[0];
    console.log('👤 المستخدم:', user.name);

    // 3) إنشاء فاتورة مبيعات (Draft)
    const invIns = await client.query(`
      INSERT INTO sales_invoices ("invoiceNumber", "customerId", date, "dueDate", subtotal, "taxAmount", total, posted_status, document_no, fiscal_year, can_edit)
      VALUES (CONCAT('INV-AR-', EXTRACT(YEAR FROM CURRENT_DATE), '-', lpad((floor(random()*9000)+1000)::text, 4, '0')),
              $1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 500, 0, 500, 'draft', NULL, EXTRACT(YEAR FROM CURRENT_DATE), true)
      RETURNING id, "invoiceNumber" as invoice_no
    `, [customer.id]);
    const invoice = invIns.rows[0];
    console.log('📄 الفاتورة:', invoice.invoice_no);

    // 4) ترحيل الفاتورة
    const postRes = await client.query(`SELECT post_document('sales_invoice', $1::uuid, $2::uuid) AS journal_id`, [invoice.id, user.id]);
    const journalId = postRes.rows[0].journal_id;
    console.log('🚀 ترحيل الفاتورة - رقم اليومية:', journalId);

    // 5) إنشاء إيصال قبض للعميل (posted)
    const receiptIns = await client.query(`
      INSERT INTO receipts ("receiptNo", "partyType", "partyId", "receiptDate", amount, "paymentMethod", status, currency, "exchangeRate", remarks, "createdBy", posted_status, posted_by, posted_at)
      VALUES (
        CONCAT('RCPT-AR-', EXTRACT(YEAR FROM CURRENT_DATE), '-', lpad((floor(random()*9000)+1000)::text, 4, '0')),
        'customer', $1, CURRENT_DATE, 300, 'cash', 'completed', 'LYD', 1, 'AR test', $2, 'posted', $2, NOW()
      ) RETURNING id, "receiptNo" as receipt_no
    `, [customer.id, user.id]);
    const receipt = receiptIns.rows[0];
    console.log('🧾 الإيصال:', receipt.receipt_no);

    // 6) تخصيص 200 دينار من الإيصال للفاتورة
    const allocRes = await client.query(`SELECT allocate_receipt_to_invoice($1, $2, $3, $4, $5) AS allocation_id`, [receipt.id, invoice.id, 200, user.id, 'اختبار تخصيص']);
    const allocationId = allocRes.rows[0].allocation_id;
    console.log('🔗 تم التخصيص، معرف:', allocationId);

    // 7) تحقق من الفاتورة المتبقية
    const invState = await client.query(`
      SELECT s."invoiceNumber", s.total,
             s.total - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.invoice_id = s.id), 0) AS outstanding
      FROM sales_invoices s WHERE s.id = $1
    `, [invoice.id]);
    const invInfo = invState.rows[0];
    console.log('📊 رصيد الفاتورة المتبقي:', invInfo.outstanding);

    // 8) تقرير أعمار الديون للعميل
    const aging = await client.query(`SELECT * FROM ar_aging_report($1::date, $2::uuid)`, [new Date().toISOString().slice(0,10), customer.id]);
    console.log('📈 AR Aging للعميل:', aging.rows[0]);

    // Cleanup test data (optional)
    await client.query('DELETE FROM ar_allocations WHERE id = $1', [allocationId]);
    await client.query('DELETE FROM receipts WHERE id = $1', [receipt.id]);
    await client.query('DELETE FROM posting_journal_entries WHERE journal_id IN (SELECT id FROM gl_journals WHERE document_type = ' + "'sales_invoice'" + ' AND document_id = $1)', [invoice.id]).catch(()=>{});
    await client.query('DELETE FROM gl_journals WHERE document_type = ' + "'sales_invoice'" + ' AND document_id = $1', [invoice.id]).catch(()=>{});
    await client.query('DELETE FROM sales_invoices WHERE id = $1', [invoice.id]);

    console.log('\n🎉 اختبار المرحلة 2 (AR) نجح!');
  } catch (e) {
    console.error('❌ خطأ:', e.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);

