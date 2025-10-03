import express from 'express';
import { authenticateToken, requireSalesAccess } from '../middleware/auth.js';
import {
  validateCustomer,
  validatePayment,
  validateInvoice,
  handleValidationErrors,
  commonValidations
} from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';
import models, { sequelize as db } from '../models/index.js';
import { Op } from 'sequelize';
import NotificationService from '../services/NotificationService.js';
import cacheService from '../services/cacheService.js';
import realtimeService from '../services/realtimeService.js';
import { cache, invalidateCache } from '../middleware/cacheMiddleware.js';

const router = express.Router();
const {
  Customer,
  Invoice,
  Payment,
  Receipt,
  Account,
  Supplier,
  GLEntry,
  JournalEntry,
  JournalEntryDetail,
  Shipment,
  ShipmentMovement,
  WarehouseReleaseOrder,
  ShippingInvoice,
  SalesInvoice,
  SalesInvoiceItem,
  SalesReturn,
  AccountMapping,
  SalesInvoicePayment,
  StockMovement
} = models;

// Use named export for sequelize
const sequelize = db;


// Dialect-aware LIKE operator (SQLite uses Op.like, Postgres uses Op.iLike)
const likeOp = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? Op.like : Op.iLike;

// ==================== CUSTOMERS ROUTES ====================

// GET /api/sales/customers/:id/statement - Get customer account statement
router.get('/customers/:id/statement',
  authenticateToken,
  requireSalesAccess,
  async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate, limit = 100 } = req.query;

    // التحقق من وجود العميل
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    // الحصول على كشف الحساب
    const statementQuery = `
      SELECT * FROM get_customer_statement(
        $1::UUID,
        $2::DATE,
        $3::DATE,
        $4::INTEGER
      )
    `;

    const statement = await sequelize.query(statementQuery, {
      bind: [id, fromDate || null, toDate || null, parseInt(limit)],
      type: sequelize.QueryTypes.SELECT
    });

    // الحصول على ملخص الحساب
    const summaryQuery = `SELECT * FROM get_customer_summary($1::UUID)`;
    const summary = await sequelize.query(summaryQuery, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          code: customer.code,
          email: customer.email,
          phone: customer.phone
        },
        summary: summary[0] || null,
        transactions: statement,
        filters: {
          fromDate,
          toDate,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer statement:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب كشف حساب العميل'
    });
  }
});

// POST /api/sales/customers/:id/transaction - Record customer transaction
router.post('/customers/:id/transaction',
  authenticateToken,
  requireSalesAccess,
  async (req, res) => {
  try {
    const { id } = req.params;
    const {
      transactionType,
      referenceType,
      referenceId,
      referenceNumber,
      transactionDate,
      dueDate,
      description,
      debitAmount = 0,
      creditAmount = 0,
      currency = 'LYD',
      exchangeRate = 1.0000
    } = req.body;

    // التحقق من وجود العميل
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    // تسجيل الحركة
    const transactionQuery = `
      SELECT record_customer_transaction(
        $1::UUID, $2::VARCHAR, $3::VARCHAR, $4::UUID, $5::VARCHAR,
        $6::DATE, $7::DATE, $8::TEXT, $9::DECIMAL, $10::DECIMAL,
        $11::VARCHAR, $12::DECIMAL, $13::UUID
      ) as transaction_id
    `;

    const result = await sequelize.query(transactionQuery, {
      bind: [
        id, transactionType, referenceType, referenceId, referenceNumber,
        transactionDate, dueDate, description, debitAmount, creditAmount,
        currency, exchangeRate, req.user.id
      ],
      type: sequelize.QueryTypes.SELECT
    });

    res.status(201).json({
      success: true,
      data: {
        transactionId: result[0].transaction_id,
        message: 'تم تسجيل الحركة بنجاح'
      }
    });

  } catch (error) {
    console.error('Error recording customer transaction:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل حركة العميل'
    });
  }
});

