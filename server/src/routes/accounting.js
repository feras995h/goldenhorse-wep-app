import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAccountingAccess } from '../middleware/permissions.js';
import { sequelize } from '../models/index.js';

const router = express.Router();

// POST /api/accounting/post/:type/:id - Post document to GL
router.post('/post/:type/:id',
  authenticateToken,
  requireAccountingAccess,
  async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // التحقق من صحة نوع المستند
    const validTypes = ['sales_invoice', 'receipt'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المستند غير مدعوم'
      });
    }

    // التحقق من وجود المستند
    let document;
    if (type === 'sales_invoice') {
      document = await sequelize.query(
        'SELECT * FROM sales_invoices WHERE id = $1',
        { bind: [id], type: sequelize.QueryTypes.SELECT }
      );
    } else if (type === 'receipt') {
      document = await sequelize.query(
        'SELECT * FROM receipts WHERE id = $1',
        { bind: [id], type: sequelize.QueryTypes.SELECT }
      );
    }

    if (!document || document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستند غير موجود'
      });
    }

    const doc = document[0];

    // التحقق من حالة الترحيل
    if (doc.posted_status === 'posted') {
      return res.status(400).json({
        success: false,
        message: 'المستند مرحل مسبقاً'
      });
    }

    // تنفيذ الترحيل
    // إصلاح User ID إذا كان integer
    let validUserId = req.user.id;
    if (typeof req.user.id === 'number' || (typeof req.user.id === 'string' && /^\d+$/.test(req.user.id))) {
      const userResult = await sequelize.query(`
        SELECT id FROM users WHERE "isActive" = true AND role = 'admin' LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });

      if (userResult.length > 0) {
        validUserId = userResult[0].id;
      } else {
        return res.status(400).json({ message: 'لا يمكن تحديد المستخدم الصحيح' });
      }
    }

    const result = await sequelize.query(
      'SELECT post_document($1, $2, $3) as journal_id',
      {
        bind: [type, id, validUserId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    const journalId = result[0].journal_id;

    // الحصول على تفاصيل اليومية
    const journalDetails = await sequelize.query(`
      SELECT
        j.journal_no,
        j.journal_date,
        j.description,
        j.total_debit,
        j.total_credit,
        json_agg(
          json_build_object(
            'account_id', e.account_id,
            'account_name', a.name,
            'account_code', a.code,
            'debit_amount', e.debit_amount,
            'credit_amount', e.credit_amount,
            'description', e.description
          ) ORDER BY e.line_number
        ) as entries
      FROM gl_journals j
      JOIN posting_journal_entries e ON j.id = e.journal_id
      JOIN accounts a ON e.account_id = a.id
      WHERE j.id = $1
      GROUP BY j.id, j.journal_no, j.journal_date, j.description, j.total_debit, j.total_credit
    `, {
      bind: [journalId],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        journal_id: journalId,
        journal_details: journalDetails[0],
        message: 'تم ترحيل المستند بنجاح'
      }
    });

  } catch (error) {
    console.error('Error posting document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في ترحيل المستند'
    });
  }
});

// POST /api/accounting/reverse/:type/:id - Reverse posted document
router.post('/reverse/:type/:id',
  authenticateToken,
  requireAccountingAccess,
  async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason = 'Manual reversal' } = req.body;
    
    // التحقق من صحة نوع المستند
    const validTypes = ['sales_invoice', 'receipt'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المستند غير مدعوم'
      });
    }

    // التحقق من وجود المستند
    let document;
    if (type === 'sales_invoice') {
      document = await sequelize.query(
        'SELECT * FROM sales_invoices WHERE id = $1',
        { bind: [id], type: sequelize.QueryTypes.SELECT }
      );
    } else if (type === 'receipt') {
      document = await sequelize.query(
        'SELECT * FROM receipts WHERE id = $1',
        { bind: [id], type: sequelize.QueryTypes.SELECT }
      );
    }

    if (!document || document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستند غير موجود'
      });
    }

    const doc = document[0];

    // التحقق من حالة الترحيل
    if (doc.posted_status !== 'posted') {
      return res.status(400).json({
        success: false,
        message: 'المستند غير مرحل'
      });
    }

    // تنفيذ الإلغاء
    // إصلاح User ID إذا كان integer
    let validUserId = req.user.id;
    if (typeof req.user.id === 'number' || (typeof req.user.id === 'string' && /^\d+$/.test(req.user.id))) {
      const userResult = await sequelize.query(`
        SELECT id FROM users WHERE "isActive" = true AND role = 'admin' LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });

      if (userResult.length > 0) {
        validUserId = userResult[0].id;
      } else {
        return res.status(400).json({ message: 'لا يمكن تحديد المستخدم الصحيح' });
      }
    }

    const result = await sequelize.query(
      'SELECT reverse_document($1, $2, $3, $4) as reversal_journal_id',
      {
        bind: [type, id, validUserId, reason],
        type: sequelize.QueryTypes.SELECT
      }
    );

    const reversalJournalId = result[0].reversal_journal_id;

    // الحصول على تفاصيل اليومية العكسية
    const journalDetails = await sequelize.query(`
      SELECT
        j.journal_no,
        j.journal_date,
        j.description,
        j.total_debit,
        j.total_credit,
        json_agg(
          json_build_object(
            'account_id', e.account_id,
            'account_name', a.name,
            'account_code', a.code,
            'debit_amount', e.debit_amount,
            'credit_amount', e.credit_amount,
            'description', e.description
          ) ORDER BY e.line_number
        ) as entries
      FROM gl_journals j
      JOIN posting_journal_entries e ON j.id = e.journal_id
      JOIN accounts a ON e.account_id = a.id
      WHERE j.id = $1
      GROUP BY j.id, j.journal_no, j.journal_date, j.description, j.total_debit, j.total_credit
    `, {
      bind: [reversalJournalId],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        reversal_journal_id: reversalJournalId,
        journal_details: journalDetails[0],
        reason: reason,
        message: 'تم إلغاء ترحيل المستند بنجاح'
      }
    });

  } catch (error) {
    console.error('Error reversing document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في إلغاء ترحيل المستند'
    });
  }
});

