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
    console.log('✅ اتصال DB للمرحلة 2');

    // 1) جدول مخصص لمطابقة الإيصالات بالفواتير (AR Allocations)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ar_allocations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL,
        invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
        receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
        allocated_amount NUMERIC(15,2) NOT NULL CHECK (allocated_amount > 0),
        currency VARCHAR(10) DEFAULT 'LYD',
        allocation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ ar_allocations جاهز');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ar_allocations_invoice ON ar_allocations(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_ar_allocations_receipt ON ar_allocations(receipt_id);
      CREATE INDEX IF NOT EXISTS idx_ar_allocations_customer ON ar_allocations(customer_id);
    `);

    // 2) دالة المطابقة allocate_receipt_to_invoice
    await client.query(`
      CREATE OR REPLACE FUNCTION allocate_receipt_to_invoice(
        p_receipt_id UUID,
        p_invoice_id UUID,
        p_amount NUMERIC(15,2),
        p_user_id UUID,
        p_notes TEXT DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        v_receipt RECORD;
        v_invoice RECORD;
        v_allocated_receipt NUMERIC(15,2);
        v_allocated_invoice NUMERIC(15,2);
        v_remaining_receipt NUMERIC(15,2);
        v_remaining_invoice NUMERIC(15,2);
        v_allocation_id UUID;
      BEGIN
        IF p_amount IS NULL OR p_amount <= 0 THEN
          RAISE EXCEPTION 'Invalid allocation amount';
        END IF;

        SELECT r.id, r.partyId AS customer_id, r.amount, r.currency, r.posted_status, r."receiptDate" AS date, r."receiptNo" AS receipt_no, r."partyType" AS party_type
        INTO v_receipt
        FROM receipts r
        WHERE r.id = p_receipt_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Receipt not found';
        END IF;

        IF v_receipt.party_type IS DISTINCT FROM 'customer' THEN
          RAISE EXCEPTION 'Receipt partyType must be customer';
        END IF;

        IF v_receipt.posted_status IS DISTINCT FROM 'posted' THEN
          RAISE EXCEPTION 'Receipt must be posted';
        END IF;

        SELECT s.id, s."customerId" AS customer_id, s.total, s.document_no, s.posted_status, s."dueDate" AS due_date
        INTO v_invoice
        FROM sales_invoices s
        WHERE s.id = p_invoice_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Sales invoice not found';
        END IF;

        IF v_invoice.posted_status IS DISTINCT FROM 'posted' THEN
          RAISE EXCEPTION 'Sales invoice must be posted';
        END IF;

        IF v_receipt.customer_id IS DISTINCT FROM v_invoice.customer_id THEN
          RAISE EXCEPTION 'Receipt and invoice must belong to the same customer';
        END IF;

        -- مجموع التخصيصات الحالية
        SELECT COALESCE(SUM(allocated_amount), 0) INTO v_allocated_receipt FROM ar_allocations WHERE receipt_id = p_receipt_id;
        SELECT COALESCE(SUM(allocated_amount), 0) INTO v_allocated_invoice FROM ar_allocations WHERE invoice_id = p_invoice_id;

        v_remaining_receipt := v_receipt.amount - v_allocated_receipt;
        v_remaining_invoice := v_invoice.total - v_allocated_invoice;

        IF p_amount > v_remaining_receipt THEN
          RAISE EXCEPTION 'Allocation exceeds remaining receipt amount (remaining=%)', v_remaining_receipt;
        END IF;

        IF p_amount > v_remaining_invoice THEN
          RAISE EXCEPTION 'Allocation exceeds invoice outstanding (remaining=%)', v_remaining_invoice;
        END IF;

        INSERT INTO ar_allocations (
          customer_id, invoice_id, receipt_id, allocated_amount, currency, created_by, notes
        ) VALUES (
          v_invoice.customer_id, p_invoice_id, p_receipt_id, p_amount, v_receipt.currency, p_user_id, p_notes
        ) RETURNING id INTO v_allocation_id;

        RETURN v_allocation_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ allocate_receipt_to_invoice جاهزة');

    // 3) دالة رصيد الفاتورة المتبقي
    await client.query(`
      CREATE OR REPLACE FUNCTION get_invoice_outstanding(p_invoice_id UUID)
      RETURNS NUMERIC AS $$
      DECLARE
        v_total NUMERIC; v_alloc NUMERIC; v_out NUMERIC;
      BEGIN
        SELECT total INTO v_total FROM sales_invoices WHERE id = p_invoice_id;
        IF NOT FOUND THEN RETURN NULL; END IF;
        SELECT COALESCE(SUM(allocated_amount), 0) INTO v_alloc FROM ar_allocations WHERE invoice_id = p_invoice_id;
        v_out := v_total - v_alloc;
        RETURN v_out;
      END; $$ LANGUAGE plpgsql;
    `);

    // 4) عرض الفواتير المفتوحة
    await client.query(`
      CREATE OR REPLACE VIEW ar_open_invoices AS
      SELECT 
        s.id AS invoice_id,
        s."invoiceNumber",
        s."customerId" AS customer_id,
        s.date,
        s."dueDate",
        s.total,
        COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.invoice_id = s.id), 0) AS allocated,
        s.total - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.invoice_id = s.id), 0) AS outstanding
      FROM sales_invoices s
      WHERE s.posted_status = 'posted' AND (s.total - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.invoice_id = s.id), 0)) > 0;
    `);
    console.log('✅ ar_open_invoices جاهز');

    // 5) تقرير أعمار الديون AR Aging
    await client.query(`
      CREATE OR REPLACE FUNCTION ar_aging_report(p_as_of DATE DEFAULT CURRENT_DATE, p_customer_id UUID DEFAULT NULL)
      RETURNS TABLE (
        customer_id UUID,
        customer_name VARCHAR,
        total_outstanding NUMERIC,
        current NUMERIC,
        bucket_30 NUMERIC,
        bucket_60 NUMERIC,
        bucket_90 NUMERIC,
        bucket_120 NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        WITH inv AS (
          SELECT 
            s.id,
            s."customerId" AS customer_id,
            s."invoiceNumber",
            s.date,
            s."dueDate",
            s.total,
            s.total - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.invoice_id = s.id), 0) AS outstanding
          FROM sales_invoices s
          WHERE s.posted_status = 'posted'
        ), inv2 AS (
          SELECT i.*, GREATEST(0, p_as_of - COALESCE(i."dueDate", i.date))::INT AS days_past_due
          FROM inv i
          WHERE i.outstanding > 0
        )
        SELECT 
          c.id AS customer_id,
          c.name AS customer_name,
          SUM(i.outstanding) AS total_outstanding,
          SUM(CASE WHEN i.days_past_due <= 0 THEN i.outstanding ELSE 0 END) AS current,
          SUM(CASE WHEN i.days_past_due BETWEEN 1 AND 30 THEN i.outstanding ELSE 0 END) AS bucket_30,
          SUM(CASE WHEN i.days_past_due BETWEEN 31 AND 60 THEN i.outstanding ELSE 0 END) AS bucket_60,
          SUM(CASE WHEN i.days_past_due BETWEEN 61 AND 90 THEN i.outstanding ELSE 0 END) AS bucket_90,
          SUM(CASE WHEN i.days_past_due >= 91 THEN i.outstanding ELSE 0 END) AS bucket_120
        FROM inv2 i
        JOIN customers c ON c.id = i.customer_id
        WHERE p_customer_id IS NULL OR c.id = p_customer_id
        GROUP BY c.id, c.name
        ORDER BY c.name;
      END; $$ LANGUAGE plpgsql;
    `);
    console.log('✅ ar_aging_report جاهز');

    console.log('\n🎉 المرحلة 2: البنية الأساسية جاهزة');
  } catch (e) {
    console.error('❌ خطأ:', e.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);