// GET /api/sales/customers - Get customers with pagination and search
router.get('/customers', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, customerType, status } = req.query;

    // إصلاح مؤقت: استخدام SQL مباشر بدلاً من stored function
    let whereConditions = ['c."isActive" = true'];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.code ILIKE $${paramIndex + 1} OR c.email ILIKE $${paramIndex + 2})`);
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (type) {
      whereConditions.push(`c.type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM customers c
      WHERE ${whereClause}
    `;

    const countResult = await db.query(countQuery, {
      bind: queryParams,
      type: db.QueryTypes.SELECT
    });

    const total = parseInt(countResult[0].count);

    // Get paginated data
    const customersQuery = `
      SELECT
        c.id,
        c.code,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.type,
        c."isActive",
        c."createdAt",
        c."updatedAt"
      FROM customers c
      WHERE ${whereClause}
      ORDER BY c.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await db.query(customersQuery, {
      bind: queryParams,
      type: db.QueryTypes.SELECT
    });

    const customersData = {
      data: result,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };

    // Apply additional filters if needed
    let filteredData = customersData.data || [];

    if (customerType) {
      filteredData = filteredData.filter(customer =>
        customer.customerType === customerType
      );
    }

    if (status === 'active') {
      filteredData = filteredData.filter(customer => customer.isActive === true);
    } else if (status === 'inactive') {
      filteredData = filteredData.filter(customer => customer.isActive === false);
    }

    // Get customer statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_customers,
        COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_customers,
        COUNT(CASE WHEN type::text = 'individual' THEN 1 END) as individual_customers,
        COUNT(CASE WHEN type::text = 'company' THEN 1 END) as company_customers,
        COALESCE(SUM(balance), 0) as total_balance
      FROM customers
    `;

    const statsResult = await db.query(statsQuery, { type: db.QueryTypes.SELECT });
    const stats = statsResult[0];

    const response = {
      data: filteredData,
      stats: {
        totalCustomers: parseInt(stats.total_customers),
        activeCustomers: parseInt(stats.active_customers),
        individualCustomers: parseInt(stats.individual_customers),
        companyCustomers: parseInt(stats.company_customers),
        totalBalance: parseFloat(stats.total_balance)
      },
      pagination: {
        ...customersData.pagination,
        total: filteredData.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'خطأ في جلب العملاء', error: error.message });
  }
});

// GET /api/sales/customers/:id - Get single customer
router.get('/customers/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name', 'balance']
        },
        {
          model: Invoice,
          as: 'invoices',
          limit: 10,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'invoiceNumber', 'date', 'totalAmount', 'status']
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'خطأ في جلب العميل' });
  }
});

// POST /api/sales/customers - Create new customer with enhanced classification
router.post('/customers',
  authenticateToken,
  requireSalesAccess,
  validateCustomer,
  handleValidationErrors,
  async (req, res) => {
  try {
    const {
      code,
      name,
      nameEn,
      type = 'individual',
      customerType = 'local',
      nationality,
      passportNumber,
      residencyStatus,
      email,
      phone,
      address,
      taxNumber,
      creditLimit = 0,
      paymentTerms = 30,
      currency = 'LYD',
      contactPerson
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'اسم العميل مطلوب' });
    }

    // Check if customer code already exists (only if provided)
    if (code) {
      const existingCustomer = await Customer.findOne({ where: { code } });
      if (existingCustomer) {
        return res.status(400).json({ message: 'كود العميل موجود مسبقاً' });
      }
    }

    // Validate customer type specific fields
    if (customerType === 'foreign') {
      if (!nationality) {
        return res.status(400).json({ message: 'الجنسية مطلوبة للعملاء الأجانب' });
      }
    }

    const newCustomer = await Customer.create({
      id: uuidv4(),
      code: code || undefined, // Let the model generate it if not provided
      name,
      nameEn,
      type,
      customerType,
      nationality,
      passportNumber,
      residencyStatus,
      email,
      phone,
      address,
      taxNumber,
      creditLimit: parseFloat(creditLimit),
      paymentTerms: parseInt(paymentTerms),
      currency,
      contactPerson,
      isActive: true,
      balance: 0.00
    });

    // Create notification for customer creation
    try {
      await NotificationService.notifyCustomerCreated(newCustomer, req.user);
    } catch (notificationError) {
      console.error('Error creating customer notification:', notificationError);
      // Don't fail the customer creation if notification fails
    }

    res.status(201).json({
      message: 'تم إنشاء العميل بنجاح',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'بيانات غير صحيحة',
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ message: 'خطأ في إنشاء العميل' });
  }
});

// PUT /api/sales/customers/:id - Update customer
router.put('/customers/:id',
  authenticateToken,
  requireSalesAccess,
  commonValidations.uuid,
  validateCustomer,
  handleValidationErrors,
  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    // Check if code is being changed and if new code exists
    if (updateData.code && updateData.code !== customer.code) {
      const existingCustomer = await Customer.findOne({ where: { code: updateData.code } });
      if (existingCustomer) {
        return res.status(400).json({ message: 'كود العميل موجود مسبقاً' });
      }
    }

    await customer.update(updateData);

    res.json({
      message: 'تم تحديث العميل بنجاح',
      customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'بيانات غير صحيحة',
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ message: 'خطأ في تحديث العميل' });
  }
});

// DELETE /api/sales/customers/:id - Delete customer (soft delete)
router.delete('/customers/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    // Check if customer has outstanding balance
    if (parseFloat(customer.balance) !== 0) {
      return res.status(400).json({
        message: 'لا يمكن حذف العميل لوجود رصيد مستحق'
      });
    }

    // Soft delete by setting isActive to false
    await customer.update({ isActive: false });

    res.json({ message: 'تم حذف العميل بنجاح' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'خطأ في حذف العميل' });
  }
});

// ==================== INVOICES ROUTES ====================

// GET /api/sales/invoices - Get invoices with pagination
router.get('/invoices', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      customerId,
      dateFrom,
      dateTo
    } = req.query;

    let whereClause = {};

    // Filter by search term (invoice number)
    if (search) {
      whereClause.invoiceNumber = {
        [likeOp]: `%${search}%`
      };
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by customer
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[Op.lte] = dateTo;
      }
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'type']
        }
      ]
    };

    const invoices = await SalesInvoice.findAll(options);
    const total = await SalesInvoice.count({ where: whereClause });

    const response = {
      data: invoices,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching invoices:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'خطأ في جلب الفواتير',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/sales/invoices/:id - Get single invoice
router.get('/invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'type', 'address', 'phone', 'email']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'خطأ في جلب الفاتورة' });
  }
});

// POST /api/sales/invoices - Create new invoice
router.post('/invoices', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      customerId,
      date,
      dueDate,
      items = [],
      notes,
      terms
    } = req.body;

    // Validate required fields
    if (!customerId || !date || !dueDate) {
      return res.status(400).json({ message: 'معرف العميل وتاريخ الفاتورة وتاريخ الاستحقاق مطلوبة' });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(400).json({ message: 'العميل غير موجود' });
    }

    // Calculate total from items
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const transaction = await sequelize.transaction();

    try {
      // التحقق من صحة المبلغ
      if (total <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'المبلغ الإجمالي يجب أن يكون أكبر من صفر' });
      }

      const newInvoice = await SalesInvoice.create({
        invoiceNumber: invoiceNumber,
        customerId,
        date,
        dueDate,
        subtotal: total,
        total: total,
        status: 'draft',
        paymentStatus: 'unpaid',
        notes,
        terms,
        createdBy: req.user.id
      }, { transaction });

      // Create automatic journal entry for sales invoice
      await newInvoice.createJournalEntryAndAffectBalance(req.user.id, { transaction });
      console.log('✅ تم إنشاء القيد المحاسبي تلقائياً للفاتورة');

      await transaction.commit();

      // Fetch the created invoice with customer details
      const invoiceWithCustomer = await SalesInvoice.findByPk(newInvoice.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'code', 'name', 'type', 'address', 'phone', 'email']
          }
        ]
      });

      res.status(201).json(invoiceWithCustomer);
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: 'خطأ في إنشاء الفاتورة', error: error.message });
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الفاتورة', error: error.message });
  }
});

// ==================== PAYMENTS ROUTES ====================

// GET /api/sales/payments - Get payments
router.get('/payments', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customerId,
      dateFrom,
      dateTo
    } = req.query;

    let whereClause = {};

    // Filter by customer
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[Op.lte] = dateTo;
      }
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    const payments = await Payment.findAll(options);
    const total = await Payment.count({ where: whereClause });

    const response = {
      data: payments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'خطأ في جلب المدفوعات' });
  }
});

// POST /api/sales/receipt-vouchers - Create receipt voucher with automatic accounting
router.post('/receipt-vouchers',
  authenticateToken,
  requireSalesAccess,
  async (req, res) => {
  try {
    const {
      customerId,
      amount,
      date,
      paymentMethod = 'cash',
      description,
      reference,
      bankAccount,
      checkNumber,
      currency = 'LYD',
      exchangeRate = 1.0,
      invoiceAllocations = []
    } = req.body;

    // Validate required fields
    if (!customerId || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'العميل والمبلغ والتاريخ مطلوبة'
      });
    }

    // التحقق من صحة المبلغ
    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ يجب أن يكون رقماً موجباً'
      });
    }

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'العميل غير موجود'
      });
    }

    const result = await db.transaction(async (transaction) => {
      // Generate receipt number
      const lastReceipt = await Receipt.findOne({
        order: [['receiptNo', 'DESC']],
        transaction
      });
      const nextNumber = lastReceipt ?
        parseInt(String(lastReceipt.receiptNo).replace('REC-', '')) + 1 : 1;
      const receiptNo = `REC-${String(nextNumber).padStart(6, '0')}`;

      // Get account mapping for automatic account selection
      const activeMapping = await AccountMapping.getActiveMapping();
      if (!activeMapping) {
        throw new Error('لم يتم العثور على ربط الحسابات. يرجى إعداد ربط الحسابات أولاً');
      }

      // Determine customer account (accounts receivable)
      let customerAccountId = customer.accountId;
      if (!customerAccountId) {
        // Use default accounts receivable account
        customerAccountId = activeMapping.accountsReceivableAccount;
        if (!customerAccountId) {
          throw new Error('لم يتم العثور على حساب الذمم المدينة. يرجى إعداد ربط الحسابات');
        }
      }

      // Determine counter account based on payment method
      let counterAccountId;
      switch (paymentMethod) {
        case 'cash':
          counterAccountId = activeMapping.cashAccount;
          break;
        case 'bank_transfer':
          counterAccountId = activeMapping.bankAccount;
          break;
        case 'check':
          counterAccountId = activeMapping.bankAccount;
          break;
        case 'credit_card':
          counterAccountId = activeMapping.bankAccount;
          break;
        default:
          counterAccountId = activeMapping.cashAccount;
      }

      if (!counterAccountId) {
        throw new Error(`لم يتم العثور على حساب ${paymentMethod}. يرجى إعداد ربط الحسابات`);
      }

      // توليد رقم الإيصال تلقائياً
      const documentNoResult = await sequelize.query(
        "SELECT generate_document_number('receipt') as document_no",
        { type: sequelize.QueryTypes.SELECT, transaction }
      );
      const documentNo = documentNoResult[0].document_no;

      // Create receipt voucher
      const receipt = await Receipt.create({
        receiptNo,
        accountId: customerAccountId,
        partyType: 'customer',
        partyId: customerId,
        receiptDate: date,
        amount: parseFloat(amount),
        paymentMethod,
        referenceNo: reference,
        bankAccount,
        checkNumber,
        remarks: description || `إيصال قبض من العميل ${customer.name}`,
        currency,
        exchangeRate: parseFloat(exchangeRate),
        status: 'completed',
        createdBy: req.user.id,
        completedAt: new Date(),
        completedBy: req.user.id,
        document_no: documentNo,
        posted_status: 'draft',
        fiscal_year: new Date().getFullYear(),
        can_edit: true
      }, { transaction });

      // Create automatic journal entry
      const journalEntryNumber = `JE-${receiptNo}`;
      const journalEntry = await JournalEntry.create({
        entryNumber: journalEntryNumber,
        date: date,
        description: `إيصال قبض رقم ${receiptNo} من العميل ${customer.name}`,
        totalDebit: parseFloat(amount),
        totalCredit: parseFloat(amount),
        status: 'posted',
        type: 'receipt',
        createdBy: req.user.id
      }, { transaction });

      // Create journal entry details
      const journalDetails = [
        {
          journalEntryId: journalEntry.id,
          accountId: counterAccountId, // Cash/Bank account (Debit)
          debit: parseFloat(amount),
          credit: 0,
          description: `استلام نقدي - ${paymentMethod}`
        },
        {
          journalEntryId: journalEntry.id,
          accountId: customerAccountId, // Customer account (Credit)
          debit: 0,
          credit: parseFloat(amount),
          description: `تحصيل من العميل ${customer.name}`
        }
      ];

      await JournalEntryDetail.bulkCreate(journalDetails, { transaction });

      // Create GL entries
      const glEntries = journalDetails.map(detail => ({
        postingDate: date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Receipt Voucher',
        voucherNo: receiptNo,
        journalEntryId: journalEntry.id,
        remarks: detail.description,
        currency,
        exchangeRate: parseFloat(exchangeRate),
        createdBy: req.user.id
      }));

      await GLEntry.bulkCreate(glEntries, { transaction });

      // Handle invoice allocations if provided
      if (invoiceAllocations && invoiceAllocations.length > 0) {
        for (const allocation of invoiceAllocations) {
          // Find the invoice
          const invoice = await SalesInvoice.findByPk(allocation.invoiceId, { transaction });
          if (invoice) {
            // Create payment record for the invoice
            await SalesInvoicePayment.create({
              salesInvoiceId: allocation.invoiceId,
              amount: allocation.amount,
              paymentDate: date,
              paymentMethod,
              paymentReference: receiptNo,
              notes: allocation.notes || `تحصيل من إيصال ${receiptNo}`,
              createdBy: req.user.id
            }, { transaction });

            // Update invoice paid amount
            const totalPaid = await SalesInvoicePayment.sum('amount', {
              where: { salesInvoiceId: allocation.invoiceId },
              transaction
            });

            const paymentStatus = totalPaid >= invoice.total ? 'paid' :
                                totalPaid > 0 ? 'partial' : 'unpaid';

            await invoice.update({
              paidAmount: totalPaid,
              paymentStatus
            }, { transaction });
          }
        }
      }

      return {
        receipt,
        journalEntry,
        glEntries,
        message: 'تم إنشاء إيصال القبض والقيود المحاسبية بنجاح'
      };
    });

    res.json({
      success: true,
      data: result.receipt,
      journalEntry: result.journalEntry,
      message: result.message
    });

  } catch (error) {
    console.error('Error creating receipt voucher:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء إنشاء إيصال القبض'
    });
  }
});

// POST /api/sales/payment-vouchers - Create payment voucher with automatic accounting
router.post('/payment-vouchers',
  authenticateToken,
  requireSalesAccess,
  async (req, res) => {
  try {
    const {
      supplierId,
      customerId,
      accountId,
      partyType = 'supplier',
      amount,
      date,
      paymentMethod = 'cash',
      description,
      reference,
      bankAccount,
      checkNumber,
      currency = 'LYD',
      exchangeRate = 1.0
    } = req.body;

    // Validate required fields
    if (!amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ والتاريخ مطلوبان'
      });
    }

    // التحقق من صحة المبلغ
    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ يجب أن يكون رقماً موجباً'
      });
    }

    // Validate party exists
    let party;
    let partyId;
    let partyName;

    if (partyType === 'supplier' && supplierId) {
      party = await Supplier.findByPk(supplierId);
      partyId = supplierId;
      partyName = party?.name;
    } else if (partyType === 'customer' && customerId) {
      party = await Customer.findByPk(customerId);
      partyId = customerId;
      partyName = party?.name;
    } else if (partyType === 'account' && accountId) {
      party = await Account.findByPk(accountId);
      partyId = accountId;
      partyName = party?.name;
    }

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'الطرف المحدد غير موجود'
      });
    }

    const result = await db.transaction(async (transaction) => {
      // Generate payment number
      const lastPayment = await Receipt.findOne({
        where: { voucherType: 'payment' },
        order: [['receiptNo', 'DESC']],
        transaction
      });
      const nextNumber = lastPayment ?
        parseInt(String(lastPayment.receiptNo).replace('PAY-', '')) + 1 : 1;
      const paymentNo = `PAY-${String(nextNumber).padStart(6, '0')}`;

      // Get account mapping for automatic account selection
      const activeMapping = await AccountMapping.getActiveMapping();
      if (!activeMapping) {
        throw new Error('لم يتم العثور على ربط الحسابات. يرجى إعداد ربط الحسابات أولاً');
      }

      // Determine party account
      let partyAccountId;
      if (partyType === 'supplier') {
        partyAccountId = party.accountId || activeMapping.accountsPayableAccount;
      } else if (partyType === 'customer') {
        partyAccountId = party.accountId || activeMapping.accountsReceivableAccount;
      } else if (partyType === 'account') {
        partyAccountId = accountId;
      }

      if (!partyAccountId) {
        throw new Error(`لم يتم العثور على حساب ${partyType}. يرجى إعداد ربط الحسابات`);
      }

      // Determine counter account based on payment method
      let counterAccountId;
      switch (paymentMethod) {
        case 'cash':
          counterAccountId = activeMapping.cashAccount;
          break;
        case 'bank_transfer':
          counterAccountId = activeMapping.bankAccount;
          break;
        case 'check':
          counterAccountId = activeMapping.bankAccount;
          break;
        case 'credit_card':
          counterAccountId = activeMapping.bankAccount;
          break;
        default:
          counterAccountId = activeMapping.cashAccount;
      }

      if (!counterAccountId) {
        throw new Error(`لم يتم العثور على حساب ${paymentMethod}. يرجى إعداد ربط الحسابات`);
      }

      // Create payment voucher
      const payment = await Receipt.create({
        receiptNo: paymentNo,
        accountId: partyAccountId,
        partyType,
        partyId,
        supplierId: partyType === 'supplier' ? partyId : null,
        voucherType: 'payment',
        receiptDate: date,
        amount: parseFloat(amount),
        paymentMethod,
        referenceNo: reference,
        bankAccount,
        checkNumber,
        remarks: description || `إيصال صرف إلى ${partyName}`,
        currency,
        exchangeRate: parseFloat(exchangeRate),
        status: 'completed',
        createdBy: req.user.id,
        completedAt: new Date(),
        completedBy: req.user.id
      }, { transaction });

      // Create automatic journal entry
      const journalEntryNumber = `JE-${paymentNo}`;
      const journalEntry = await JournalEntry.create({
        entryNumber: journalEntryNumber,
        date: date,
        description: `إيصال صرف رقم ${paymentNo} إلى ${partyName}`,
        totalDebit: parseFloat(amount),
        totalCredit: parseFloat(amount),
        status: 'posted',
        type: 'payment',
        createdBy: req.user.id
      }, { transaction });

      // Create journal entry details
      const journalDetails = [
        {
          journalEntryId: journalEntry.id,
          accountId: partyAccountId, // Party account (Debit)
          debit: parseFloat(amount),
          credit: 0,
          description: `دفع إلى ${partyName}`
        },
        {
          journalEntryId: journalEntry.id,
          accountId: counterAccountId, // Cash/Bank account (Credit)
          debit: 0,
          credit: parseFloat(amount),
          description: `دفع نقدي - ${paymentMethod}`
        }
      ];

      await JournalEntryDetail.bulkCreate(journalDetails, { transaction });

      // Create GL entries
      const glEntries = journalDetails.map(detail => ({
        postingDate: date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Payment Voucher',
        voucherNo: paymentNo,
        journalEntryId: journalEntry.id,
        remarks: detail.description,
        currency,
        exchangeRate: parseFloat(exchangeRate),
        createdBy: req.user.id
      }));

      await GLEntry.bulkCreate(glEntries, { transaction });

      return {
        payment,
        journalEntry,
        glEntries,
        message: 'تم إنشاء إيصال الصرف والقيود المحاسبية بنجاح'
      };
    });

    res.json({
      success: true,
      data: result.payment,
      journalEntry: result.journalEntry,
      message: result.message
    });

  } catch (error) {
    console.error('Error creating payment voucher:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء إنشاء إيصال الصرف'
    });
  }
});

// POST /api/sales/payments - Create payment (Legacy endpoint - kept for compatibility)
router.post('/payments',
  authenticateToken,
  requireSalesAccess,
  validatePayment,
  handleValidationErrors,
  async (req, res) => {
  try {
    const {
      customerId,
      amount,
      date,
      paymentMethod = 'cash',
      description,
      reference,
      counterAccountId: counterAccountIdFromClient
    } = req.body;

    // Validate required fields
    if (!customerId || !amount || !date) {
      return res.status(400).json({ message: 'العميل والمبلغ والتاريخ مطلوبة' });
    }

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    const result = await sequelize.transaction(async (transaction) => {
      // Generate payment number (inside transaction)
      const lastPayment = await Payment.findOne({
        order: [['paymentNumber', 'DESC']],
        transaction
      });
      const nextNumber = lastPayment ?
        parseInt(String(lastPayment.paymentNumber).replace('PAY', '')) + 1 : 1;
      const paymentNumber = `PAY${String(nextNumber).padStart(6, '0')}`;

      // Determine party account (customer receivable)
      let partyAccountId = customer.accountId;
      if (!partyAccountId) {
        const activeMapping = await AccountMapping.getActiveMapping();
        partyAccountId = activeMapping?.accountsReceivableAccount || null;
      }
      if (!partyAccountId) {
        return { error: 'لم يتم العثور على حساب العميل أو حساب الذمم المدينة الافتراضي' };
      }

      // Determine counter account (auto-detect if not provided)
      let counterAccountId = counterAccountIdFromClient || null;
      if (counterAccountId) {
        const counterAccount = await Account.findByPk(counterAccountIdFromClient, { transaction });
        if (!counterAccount || counterAccount.isActive === false) {
          return { error: 'حساب المقابل غير موجود أو غير نشط' };
        }
        counterAccountId = counterAccount.id;
      } else {
        const likeName = paymentMethod === 'bank_transfer'
          ? { [likeOp]: '%bank%' }
          : { [likeOp]: '%cash%' };
        const likeNameAr = paymentMethod === 'bank_transfer'
          ? { [likeOp]: '%مصرف%' }
          : { [likeOp]: '%صندوق%' };

        const autoAccount = await Account.findOne({
          where: {
            isActive: true,
            isGroup: false,
            type: 'asset',
            [Op.or]: [
              { name: likeName },
              { name: likeNameAr }
            ]
          },
          transaction
        }) || await Account.findOne({
          where: { isActive: true, isGroup: false, type: 'asset' },
          order: [['createdAt', 'ASC']],
          transaction
        });

        if (!autoAccount) {
          return { error: 'تعذر تحديد حساب المقابل تلقائيًا. الرجاء تحديد counterAccountId.' };
        }
        counterAccountId = autoAccount.id;
      }

      // Create payment as pending first
      const payment = await Payment.create({
        id: uuidv4(),
        paymentNumber,
        customerId,
        amount: parseFloat(amount),
        date,
        paymentMethod,
        description,
        reference,
        status: 'pending',
        voucherType: 'payment',
        accountId: partyAccountId, // party account to be credited
        createdBy: req.user.id
      }, { transaction });

      // Attach non-persistent counter account id for journal entry method
      payment.set('counterAccountId', counterAccountId);

      // Mark completed and create GL/Journal Entry
      await payment.update({ status: 'completed', completedBy: req.user.id, completedAt: new Date() }, { transaction });
      const journalEntry = await payment.createJournalEntry(req.user.id, { transaction });

      return { payment, journalEntry };
    });

    if (result?.error) {
      return res.status(400).json({ message: result.error });
    }

    res.status(201).json({
      message: 'تم إنشاء المدفوعة وربطها بدفتر الأستاذ بنجاح',
      payment: result.payment,
      journalEntry: result.journalEntry
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'بيانات غير صحيحة',
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ message: 'خطأ في إنشاء المدفوعة' });
  }
});

// ==================== SALES ANALYTICS ROUTES ====================

// GET /api/sales/summary - Get sales summary
router.get('/summary', 
  authenticateToken, 
  requireSalesAccess,
  cache(300, (req) => `sales:summary:${req.query.dateFrom || 'all'}:${req.query.dateTo || 'all'}`),
  async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // إصلاح مؤقت: استخدام SQL مباشر بدلاً من stored function
    const summaryQuery = `
      SELECT
        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,
        COALESCE(SUM(si.total), 0) as total_sales,
        COALESCE(COUNT(DISTINCT si.customer_id), 0) as active_customers,
        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,
        COALESCE(SUM(s."shippingCost"), 0) as shipping_revenue
      FROM sales_invoices si
      LEFT JOIN shipments s ON true
      WHERE si."isActive" = true
      ${dateFrom ? `AND si.date >= '${dateFrom}'` : ''}
      ${dateTo ? `AND si.date <= '${dateTo}'` : ''}
    `;

    const result = await db.query(summaryQuery, {
      type: db.QueryTypes.SELECT
    });

    const summaryData = result[0];

    // Calculate monthly growth separately
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];

    const growthQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN date >= $1 THEN total ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN date >= $2 AND date < $1 THEN total ELSE 0 END), 0) as prev_month
      FROM sales_invoices
      WHERE "isActive" = true AND status::text != 'cancelled'
    `;

    const growth = await db.query(growthQuery, {
      bind: [startOfThisMonth, startOfPrevMonth],
      type: db.QueryTypes.SELECT
    });

    const thisTotal = parseFloat(growth[0].this_month || 0);
    const lastTotal = parseFloat(growth[0].prev_month || 0);
    const monthlyGrowth = lastTotal === 0 ? (thisTotal > 0 ? 100 : 0) : ((thisTotal - lastTotal) / lastTotal) * 100;

    // Combine the results
    const finalResult = {
      ...summaryData,
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
      totalPayments: 0, // Will be calculated separately if needed
      lowStockItems: 0, // يتطلب تكامل المخزون الحقيقي
      totalOrders: summaryData.totalInvoices
    };

    res.json(finalResult);
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'خطأ في جلب ملخص المبيعات', error: error.message });
  }
});



