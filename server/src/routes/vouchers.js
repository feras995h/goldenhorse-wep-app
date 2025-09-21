import express from 'express';
import { authenticateToken, requireAccountingAccess } from '../middleware/auth.js';
import models from '../models/index.js';
const { ReceiptVoucher, PaymentVoucher, Customer, Supplier, Account } = models;
import { sequelize } from '../models/index.js';

const router = express.Router();

// ===== RECEIPT VOUCHERS =====

// GET /api/vouchers/receipts - Get receipt vouchers
router.get('/receipts', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      dateFrom,
      dateTo,
      customerId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[sequelize.Op.or] = [
        { voucherNumber: { [sequelize.Op.like]: `%${search}%` } },
        { customerName: { [sequelize.Op.like]: `%${search}%` } },
        { purposeDescription: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Customer filter
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[sequelize.Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[sequelize.Op.lte] = dateTo;
      }
    }

    const { count, rows: vouchers } = await ReceiptVoucher.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'phone', 'email']
        },
        {
          model: Account,
          as: 'debitAccount',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'creditAccount',
          attributes: ['id', 'code', 'name']
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching receipt vouchers:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب إيصالات القبض',
      error: error.message 
    });
  }
});

// POST /api/vouchers/receipts - Create receipt voucher
router.post('/receipts', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      shipmentId,
      paymentMethod,
      currency,
      amount,
      purpose,
      purposeDescription,
      debitAccountId,
      creditAccountId,
      exchangeRate,
      notes,
      attachments
    } = req.body;

    // Validate required fields
    if (!customerName || !amount || !debitAccountId || !creditAccountId) {
      return res.status(400).json({ 
        success: false,
        message: 'البيانات المطلوبة: اسم العميل، المبلغ، الحساب المدين، الحساب الدائن' 
      });
    }

    // Validate customer exists if customerId provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ 
          success: false,
          message: 'العميل غير موجود' 
        });
      }
    }

    // Validate accounts exist
    const [debitAccount, creditAccount] = await Promise.all([
      Account.findByPk(debitAccountId),
      Account.findByPk(creditAccountId)
    ]);

    if (!debitAccount || !creditAccount) {
      return res.status(404).json({ 
        success: false,
        message: 'أحد الحسابات غير موجود' 
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const newVoucher = await ReceiptVoucher.create({
        customerId,
        customerName,
        shipmentId,
        paymentMethod: paymentMethod || 'cash',
        currency: currency || 'LYD',
        amount: parseFloat(amount),
        purpose: purpose || 'invoice_payment',
        purposeDescription,
        debitAccountId,
        creditAccountId,
        exchangeRate: parseFloat(exchangeRate) || 1.0,
        notes,
        attachments: attachments || [],
        createdBy: req.user.id
      }, { transaction });

      // Create journal entry
      try {
        await newVoucher.createJournalEntry(req.user.id, { transaction });
        console.log('✅ تم إنشاء القيد المحاسبي لإيصال القبض');
      } catch (journalError) {
        console.error('❌ خطأ في إنشاء القيد المحاسبي:', journalError.message);
        // Don't fail the voucher creation if journal entry fails
      }

      await transaction.commit();

      // Fetch the created voucher with details
      const voucherWithDetails = await ReceiptVoucher.findByPk(newVoucher.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'code', 'name', 'phone', 'email']
          },
          {
            model: Account,
            as: 'debitAccount',
            attributes: ['id', 'code', 'name']
          },
          {
            model: Account,
            as: 'creditAccount',
            attributes: ['id', 'code', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: voucherWithDetails,
        message: 'تم إنشاء إيصال القبض بنجاح'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating receipt voucher:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في إنشاء إيصال القبض',
      error: error.message 
    });
  }
});

// ===== PAYMENT VOUCHERS =====

// GET /api/vouchers/payments - Get payment vouchers
router.get('/payments', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      dateFrom,
      dateTo,
      beneficiaryId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[sequelize.Op.or] = [
        { voucherNumber: { [sequelize.Op.like]: `%${search}%` } },
        { beneficiaryName: { [sequelize.Op.like]: `%${search}%` } },
        { purposeDescription: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Beneficiary filter
    if (beneficiaryId) {
      whereClause.beneficiaryId = beneficiaryId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[sequelize.Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[sequelize.Op.lte] = dateTo;
      }
    }

    const { count, rows: vouchers } = await PaymentVoucher.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Supplier,
          as: 'beneficiary',
          attributes: ['id', 'code', 'name', 'phone', 'email']
        },
        {
          model: Account,
          as: 'debitAccount',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'creditAccount',
          attributes: ['id', 'code', 'name']
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payment vouchers:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب إيصالات الصرف',
      error: error.message 
    });
  }
});

// POST /api/vouchers/payments - Create payment voucher
router.post('/payments', authenticateToken, requireAccountingAccess, async (req, res) => {
  try {
    const {
      beneficiaryId,
      beneficiaryName,
      purpose,
      purposeDescription,
      paymentMethod,
      currency,
      amount,
      debitAccountId,
      creditAccountId,
      exchangeRate,
      notes,
      attachments
    } = req.body;

    // Validate required fields
    if (!beneficiaryName || !amount || !debitAccountId || !creditAccountId) {
      return res.status(400).json({ 
        success: false,
        message: 'البيانات المطلوبة: اسم المستفيد، المبلغ، الحساب المدين، الحساب الدائن' 
      });
    }

    // Validate beneficiary exists if beneficiaryId provided
    if (beneficiaryId) {
      const beneficiary = await Supplier.findByPk(beneficiaryId);
      if (!beneficiary) {
        return res.status(404).json({ 
          success: false,
          message: 'المستفيد غير موجود' 
        });
      }
    }

    // Validate accounts exist
    const [debitAccount, creditAccount] = await Promise.all([
      Account.findByPk(debitAccountId),
      Account.findByPk(creditAccountId)
    ]);

    if (!debitAccount || !creditAccount) {
      return res.status(404).json({ 
        success: false,
        message: 'أحد الحسابات غير موجود' 
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const newVoucher = await PaymentVoucher.create({
        beneficiaryId,
        beneficiaryName,
        purpose: purpose || 'invoice_payment',
        purposeDescription,
        paymentMethod: paymentMethod || 'cash',
        currency: currency || 'LYD',
        amount: parseFloat(amount),
        debitAccountId,
        creditAccountId,
        exchangeRate: parseFloat(exchangeRate) || 1.0,
        notes,
        attachments: attachments || [],
        createdBy: req.user.id
      }, { transaction });

      // Create journal entry
      try {
        await newVoucher.createJournalEntry(req.user.id, { transaction });
        console.log('✅ تم إنشاء القيد المحاسبي لإيصال الصرف');
      } catch (journalError) {
        console.error('❌ خطأ في إنشاء القيد المحاسبي:', journalError.message);
        // Don't fail the voucher creation if journal entry fails
      }

      await transaction.commit();

      // Fetch the created voucher with details
      const voucherWithDetails = await PaymentVoucher.findByPk(newVoucher.id, {
        include: [
          {
            model: Supplier,
            as: 'beneficiary',
            attributes: ['id', 'code', 'name', 'phone', 'email']
          },
          {
            model: Account,
            as: 'debitAccount',
            attributes: ['id', 'code', 'name']
          },
          {
            model: Account,
            as: 'creditAccount',
            attributes: ['id', 'code', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: voucherWithDetails,
        message: 'تم إنشاء إيصال الصرف بنجاح'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating payment voucher:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في إنشاء إيصال الصرف',
      error: error.message 
    });
  }
});

export default router;
