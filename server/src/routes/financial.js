import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import models from '../models/index.js';
import FinancialReportsController from '../controllers/financialReportsController.js';
import TransactionManager from '../utils/transactionManager.js';
import backupManager from '../utils/backupManager.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const { 
  Account, 
  GLEntry, 
  JournalEntry, 
  JournalEntryDetail, 
  Customer, 
  Supplier, 
  Employee, 
  Invoice, 
  Payment, 
  Receipt, 
  PayrollEntry, 
  EmployeeAdvance, 
  FixedAsset, 
  Setting 
} = models;



// Middleware to ensure financial role access
const requireFinancialAccess = requireRole(['admin', 'financial']);

// ==================== ACCOUNTS ROUTES ====================

// GET /api/financial/accounts - Get chart of accounts
router.get('/accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, type } = req.query;
    
    let whereClause = {};
    
    // Filter by search term
    if (search) {
      whereClause = {
        [models.sequelize.Op.or]: [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { nameEn: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Filter by account type
    if (type) {
      whereClause.type = type;
    }
    
    const options = {
      where: whereClause,
      order: [['code', 'ASC']],
      include: [
        {
          model: Account,
          as: 'parent',
          attributes: ['id', 'code', 'name']
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const accounts = await Account.findAll(options);
    const total = await Account.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: accounts,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'خطأ في جلب الحسابات' });
  }
});

// POST /api/financial/accounts - Create new account with transaction safety
router.post('/accounts', authenticateToken, requireFinancialAccess, asyncHandler(async (req, res) => {
  // Derive rootType and reportType from type field
  const typeMapping = {
    'asset': { rootType: 'Asset', reportType: 'Balance Sheet' },
    'liability': { rootType: 'Liability', reportType: 'Balance Sheet' },
    'equity': { rootType: 'Equity', reportType: 'Balance Sheet' },
    'revenue': { rootType: 'Income', reportType: 'Profit and Loss' },
    'expense': { rootType: 'Expense', reportType: 'Profit and Loss' }
  };

  const mapping = typeMapping[req.body.type];
  if (!mapping) {
    return res.status(400).json({
      success: false,
      message: 'نوع الحساب غير صحيح',
      code: 'INVALID_ACCOUNT_TYPE'
    });
  }

  const accountData = {
    id: uuidv4(),
    ...req.body,
    parentId: req.body.parentId || null, // Convert empty string to null
    rootType: mapping.rootType,
    reportType: mapping.reportType,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Use transaction manager for safe account creation
  const result = await TransactionManager.createAccountSafely(accountData, models);

  if (result.success) {
    res.status(201).json({
      success: true,
      data: result.data,
      message: 'تم إنشاء الحساب بنجاح'
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.error,
      code: result.code || 'ACCOUNT_CREATION_FAILED'
    });
  }
}));

// PUT /api/financial/accounts/:id - Update account
router.put('/accounts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'الحساب غير موجود' });
    }
    
    // Derive rootType and reportType from type field if type is being updated
    let updateData = { 
      ...req.body, 
      parentId: req.body.parentId || null, // Convert empty string to null
      updatedAt: new Date() 
    };
    
    if (req.body.type) {
      const typeMapping = {
        'asset': { rootType: 'Asset', reportType: 'Balance Sheet' },
        'liability': { rootType: 'Liability', reportType: 'Balance Sheet' },
        'equity': { rootType: 'Equity', reportType: 'Balance Sheet' },
        'revenue': { rootType: 'Income', reportType: 'Profit and Loss' },
        'expense': { rootType: 'Expense', reportType: 'Profit and Loss' }
      };

      const mapping = typeMapping[req.body.type];
      if (!mapping) {
        return res.status(400).json({ message: 'نوع الحساب غير صحيح' });
      }

      updateData.rootType = mapping.rootType;
      updateData.reportType = mapping.reportType;
    }
    
    await account.update(updateData);
    
    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'خطأ في تحديث الحساب' });
  }
});

// DELETE /api/financial/accounts/:id - Delete account with transaction safety
router.delete('/accounts/:id', authenticateToken, requireFinancialAccess, asyncHandler(async (req, res) => {
  // Use transaction manager for safe account deletion
  const result = await TransactionManager.deleteAccountSafely(req.params.id, models);

  if (result.success) {
    res.json({
      success: true,
      message: `تم حذف الحساب '${result.data.accountName}' بنجاح`,
      data: result.data
    });
  } else {
    const statusCode = result.error.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: result.error,
      code: result.code || 'ACCOUNT_DELETION_FAILED'
    });
  }
}));