// ==================== INVENTORY ROUTES ====================

// GET /api/sales/inventory - Get inventory items
router.get('/inventory', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status
    } = req.query;

    // Mock inventory data for now
    const mockItems = [
      {
        id: '1',
        code: 'ITM001',
        name: 'منتج تجريبي 1',
        category: 'إلكترونيات',
        unit: 'قطعة',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        unitCost: 25.5,
        sellingPrice: 35.0,
        location: 'مخزن أ',
        supplier: 'مورد 1',
        isActive: true,
        lastUpdated: new Date().toISOString(),
        stockValue: 1275,
        stockStatus: 'in_stock'
      },
      {
        id: '2',
        code: 'ITM002',
        name: 'منتج تجريبي 2',
        category: 'مكتبية',
        unit: 'علبة',
        currentStock: 5,
        minStock: 10,
        maxStock: 50,
        unitCost: 15.0,
        sellingPrice: 22.0,
        location: 'مخزن ب',
        supplier: 'مورد 2',
        isActive: true,
        lastUpdated: new Date().toISOString(),
        stockValue: 75,
        stockStatus: 'low_stock'
      }
    ];

    let filteredItems = mockItems;

    // Apply filters
    if (search) {
      filteredItems = filteredItems.filter(item =>
        item.name.includes(search) || item.code.includes(search)
      );
    }

    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (status) {
      filteredItems = filteredItems.filter(item => item.stockStatus === status);
    }

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    res.json({
      data: paginatedItems,
      total: filteredItems.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredItems.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'خطأ في جلب بيانات المخزون' });
  }
});

// POST /api/sales/inventory - Create inventory item
router.post('/inventory', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      code,
      name,
      nameEn,
      category,
      unit,
      currentStock,
      minStock,
      maxStock,
      unitCost,
      sellingPrice,
      location,
      supplier,
      barcode,
      description
    } = req.body;

    // TODO: Implement actual inventory creation
    const newItem = {
      id: uuidv4(),
      code,
      name,
      nameEn,
      category,
      unit,
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 0,
      maxStock: parseFloat(maxStock) || 0,
      unitCost: parseFloat(unitCost) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      location,
      supplier,
      barcode,
      description,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      stockValue: (parseFloat(currentStock) || 0) * (parseFloat(unitCost) || 0),
      stockStatus: (parseFloat(currentStock) || 0) <= (parseFloat(minStock) || 0) ? 'low_stock' : 'in_stock'
    };

    console.log('✅ تم إنشاء صنف جديد:', newItem.name);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الصنف' });
  }
});

// PUT /api/sales/inventory/:id - Update inventory item
router.put('/inventory/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // TODO: Implement actual inventory update
    const updatedItem = {
      id,
      ...updateData,
      lastUpdated: new Date().toISOString(),
      stockValue: (parseFloat(updateData.currentStock) || 0) * (parseFloat(updateData.unitCost) || 0),
      stockStatus: (parseFloat(updateData.currentStock) || 0) <= (parseFloat(updateData.minStock) || 0) ? 'low_stock' : 'in_stock'
    };

    console.log('✅ تم تحديث الصنف:', id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'خطأ في تحديث الصنف' });
  }
});

// POST /api/sales/inventory/:id/movement - Record stock movement
router.post('/inventory/:id/movement', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason, reference, notes } = req.body;

    // TODO: Implement actual stock movement recording
    const movement = {
      id: uuidv4(),
      itemId: id,
      type, // 'in', 'out', 'adjustment'
      quantity: parseFloat(quantity),
      reason,
      reference,
      notes,
      date: new Date().toISOString(),
      createdBy: req.user.id
    };

    console.log('✅ تم تسجيل حركة مخزون:', movement.id);
    res.status(201).json(movement);
  } catch (error) {
    console.error('Error recording stock movement:', error);
    res.status(500).json({ message: 'خطأ في تسجيل حركة المخزون' });
  }
});

// GET /api/sales/inventory/:id/movements - Get stock movements for item
router.get('/inventory/:id/movements', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Mock movements data
    const mockMovements = [
      {
        id: '1',
        itemId: id,
        type: 'in',
        quantity: 20,
        reason: 'شراء جديد',
        date: new Date().toISOString(),
        reference: 'PO-001',
        notes: 'وصول شحنة جديدة'
      },
      {
        id: '2',
        itemId: id,
        type: 'out',
        quantity: 5,
        reason: 'بيع',
        date: new Date().toISOString(),
        reference: 'INV-001',
        notes: 'بيع للعميل أحمد'
      }
    ];

    res.json({
      data: mockMovements,
      total: mockMovements.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(mockMovements.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'خطأ في جلب حركات المخزون' });
  }
});

