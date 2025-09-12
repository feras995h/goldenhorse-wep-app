import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import models, { sequelize } from '../models/index.js';
import FinancialReportsController from '../controllers/financialReportsController.js';
import TransactionManager from '../utils/transactionManager.js';
import backupManager from '../utils/backupManager.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import NotificationService from '../services/NotificationService.js';
import { Op, Transaction } from 'sequelize';

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
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { nameEn: { [Op.iLike]: `%${search}%` } }
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

// POST /api/financial/accounts - Create new account
router.post('/accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
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

    // Check for duplicate account code
    const existingAccount = await Account.findOne({
      where: { code: req.body.code }
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: `رمز الحساب '${req.body.code}' موجود بالفعل`,
        code: 'DUPLICATE_ACCOUNT_CODE'
      });
    }

    // Validate parent account if specified
    if (req.body.parentId) {
      const parentAccount = await Account.findByPk(req.body.parentId);
      if (!parentAccount) {
        return res.status(400).json({
          success: false,
          message: `الحساب الأب غير موجود`,
          code: 'PARENT_ACCOUNT_NOT_FOUND'
        });
      }

      if (!parentAccount.isGroup) {
        return res.status(400).json({
          success: false,
          message: 'الحساب الأب يجب أن يكون مجموعة',
          code: 'PARENT_NOT_GROUP'
        });
      }
    }

    const accountData = {
      id: uuidv4(),
      ...req.body,
      parentId: req.body.parentId || null,
      rootType: mapping.rootType,
      reportType: mapping.reportType,
      balance: 0.00,
      isActive: true
    };

    // Create the account
    const newAccount = await Account.create(accountData);

    // Create notification for account creation
    try {
      await NotificationService.notifyAccountCreated(newAccount, req.user);
    } catch (notificationError) {
      console.error('Error creating account notification:', notificationError);
      // Don't fail the account creation if notification fails
    }

    res.status(201).json({
      success: true,
      data: newAccount,
      message: 'تم إنشاء الحساب بنجاح'
    });

  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الحساب',
      error: error.message
    });
  }
});

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
        [Op.or]: [
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
      if (dateFrom) whereClause.postingDate[Op.gte] = dateFrom;
      if (dateTo) whereClause.postingDate[Op.lte] = dateTo;
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
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
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
      date, description, reference, type = 'manual', details, lines
    } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !description || !entryLines || entryLines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف والتفاصيل مطلوبة' });
    }

    // Validate journal entry details
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of entryLines) {
      if (!line.accountId || (!line.debit && !line.credit)) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      totalDebit += parseFloat(line.debit || 0);
      totalCredit += parseFloat(line.credit || 0);
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
    for (const line of entryLines) {
      const entryDetail = await JournalEntryDetail.create({
        id: uuidv4(),
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        description: line.description || '',
        debit: parseFloat(line.debit || 0),
        credit: parseFloat(line.credit || 0),
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

    // Create notification for journal entry creation
    try {
      await NotificationService.notifyJournalEntryCreated(completeEntry, req.user);
    } catch (notificationError) {
      console.error('Error creating journal entry notification:', notificationError);
      // Don't fail the journal entry creation if notification fails
    }

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
      postingDate, description, reference, currency, exchangeRate, details, lines
    } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate details if provided
    if (entryLines && entryLines.length > 0) {
      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of entryLines) {
        if (!line.accountId || (!line.debit && !line.credit)) {
          return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
        }

        totalDebit += parseFloat(line.debit || 0);
        totalCredit += parseFloat(line.credit || 0);
      }

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ message: 'يجب أن يتساوى مجموع المدين مع مجموع الدائن' });
      }

      // Update journal entry details
      await JournalEntryDetail.destroy({ where: { journalEntryId: req.params.id } });

      for (const line of entryLines) {
        await JournalEntryDetail.create({
          id: uuidv4(),
          journalEntryId: req.params.id,
          accountId: line.accountId,
          description: line.description || '',
          debit: parseFloat(line.debit || 0),
          credit: parseFloat(line.credit || 0),
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
          as: 'details',
          include: [
            {
              model: Account,
              as: 'account'
            }
          ]
        }
      ]
    });

    if (!journalEntry) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    if (journalEntry.status !== 'draft') {
      return res.status(400).json({ message: 'القيد معتمد مسبقاً أو ملغي' });
    }

    // Check if journal entry has details
    if (!journalEntry.details || journalEntry.details.length === 0) {
      return res.status(400).json({ message: 'لا يمكن اعتماد قيد بدون تفاصيل' });
    }

    // Perform the conversion to GL and account balance updates inside a transaction
    await sequelize.transaction(async (transaction) => {
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
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });

      // For each created GL entry, update corresponding Account balance
      for (const gl of createdGLEntries) {
        const account = await Account.findByPk(gl.accountId, { transaction, lock: Transaction.LOCK.UPDATE });
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
        postedBy: req.user?.id || 'system',
        updatedAt: new Date()
      }, { transaction });
    });

    res.json({ message: 'تم اعتماد قيد اليومية وإنشاء قيود دفتر الأستاذ العام' });
  } catch (error) {
    console.error('Error submitting journal entry:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      journalEntryId: req.params.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد قيد اليومية',
      error: error.message
    });
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
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { nameEn: { [Op.iLike]: `%${search}%` } }
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
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { nameEn: { [Op.iLike]: `%${search}%` } }
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
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { nameEn: { [Op.iLike]: `%${search}%` } }
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
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { nameEn: { [Op.iLike]: `%${search}%` } }
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
    console.log('🔍 بدء حساب الملخص المالي...');

    // Create a simplified summary for now
    const summary = {
      totalSales: 0,
      totalPurchases: 0,
      netProfit: 0,
      cashFlow: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      cashBalance: 0,
      bankBalance: 0,
      monthlyGrowth: 0,
      asOfDate: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString()
    };

    console.log('✅ تم إنشاء الملخص المالي بنجاح');
    res.json(summary);
  } catch (error) {
    console.error('❌ خطأ في حساب الملخص المالي:', error);
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
        [Op.or]: [
          { balance: { [Op.gt]: 100000 } }, // High balance accounts
          { balance: { [Op.lt]: 0 } }, // Negative balance accounts
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

// GET /api/financial/opening-balances - Get opening balance entries
router.get('/opening-balances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {
      voucherType: 'Opening Balance'
    };

    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { voucherNo: { [Op.like]: `%${search}%` } },
          { remarks: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await GLEntry.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name', 'type']
        }
      ],
      order: [['postingDate', 'DESC'], ['voucherNo', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Group by voucher number
    const groupedEntries = {};
    rows.forEach(entry => {
      if (!groupedEntries[entry.voucherNo]) {
        groupedEntries[entry.voucherNo] = {
          voucherNo: entry.voucherNo,
          postingDate: entry.postingDate,
          remarks: entry.remarks,
          entries: [],
          totalDebit: 0,
          totalCredit: 0
        };
      }

      groupedEntries[entry.voucherNo].entries.push({
        id: entry.id,
        accountId: entry.accountId,
        accountCode: entry.account?.code,
        accountName: entry.account?.name,
        debit: entry.debit,
        credit: entry.credit,
        type: entry.debit > 0 ? 'debit' : 'credit',
        balance: entry.debit > 0 ? entry.debit : entry.credit
      });

      groupedEntries[entry.voucherNo].totalDebit += entry.debit;
      groupedEntries[entry.voucherNo].totalCredit += entry.credit;
    });

    const openingBalances = Object.values(groupedEntries);

    res.json({
      data: openingBalances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching opening balances:', error);
    res.status(500).json({ message: 'خطأ في جلب الأرصدة الافتتاحية' });
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

// POST /api/financial/opening-balance-entry - Create comprehensive opening balance entry
router.post('/opening-balance-entry', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { date, description, reference, currency = 'LYD', lines } = req.body;

    if (!date || !lines || lines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والتفاصيل مطلوبة' });
    }

    // Validate and calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    const validLines = [];

    for (const line of lines) {
      if (!line.accountId || (!line.debit && !line.credit)) {
        continue; // Skip empty lines
      }

      const debit = parseFloat(line.debit || 0);
      const credit = parseFloat(line.credit || 0);

      if (debit > 0 && credit > 0) {
        return res.status(400).json({ message: 'لا يمكن أن يكون للسطر مبلغ مدين ودائن في نفس الوقت' });
      }

      totalDebit += debit;
      totalCredit += credit;

      validLines.push({
        accountId: line.accountId,
        debit,
        credit,
        description: line.description || description || 'رصيد افتتاحي',
        notes: line.notes || ''
      });
    }

    if (validLines.length === 0) {
      return res.status(400).json({ message: 'يجب إدخال سطر واحد على الأقل' });
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        message: 'يجب أن يتساوى مجموع المدين مع مجموع الدائن',
        totalDebit,
        totalCredit,
        difference: totalDebit - totalCredit
      });
    }

    // Generate reference number if not provided
    let voucherNo = reference;
    if (!voucherNo) {
      const lastEntry = await GLEntry.findOne({
        where: { voucherType: 'Opening Balance' },
        order: [['voucherNo', 'DESC']]
      });

      const nextNumber = lastEntry ? parseInt(lastEntry.voucherNo.replace(/\D/g, '')) + 1 : 1;
      voucherNo = `OB-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;
    }

    // Create GL entries
    const glEntries = validLines.map(line => ({
      id: uuidv4(),
      postingDate: date,
      accountId: line.accountId,
      debit: line.debit,
      credit: line.credit,
      voucherType: 'Opening Balance',
      voucherNo,
      remarks: line.description,
      currency: currency,
      exchangeRate: 1.0,
      createdBy: req.user?.id || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdEntries = await GLEntry.bulkCreate(glEntries);

    res.status(201).json({
      message: 'تم إنشاء القيد الافتتاحي بنجاح',
      voucherNo,
      entries: createdEntries,
      totalDebit,
      totalCredit,
      linesCount: validLines.length
    });
  } catch (error) {
    console.error('Error creating opening balance entry:', error);
    res.status(500).json({
      message: 'خطأ في إنشاء القيد الافتتاحي',
      error: error.message
    });
  }
});

// ==================== FINANCIAL REPORTS ROUTES ====================

// GET /api/financial/reports/trial-balance - Get trial balance report
router.get('/reports/trial-balance', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Get all accounts with their balances
    const accounts = await Account.findAll({
      where: {
        isActive: true,
        ...(branch && { branch })
      },
      include: [
        {
          model: GLEntry,
          as: 'glEntries',
          where: {
            date: {
              [Op.between]: [dateFrom, dateTo]
            },
            ...(currency !== 'LYD' && { currency })
          },
          required: false
        }
      ],
      order: [['code', 'ASC']]
    });

    const trialBalance = accounts.map(account => {
      const entries = account.glEntries || [];
      const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
      const balance = totalDebit - totalCredit;

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        debit: totalDebit,
        credit: totalCredit,
        balance: balance
      };
    }).filter(entry => entry.debit !== 0 || entry.credit !== 0 || entry.balance !== 0);

    const totals = trialBalance.reduce((acc, entry) => ({
      totalDebit: acc.totalDebit + entry.debit,
      totalCredit: acc.totalCredit + entry.credit
    }), { totalDebit: 0, totalCredit: 0 });

    res.json({
      data: trialBalance,
      totals,
      period: { dateFrom, dateTo },
      currency,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ message: 'خطأ في إنشاء ميزان المراجعة' });
  }
});

// GET /api/financial/reports/income-statement - Get income statement report
router.get('/reports/income-statement', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Get revenue and expense accounts
    const accounts = await Account.findAll({
      where: {
        type: { [Op.in]: ['revenue', 'expense'] },
        isActive: true,
        ...(branch && { branch })
      },
      include: [
        {
          model: GLEntry,
          as: 'glEntries',
          where: {
            date: {
              [Op.between]: [dateFrom, dateTo]
            },
            ...(currency !== 'LYD' && { currency })
          },
          required: false
        }
      ],
      order: [['type', 'ASC'], ['code', 'ASC']]
    });

    const revenues = [];
    const expenses = [];

    accounts.forEach(account => {
      const entries = account.glEntries || [];
      const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
      const amount = account.type === 'revenue' ? totalCredit - totalDebit : totalDebit - totalCredit;

      if (amount !== 0) {
        const entry = {
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          amount: Math.abs(amount),
          type: account.type
        };

        if (account.type === 'revenue') {
          revenues.push(entry);
        } else {
          expenses.push(entry);
        }
      }
    });

    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      revenues,
      expenses,
      totals: {
        totalRevenue,
        totalExpenses,
        netIncome
      },
      period: { dateFrom, dateTo },
      currency,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ message: 'خطأ في إنشاء قائمة الدخل' });
  }
});

// GET /api/financial/reports/balance-sheet - Get balance sheet report
router.get('/reports/balance-sheet', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Get asset, liability, and equity accounts
    const accounts = await Account.findAll({
      where: {
        type: { [Op.in]: ['asset', 'liability', 'equity'] },
        isActive: true,
        ...(branch && { branch })
      },
      include: [
        {
          model: GLEntry,
          as: 'glEntries',
          where: {
            date: {
              [Op.lte]: dateTo
            },
            ...(currency !== 'LYD' && { currency })
          },
          required: false
        }
      ],
      order: [['type', 'ASC'], ['code', 'ASC']]
    });

    const assets = [];
    const liabilities = [];
    const equity = [];

    accounts.forEach(account => {
      const entries = account.glEntries || [];
      const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      let amount;
      if (account.type === 'asset') {
        amount = totalDebit - totalCredit;
      } else {
        amount = totalCredit - totalDebit;
      }

      if (amount !== 0) {
        const entry = {
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          amount: Math.abs(amount),
          type: account.type
        };

        if (account.type === 'asset') {
          assets.push(entry);
        } else if (account.type === 'liability') {
          liabilities.push(entry);
        } else {
          equity.push(entry);
        }
      }
    });

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      assets,
      liabilities,
      equity,
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity
      },
      asOfDate: dateTo,
      currency,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الميزانية العمومية' });
  }
});

// GET /api/financial/reports/cash-flow - Get cash flow statement
router.get('/reports/cash-flow', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Get cash and bank accounts
    const cashAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: '%نقد%' } },
          { name: { [Op.iLike]: '%صندوق%' } },
          { name: { [Op.iLike]: '%بنك%' } },
          { name: { [Op.iLike]: '%cash%' } },
          { name: { [Op.iLike]: '%bank%' } }
        ],
        isActive: true,
        ...(branch && { branch })
      },
      include: [
        {
          model: GLEntry,
          as: 'glEntries',
          where: {
            date: {
              [Op.between]: [dateFrom, dateTo]
            },
            ...(currency !== 'LYD' && { currency })
          },
          required: false
        }
      ]
    });

    const cashFlows = cashAccounts.map(account => {
      const entries = account.glEntries || [];
      const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
      const netFlow = totalDebit - totalCredit;

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        inflow: totalDebit,
        outflow: totalCredit,
        netFlow: netFlow
      };
    }).filter(flow => flow.inflow !== 0 || flow.outflow !== 0);

    const totals = cashFlows.reduce((acc, flow) => ({
      totalInflow: acc.totalInflow + flow.inflow,
      totalOutflow: acc.totalOutflow + flow.outflow,
      netCashFlow: acc.netCashFlow + flow.netFlow
    }), { totalInflow: 0, totalOutflow: 0, netCashFlow: 0 });

    res.json({
      cashFlows,
      totals,
      period: { dateFrom, dateTo },
      currency,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating cash flow statement:', error);
    res.status(500).json({ message: 'خطأ في إنشاء قائمة التدفق النقدي' });
  }
});

// ==================== PAYROLL MANAGEMENT ROUTES ====================

// GET /api/financial/payroll - Get payroll entries
router.get('/payroll', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, department, month, year } = req.query;

    let whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by month and year
    if (month && year) {
      whereClause.month = `${year}-${month.toString().padStart(2, '0')}`;
    } else if (year) {
      whereClause.month = { [Op.like]: `${year}-%` };
    }

    // Filter by search term (employee name)
    if (search) {
      whereClause.employeeName = { [Op.iLike]: `%${search}%` };
    }

    const options = {
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'code', 'department', 'position'],
          where: department ? { department } : undefined
        }
      ],
      order: [['month', 'DESC'], ['employeeName', 'ASC']]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await PayrollEntry.findAndCountAll(options);

    // Calculate net salary for each entry
    const payrollEntries = rows.map(entry => ({
      ...entry.toJSON(),
      netSalary: entry.basicSalary + (entry.allowances || 0) + (entry.overtime || 0) + (entry.bonuses || 0) - (entry.deductions || 0) - (entry.advances || 0)
    }));

    res.json({
      data: payrollEntries,
      total: count,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      totalPages: Math.ceil(count / (parseInt(limit) || 10))
    });
  } catch (error) {
    console.error('Error fetching payroll entries:', error);
    res.status(500).json({ message: 'خطأ في جلب قيود الرواتب' });
  }
});

// POST /api/financial/payroll - Create payroll entry
router.post('/payroll', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances = 0, deductions = 0, overtime = 0, bonuses = 0, paymentMethod = 'bank', remarks } = req.body;

    // Get employee details
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // Check if payroll entry already exists for this employee and month
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    const existingEntry = await PayrollEntry.findOne({
      where: { employeeId, month: monthStr }
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'يوجد قيد راتب لهذا الموظف في هذا الشهر' });
    }

    const netSalary = basicSalary + allowances + overtime + bonuses - deductions;

    const payrollData = {
      id: uuidv4(),
      employeeId,
      employeeName: employee.name,
      month: monthStr,
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonuses,
      netSalary,
      currency: 'LYD',
      status: 'draft',
      paymentMethod,
      remarks,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPayrollEntry = await PayrollEntry.create(payrollData);
    res.status(201).json(newPayrollEntry);
  } catch (error) {
    console.error('Error creating payroll entry:', error);
    res.status(500).json({ message: 'خطأ في إنشاء قيد الراتب' });
  }
});

// PUT /api/financial/payroll/:id - Update payroll entry
router.put('/payroll/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { basicSalary, allowances = 0, deductions = 0, overtime = 0, bonuses = 0, paymentMethod, remarks } = req.body;

    const payrollEntry = await PayrollEntry.findByPk(id);
    if (!payrollEntry) {
      return res.status(404).json({ message: 'قيد الراتب غير موجود' });
    }

    if (payrollEntry.status !== 'draft') {
      return res.status(400).json({ message: 'لا يمكن تعديل قيد راتب معتمد أو مدفوع' });
    }

    const netSalary = basicSalary + allowances + overtime + bonuses - deductions;

    await payrollEntry.update({
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonuses,
      netSalary,
      paymentMethod,
      remarks,
      updatedAt: new Date()
    });

    res.json(payrollEntry);
  } catch (error) {
    console.error('Error updating payroll entry:', error);
    res.status(500).json({ message: 'خطأ في تحديث قيد الراتب' });
  }
});

// POST /api/financial/payroll/:id/approve - Approve payroll entry
router.post('/payroll/:id/approve', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const payrollEntry = await PayrollEntry.findByPk(id);
    if (!payrollEntry) {
      return res.status(404).json({ message: 'قيد الراتب غير موجود' });
    }

    if (payrollEntry.status !== 'draft') {
      return res.status(400).json({ message: 'قيد الراتب معتمد مسبقاً' });
    }

    await payrollEntry.update({
      status: 'approved',
      approvedBy: req.user.id,
      updatedAt: new Date()
    });

    res.json({ message: 'تم اعتماد قيد الراتب بنجاح', data: payrollEntry });
  } catch (error) {
    console.error('Error approving payroll entry:', error);
    res.status(500).json({ message: 'خطأ في اعتماد قيد الراتب' });
  }
});

// POST /api/financial/payroll/:id/pay - Mark payroll entry as paid
router.post('/payroll/:id/pay', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const payrollEntry = await PayrollEntry.findByPk(id);
    if (!payrollEntry) {
      return res.status(404).json({ message: 'قيد الراتب غير موجود' });
    }

    if (payrollEntry.status !== 'approved') {
      return res.status(400).json({ message: 'يجب اعتماد قيد الراتب أولاً' });
    }

    await payrollEntry.update({
      status: 'paid',
      paymentDate: new Date(),
      updatedAt: new Date()
    });

    // TODO: Create GL entries for salary payment

    res.json({ message: 'تم تسجيل دفع الراتب بنجاح', data: payrollEntry });
  } catch (error) {
    console.error('Error paying payroll entry:', error);
    res.status(500).json({ message: 'خطأ في تسجيل دفع الراتب' });
  }
});

// ==================== ACCOUNT STATEMENT ROUTES ====================

// GET /api/financial/accounts/:id/statement - Get account statement
router.get('/accounts/:id/statement', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate, page, limit } = req.query;

    // Get account details
    const account = await Account.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: 'الحساب غير موجود' });
    }

    // Build where clause for date range
    let whereClause = { accountId: id };
    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date[Op.gte] = fromDate;
      if (toDate) whereClause.date[Op.lte] = toDate;
    }

    const options = {
      where: whereClause,
      include: [
        {
          model: JournalEntry,
          as: 'journalEntry',
          attributes: ['id', 'entryNumber', 'description', 'reference']
        }
      ],
      order: [['date', 'ASC'], ['createdAt', 'ASC']]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await GLEntry.findAndCountAll(options);

    // Calculate running balance
    let runningBalance = 0;
    const entries = rows.map(entry => {
      const debit = entry.debit || 0;
      const credit = entry.credit || 0;

      if (account.nature === 'debit') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        ...entry.toJSON(),
        runningBalance: runningBalance
      };
    });

    // Get opening balance (entries before fromDate)
    let openingBalance = 0;
    if (fromDate) {
      const openingEntries = await GLEntry.findAll({
        where: {
          accountId: id,
          date: { [Op.lt]: fromDate }
        }
      });

      openingEntries.forEach(entry => {
        const debit = entry.debit || 0;
        const credit = entry.credit || 0;

        if (account.nature === 'debit') {
          openingBalance += debit - credit;
        } else {
          openingBalance += credit - debit;
        }
      });
    }

    // Calculate totals
    const totals = entries.reduce((acc, entry) => ({
      totalDebit: acc.totalDebit + (entry.debit || 0),
      totalCredit: acc.totalCredit + (entry.credit || 0)
    }), { totalDebit: 0, totalCredit: 0 });

    const closingBalance = openingBalance + (account.nature === 'debit' ?
      totals.totalDebit - totals.totalCredit :
      totals.totalCredit - totals.totalDebit);

    res.json({
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature
      },
      entries,
      totals: {
        ...totals,
        openingBalance,
        closingBalance
      },
      period: { fromDate, toDate },
      pagination: {
        total: count,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        totalPages: Math.ceil(count / (parseInt(limit) || 50))
      }
    });
  } catch (error) {
    console.error('Error generating account statement:', error);
    res.status(500).json({ message: 'خطأ في إنشاء كشف الحساب' });
  }
});

// ==================== INSTANT REPORTS ROUTES ====================

// GET /api/financial/instant-reports - Get instant financial reports
router.get('/instant-reports', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    let dateFrom, dateTo;
    const now = new Date();

    switch (period) {
      case 'today':
        dateFrom = dateTo = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        break;
      default:
        dateFrom = dateTo = now.toISOString().split('T')[0];
    }

    // Get receipts (cash inflows)
    const receipts = await Receipt.findAll({
      where: {
        date: { [Op.between]: [dateFrom, dateTo] },
        status: 'approved'
      },
      attributes: ['amount', 'currency', 'method', 'description']
    });

    // Get payments (cash outflows)
    const payments = await Payment.findAll({
      where: {
        date: { [Op.between]: [dateFrom, dateTo] },
        status: 'approved'
      },
      attributes: ['amount', 'currency', 'category', 'description']
    });

    // Get revenue accounts activity
    const revenueEntries = await GLEntry.findAll({
      where: {
        date: { [Op.between]: [dateFrom, dateTo] }
      },
      include: [
        {
          model: Account,
          as: 'account',
          where: { type: 'revenue' },
          attributes: ['name', 'code']
        }
      ]
    });

    // Get expense accounts activity
    const expenseEntries = await GLEntry.findAll({
      where: {
        date: { [Op.between]: [dateFrom, dateTo] }
      },
      include: [
        {
          model: Account,
          as: 'account',
          where: { type: 'expense' },
          attributes: ['name', 'code']
        }
      ]
    });

    // Calculate totals
    const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = revenueEntries.reduce((sum, e) => sum + (e.credit - e.debit), 0);
    const totalExpenses = expenseEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);

    // Get accounts receivable and payable
    const receivableAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: '%مدين%' } },
          { name: { [Op.iLike]: '%عميل%' } },
          { name: { [Op.iLike]: '%receivable%' } }
        ]
      },
      attributes: ['id', 'name', 'balance']
    });

    const payableAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: '%دائن%' } },
          { name: { [Op.iLike]: '%مورد%' } },
          { name: { [Op.iLike]: '%payable%' } }
        ]
      },
      attributes: ['id', 'name', 'balance']
    });

    const totalReceivables = receivableAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalPayables = payableAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Get cash balance
    const cashAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: '%نقد%' } },
          { name: { [Op.iLike]: '%صندوق%' } },
          { name: { [Op.iLike]: '%بنك%' } },
          { name: { [Op.iLike]: '%cash%' } },
          { name: { [Op.iLike]: '%bank%' } }
        ]
      },
      attributes: ['id', 'name', 'balance']
    });

    const cashBalance = cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    res.json({
      period: { dateFrom, dateTo, label: period },
      receipts: {
        total: totalReceipts,
        count: receipts.length,
        details: receipts
      },
      payments: {
        total: totalPayments,
        count: payments.length,
        details: payments
      },
      revenue: {
        total: totalRevenue,
        details: revenueEntries.map(e => ({
          accountName: e.account.name,
          accountCode: e.account.code,
          amount: e.credit - e.debit
        }))
      },
      expenses: {
        total: totalExpenses,
        details: expenseEntries.map(e => ({
          accountName: e.account.name,
          accountCode: e.account.code,
          amount: e.debit - e.credit
        }))
      },
      balances: {
        cash: cashBalance,
        receivables: totalReceivables,
        payables: totalPayables
      },
      netCashFlow: totalReceipts - totalPayments,
      netIncome: totalRevenue - totalExpenses,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating instant reports:', error);
    res.status(500).json({ message: 'خطأ في إنشاء التقارير الفورية' });
  }
});

// ==================== EMPLOYEE ADVANCES ROUTES ====================

// GET /api/financial/advances - Get employee advances
router.get('/advances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, employeeId } = req.query;

    let whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by employee
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    // Filter by search term (employee name)
    if (search) {
      whereClause.employeeName = { [Op.iLike]: `%${search}%` };
    }

    const options = {
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'code', 'department']
        }
      ],
      order: [['date', 'DESC']]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await EmployeeAdvance.findAndCountAll(options);

    res.json({
      data: rows,
      total: count,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      totalPages: Math.ceil(count / (parseInt(limit) || 10))
    });
  } catch (error) {
    console.error('Error fetching employee advances:', error);
    res.status(500).json({ message: 'خطأ في جلب سلف الموظفين' });
  }
});

// POST /api/financial/advances - Create employee advance request
router.post('/advances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { employeeId, amount, reason, paymentMethod = 'bank', installments = 1, remarks } = req.body;

    // Get employee details
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    const advanceData = {
      id: uuidv4(),
      employeeId,
      employeeName: employee.name,
      date: new Date().toISOString().split('T')[0],
      amount,
      currency: 'LYD',
      reason,
      status: 'draft',
      remainingAmount: amount,
      paymentMethod,
      installments,
      remarks,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newAdvance = await EmployeeAdvance.create(advanceData);
    res.status(201).json(newAdvance);
  } catch (error) {
    console.error('Error creating employee advance:', error);
    res.status(500).json({ message: 'خطأ في إنشاء طلب السلفة' });
  }
});

// POST /api/financial/advances/:id/approve - Approve advance request
router.post('/advances/:id/approve', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const advance = await EmployeeAdvance.findByPk(id);
    if (!advance) {
      return res.status(404).json({ message: 'طلب السلفة غير موجود' });
    }

    if (advance.status !== 'draft') {
      return res.status(400).json({ message: 'طلب السلفة معتمد مسبقاً' });
    }

    await advance.update({
      status: 'approved',
      approvedBy: req.user.id,
      updatedAt: new Date()
    });

    res.json({ message: 'تم اعتماد طلب السلفة بنجاح', data: advance });
  } catch (error) {
    console.error('Error approving advance request:', error);
    res.status(500).json({ message: 'خطأ في اعتماد طلب السلفة' });
  }
});

// POST /api/financial/advances/:id/pay - Pay advance request
router.post('/advances/:id/pay', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const advance = await EmployeeAdvance.findByPk(id);
    if (!advance) {
      return res.status(404).json({ message: 'طلب السلفة غير موجود' });
    }

    if (advance.status !== 'approved') {
      return res.status(400).json({ message: 'يجب اعتماد طلب السلفة أولاً' });
    }

    await advance.update({
      status: 'paid',
      paymentDate: new Date(),
      updatedAt: new Date()
    });

    // TODO: Create GL entries for advance payment

    res.json({ message: 'تم تسجيل دفع السلفة بنجاح', data: advance });
  } catch (error) {
    console.error('Error paying advance request:', error);
    res.status(500).json({ message: 'خطأ في تسجيل دفع السلفة' });
  }
});

// ==================== TREASURY OPERATIONS ROUTES ====================

// GET /api/financial/receipts - Get receipts
router.get('/receipts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    // Filter by search term
    if (search) {
      whereClause[Op.or] = [
        { receiptNumber: { [Op.iLike]: `%${search}%` } },
        { customerName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC'], ['receiptNumber', 'DESC']]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await Receipt.findAndCountAll(options);

    res.json({
      data: rows,
      total: count,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      totalPages: Math.ceil(count / (parseInt(limit) || 10))
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'خطأ في جلب المقبوضات' });
  }
});

// GET /api/financial/payments - Get payments
router.get('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, category, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by category
    if (category) {
      whereClause.category = category;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    // Filter by search term
    if (search) {
      whereClause[Op.or] = [
        { paymentNumber: { [Op.iLike]: `%${search}%` } },
        { payeeName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC'], ['paymentNumber', 'DESC']]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await Payment.findAndCountAll(options);

    res.json({
      data: rows,
      total: count,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      totalPages: Math.ceil(count / (parseInt(limit) || 10))
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'خطأ في جلب المدفوعات' });
  }
});

export default router;