// POST /api/financial/accounts/fix-fields - Fix missing rootType and reportType fields
router.post('/accounts/fix-fields', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const typeMapping = {
      'asset': { rootType: 'Asset', reportType: 'Balance Sheet' },
      'liability': { rootType: 'Liability', reportType: 'Balance Sheet' },
      'equity': { rootType: 'Equity', reportType: 'Balance Sheet' },
      'revenue': { rootType: 'Income', reportType: 'Profit and Loss' },
      'expense': { rootType: 'Expense', reportType: 'Profit and Loss' }
    };

    // Find all accounts that are missing rootType or reportType
    const accounts = await Account.findAll({
      where: {
        [models.sequelize.Op.or]: [
          { rootType: null },
          { reportType: null }
        ]
      }
    });
    
    let updatedCount = 0;
    
    for (const account of accounts) {
      const mapping = typeMapping[account.type];
      if (mapping) {
        await account.update({
          rootType: mapping.rootType,
          reportType: mapping.reportType
        });
        updatedCount++;
      }
    }
    
    res.json({ 
      message: `تم تحديث ${updatedCount} حساب بنجاح`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error fixing account fields:', error);
    res.status(500).json({ message: 'خطأ في تحديث الحسابات' });
  }
});

// ==================== GL ENTRIES ROUTES ====================

// GET /api/financial/gl-entries - Get GL entries
router.get('/gl-entries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, accountId, voucherType, dateFrom, dateTo } = req.query;
    
    let whereClause = {};
    
    // Filter by account
    if (accountId) {
      whereClause.accountId = accountId;
    }
    
    // Filter by voucher type
    if (voucherType) {
      whereClause.voucherType = voucherType;
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.postingDate = {};
      if (dateFrom) whereClause.postingDate[models.sequelize.Op.gte] = dateFrom;
      if (dateTo) whereClause.postingDate[models.sequelize.Op.lte] = dateTo;
    }
    
    const options = {
      where: whereClause,
      order: [['postingDate', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name', 'type']
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const glEntries = await GLEntry.findAll(options);
    const total = await GLEntry.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: glEntries,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching GL entries:', error);
    res.status(500).json({ message: 'خطأ في جلب قيود دفتر الأستاذ العام' });
  }
});

// ==================== JOURNAL ENTRIES ROUTES ====================

// GET /api/financial/journal-entries - Get journal entries
router.get('/journal-entries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, type, dateFrom, dateTo } = req.query;
    
    let whereClause = {};
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    // Filter by type
    if (type) {
      whereClause.type = type;
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[models.sequelize.Op.gte] = dateFrom;
      if (dateTo) whereClause.date[models.sequelize.Op.lte] = dateTo;
    }
    
    const options = {
      where: whereClause,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: JournalEntryDetail,
          as: 'details',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'code', 'name']
            }
          ]
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const journalEntries = await JournalEntry.findAll(options);
    const total = await JournalEntry.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: journalEntries,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'خطأ في جلب قيود اليومية' });
  }
});