// GET /api/sales/analytics - Get sales analytics
router.get('/analytics', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get sales data (SalesInvoice-based)
    const [totalSales, totalInvoices, totalPayments, activeCustomers] = await Promise.all([
      SalesInvoice.sum('total', {
        where: {
          date: { [Op.gte]: startDate },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      SalesInvoice.count({
        where: {
          date: { [Op.gte]: startDate },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      Payment.sum('amount', {
        where: { date: { [Op.gte]: startDate } }
      }),
      SalesInvoice.count({
        where: {
          date: { [Op.gte]: startDate },
          status: { [Op.ne]: 'cancelled' }
        },
        distinct: true,
        col: 'customerId'
      })
    ]);

    // Top customers from SalesInvoice aggregation
    const topCustomers = await SalesInvoice.findAll({
      attributes: [
        'customerId',
        [sequelize.fn('COUNT', sequelize.col('SalesInvoice.id')), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalPurchases']
      ],
      where: {
        date: { [Op.gte]: startDate },
        status: { [Op.ne]: 'cancelled' }
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name'] }
      ],
      group: ['customerId', 'customer.id', 'customer.code', 'customer.name'],
      order: [[sequelize.literal('totalPurchases'), 'DESC']],
      limit: 5,
      raw: true
    });

    const analytics = {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      summary: {
        totalSales: parseFloat(totalSales || 0),
        totalInvoices: parseInt(totalInvoices || 0),
        totalPayments: parseFloat(totalPayments || 0),
        activeCustomers: parseInt(activeCustomers || 0),
        averageInvoiceValue: totalInvoices > 0 ?
          parseFloat(totalSales || 0) / parseInt(totalInvoices) : 0
      },
      topCustomers: topCustomers.map(row => ({
        id: row['customer.id'],
        code: row['customer.code'],
        name: row['customer.name'],
        invoiceCount: parseInt(row.invoiceCount || 0),
        totalPurchases: parseFloat(row.totalPurchases || 0)
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'خطأ في جلب تحليلات المبيعات' });
  }
});

// ==================== SHIPMENTS ROUTES ====================

// GET /api/sales/shipments - Get shipments
router.get('/shipments', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { trackingNumber: { [likeOp]: `%${search}%` } },
        { customerName: { [likeOp]: `%${search}%` } },
        { itemDescription: { [likeOp]: `%${search}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      data: shipments,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ message: 'خطأ في جلب بيانات الشحنات' });
  }
});

// GET /api/sales/shipments/:id - Get single shipment
router.get('/shipments/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const shipment = await Shipment.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: ShipmentMovement,
          as: 'movements',
          order: [['date', 'DESC']]
        },
        {
          model: WarehouseReleaseOrder,
          as: 'releaseOrders'
        }
      ]
    });

    if (!shipment) {
      return res.status(404).json({ message: 'الشحنة غير موجودة' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ message: 'خطأ في جلب بيانات الشحنة' });
  }
});

// POST /api/sales/shipments - Create new shipment
router.post('/shipments', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      trackingNumber,
      customerId,
      customerName,
      customerPhone,
      itemDescription,
      itemDescriptionEn,
      category,
      quantity,
      weight,
      length,
      width,
      height,
      volumeOverride,
      declaredValue,
      shippingCost,
      originLocation,
      destinationLocation,
      receivedDate,
      estimatedDelivery,
      notes,
      isFragile,
      requiresSpecialHandling,
      customsDeclaration
    } = req.body;

    // Validate required fields
    if (!customerName || !itemDescription || !weight || !originLocation || !destinationLocation || !receivedDate) {
      return res.status(400).json({ message: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    // Validate customer exists if customerId provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'العميل غير موجود' });
      }
    }

    // Auto-generate tracking number if not provided
    let finalTrackingNumber = (trackingNumber || '').trim();
    if (!finalTrackingNumber) {
      const year = new Date().getFullYear();
      let attempt = 0;
      while (attempt < 5) {
        const rnd = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const candidate = `GH${year}${rnd}`;
        const exists = await Shipment.findOne({ where: { trackingNumber: candidate } });
        if (!exists) { finalTrackingNumber = candidate; break; }
        attempt++;
      }
      if (!finalTrackingNumber) {
        finalTrackingNumber = `GH${Date.now()}`;
      }
    }

    // إنشاء الشحنة باستخدام SQL مباشر لتجنب مشاكل UUID
    const shipmentId = await db.query(`SELECT gen_random_uuid() as id`, { type: db.QueryTypes.SELECT });
    const newShipmentId = shipmentId[0].id;

    const createShipmentQuery = `
      INSERT INTO shipments (
        id, "trackingNumber", "customerId", "customerName", "customerPhone",
        "itemDescription", "itemDescriptionEn", category, quantity, weight,
        length, width, height, "volumeOverride", "declaredValue", "shippingCost",
        "originLocation", "destinationLocation", status, "receivedDate",
        "estimatedDelivery", notes, "isFragile", "requiresSpecialHandling",
        "customsDeclaration", "createdBy", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, 'received_china', $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
      ) RETURNING *
    `;

    const newShipmentResult = await db.query(createShipmentQuery, {
      bind: [
        newShipmentId,
        finalTrackingNumber,
        customerId,
        customerName,
        customerPhone,
        itemDescription,
        itemDescriptionEn || null,
        category || 'other',
        parseInt(quantity) || 1,
        parseFloat(weight),
        length ? parseFloat(length) : null,
        width ? parseFloat(width) : null,
        height ? parseFloat(height) : null,
        volumeOverride ? parseFloat(volumeOverride) : null,
        parseFloat(declaredValue) || 0,
        parseFloat(shippingCost) || 0,
        originLocation,
        destinationLocation,
        receivedDate,
        estimatedDelivery || null,
        notes || null,
        Boolean(isFragile),
        Boolean(requiresSpecialHandling),
        customsDeclaration || null,
        req.user.id
      ],
      type: db.QueryTypes.INSERT
    });

    const newShipment = newShipmentResult[0][0];

    // Create initial movement record باستخدام SQL مباشر
    const movementId = await db.query(`SELECT gen_random_uuid() as id`, { type: db.QueryTypes.SELECT });
    const newMovementId = movementId[0].id;

    const createMovementQuery = `
      INSERT INTO shipment_movements (
        id, "shipmentId", "trackingNumber", type, "newStatus", location,
        notes, "handledBy", "createdBy", "isSystemGenerated", date, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, 'status_update', 'received_china', $4, $5, $6, $7, true, NOW(), NOW(), NOW()
      )
    `;

    await db.query(createMovementQuery, {
      bind: [
        newMovementId,
        newShipment.id,
        newShipment.trackingNumber,
        originLocation,
        'تم استلام الشحنة في الصين',
        'نظام الشحن',
        req.user.id
      ],
      type: db.QueryTypes.INSERT
    });
    // Record stock IN movement upon shipment creation (receiving into warehouse)
    try {
      const stockMovementId = await db.query(`SELECT gen_random_uuid() as id`, { type: db.QueryTypes.SELECT });
      const newStockMovementId = stockMovementId[0].id;

      const createStockMovementQuery = `
        INSERT INTO stock_movements (
          id, "itemCode", description, quantity, unit, direction, reason,
          "referenceType", "referenceId", "warehouseLocation", date,
          "shipmentId", "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          $1, NULL, $2, $3, 'قطعة', 'in', 'shipment', 'shipment', $4, $5, NOW(), $6, $7, NOW(), NOW()
        )
      `;

      await db.query(createStockMovementQuery, {
        bind: [
          newStockMovementId,
          newShipment.itemDescription,
          parseFloat(newShipment.quantity) || 0,
          newShipment.trackingNumber,
          originLocation,
          newShipment.id,
          req.user.id
        ],
        type: db.QueryTypes.INSERT
      });
    } catch (e) {
      console.warn('⚠️ فشل تسجيل حركة مخزون دخول للشحنة:', e.message);
    }


    res.status(201).json({
      message: 'تم إنشاء الشحنة بنجاح',
      shipment: newShipment
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الشحنة' });
  }
});

// PUT /api/sales/shipments/:id - Update shipment
router.put('/shipments/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const shipment = await Shipment.findByPk(id);
    if (!shipment) {
      return res.status(404).json({ message: 'الشحنة غير موجودة' });
    }

    // Validate customer exists if customerId provided
    if (updateData.customerId) {
      const customer = await Customer.findByPk(updateData.customerId);
      if (!customer) {
        return res.status(404).json({ message: 'العميل غير موجود' });
      }
    }

    await shipment.update(updateData);

    res.json({
      message: 'تم تحديث الشحنة بنجاح',
      shipment
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ message: 'خطأ في تحديث الشحنة' });
  }
});

// DELETE /api/sales/shipments/:id - Delete shipment
router.delete('/shipments/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const shipment = await Shipment.findByPk(id);
    if (!shipment) {
      return res.status(404).json({ message: 'الشحنة غير موجودة' });
    }

    // Check if shipment has release orders
    const releaseOrders = await WarehouseReleaseOrder.findAll({
      where: { shipmentId: id, status: { [Op.ne]: 'cancelled' } }
    });

    if (releaseOrders.length > 0) {
      return res.status(400).json({
        message: 'لا يمكن حذف الشحنة لوجود أوامر صرف مرتبطة بها'
      });
    }

    await shipment.destroy();

    res.json({ message: 'تم حذف الشحنة بنجاح' });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ message: 'خطأ في حذف الشحنة' });
  }
});

// POST /api/sales/shipments/:id/movements - Add shipment movement
router.post('/shipments/:id/movements', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, newStatus, location, notes, handledBy } = req.body;

    // Get shipment using SQL
    const shipmentQuery = `SELECT * FROM shipments WHERE id = $1`;
    const shipmentResult = await db.query(shipmentQuery, {
      bind: [id],
      type: db.QueryTypes.SELECT
    });

    if (shipmentResult.length === 0) {
      return res.status(404).json({ message: 'الشحنة غير موجودة' });
    }

    const shipment = shipmentResult[0];
    const previousStatus = shipment.status;

    // Create movement record using SQL
    const movementId = await db.query(`SELECT gen_random_uuid() as id`, { type: db.QueryTypes.SELECT });
    const newMovementId = movementId[0].id;

    const createMovementQuery = `
      INSERT INTO shipment_movements (
        id, "shipmentId", "trackingNumber", type, "previousStatus", "newStatus",
        location, notes, "handledBy", "createdBy", date, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW()
      ) RETURNING *
    `;

    const movementResult = await db.query(createMovementQuery, {
      bind: [
        newMovementId,
        id,
        shipment.trackingNumber,
        type || 'status_update',
        previousStatus,
        newStatus,
        location,
        notes,
        handledBy,
        req.user.id
      ],
      type: db.QueryTypes.INSERT
    });

    // Update shipment status using SQL
    const updateShipmentQuery = `UPDATE shipments SET status = $1, "updatedAt" = NOW() WHERE id = $2`;
    await db.query(updateShipmentQuery, {
      bind: [newStatus, id],
      type: db.QueryTypes.UPDATE
    });

    res.status(201).json({
      message: 'تم تسجيل حركة الشحنة بنجاح',
      movement: movementResult[0][0]
    });
  } catch (error) {
    console.error('Error creating shipment movement:', error);
    res.status(500).json({ message: 'خطأ في تسجيل حركة الشحنة' });
  }
});

// GET /api/sales/shipments/:id/movements - Get shipment movements
router.get('/shipments/:id/movements', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const movements = await ShipmentMovement.findAll({
      where: { shipmentId: id },
      order: [['date', 'DESC']]
    });

    res.json({ data: movements });
  } catch (error) {
    console.error('Error fetching shipment movements:', error);
    res.status(500).json({ message: 'خطأ في جلب حركات الشحنة' });
  }
});

// ==================== WAREHOUSE RELEASE ORDERS ROUTES ====================

// GET /api/sales/warehouse-release-orders - Get warehouse release orders
router.get('/warehouse-release-orders', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, paymentStatus } = req.query;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { orderNumber: { [likeOp]: `%${search}%` } },
        { trackingNumber: { [likeOp]: `%${search}%` } },
        { requestedBy: { [likeOp]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    const offset = (page - 1) * limit;

    const { count, rows: releaseOrders } = await WarehouseReleaseOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'trackingNumber', 'itemDescription']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      data: releaseOrders,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse release orders:', error);
    res.status(500).json({ message: 'خطأ في جلب أوامر الصرف من المخزن' });
  }
});

// GET /api/sales/warehouse-release-orders/:id - Get single warehouse release order
router.get('/warehouse-release-orders/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const releaseOrder = await WarehouseReleaseOrder.findByPk(id, {
      include: [
        {
          model: Shipment,
          as: 'shipment'
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    if (!releaseOrder) {
      return res.status(404).json({ message: 'أمر الصرف غير موجود' });
    }

    res.json(releaseOrder);
  } catch (error) {
    console.error('Error fetching warehouse release order:', error);
    res.status(500).json({ message: 'خطأ في جلب أمر الصرف' });
  }
});

// POST /api/sales/warehouse-release-orders - Create warehouse release order
router.post('/warehouse-release-orders', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      shipmentId: shipmentIdFromClient,
      trackingNumber,
      requestedBy,
      requestedByPhone,
      warehouseLocation,
      releaseConditions,
      documentsRequired,
      storageFeesAmount,
      handlingFeesAmount,
      paymentMethod,
      paymentReference,
      notes
    } = req.body;

    // Resolve shipment by ID or tracking number
    let shipmentId = shipmentIdFromClient;
    if (!shipmentId && trackingNumber) {
      const foundShipment = await Shipment.findOne({ where: { trackingNumber } });
      if (foundShipment) shipmentId = foundShipment.id;
    }

    // Validate required fields
    if (!shipmentId || !requestedBy) {
      return res.status(400).json({ message: 'معرف الشحنة أو رقم التتبع واسم طالب الصرف مطلوبة' });
    }

    // Validate shipment exists
    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'الشحنة غير موجودة' });
    }

    // Check if shipment already has an active release order
    const existingOrder = await WarehouseReleaseOrder.findOne({
      where: {
        shipmentId: shipment.id,
        status: { [Op.notIn]: ['cancelled', 'released'] }
      }
    });

    if (existingOrder) {
      return res.status(400).json({
        message: 'يوجد أمر صرف نشط لهذه الشحنة بالفعل'
      });
    }

    // Generate order number
    const lastOrder = await WarehouseReleaseOrder.findOne({
      order: [['orderNumber', 'DESC']]
    });

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const match = lastOrder.orderNumber.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const year = new Date().getFullYear();
    const orderNumber = `WRO-${year}-${String(nextNumber).padStart(3, '0')}`;

    const newReleaseOrder = await WarehouseReleaseOrder.create({
      orderNumber,
      shipmentId: shipment.id,
      customerId: shipment.customerId,
      trackingNumber: shipment.trackingNumber,
      requestedBy,
      requestedByPhone,
      authorizedBy: req.user.id,
      warehouseLocation: warehouseLocation || 'المخزن الرئيسي - طرابلس',
      itemDescription: shipment.itemDescription,
      quantity: shipment.quantity,
      weight: shipment.weight,
      volume: shipment.volume,
      releaseConditions,
      documentsRequired,
      storageFeesAmount: parseFloat(storageFeesAmount) || 0,
      handlingFeesAmount: parseFloat(handlingFeesAmount) || 0,
      totalFeesAmount: parseFloat(storageFeesAmount || 0) + parseFloat(handlingFeesAmount || 0),
      notes,
      createdBy: req.user.id
    });


    // Auto-create receipt vouchers for storage/handling fees if applicable
    const _storageAmt = parseFloat(storageFeesAmount) || 0;
    const _handlingAmt = parseFloat(handlingFeesAmount) || 0;
    const createdPayments = [];
    if ((_storageAmt + _handlingAmt) > 0 && paymentMethod) {
      try {
        const likeName = paymentMethod === 'bank_transfer' ? { [likeOp]: '%bank%' } : { [likeOp]: '%cash%' };
        const likeNameAr = paymentMethod === 'bank_transfer' ? { [likeOp]: '%مصرف%' } : { [likeOp]: '%صندوق%' };
        const counterAccount = await Account.findOne({
          where: {
            isActive: true,
            isGroup: false,
            type: 'asset',
            [Op.or]: [{ name: likeName }, { name: likeNameAr }]
          }
        });

        if (counterAccount) {
          const nextPaymentNumber = async (t) => {
            const lastPayment = await Payment.findOne({ order: [['createdAt', 'DESC']], transaction: t });
            const next = lastPayment ? parseInt(String(lastPayment.paymentNumber).replace('PAY', '')) + 1 : 1;
            return `PAY${String(next).padStart(6, '0')}`;
          };

          await sequelize.transaction(async (t) => {
            const now = new Date();
            const mapping = await AccountMapping.getActiveMapping();

            const createReceipt = async (amount, arLike, enLike, memo, mappedId) => {
              if (!amount || amount <= 0) return null;
              let revenueAccountId = mappedId || null;
              if (!revenueAccountId) {
                const accAr = await Account.findOne({ where: { name: arLike, type: 'revenue' }, transaction: t });
                const accEn = revenueAccountId ? null : await Account.findOne({ where: { nameEn: enLike, type: 'revenue' }, transaction: t });
                revenueAccountId = (accAr || accEn)?.id || null;
              }
              if (!revenueAccountId) return null;

              const paymentNumber = await nextPaymentNumber(t);
              const payment = await Payment.create({
                id: uuidv4(),
                paymentNumber,
                customerId: shipment.customerId || null,
                amount,
                date: now,
                paymentMethod,
                reference: paymentReference,
                notes: memo,
                status: 'pending',
                voucherType: 'receipt',
                accountId: revenueAccountId,
                partyType: shipment.customerId ? 'customer' : null,
                partyId: shipment.customerId || null,
                createdBy: req.user.id
              }, { transaction: t });
              payment.set('counterAccountId', counterAccount.id);
              await payment.update({ status: 'completed', completedBy: req.user.id, completedAt: now }, { transaction: t });
              await payment.createJournalEntry(req.user.id, { transaction: t });
              return payment;
            };

            const storagePayment = await createReceipt(
              _storageAmt,
              { [likeOp]: '%التخزين%' },
              { [likeOp]: '%Storage%' },
              `Storage fee for release ${newReleaseOrder.orderNumber || newReleaseOrder.id}`,
              mapping?.storageAccount || null
            );
            const handlingPayment = await createReceipt(
              _handlingAmt,
              { [likeOp]: '%المناولة%' },
              { [likeOp]: '%Handling%' },
              `Handling fee for release ${newReleaseOrder.orderNumber || newReleaseOrder.id}`,
              mapping?.handlingFeeAccount || null
            );

            if (storagePayment) createdPayments.push({ id: storagePayment.id, paymentNumber: storagePayment.paymentNumber, amount: storagePayment.amount });
            if (handlingPayment) createdPayments.push({ id: handlingPayment.id, paymentNumber: handlingPayment.paymentNumber, amount: handlingPayment.amount });
          });
        }
      } catch (e) {
        console.warn('Failed to auto-create receipt vouchers for release fees:', e?.message || e);
      }
    }

    res.status(201).json({
      message: 'تم إنشاء أمر الصرف بنجاح',
      releaseOrder: newReleaseOrder,
      payments: createdPayments
    });
  } catch (error) {
    console.error('Error creating warehouse release order:', error);
    res.status(500).json({ message: 'خطأ في إنشاء أمر الصرف' });
  }
});

// PUT /api/sales/warehouse-release-orders/:id - Update warehouse release order
router.put('/warehouse-release-orders/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const releaseOrder = await WarehouseReleaseOrder.findByPk(id);
    if (!releaseOrder) {
      return res.status(404).json({ message: 'أمر الصرف غير موجود' });
    }

    // Don't allow updates to released orders
    if (releaseOrder.status === 'released') {
      return res.status(400).json({ message: 'لا يمكن تعديل أمر صرف تم تنفيذه' });
    }

    await releaseOrder.update(updateData);

    res.json({
      message: 'تم تحديث أمر الصرف بنجاح',
      releaseOrder
    });
  } catch (error) {
    console.error('Error updating warehouse release order:', error);
    res.status(500).json({ message: 'خطأ في تحديث أمر الصرف' });
  }
});

// POST /api/sales/warehouse-release-orders/:id/approve - Approve release order
router.post('/warehouse-release-orders/:id/approve', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const releaseOrder = await WarehouseReleaseOrder.findByPk(id);
    if (!releaseOrder) {
      return res.status(404).json({ message: 'أمر الصرف غير موجود' });
    }

    if (releaseOrder.status !== 'pending_approval') {
      return res.status(400).json({ message: 'أمر الصرف ليس في حالة انتظار الموافقة' });
    }

    await releaseOrder.update({
      status: 'approved',
      approvalDate: new Date()
    });

    res.json({
      message: 'تم اعتماد أمر الصرف بنجاح',
      releaseOrder
    });
  } catch (error) {
    console.error('Error approving warehouse release order:', error);
    // Handle invalid UUIDs gracefully
    if (error?.parent?.code === '22P02') {
      return res.status(400).json({ message: 'معرف أمر الصرف غير صالح' });
    }
    res.status(500).json({ message: 'خطأ في اعتماد أمر الصرف' });
  }
});

// POST /api/sales/warehouse-release-orders/:id/release - Execute release
router.post('/warehouse-release-orders/:id/release', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { releasedToName, releasedToPhone, releasedToIdNumber, notes } = req.body;

    const releaseOrder = await WarehouseReleaseOrder.findByPk(id, {
      include: [{ model: Shipment, as: 'shipment' }]
    });

    if (!releaseOrder) {
      return res.status(404).json({ message: 'أمر الصرف غير موجود' });
    }

    if (!releaseOrder.canBeReleased()) {
      return res.status(400).json({
        message: 'أمر الصرف غير معتمد أو لم يتم دفع الرسوم المطلوبة'
      });
    }

    if (!releasedToName) {
      return res.status(400).json({ message: 'اسم مستلم البضاعة مطلوب' });
    }

    // Check available stock for this shipment before release
    try {
      const inQty = (await StockMovement.sum('quantity', { where: { shipmentId: releaseOrder.shipmentId, direction: 'in' } })) || 0;
      const outQty = (await StockMovement.sum('quantity', { where: { shipmentId: releaseOrder.shipmentId, direction: 'out' } })) || 0;
      const available = parseFloat(inQty) - parseFloat(outQty);
      const required = parseFloat(releaseOrder.quantity) || 0;
      if (available < required) {
        return res.status(400).json({ message: 'الرصيد غير كافٍ لإتمام الصرف من المخزن', available, required });
      }
    } catch (e) {
      console.warn('⚠️ تعذر احتساب رصيد المخزون قبل الصرف:', e.message);
    }

    // Update release order
    await releaseOrder.update({
      status: 'released',
      releaseExecutedDate: new Date(),
      releasedToName,
      releasedToPhone,
      releasedToIdNumber,
      releasedBy: req.user.id,
      notes: notes || releaseOrder.notes
    });

    // Create shipment movement
    await ShipmentMovement.create({
      shipmentId: releaseOrder.shipmentId,
      trackingNumber: releaseOrder.trackingNumber,
      type: 'warehouse_release',
      previousStatus: releaseOrder.shipment.status,
      newStatus: 'out_for_delivery',
      location: releaseOrder.warehouseLocation,
      notes: `تم صرف البضاعة من المخزن - أمر رقم: ${releaseOrder.orderNumber}`,
      handledBy: releasedToName,
      warehouseReleaseOrderId: releaseOrder.id,
      createdBy: req.user.id,
      isSystemGenerated: true
    });

    // Update shipment status
    await releaseOrder.shipment.update({ status: 'out_for_delivery' });

    // Record stock movement (out) for warehouse release
    try {
      await StockMovement.create({
        itemCode: null, // Unknown here; can be provided if shipment items have codes
        description: releaseOrder.itemDescription,
        quantity: parseFloat(releaseOrder.quantity) || 0,
        unit: 'قطعة',
        direction: 'out',
        reason: 'warehouse_release',
        referenceType: 'warehouse_release',
        referenceId: releaseOrder.orderNumber,
        warehouseLocation: releaseOrder.warehouseLocation,
        date: new Date(),
        shipmentId: releaseOrder.shipmentId,
        warehouseReleaseOrderId: releaseOrder.id,
        createdBy: req.user.id
      });
    } catch (e) {
      console.warn('⚠️ فشل تسجيل حركة المخزون لأمر الصرف:', e.message);
    }

    res.json({
      message: 'تم تنفيذ أمر الصرف بنجاح',
      releaseOrder
    });
  } catch (error) {
    console.error('Error executing warehouse release:', error);
    res.status(500).json({ message: 'خطأ في تنفيذ أمر الصرف' });
  }
});

// DELETE /api/sales/warehouse-release-orders/:id - Cancel release order
router.delete('/warehouse-release-orders/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const releaseOrder = await WarehouseReleaseOrder.findByPk(id);
    if (!releaseOrder) {
      return res.status(404).json({ message: 'أمر الصرف غير موجود' });
    }

    if (releaseOrder.status === 'released') {
      return res.status(400).json({ message: 'لا يمكن إلغاء أمر صرف تم تنفيذه' });
    }

    await releaseOrder.update({ status: 'cancelled' });

    res.json({ message: 'تم إلغاء أمر الصرف بنجاح' });
  } catch (error) {
    console.error('Error cancelling warehouse release order:', error);
    if (error?.parent?.code === '22P02') {
      return res.status(400).json({ message: 'معرف أمر الصرف غير صالح' });
    }
    res.status(500).json({ message: 'خطأ في إلغاء أمر الصرف' });
  }
});

// ==================== SHIPPING INVOICES ENDPOINTS ====================

// GET /api/sales/shipping-invoices - Get shipping invoices with filtering
router.get('/shipping-invoices', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      customerId,
      dateFrom,
      dateTo
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { invoiceNumber: { [likeOp]: `%${search}%` } },
        { trackingNumber: { [likeOp]: `%${search}%` } },
        { itemDescription: { [likeOp]: `%${search}%` } }
      ];
    }

    // Status filters
    if (status) {
      whereClause.status = status;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    // Customer filter
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[Op.lte] = dateTo;
      }
    }

    const { count, rows: invoices } = await ShippingInvoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'phone', 'email']
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'trackingNumber', 'status', 'itemDescription'],
          required: false
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      data: invoices,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shipping invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب فواتير الشحن' });
  }
});

// GET /api/sales/shipping-invoices/:id - Get shipping invoice by ID
router.get('/shipping-invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await ShippingInvoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'phone', 'email', 'address']
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'trackingNumber', 'status', 'itemDescription', 'weight', 'volume'],
          required: false
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة الشحن غير موجودة' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching shipping invoice:', error);
    res.status(500).json({ message: 'خطأ في جلب فاتورة الشحن' });
  }
});

// POST /api/sales/shipping-invoices - Create new shipping invoice
router.post('/shipping-invoices', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      customerId,
      shipmentId,
      trackingNumber,
      date,
      dueDate,
      shippingCost,
      handlingFee,
      storageFee,
      customsClearanceFee,
      insuranceFee,
      additionalFees,
      discountAmount,
      taxAmount,
      currency,
      exchangeRate,
      paymentMethod,
      paymentReference,
      itemDescription,
      itemDescriptionEn,
      quantity,
      weight,
      volume,
      originLocation,
      destinationLocation,
      notes,
      terms
    } = req.body;

    // Validate required fields
    if (!customerId || !date || !dueDate) {
      return res.status(400).json({ message: 'العميل وتاريخ الفاتورة وتاريخ الاستحقاق مطلوبة' });
    }

    // Validate itemDescription is required
    if (!itemDescription || itemDescription.trim() === '') {
      return res.status(400).json({ message: 'وصف البضاعة مطلوب' });
    }

    // Validate origin and destination locations
    if (!originLocation || !destinationLocation) {
      return res.status(400).json({ message: 'موقع المنشأ والوجهة مطلوبان' });
    }

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    // Validate shipment if provided
    if (shipmentId) {
      const shipment = await Shipment.findByPk(shipmentId);
      if (!shipment) {
        return res.status(404).json({ message: 'الشحنة غير موجودة' });
      }
    }

    const transaction = await sequelize.transaction();

    try {
      // حساب المبالغ بشكل صحيح
      const shippingCostVal = parseFloat(shippingCost) || 0;
      const handlingFeeVal = parseFloat(handlingFee) || 0;
      const storageFeeVal = parseFloat(storageFee) || 0;
      const customsClearanceFeeVal = parseFloat(customsClearanceFee) || 0;
      const insuranceFeeVal = parseFloat(insuranceFee) || 0;
      const additionalFeesVal = parseFloat(additionalFees) || 0;
      const discountAmountVal = parseFloat(discountAmount) || 0;
      const taxAmountVal = parseFloat(taxAmount) || 0;

      // حساب المجموع الفرعي
      const subtotal = shippingCostVal + handlingFeeVal + storageFeeVal + 
                      customsClearanceFeeVal + insuranceFeeVal + additionalFeesVal;

      // حساب المجموع الإجمالي
      const total = subtotal - discountAmountVal + taxAmountVal;

      // التحقق من صحة المبالغ
      if (subtotal <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'المبلغ الإجمالي يجب أن يكون أكبر من صفر' });
      }

      if (discountAmountVal < 0 || taxAmountVal < 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'الخصم والضريبة لا يمكن أن تكون سالبة' });
      }

      const newInvoice = await ShippingInvoice.create({
        customerId,
        shipmentId,
        trackingNumber,
        date,
        dueDate,
        shippingCost: shippingCostVal,
        handlingFee: handlingFeeVal,
        storageFee: storageFeeVal,
        customsClearanceFee: customsClearanceFeeVal,
        insuranceFee: insuranceFeeVal,
        additionalFees: additionalFeesVal,
        discountAmount: discountAmountVal,
        taxAmount: taxAmountVal,
        subtotal: subtotal,
        total: total,
        currency: currency || 'LYD',
        exchangeRate: parseFloat(exchangeRate) || 1.0,
        paymentMethod,
        paymentReference,
        itemDescription,
        itemDescriptionEn,
        quantity: parseInt(quantity) || 1,
        weight: parseFloat(weight) || null,
        volume: parseFloat(volume) || null,
        originLocation,
        destinationLocation,
        notes,
        terms,
        createdBy: req.user.id
      }, { transaction });

      // Create automatic journal entry for shipping invoice
      await newInvoice.createJournalEntryAndAffectBalance(req.user.id, { transaction });
      console.log('✅ تم إنشاء القيد المحاسبي تلقائياً لفاتورة الشحن');

      await transaction.commit();

      // Fetch the created invoice with customer details
      const invoiceWithDetails = await ShippingInvoice.findByPk(newInvoice.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'code', 'name', 'phone', 'email']
          }
        ]
      });

      res.status(201).json(invoiceWithDetails);
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating shipping invoice:', error);
      res.status(500).json({ message: 'خطأ في إنشاء فاتورة الشحن', error: error.message });
    }
  } catch (error) {
    console.error('Error creating shipping invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء فاتورة الشحن', error: error.message });
  }
});

// PUT /api/sales/shipping-invoices/:id - Update shipping invoice
router.put('/shipping-invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await ShippingInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة الشحن غير موجودة' });
    }

    // Don't allow updating paid invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'لا يمكن تعديل فاتورة مدفوعة' });
    }

    // Validate customer if being updated
    if (updateData.customerId && updateData.customerId !== invoice.customerId) {
      const customer = await Customer.findByPk(updateData.customerId);
      if (!customer) {
        return res.status(404).json({ message: 'العميل غير موجود' });
      }
    }

    await invoice.update(updateData);

    // Fetch updated invoice with details
    const updatedInvoice = await ShippingInvoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'phone', 'email']
        }
      ]
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating shipping invoice:', error);
    res.status(500).json({ message: 'خطأ في تحديث فاتورة الشحن' });
  }
});

// DELETE /api/sales/shipping-invoices/:id - Delete shipping invoice
router.delete('/shipping-invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await ShippingInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة الشحن غير موجودة' });
    }

    // Don't allow deleting paid invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'لا يمكن حذف فاتورة مدفوعة' });
    }

    await invoice.destroy();
    res.json({ message: 'تم حذف فاتورة الشحن بنجاح' });
  } catch (error) {
    console.error('Error deleting shipping invoice:', error);
    res.status(500).json({ message: 'خطأ في حذف فاتورة الشحن' });
  }
});

// POST /api/sales/shipping-invoices/:id/payment - Record payment for shipping invoice
router.post('/shipping-invoices/:id/payment', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentReference } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'مبلغ الدفع مطلوب ويجب أن يكون أكبر من صفر' });
    }

    const invoice = await ShippingInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة الشحن غير موجودة' });
    }

    const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);

    await invoice.update({
      paidAmount: newPaidAmount,
      paymentMethod: paymentMethod || invoice.paymentMethod,
      paymentReference: paymentReference || invoice.paymentReference
    });

    res.json({
      message: 'تم تسجيل الدفع بنجاح',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        paidAmount: newPaidAmount,
        balance: parseFloat(invoice.total) - newPaidAmount,
        paymentStatus: invoice.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'خطأ في تسجيل الدفع' });
  }
});

// ==================== SALES INVOICES ENDPOINTS ====================

// GET /api/sales/sales-invoices - Get sales invoices with filtering
router.get('/sales-invoices', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      customerId,
      salesPerson,
      dateFrom,
      dateTo
    } = req.query;

    // Use the database function for sales invoices
    const invoicesQuery = `
      SELECT get_sales_invoices_final($1, $2, $3, $4, $5) as result
    `;

    const result = await db.query(invoicesQuery, {
      bind: [
        parseInt(page),
        parseInt(limit),
        search || null,
        status || null,
        customerId || null
      ],
      type: db.QueryTypes.SELECT
    });

    const invoicesData = result[0].result;

    // Apply additional filters if needed (salesPerson, paymentStatus, dateFrom, dateTo)
    // These can be added to the function later if needed
    let filteredData = invoicesData.data || [];

    if (salesPerson) {
      filteredData = filteredData.filter(invoice =>
        invoice.salesPerson && invoice.salesPerson.toLowerCase().includes(salesPerson.toLowerCase())
      );
    }

    if (paymentStatus) {
      filteredData = filteredData.filter(invoice =>
        invoice.paymentStatus === paymentStatus
      );
    }

    if (dateFrom || dateTo) {
      filteredData = filteredData.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        if (dateFrom && dateTo) {
          return invoiceDate >= new Date(dateFrom) && invoiceDate <= new Date(dateTo);
        } else if (dateFrom) {
          return invoiceDate >= new Date(dateFrom);
        } else if (dateTo) {
          return invoiceDate <= new Date(dateTo);
        }
        return true;
      });
    }

    // Update pagination if filters were applied
    const finalResult = {
      data: filteredData,
      pagination: {
        ...invoicesData.pagination,
        total: filteredData.length
      }
    };

    res.json(finalResult);
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب فواتير المبيعات', error: error.message });
  }
});

// GET /api/sales/sales-invoices/:id - Get sales invoice by ID
router.get('/sales-invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'phone', 'email', 'address']
        },
        {
          model: SalesInvoiceItem,
          as: 'items'
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة المبيعات غير موجودة' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching sales invoice:', error);
    res.status(500).json({ message: 'خطأ في جلب فاتورة المبيعات' });
  }
});

// POST /api/sales/sales-invoices - Create new sales invoice
router.post('/sales-invoices', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      customerId,
      date,
      dueDate,
      discountPercent,
      taxPercent,
      currency,
      exchangeRate,
      paymentTerms,
      salesPerson,
      salesChannel,
      deliveryMethod,
      deliveryAddress,
      deliveryDate,
      deliveryFee,
      notes,
      terms,
      items
    } = req.body;

    // Validate required fields
    if (!customerId || !date || !dueDate || !items || items.length === 0) {
      return res.status(400).json({ message: 'العميل وتاريخ الفاتورة وتاريخ الاستحقاق والعناصر مطلوبة' });
    }

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    // Calculate subtotal from items with validation
    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || 0);
      const unitPrice = parseFloat(item.unitPrice || 0);
      
      // التحقق من صحة البيانات
      if (quantity < 0) {
        throw new Error(`الكمية للعنصر ${item.description || 'غير محدد'} لا يمكن أن تكون سالبة`);
      }
      if (unitPrice < 0) {
        throw new Error(`سعر الوحدة للعنصر ${item.description || 'غير محدد'} لا يمكن أن يكون سالباً`);
      }
      
      const itemTotal = quantity * unitPrice;
      return sum + itemTotal;
    }, 0);

    // حساب الخصم والضريبة
    const discountPercentVal = parseFloat(discountPercent || 0);
    const taxPercentVal = parseFloat(taxPercent || 0);
    
    if (discountPercentVal < 0 || discountPercentVal > 100) {
      return res.status(400).json({ message: 'نسبة الخصم يجب أن تكون بين 0 و 100' });
    }
    
    if (taxPercentVal < 0 || taxPercentVal > 100) {
      return res.status(400).json({ message: 'نسبة الضريبة يجب أن تكون بين 0 و 100' });
    }

    const discountAmount = (subtotal * discountPercentVal) / 100;
    const taxAmount = ((subtotal - discountAmount) * taxPercentVal) / 100;
    const total = subtotal - discountAmount + taxAmount;

    // التحقق من صحة المبلغ الإجمالي
    if (subtotal <= 0) {
      return res.status(400).json({ message: 'المبلغ الإجمالي يجب أن يكون أكبر من صفر' });
    }

    // توليد رقم الفاتورة تلقائياً
    const documentNoResult = await sequelize.query(
      "SELECT generate_document_number('sales_invoice') as document_no",
      { type: sequelize.QueryTypes.SELECT }
    );
    const documentNo = documentNoResult[0].document_no;

    const transaction = await sequelize.transaction();

    try {
      // Create the invoice
      const newInvoice = await SalesInvoice.create({
        customerId,
        date,
        dueDate,
        subtotal,
        total,
        discountAmount,
        taxAmount,
        discountPercent: discountPercentVal,
        taxPercent: taxPercentVal,
        currency: currency || 'LYD',
        exchangeRate: parseFloat(exchangeRate) || 1.0,
        invoiceNumber: documentNo,
        status: 'draft',
        paymentStatus: 'unpaid',
        paymentTerms: parseInt(paymentTerms) || 30,
        salesPerson,
        salesChannel: salesChannel || 'direct',
        deliveryMethod: deliveryMethod || 'pickup',
        deliveryAddress,
        deliveryDate,
        deliveryFee: parseFloat(deliveryFee) || 0,
        notes,
        terms,
        createdBy: req.user.id
      }, { transaction });

      // Create invoice items
      await Promise.all(
        items.map(item =>
          SalesInvoiceItem.create({
            invoiceId: newInvoice.id,
            itemCode: item.itemCode,
            description: item.description,
            descriptionEn: item.descriptionEn,
            category: item.category,
            quantity: parseFloat(item.quantity),
            unit: item.unit || 'قطعة',
            unitPrice: parseFloat(item.unitPrice),
            discountPercent: parseFloat(item.discountPercent) || 0,
            taxPercent: parseFloat(item.taxPercent) || 0,
            notes: item.notes,
            weight: parseFloat(item.weight) || null,
            dimensions: item.dimensions,
            color: item.color,
            size: item.size,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            warrantyPeriod: parseInt(item.warrantyPeriod) || null,
            stockLocation: item.stockLocation,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate
          }, { transaction })
        )
      );

      // Update customer balance (increase receivable by invoice total)
      const cust = await Customer.findByPk(customerId, { transaction, lock: transaction.LOCK.UPDATE });
      if (cust) {
        const currentBal = parseFloat(cust.balance || 0);
        const invTotal = parseFloat(newInvoice.total || 0);
        await cust.update({ balance: currentBal + invTotal }, { transaction });
      }

      // Create automatic journal entry for sales invoice
      await newInvoice.createJournalEntryAndAffectBalance(req.user.id, { transaction });
      console.log('✅ تم إنشاء القيد المحاسبي تلقائياً للفاتورة');

      await transaction.commit();

      // Notify real-time updates
      await realtimeService.notifySalesUpdate('sales_invoice_created', {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        total: newInvoice.total,
        customerId: newInvoice.customerId,
        date: newInvoice.date
      });

      // Fetch the created invoice with all details
      const invoiceWithDetails = await SalesInvoice.findByPk(newInvoice.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'code', 'name', 'phone', 'email']
          },
          {
            model: SalesInvoiceItem,
            as: 'items'
          }
        ]
      });

      res.status(201).json(invoiceWithDetails);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating sales invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء فاتورة المبيعات' });
  }
});

// PUT /api/sales/sales-invoices/:id - Update sales invoice
router.put('/sales-invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { items, ...invoiceData } = req.body;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة المبيعات غير موجودة' });
    }

    // Don't allow updating paid invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'لا يمكن تعديل فاتورة مدفوعة' });
    }

    const transaction = await sequelize.transaction();

    try {
      // Update invoice
      await invoice.update(invoiceData, { transaction });

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        await SalesInvoiceItem.destroy({
          where: { invoiceId: id },
          transaction
        });

        // Create new items
        await Promise.all(
          items.map(item =>
            SalesInvoiceItem.create({
              invoiceId: id,
              ...item
            }, { transaction })
          )
        );
      }

      await transaction.commit();

      // Fetch updated invoice with details
      const updatedInvoice = await SalesInvoice.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'code', 'name', 'phone', 'email']
          },
          {
            model: SalesInvoiceItem,
            as: 'items'
          }
        ]
      });

      res.json(updatedInvoice);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating sales invoice:', error);
    res.status(500).json({ message: 'خطأ في تحديث فاتورة المبيعات' });
  }
});

// DELETE /api/sales/sales-invoices/:id - Delete sales invoice
router.delete('/sales-invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة المبيعات غير موجودة' });
    }

    // Don't allow deleting paid invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'لا يمكن حذف فاتورة مدفوعة' });
    }

    const transaction = await sequelize.transaction();

    try {
      // Delete invoice items first
      await SalesInvoiceItem.destroy({
        where: { invoiceId: id },
        transaction
      });

      // Delete invoice
      await invoice.destroy({ transaction });

      await transaction.commit();
      res.json({ message: 'تم حذف فاتورة المبيعات بنجاح' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting sales invoice:', error);
    res.status(500).json({ message: 'خطأ في حذف فاتورة المبيعات' });
  }
});

// POST /api/sales/sales-invoices/:id/payment - Record payment for sales invoice
router.post('/sales-invoices/:id/payment', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      paymentMethod = 'cash',
      paymentReference,
      notes,
      counterAccountId: counterAccountIdFromClient,
      date
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'مبلغ الدفع مطلوب ويجب أن يكون أكبر من صفر' });
    }

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'فاتورة المبيعات غير موجودة' });
    }

    // Ensure customer exists for party account resolution
    const customer = await Customer.findByPk(invoice.customerId);
    if (!customer) {
      return res.status(400).json({ message: 'العميل المرتبط بالفاتورة غير موجود' });
    }

    const result = await sequelize.transaction(async (transaction) => {
      // Generate payment number similar to /payments endpoint
      const lastPayment = await Payment.findOne({
        order: [['paymentNumber', 'DESC']],
        transaction
      });
      const nextNumber = lastPayment ?
        parseInt(String(lastPayment.paymentNumber).replace('PAY', '')) + 1 : 1;
      const paymentNumber = `PAY${String(nextNumber).padStart(6, '0')}`;

      // Determine party account (customer receivable)
      let partyAccountId = customer.accountId;
      if (!partyAccountId) {
        const activeMapping = await AccountMapping.getActiveMapping();
        partyAccountId = activeMapping?.accountsReceivableAccount || null;
      }
      if (!partyAccountId) {
        return { error: 'لم يتم العثور على حساب العميل أو حساب الذمم المدينة الافتراضي' };
      }

      // Determine counter account
      let counterAccountId = counterAccountIdFromClient || null;
      if (counterAccountId) {
        const counterAccount = await Account.findByPk(counterAccountId, { transaction });
        if (!counterAccount || counterAccount.isActive === false) {
          return { error: 'حساب المقابل غير موجود أو غير نشط' };
        }
      } else {
        // Auto-detect based on payment method (fallback to any active asset ledger)
        const likeName = paymentMethod === 'bank_transfer'
          ? { [likeOp]: '%bank%' }
          : { [likeOp]: '%cash%' };
        const likeNameAr = paymentMethod === 'bank_transfer'
          ? { [likeOp]: '%مصرف%' }
          : { [likeOp]: '%صندوق%' };

        const autoAccount = await Account.findOne({
          where: {
            isActive: true,
            isGroup: false,
            type: 'asset',
            [Op.or]: [
              { name: likeName },
              { name: likeNameAr }
            ]
          },
          transaction
        }) || await Account.findOne({
          where: { isActive: true, isGroup: false, type: 'asset' },
          order: [['createdAt', 'ASC']],
          transaction
        });

        if (!autoAccount) {
          return { error: 'تعذر تحديد حساب المقابل تلقائيًا. الرجاء تحديد counterAccountId.' };
        }
        counterAccountId = autoAccount.id;
      }

      // Create payment (receipt voucher: debit cash/bank, credit receivable)
      const payment = await Payment.create({
        id: uuidv4(),
        paymentNumber,
        customerId: customer.id,
        amount: parseFloat(amount),
        date: date || new Date(),
        paymentMethod,
        reference: paymentReference,
        notes,
        status: 'pending',
        voucherType: 'receipt',
        accountId: partyAccountId, // receivable account to be credited
        partyType: 'customer',
        partyId: customer.id,
        createdBy: req.user.id
      }, { transaction });

      // Attach non-persistent counter account id for journal entry method
      payment.set('counterAccountId', counterAccountId);

      // Mark completed and create GL/Journal Entry
      await payment.update({ status: 'completed', completedBy: req.user.id, completedAt: new Date() }, { transaction });
      const journalEntry = await payment.createJournalEntry(req.user.id, { transaction });

      // Link payment to this sales invoice (allocation record)

	      // Decrease customer balance by payment amount (receivable reduced)
	      const custForPay = await Customer.findByPk(invoice.customerId, { transaction, lock: transaction.LOCK.UPDATE });
	      if (custForPay) {
	        const currentBal = parseFloat(custForPay.balance || 0);
	        await custForPay.update({ balance: currentBal - parseFloat(amount) }, { transaction });
	      }

      await SalesInvoicePayment.create({
        invoiceId: invoice.id,
        paymentId: payment.id,
        allocatedAmount: parseFloat(amount),
        allocationDate: date || new Date(),
        currency: invoice.currency || 'LYD',
        exchangeRate: invoice.exchangeRate || 1.0,
        notes,
        createdBy: req.user.id
      }, { transaction });

      // Update invoice payment fields
      const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);
      let paymentStatus = 'partial';
      if (newPaidAmount >= invoice.total) {
        paymentStatus = newPaidAmount > invoice.total ? 'overpaid' : 'paid';
      } else if (newPaidAmount === 0) {
        paymentStatus = 'unpaid';
      }

      await invoice.update({
        paidAmount: newPaidAmount,
        paymentStatus,
        paymentMethod: paymentMethod || invoice.paymentMethod,
        paymentReference: paymentReference || invoice.paymentReference,
        status: paymentStatus === 'paid' ? 'paid' : invoice.status
      }, { transaction });

      return { payment, journalEntry };
    });

    if (result?.error) {
      return res.status(400).json({ message: result.error });
    }

    // Fetch updated invoice with details
    const updatedInvoice = await SalesInvoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name', 'phone', 'email']
        },
        {
          model: SalesInvoiceItem,
          as: 'items'
        }
      ]
    });


    res.json({
      message: 'تم تسجيل الدفع وإنشاء القيد المحاسبي بنجاح',
      invoice: updatedInvoice,
      payment: result.payment
    });

  } catch (error) {
    console.error('Error recording payment for sales invoice:', error);
    res.status(500).json({ message: 'خطأ في تسجيل الدفع' });
  }
});

// ==================== SALES REPORTS ROUTES ====================

// GET /api/sales/reports - Sales reports (summary | detailed | customer | product)
router.get('/reports', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      customerId,
      productCategory,
      reportType = 'summary',
      page = 1,
      limit = 50
    } = req.query;

    // Use the database function for reports
    const reportsQuery = `
      SELECT get_sales_reports($1, $2, $3) as report
    `;

    const result = await db.query(reportsQuery, {
      bind: [
        reportType,
        dateFrom || null,
        dateTo || null
      ],
      type: db.QueryTypes.SELECT
    });

    const reportData = result[0].report;

    if (reportType === 'summary') {
      return res.json({
        reportType,
        summary: reportData
      });
    }

    if (reportType === 'customer') {
      return res.json({
        reportType,
        data: reportData.customers || []
      });
    }

    if (reportType === 'detailed') {
      // For detailed reports, use the sales invoices function
      const detailedQuery = `
        SELECT get_sales_invoices_final($1, $2, NULL, NULL, $3) as result
      `;

      const detailedResult = await db.query(detailedQuery, {
        bind: [
          parseInt(page),
          parseInt(limit),
          customerId || null
        ],
        type: db.QueryTypes.SELECT
      });

      const detailedData = detailedResult[0].result;

      // Apply date filters if needed
      let filteredData = detailedData.data || [];

      if (dateFrom || dateTo) {
        filteredData = filteredData.filter(invoice => {
          const invoiceDate = new Date(invoice.invoiceDate);
          if (dateFrom && dateTo) {
            return invoiceDate >= new Date(dateFrom) && invoiceDate <= new Date(dateTo);
          } else if (dateFrom) {
            return invoiceDate >= new Date(dateFrom);
          } else if (dateTo) {
            return invoiceDate <= new Date(dateTo);
          }
          return true;
        });
      }

      return res.json({
        reportType,
        data: filteredData,
        pagination: {
          ...detailedData.pagination,
          total: filteredData.length
        }
      });
    }

    if (reportType === 'product') {
      // Product reports would need additional implementation
      // For now, return a placeholder
      return res.json({
        reportType,
        data: [],
        message: 'تقرير المنتجات قيد التطوير'
      });
    }

    return res.status(400).json({ message: 'نوع التقرير غير مدعوم' });
  } catch (error) {
    console.error('Error generating sales reports:', error);
    res.status(500).json({ message: 'خطأ في إنشاء تقرير المبيعات', error: error.message });
  }
});

// ==================== SALES RETURNS ENDPOINTS ====================

// GET /api/sales/returns - list sales returns
router.get('/returns', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, customerId, dateFrom, dateTo } = req.query;
    const where = {};

    if (search) {
      where.returnNumber = { [Op.iLike]: `%${search}%` };
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = dateFrom;
      if (dateTo) where.date[Op.lte] = dateTo;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await SalesReturn.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name'] },
        { model: Invoice, as: 'originalInvoice', attributes: ['id', 'invoiceNumber', 'date', 'total'] }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching sales returns:', error);
    res.status(500).json({ message: 'خطأ في جلب فواتير المسترجع' });
  }
});

// GET /api/sales/returns/:id - get one
router.get('/returns/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const sr = await SalesReturn.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name', 'phone', 'email', 'address'] },
        { model: Invoice, as: 'originalInvoice', attributes: ['id', 'invoiceNumber', 'date', 'total'] }
      ]
    });
    if (!sr) return res.status(404).json({ message: 'فاتورة المسترجع غير موجودة' });
    res.json(sr);
  } catch (error) {
    console.error('Error fetching sales return:', error);
    res.status(500).json({ message: 'خطأ في جلب فاتورة المسترجع' });
  }
});

// POST /api/sales/returns - create & post a sales return (credit note)
router.post('/returns', authenticateToken, requireSalesAccess, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      customerId,
      originalInvoiceId,
      date,
      reason,
      subtotal = 0,
      taxAmount = 0,
      total // optional; if omitted will be computed
    } = req.body;

    if (!customerId || !date) {
      await t.rollback();
      return res.status(400).json({ message: 'العميل والتاريخ مطلوبة' });
    }

    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    if (originalInvoiceId) {
      const inv = await Invoice.findByPk(originalInvoiceId, { transaction: t });
      if (!inv) {
        await t.rollback();
        return res.status(404).json({ message: 'الفاتورة الأصلية غير موجودة' });
      }
    }

    const sr = await SalesReturn.create({
      customerId,
      originalInvoiceId: originalInvoiceId || null,
      date,
      reason,
      subtotal: parseFloat(subtotal) || 0,
      taxAmount: parseFloat(taxAmount) || 0,
      total: total != null ? parseFloat(total) : (parseFloat(subtotal || 0) + parseFloat(taxAmount || 0)),
      status: 'posted',
      createdBy: req.user.id,
      notes: req.body.notes
    }, { transaction: t });

    // Create JE + update customer balance
    await sr.createJournalEntryAndAffectBalance(req.user.id, { transaction: t });

    await t.commit();

    const srFull = await SalesReturn.findByPk(sr.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name'] },
        { model: Invoice, as: 'originalInvoice', attributes: ['id', 'invoiceNumber', 'date', 'total'] }
      ]
    });

    res.status(201).json({
      message: 'تم إنشاء فاتورة المسترجع بنجاح',
      salesReturn: srFull
    });
  } catch (error) {
    console.error('Error creating sales return:', error);
    try { await t.rollback(); } catch {}
    res.status(500).json({ message: 'خطأ في إنشاء فاتورة المسترجع' });
  }
});

// POST /api/sales/returns/:id/cancel - cancel posted return (simple reversal)
router.post('/returns/:id/cancel', authenticateToken, requireSalesAccess, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const sr = await SalesReturn.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!sr) { await t.rollback(); return res.status(404).json({ message: 'فاتورة المسترجع غير موجودة' }); }
    if (sr.status !== 'posted') { await t.rollback(); return res.status(400).json({ message: 'يمكن إلغاء المسترجع في حالة مرحّل فقط' }); }

    // Reverse effect: increase customer balance back and post reversing JE
    const { JournalEntry, JournalEntryDetail, GLEntry, Customer } = models;
    const mapping = await models.AccountMapping.getActiveMapping();
    if (!mapping) { await t.rollback(); return res.status(400).json({ message: 'تهيئة الحسابات غير متوفرة' }); }

    const receivable = mapping.accountsReceivableAccount;
    const salesReturns = mapping.discountAccount || mapping.salesRevenueAccount;
    const taxAcc = mapping.salesTaxAccount;

    const total = parseFloat(sr.total || 0);
    const subtotal = parseFloat(sr.subtotal || 0);
    const tax = parseFloat(sr.taxAmount || 0);

    const lastEntry = await JournalEntry.findOne({ order: [['createdAt', 'DESC']] });
    const nextNumber = lastEntry ? (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
    const entryNumber = `SRN-RV-${String(nextNumber).padStart(6, '0')}`;

    const je = await JournalEntry.create({
      entryNumber,
      date: sr.date,
      description: `Cancel sales return ${sr.returnNumber}`,
      totalDebit: total,
      totalCredit: total,
      status: 'posted',
      type: 'sales_return_reversal',
      createdBy: req.user.id
    }, { transaction: t });

    const details = [];
    // Debit AR (undo earlier credit)
    details.push({ journalEntryId: je.id, accountId: receivable, debit: total, credit: 0, description: `Reversal AR - ${sr.returnNumber}` });
    // Credit Sales Returns (undo earlier debit)
    if (subtotal > 0 && salesReturns) details.push({ journalEntryId: je.id, accountId: salesReturns, debit: 0, credit: subtotal, description: `Reversal sales return - ${sr.returnNumber}` });
    // Credit Tax (undo earlier tax debit)
    if (tax > 0 && taxAcc) details.push({ journalEntryId: je.id, accountId: taxAcc, debit: 0, credit: tax, description: `Reversal sales return tax - ${sr.returnNumber}` });

    await JournalEntryDetail.bulkCreate(details, { transaction: t });
    await GLEntry.bulkCreate(details.map(d => ({
      postingDate: sr.date,
      accountId: d.accountId,
      debit: d.debit,
      credit: d.credit,
      voucherType: 'Sales Return Reversal',
      voucherNo: sr.returnNumber,
      journalEntryId: je.id,
      remarks: d.description,
      currency: 'LYD',
      exchangeRate: 1.0,
      createdBy: req.user.id
    })), { transaction: t });

    const customer = await Customer.findByPk(sr.customerId, { transaction: t, lock: t.LOCK.UPDATE });
    if (customer) {
      const newBalance = parseFloat(customer.balance || 0) + total;
      await customer.update({ balance: newBalance }, { transaction: t });
    }

    await sr.update({ status: 'cancelled' }, { transaction: t });

    await t.commit();
    res.json({ message: 'تم إلغاء فاتورة المسترجع بنجاح' });
  } catch (error) {
    console.error('Error cancelling sales return:', error);
    try { await t.rollback(); } catch {}
    res.status(500).json({ message: 'خطأ في إلغاء فاتورة المسترجع' });
  }
});

// ==================== STOCK (INVENTORY) ENDPOINTS ====================

// GET /api/sales/stock/shipments/:id/balance - Get available stock for a shipment
router.get('/stock/shipments/:id/balance', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate shipment exists
    const shipment = await Shipment.findByPk(id);
    if (!shipment) {
      return res.status(404).json({ message: 'الشحنة غير موجودة' });
    }

    const inQty = (await StockMovement.sum('quantity', { where: { shipmentId: id, direction: 'in' } })) || 0;
    const outQty = (await StockMovement.sum('quantity', { where: { shipmentId: id, direction: 'out' } })) || 0;
    const available = parseFloat(inQty) - parseFloat(outQty);

    return res.json({
      shipmentId: id,
      trackingNumber: shipment.trackingNumber,
      receivedQty: parseFloat(inQty) || 0,
      releasedQty: parseFloat(outQty) || 0,
      available: available < 0 ? 0 : available
    });
  } catch (error) {
    console.error('Error fetching shipment stock balance:', error);
    res.status(500).json({ message: 'خطأ في جلب رصيد الشحنة' });
  }
});

// GET /api/sales/stock/shipments/:id/movements - List stock movements for shipment
router.get('/stock/shipments/:id/movements', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const movements = await StockMovement.findAll({
      where: { shipmentId: id },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ data: movements });
  } catch (error) {
    console.error('Error fetching shipment stock movements:', error);
    res.status(500).json({ message: 'خطأ في جلب حركات مخزون الشحنة' });
  }
});

export default router;
