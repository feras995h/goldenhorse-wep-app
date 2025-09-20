import express from 'express';
import { authenticateToken, requireAccountingAccess } from '../middleware/auth.js';
import { sequelize } from '../models/index.js';

const router = express.Router();

// POST /api/ar/allocate - تخصيص إيصال لفاتورة
router.post('/allocate', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const { receipt_id, invoice_id, amount, notes } = req.body;

    if (!receipt_id || !invoice_id || !amount) {
      return res.status(400).json({ success: false, message: 'receipt_id, invoice_id, amount مطلوبة' });
    }

    const result = await sequelize.query(
      'SELECT allocate_receipt_to_invoice($1, $2, $3, $4, $5) AS allocation_id',
      {
        bind: [receipt_id, invoice_id, amount, req.user.id, notes || null],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // القيم المحدثة بعد التخصيص
    const [invoice] = await sequelize.query(
      `SELECT s.id, s."invoiceNumber", s.total,
              s.total - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.invoice_id = s.id), 0) AS outstanding
        FROM sales_invoices s WHERE s.id = $1`,
      { bind: [invoice_id], type: sequelize.QueryTypes.SELECT }
    );

    const [receipt] = await sequelize.query(
      `SELECT r.id, r."receiptNo", r.amount,
              r.amount - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.receipt_id = r.id), 0) AS remaining
        FROM receipts r WHERE r.id = $1`,
      { bind: [receipt_id], type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        allocation_id: result[0].allocation_id,
        invoice,
        receipt,
      },
      message: 'تم التخصيص بنجاح',
    });
  } catch (error) {
    console.error('AR allocate error:', error);
    res.status(400).json({ success: false, message: error.message || 'خطأ في التخصيص' });
  }
});
// POST /api/ar/allocate-batch - تخصيصات مجمعة داخل معاملة واحدة
router.post('/allocate-batch', authenticateToken, requireAccountingAccess, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { allocations } = req.body || {};
    if (!Array.isArray(allocations) || allocations.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'allocations: مصفوفة مطلوبة' });
    }

    for (const item of allocations) {
      const { receipt_id, invoice_id, amount, notes } = item || {};
      if (!receipt_id || !invoice_id || !amount) {
        throw new Error('كل عنصر يجب أن يحتوي receipt_id, invoice_id, amount');
      }
      await sequelize.query(
        'SELECT allocate_receipt_to_invoice($1, $2, $3, $4, $5) AS allocation_id',
        {
          bind: [receipt_id, invoice_id, amount, req.user.id, notes || null],
          type: sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );
    }

    await t.commit();
    return res.json({ success: true, message: 'تم تنفيذ التخصيصات بنجاح', count: allocations.length });
  } catch (error) {
    try { await t.rollback(); } catch {}
    console.error('AR allocate-batch error:', error);
    return res.status(400).json({ success: false, message: error.message || 'خطأ في التخصيص المجمّع' });
  }
});