// POST /api/financial/journal-entries - Create new journal entry
router.post('/journal-entries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      date, description, reference, type = 'manual', details
    } = req.body;

    // Validate required fields
    if (!date || !description || !details || details.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف والتفاصيل مطلوبة' });
    }

    // Validate journal entry details
    let totalDebit = 0;
    let totalCredit = 0;

    for (const detail of details) {
      if (!detail.accountId || (!detail.debit && !detail.credit)) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(detail.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${detail.accountId} غير موجود` });
      }

      totalDebit += parseFloat(detail.debit || 0);
      totalCredit += parseFloat(detail.credit || 0);
    }

    // Validate balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'يجب أن يتساوى مجموع المدين مع مجموع الدائن' });
    }

    // Generate entry number
    const lastEntry = await JournalEntry.findOne({
      order: [['entryNumber', 'DESC']]
    });
    const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace('JE', '')) + 1 : 1;
    const entryNumber = `JE${String(nextNumber).padStart(6, '0')}`;

    // Create journal entry
    const journalEntry = await JournalEntry.create({
      id: uuidv4(),
      entryNumber,
      date,
      description,
      reference,
      totalDebit,
      totalCredit,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create journal entry details
    const entryDetails = [];
    for (const detail of details) {
      const entryDetail = await JournalEntryDetail.create({
        id: uuidv4(),
        journalEntryId: journalEntry.id,
        accountId: detail.accountId,
        description: detail.description || '',
        debit: parseFloat(detail.debit || 0),
        credit: parseFloat(detail.credit || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      entryDetails.push(entryDetail);
    }

    // Fetch the complete journal entry with details
    const completeEntry = await JournalEntry.findByPk(journalEntry.id, {
      include: [
        {
          model: JournalEntryDetail,
          as: 'details',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'code', 'name']
            }
          ]
        }
      ]
    });

    res.status(201).json(completeEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ message: 'خطأ في إنشاء قيد اليومية' });
  }
});

// GET /api/financial/journal-entries/:id - Get specific journal entry
router.get('/journal-entries/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findByPk(req.params.id, {
      include: [
        {
          model: JournalEntryDetail,
          as: 'details',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'code', 'name']
            }
          ]
        }
      ]
    });

    if (!journalEntry) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    res.json(journalEntry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'خطأ في جلب قيد اليومية' });
  }
});

// PUT /api/financial/journal-entries/:id - Update journal entry
router.put('/journal-entries/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findByPk(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    if (journalEntry.status !== 'draft') {
      return res.status(400).json({ message: 'لا يمكن تعديل قيد معتمد أو ملغي' });
    }

    const {
      postingDate, description, reference, currency, exchangeRate, details
    } = req.body;

    // Validate details if provided
    if (details && details.length > 0) {
      let totalDebit = 0;
      let totalCredit = 0;

      for (const detail of details) {
        if (!detail.accountId || (!detail.debit && !detail.credit)) {
          return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
        }

        totalDebit += parseFloat(detail.debit || 0);
        totalCredit += parseFloat(detail.credit || 0);
      }

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ message: 'يجب أن يتساوى مجموع المدين مع مجموع الدائن' });
      }

      // Update journal entry details
      await JournalEntryDetail.destroy({ where: { journalEntryId: req.params.id } });

      for (const detail of details) {
        await JournalEntryDetail.create({
          id: uuidv4(),
          journalEntryId: req.params.id,
          accountId: detail.accountId,
          description: detail.description || '',
          debit: parseFloat(detail.debit || 0),
          credit: parseFloat(detail.credit || 0),
          currency: currency || 'LYD',
          exchangeRate: parseFloat(exchangeRate || 1),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update totals
      req.body.totalDebit = totalDebit;
      req.body.totalCredit = totalCredit;
    }

    // Update journal entry
    await journalEntry.update({
      ...req.body,
      updatedAt: new Date()
    });

    // Fetch updated entry
    const updatedEntry = await JournalEntry.findByPk(req.params.id, {
      include: [
        {
          model: JournalEntryDetail,
          as: 'details',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'code', 'name']
            }
          ]
        }
      ]
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ message: 'خطأ في تحديث قيد اليومية' });
  }
});

// POST /api/financial/journal-entries/:id/submit - Submit journal entry and create GL entries
router.post('/journal-entries/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findByPk(req.params.id, {
      include: [
        {
          model: JournalEntryDetail,
          as: 'details'
        }
      ]
    });

    if (!journalEntry) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    if (journalEntry.status !== 'draft') {
      return res.status(400).json({ message: 'القيد معتمد مسبقاً أو ملغي' });
    }

    // Perform the conversion to GL and account balance updates inside a transaction
    await models.sequelize.transaction(async (transaction) => {
      // Prepare GL entries
      const glEntries = journalEntry.details.map(detail => ({
        id: uuidv4(),
        postingDate: journalEntry.date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Journal Entry',
        voucherNo: journalEntry.entryNumber,
        voucherDetailNo: detail.id,
        remarks: detail.description || journalEntry.description,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });

      // For each created GL entry, update corresponding Account balance
      for (const gl of createdGLEntries) {
        const account = await Account.findByPk(gl.accountId, { transaction, lock: models.sequelize.Transaction.LOCK.UPDATE });
        if (!account) {
          throw new Error(`Account not found: ${gl.accountId}`);
        }

        // Compute new balance depending on account nature
        const current = parseFloat(account.balance || 0);
        const debit = parseFloat(gl.debit || 0);
        const credit = parseFloat(gl.credit || 0);

        let newBalance = current;

        // If account nature is 'debit' (assets, expenses) a debit increases balance
        if (account.nature === 'debit') {
          newBalance = current + debit - credit;
        } else {
          // nature === 'credit' (liabilities, revenue, equity): credit increases balance
          newBalance = current - debit + credit;
        }

        // Update account balance
        account.balance = newBalance;
        await account.save({ transaction });
      }

      // Update journal entry status within the same transaction
      await journalEntry.update({
        status: 'posted',
        postedAt: new Date(),
        postedBy: req.user.id,
        updatedAt: new Date()
      }, { transaction });
    });

    res.json({ message: 'تم اعتماد قيد اليومية وإنشاء قيود دفتر الأستاذ العام' });
  } catch (error) {
    console.error('Error submitting journal entry:', error);
    res.status(500).json({ message: 'خطأ في اعتماد قيد اليومية' });
  }
});

// POST /api/financial/journal-entries/:id/cancel - Cancel journal entry
router.post('/journal-entries/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findByPk(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    if (journalEntry.status === 'cancelled') {
      return res.status(400).json({ message: 'القيد ملغي مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      { 
        where: { 
          voucherType: 'Journal Entry',
          voucherNo: journalEntry.entryNumber
        }
      }
    );

    // Update journal entry status
    await journalEntry.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء قيد اليومية' });
  } catch (error) {
    console.error('Error cancelling journal entry:', error);
    res.status(500).json({ message: 'خطأ في إلغاء قيد اليومية' });
  }
});

// ==================== CUSTOMERS ROUTES ====================

// GET /api/financial/customers - Get customers
router.get('/customers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, type } = req.query;
    
    let whereClause = {};
    
    // Filter by search term
    if (search) {
      whereClause = {
        [models.sequelize.Op.or]: [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { nameEn: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Filter by type
    if (type) {
      whereClause.type = type;
    }
    
    const options = {
      where: whereClause,
      order: [['name', 'ASC']],
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const customers = await Customer.findAll(options);
    const total = await Customer.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: customers,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'خطأ في جلب العملاء' });
  }
});

// POST /api/financial/customers - Create new customer
router.post('/customers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const customerData = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newCustomer = await Customer.create(customerData);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'خطأ في إنشاء العميل' });
  }
});

// ==================== SUPPLIERS ROUTES ====================

// GET /api/financial/suppliers - Get suppliers
router.get('/suppliers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, type } = req.query;
    
    let whereClause = {};
    
    // Filter by search term
    if (search) {
      whereClause = {
        [models.sequelize.Op.or]: [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { nameEn: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Filter by type
    if (type) {
      whereClause.type = type;
    }
    
    const options = {
      where: whereClause,
      order: [['name', 'ASC']],
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const suppliers = await Supplier.findAll(options);
    const total = await Supplier.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: suppliers,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'خطأ في جلب الموردين' });
  }
});

// POST /api/financial/suppliers - Create new supplier
router.post('/suppliers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const supplierData = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newSupplier = await Supplier.create(supplierData);
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'خطأ في إنشاء المورد' });
  }
});

// ==================== EMPLOYEES ROUTES ====================

// GET /api/financial/employees - Get employees
router.get('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, department, position } = req.query;
    
    let whereClause = {};
    
    // Filter by search term
    if (search) {
      whereClause = {
        [models.sequelize.Op.or]: [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { nameEn: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Filter by department
    if (department) {
      whereClause.department = department;
    }
    
    // Filter by position
    if (position) {
      whereClause.position = position;
    }
    
    const options = {
      where: whereClause,
      order: [['name', 'ASC']],
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const employees = await Employee.findAll(options);
    const total = await Employee.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: employees,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'خطأ في جلب الموظفين' });
  }
});

// POST /api/financial/employees - Create new employee
router.post('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const employeeData = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newEmployee = await Employee.create(employeeData);
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الموظف' });
  }
});

// GET /api/financial/employees/:id/salaries - Get employee salaries
router.get('/employees/:id/salaries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const salaries = await PayrollEntry.findAll({
      where: { employeeId: id },
      order: [['month', 'DESC'], ['year', 'DESC']]
    });
    
    res.json(salaries);
  } catch (error) {
    console.error('Error fetching employee salaries:', error);
    res.status(500).json({ message: 'خطأ في جلب رواتب الموظف' });
  }
});

// GET /api/financial/employees/:id/advances - Get employee advances
router.get('/employees/:id/advances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const advances = await EmployeeAdvance.findAll({
      where: { employeeId: id },
      order: [['requestDate', 'DESC']]
    });
    
    res.json(advances);
  } catch (error) {
    console.error('Error fetching employee advances:', error);
    res.status(500).json({ message: 'خطأ في جلب سلف الموظف' });
  }
});

// GET /api/financial/employees/:id/bonds - Get employee bonds
router.get('/employees/:id/bonds', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return empty array as bonds table might not exist
    // This can be implemented when the bonds table is created
    res.json([]);
  } catch (error) {
    console.error('Error fetching employee bonds:', error);
    res.status(500).json({ message: 'خطأ في جلب عهود الموظف' });
  }
});

// ==================== FIXED ASSETS ROUTES ====================

// GET /api/financial/fixed-assets - Get fixed assets
router.get('/fixed-assets', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, category, status } = req.query;
    
    let whereClause = {};
    
    // Filter by search term
    if (search) {
      whereClause = {
        [models.sequelize.Op.or]: [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { nameEn: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Filter by category
    if (category) {
      whereClause.category = category;
    }
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    const options = {
      where: whereClause,
      order: [['name', 'ASC']],
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        }
      ]
    };
    
    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }
    
    const fixedAssets = await FixedAsset.findAll(options);
    const total = await FixedAsset.count({ where: whereClause });
    
    // Always use consistent response format
    const response = {
      data: fixedAssets,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching fixed assets:', error);
    res.status(500).json({ message: 'خطأ في جلب الأصول الثابتة' });
  }
});

// POST /api/financial/fixed-assets - Create new fixed asset
router.post('/fixed-assets', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const fixedAssetData = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newFixedAsset = await FixedAsset.create(fixedAssetData);
    res.status(201).json(newFixedAsset);
  } catch (error) {
    console.error('Error creating fixed asset:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الأصل الثابت' });
  }
});

// ==================== FINANCIAL REPORTS ENDPOINTS ====================

const reportsController = new FinancialReportsController();

// GET /api/financial/summary - Get financial summary
router.get('/summary', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    
    // Get trial balance
    const trialBalance = await reportsController.getTrialBalance(asOfDate, false);
    
    // Get basic financial metrics
    const totalAssets = await Account.sum('balance', {
      where: { type: 'asset', isGroup: false, isActive: true }
    }) || 0;
    
    const totalLiabilities = await Account.sum('balance', {
      where: { type: 'liability', isGroup: false, isActive: true }
    }) || 0;
    
    const totalRevenue = await Account.sum('balance', {
      where: { type: 'revenue', isGroup: false, isActive: true }
    }) || 0;
    
    const totalExpenses = await Account.sum('balance', {
      where: { type: 'expense', isGroup: false, isActive: true }
    }) || 0;
    
    // Get sales and purchase data
    const totalSales = await Invoice.sum('total', {
      where: { 
        status: { [models.sequelize.Op.in]: ['sent', 'paid', 'posted'] },
        type: 'sale'
      }
    }) || 0;
    
    const totalPurchases = await Invoice.sum('total', {
      where: { 
        status: { [models.sequelize.Op.in]: ['sent', 'paid', 'posted'] },
        type: 'purchase'
      }
    }) || 0;
    
    // Get cash and bank balances
    const cashBalance = await Account.sum('balance', {
      where: { 
        type: 'asset', 
        isGroup: false, 
        isActive: true,
        code: { [models.sequelize.Op.like]: '%CASH%' }
      }
    }) || 0;
    
    const bankBalance = await Account.sum('balance', {
      where: { 
        type: 'asset', 
        isGroup: false, 
        isActive: true,
        code: { [models.sequelize.Op.like]: '%BANK%' }
      }
    }) || 0;
    
    // Get accounts receivable and payable
    const accountsReceivable = await Account.sum('balance', {
      where: { 
        type: 'asset', 
        isGroup: false, 
        isActive: true,
        code: { [models.sequelize.Op.like]: '%RECEIVABLE%' }
      }
    }) || 0;
    
    const accountsPayable = await Account.sum('balance', {
      where: { 
        type: 'liability', 
        isGroup: false, 
        isActive: true,
        code: { [models.sequelize.Op.like]: '%PAYABLE%' }
      }
    }) || 0;
    
    // Calculate cash flow (simplified)
    const cashFlow = cashBalance + bankBalance;
    
    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;
    
    // Calculate monthly growth (simplified)
    const monthlyGrowth = ((totalSales - totalExpenses) / (totalExpenses || 1)) * 100;
    
    const summary = {
      totalSales: parseFloat(totalSales),
      totalPurchases: parseFloat(totalPurchases),
      netProfit: parseFloat(netProfit),
      cashFlow: parseFloat(cashFlow),
      totalAssets: parseFloat(totalAssets),
      totalLiabilities: parseFloat(totalLiabilities),
      totalEquity: parseFloat(totalAssets - totalLiabilities),
      accountsReceivable: parseFloat(accountsReceivable),
      accountsPayable: parseFloat(accountsPayable),
      cashBalance: parseFloat(cashBalance),
      bankBalance: parseFloat(bankBalance),
      monthlyGrowth: parseFloat(monthlyGrowth),
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString()
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating financial summary:', error);
    res.status(500).json({ message: 'خطأ في حساب الملخص المالي' });
  }
});

// GET /api/financial/monitored-accounts - Get monitored accounts
router.get('/monitored-accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    // Get accounts that need monitoring (high balance, negative balance, etc.)
    const accounts = await Account.findAll({
      where: {
        isActive: true,
        isGroup: false,
        [models.sequelize.Op.or]: [
          { balance: { [models.sequelize.Op.gt]: 100000 } }, // High balance accounts
          { balance: { [models.sequelize.Op.lt]: 0 } }, // Negative balance accounts
        ]
      },
      order: [['balance', 'DESC']],
      include: [
        {
          model: Account,
          as: 'parent',
          attributes: ['id', 'code', 'name']
        }
      ]
    });
    
    const monitoredAccounts = accounts.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      balance: parseFloat(account.balance || 0),
      status: account.balance > 100000 ? 'high_balance' : 'negative_balance',
      parent: account.parent,
      lastUpdated: account.updatedAt
    }));
    
    res.json({
      data: monitoredAccounts,
      total: monitoredAccounts.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching monitored accounts:', error);
    res.status(500).json({ message: 'خطأ في جلب الحسابات المراقبة' });
  }
});

// POST /api/financial/opening-balances - Create opening balance entries
router.post('/opening-balances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { date, entries, description = 'Opening Balance Entry' } = req.body;
    
    if (!date || !entries || entries.length === 0) {
      return res.status(400).json({ message: 'التاريخ والقيود مطلوبة' });
    }
    
    // Validate entries balance
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const entry of entries) {
      if (!entry.accountId || (!entry.debit && !entry.credit)) {
        return res.status(400).json({ message: 'كل قيد يجب أن يحتوي على حساب ومبلغ' });
      }
      
      totalDebit += parseFloat(entry.debit || 0);
      totalCredit += parseFloat(entry.credit || 0);
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'يجب أن يتساوى مجموع المدين مع مجموع الدائن' });
    }
    
    // Generate opening balance number
    const lastEntry = await GLEntry.findOne({
      where: { voucherType: 'Opening Balance' },
      order: [['voucherNo', 'DESC']]
    });
    
    const nextNumber = lastEntry ? parseInt(lastEntry.voucherNo.replace('OB', '')) + 1 : 1;
    const voucherNo = `OB${String(nextNumber).padStart(6, '0')}`;
    
    // Create GL entries
    const glEntries = entries.map(entry => ({
      id: uuidv4(),
      postingDate: date,
      accountId: entry.accountId,
      debit: parseFloat(entry.debit || 0),
      credit: parseFloat(entry.credit || 0),
      voucherType: 'Opening Balance',
      voucherNo,
      remarks: entry.description || description,
      currency: 'LYD',
      exchangeRate: 1.0,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const createdEntries = await GLEntry.bulkCreate(glEntries);
    
    res.status(201).json({
      message: 'تم إنشاء الأرصدة الافتتاحية بنجاح',
      voucherNo,
      entries: createdEntries,
      totalDebit,
      totalCredit
    });
  } catch (error) {
    console.error('Error creating opening balance:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الرصيد الافتتاحي' });
  }
});

export default router;