// GET /api/accounting/journals - Get GL journals with filtering
router.get('/journals',
  authenticateToken,
  requireAccountingAccess,
  async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      document_type,
      status,
      from_date,
      to_date,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const bindings = [];
    let bindIndex = 1;

    if (document_type) {
      whereClause += ` AND j.document_type = $${bindIndex}`;
      bindings.push(document_type);
      bindIndex++;
    }

    if (status) {
      whereClause += ` AND j.status = $${bindIndex}`;
      bindings.push(status);
      bindIndex++;
    }

    if (from_date) {
      whereClause += ` AND j.journal_date >= $${bindIndex}`;
      bindings.push(from_date);
      bindIndex++;
    }

    if (to_date) {
      whereClause += ` AND j.journal_date <= $${bindIndex}`;
      bindings.push(to_date);
      bindIndex++;
    }

    if (search) {
      whereClause += ` AND (j.journal_no ILIKE $${bindIndex} OR j.description ILIKE $${bindIndex} OR j.document_no ILIKE $${bindIndex})`;
      bindings.push(`%${search}%`);
      bindIndex++;
    }

    // الحصول على العدد الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM gl_journals j
      ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: bindings,
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult[0].total);

    // الحصول على البيانات
    const dataQuery = `
      SELECT 
        j.id,
        j.journal_no,
        j.journal_date,
        j.description,
        j.document_type,
        j.document_no,
        j.total_debit,
        j.total_credit,
        j.status,
        j.posted_at,
        u.name as posted_by_name
      FROM gl_journals j
      LEFT JOIN users u ON j.posted_by = u.id
      ${whereClause}
      ORDER BY j.journal_date DESC, j.journal_no DESC
      LIMIT $${bindIndex} OFFSET $${bindIndex + 1}
    `;

    bindings.push(parseInt(limit), offset);

    const journals = await sequelize.query(dataQuery, {
      bind: bindings,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        journals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب اليوميات'
    });
  }
});

// GET /api/accounting/journals/:id - Get journal details
router.get('/journals/:id',
  authenticateToken,
  requireAccountingAccess,
  async (req, res) => {
  try {
    const { id } = req.params;

    const journalDetails = await sequelize.query(`
      SELECT
        j.id,
        j.journal_no,
        j.journal_date,
        j.description,
        j.document_type,
        j.document_id,
        j.document_no,
        j.total_debit,
        j.total_credit,
        j.status,
        j.fiscal_year,
        j.posted_at,
        j.posted_by,
        j.reversed_at,
        j.reversed_by,
        j.reversal_reason,
        u1.name as posted_by_name,
        u2.name as reversed_by_name,
        json_agg(
          json_build_object(
            'id', e.id,
            'account_id', e.account_id,
            'account_code', a.code,
            'account_name', a.name,
            'debit_amount', e.debit_amount,
            'credit_amount', e.credit_amount,
            'description', e.description,
            'line_number', e.line_number
          ) ORDER BY e.line_number
        ) as entries
      FROM gl_journals j
      LEFT JOIN users u1 ON j.posted_by = u1.id
      LEFT JOIN users u2 ON j.reversed_by = u2.id
      LEFT JOIN posting_journal_entries e ON j.id = e.journal_id
      LEFT JOIN accounts a ON e.account_id = a.id
      WHERE j.id = $1
      GROUP BY j.id, u1.name, u2.name
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    if (journalDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'اليومية غير موجودة'
      });
    }

    res.json({
      success: true,
      data: journalDetails[0]
    });

  } catch (error) {
    console.error('Error fetching journal details:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تفاصيل اليومية'
    });
  }
});

export default router;