// GET /api/ar/allocations - عرض التخصيصات (فلترة اختيارية)
router.get('/allocations', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const { customer_id, invoice_id, receipt_id, limit = 100, page = 1 } = req.query;

    let where = 'WHERE 1=1';
    const binds = [];
    let idx = 1;

    if (customer_id) {
      where += ` AND s."customerId" = $${idx}`;
      binds.push(customer_id);
      idx++;
    }
    if (invoice_id) {
      where += ` AND a.invoice_id = $${idx}`;
      binds.push(invoice_id);
      idx++;
    }
    if (receipt_id) {
      where += ` AND a.receipt_id = $${idx}`;
      binds.push(receipt_id);
      idx++;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const rows = await sequelize.query(
      `SELECT a.id, a.invoice_id, a.receipt_id, a.allocated_amount, a.notes, a.created_at,
              s."invoiceNumber" AS invoice_no, s.date AS invoice_date,
              r."receiptNo" AS receipt_no, r."receiptDate" AS receipt_date
         FROM ar_allocations a
         JOIN sales_invoices s ON s.id = a.invoice_id
         JOIN receipts r ON r.id = a.receipt_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
      { bind: [...binds, parseInt(limit), offset], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('AR allocations error:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب التخصيصات' });
  }
});

// POST /api/ar/unallocate - إلغاء تخصيص
router.post('/unallocate', authenticateToken, requireAccountingAccess, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { allocation_id, reason } = req.body || {};
    if (!allocation_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'allocation_id مطلوب' });
    }

    const [row] = await sequelize.query(
      'SELECT id, invoice_id, receipt_id, allocated_amount FROM ar_allocations WHERE id = $1',
      { bind: [allocation_id], type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'التخصيص غير موجود' });
    }

    await sequelize.query('DELETE FROM ar_allocations WHERE id = $1', {
      bind: [allocation_id],
      type: sequelize.QueryTypes.DELETE,
      transaction: t,
    });

    await t.commit();
    return res.json({ success: true, message: 'تم إلغاء التخصيص بنجاح', data: { allocation_id, reason: reason || null } });
  } catch (error) {
    try { await t.rollback(); } catch {}
    console.error('AR unallocate error:', error);
    return res.status(400).json({ success: false, message: error.message || 'خطأ في إلغاء التخصيص' });
  }
});



// GET /api/ar/open-invoices - الفواتير المفتوحة (قابلة للتحصيل)
router.get('/open-invoices', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const { customer_id, page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const binds = [];
    let idx = 1;

    if (customer_id) {
      where += ` AND customer_id = $${idx}`;
      binds.push(customer_id);
      idx++;
    }

    const countQuery = `SELECT COUNT(*)::int AS total FROM ar_open_invoices ${where}`;
    const [{ total }] = await sequelize.query(countQuery, { bind: binds, type: sequelize.QueryTypes.SELECT });

    const dataQuery = `
      SELECT *
      FROM ar_open_invoices
      ${where}
      ORDER BY "dueDate" NULLS LAST, date
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    binds.push(parseInt(limit), offset);

    const invoices = await sequelize.query(dataQuery, { bind: binds, type: sequelize.QueryTypes.SELECT });

    res.json({ success: true, data: { invoices, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) {
    console.error('AR open-invoices error:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب الفواتير المفتوحة' });
  }
});

// GET /api/ar/aging - تقرير أعمار الديون
router.get('/aging', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const { as_of, customer_id } = req.query;

    const asOfDate = as_of || new Date().toISOString().slice(0, 10);

    const aging = await sequelize.query(
      'SELECT * FROM ar_aging_report($1::date, $2::uuid)',
      { bind: [asOfDate, customer_id || null], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: { as_of: asOfDate, aging } });
  } catch (error) {
    console.error('AR aging error:', error);
    res.status(500).json({ success: false, message: 'خطأ في تقرير أعمار الديون' });
  }
});


// GET /api/ar/receipts - إيصالات العميل المرحلة مع الرصيد المتبقي
router.get('/receipts', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'customer_id مطلوب' });
    }

    const receipts = await sequelize.query(
      `SELECT
         r.id,
         r."receiptNo" as receipt_no,
         r."receiptDate" as receipt_date,
         r.amount,
         r.status,
         r.posted_status,
         (r.amount - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.receipt_id = r.id), 0)) AS remaining
       FROM receipts r
       WHERE r.posted_status = 'posted'
         AND r."partyType" = 'customer'
         AND r."partyId" = $1
       HAVING (r.amount - COALESCE((SELECT SUM(a.allocated_amount) FROM ar_allocations a WHERE a.receipt_id = r.id), 0)) > 0
       ORDER BY r."receiptDate" DESC NULLS LAST, r."createdAt" DESC NULLS LAST
      `,
      { bind: [customer_id], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: receipts });
  } catch (error) {
    console.error('AR receipts error:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب إيصالات العميل' });
  }
});

export default router;

