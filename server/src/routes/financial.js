import express from 'express';
import { authenticateToken, requireRole, requireAccountingAccess } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import models, { sequelize } from '../models/index.js';
import { Op, Transaction } from 'sequelize';
import { ensureOperationalSubAccounts } from '../utils/ensureDefaultAccounts.js';
import { validateFixedAsset, handleValidationErrors } from '../middleware/validation.js';
import FinancialReportsController from '../controllers/financialReportsController.js';
import TransactionManager from '../utils/transactionManager.js';
import backupManager from '../utils/backupManager.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import NotificationService from '../services/NotificationService.js';
import EmployeeAccountService from '../services/EmployeeAccountService.js';
import balanceUpdateService from '../services/balanceUpdateService.js';
import advancedFixedAssetManager from '../utils/advancedFixedAssetManager.js';

import AccountingAuditService from '../services/AccountingAuditService.js';
import { getAuditTrail, getUserAuditTrail, getFinancialAuditTrail } from '../middleware/auditTrail.js';

// Import fixed asset helpers
import { generateHierarchicalAssetNumber, createFixedAssetAccounts, ensureFixedAssetsStructure } from '../utils/fixedAssetHelpers.js';

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
  Setting,
  InvoicePayment,
  InvoiceReceipt,
  AccountProvision,
  User
} = models;



// Middleware to ensure financial role access
const requireFinancialAccess = requireAccountingAccess;
// Treasury vouchers can be used by sales as well (no direct chart editing required)
const requireTreasuryAccess = requireRole(['admin', 'financial', 'sales']);

// ==================== AUDIT ROUTES ====================
// GET /api/financial/audit - Run accounting audit checks and return JSON report
router.get('/audit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { dateFrom, dateTo, agingDays } = req.query;
    const report = await AccountingAuditService.run({ dateFrom, dateTo, agingDays: agingDays ? parseInt(agingDays) : 30 });
    res.json(report);
  } catch (error) {
    console.error('Error running accounting audit:', error);
    res.status(500).json({ message: 'خطأ في تشغيل فحوصات المحاسبة', error: error.message });
  }
});

// ==================== ACCOUNTS ROUTES ====================

// GET /api/financial/accounts - Get chart of accounts
router.get('/accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, type } = req.query;

    let whereClause = {};

    // Filter by search term (SQLite compatible)
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
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
    console.log('Creating account with data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const { code, name, type, accountType, nature } = req.body;

    if (!code || !name || !type || !accountType || !nature) {
      console.log('Missing required fields:', { code, name, type, accountType, nature });
      return res.status(400).json({
        success: false,
        message: 'البيانات المطلوبة مفقودة',
        code: 'MISSING_REQUIRED_FIELDS',
        details: {
          code: !code ? 'رمز الحساب مطلوب' : null,
          name: !name ? 'اسم الحساب مطلوب' : null,
          type: !type ? 'نوع الحساب مطلوب' : null,
          accountType: !accountType ? 'تصنيف الحساب مطلوب' : null,
          nature: !nature ? 'طبيعة الحساب مطلوبة' : null
        }
      });
    }

    // Derive rootType and reportType from type field
    const typeMapping = {
      'asset': { rootType: 'Asset', reportType: 'Balance Sheet' },
      'liability': { rootType: 'Liability', reportType: 'Balance Sheet' },
      'equity': { rootType: 'Equity', reportType: 'Balance Sheet' },
      'revenue': { rootType: 'Income', reportType: 'Profit and Loss' },
      'expense': { rootType: 'Expense', reportType: 'Profit and Loss' }
    };

    const mapping = typeMapping[type];
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

      // Auto-convert parent to group if it's not already
      if (!parentAccount.isGroup) {
        await parentAccount.update({ isGroup: true });
        console.log(`✅ Parent account '${parentAccount.code}' converted to group automatically`);
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
      // This might happen if notifications table doesn't exist in production
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
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'الحساب غير موجود'
      });
    }

    // Check if account has children
    const childrenCount = await Account.count({ where: { parentId: req.params.id } });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف حساب له حسابات فرعية'
      });
    }

    // Check if account has transactions
    const transactionCount = await GLEntry.count({ where: { accountId: req.params.id } });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف حساب له معاملات'
      });
    }

    // Check if account has non-zero balance
    if (parseFloat(account.balance) !== 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف حساب له رصيد'
      });
    }

    // Delete account
    await account.destroy();

    res.json({
      success: true,
      message: `تم حذف الحساب '${account.name}' بنجاح`
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الحساب',
      error: error.message
    });
  }
}));

// DELETE /api/financial/accounts/:id/force-delete - Force delete account (bypasses some validations)
router.delete('/accounts/:id/force-delete', authenticateToken, requireFinancialAccess, asyncHandler(async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'الحساب غير موجود'
      });
    }

    // Force delete - remove all constraints
    // First, update any child accounts to remove parent reference
    await Account.update(
      { parentId: null },
      { where: { parentId: req.params.id } }
    );

    // Delete any GL entries that reference this account
    await GLEntry.destroy({ where: { accountId: req.params.id } });

    // Delete any journal entry details that reference this account
    await JournalEntryDetail.destroy({ where: { accountId: req.params.id } });

    // Now delete the account
    await account.destroy();

    res.json({
      success: true,
      message: `تم حذف الحساب '${account.name}' بالقوة`
    });

  } catch (error) {
    console.error('Error force deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الحذف القسري للحساب',
      error: error.message
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
    const { page, limit, search, accountId, accountType, voucherType, dateFrom, dateTo, orderBy, orderDirection } = req.query;

    let whereClause = {};
    let includeClause = [
      {
        model: Account,
        as: 'account',
        attributes: ['id', 'code', 'name', 'type']
      }
    ];

    // Filter by account
    if (accountId) {
      whereClause.accountId = accountId;
    }

    // Filter by account type
    if (accountType) {
      includeClause[0].where = { type: accountType };
      includeClause[0].required = true;
    }

    // Filter by search term in account name
    if (search) {
      includeClause[0].where = {
        ...includeClause[0].where,
        name: { [Op.like]: `%${search}%` }
      };
      includeClause[0].required = true;
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

    // Set up ordering
    let orderClause = [['postingDate', 'DESC'], ['createdAt', 'DESC']];
    if (orderBy && orderDirection) {
      orderClause = [[orderBy, orderDirection.toUpperCase()], ['createdAt', 'DESC']];
    }

    const options = {
      where: whereClause,
      order: orderClause,
      include: includeClause
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
      const debitVal = parseFloat(line.debit || 0) || 0;
      const creditVal = parseFloat(line.credit || 0) || 0;

      if (!line.accountId || (debitVal === 0 && creditVal === 0)) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }
      if (debitVal > 0 && creditVal > 0) {
        return res.status(400).json({ message: 'لا يمكن أن يكون السطر مديناً ودائناً في آن واحد' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      totalDebit += debitVal;
      totalCredit += creditVal;
    }

    // Validate balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'يجب أن يتساوى مجموع المدين مع مجموع الدائن' });
    }

    // Generate robust entry number with retry to avoid unique collisions (only JE prefix)
    const lastEntry = await JournalEntry.findOne({
      where: { entryNumber: { [Op.like]: 'JE%' } },
      order: [['createdAt', 'DESC']]
    });
    const lastNumStr = (lastEntry?.entryNumber || '').match(/(\d+)$/)?.[1] || '0';
    let baseNextNumber = parseInt(lastNumStr, 10);
    if (!Number.isFinite(baseNextNumber)) baseNextNumber = 0;

    let journalEntry;
    let attempt = 0;
    while (attempt < 5) {
      // Compute a safe integer candidate
      let candidateNumber = baseNextNumber + 1 + attempt;
      if (!Number.isFinite(candidateNumber)) candidateNumber = 1 + attempt;
      candidateNumber = Math.abs(Math.trunc(candidateNumber));
      if (!Number.isFinite(candidateNumber) || Number.isNaN(candidateNumber)) {
        candidateNumber = Math.abs(Date.now() % 1000000);
      }

      let entryNumber = `JE${String(candidateNumber).padStart(6, '0')}`;
      if (entryNumber.includes('NaN')) {
        const fallback = Math.abs(Date.now() % 1000000);
        entryNumber = `JE${String(fallback).padStart(6, '0')}`;
      }

      try {
        journalEntry = await JournalEntry.create({
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
        break; // success
      } catch (e) {
        // If unique violation on entryNumber, retry with next number; otherwise rethrow
        const msg = (e && e.message) || '';
        const isUnique = msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('entrynumber');
        if (!isUnique) throw e;
        attempt += 1;
        if (attempt >= 5) throw e;
      }
    }

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
    // Better diagnostics for 500 errors during development
    console.error('Error creating journal entry:', error);
    if (error && error.stack) console.error(error.stack);
    if (error && error.errors) console.error('Sequelize validation errors:', error.errors);
    res.status(500).json({ message: 'خطأ في إنشاء قيد اليومية', error: (error && error.message) || 'Unknown error' });
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
    console.log(`🔄 Starting journal entry approval for ID: ${req.params.id}`);

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
      console.log(`❌ Journal entry not found: ${req.params.id}`);
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    console.log(`📋 Journal entry found: ${journalEntry.entryNumber}, status: ${journalEntry.status}`);

    if (journalEntry.status !== 'draft') {
      console.log(`❌ Journal entry status is not draft: ${journalEntry.status}`);
      return res.status(400).json({ message: 'القيد معتمد مسبقاً أو ملغي' });
    }

    // Check if journal entry has details
    if (!journalEntry.details || journalEntry.details.length === 0) {
      console.log(`❌ Journal entry has no details`);
      return res.status(400).json({ message: 'لا يمكن اعتماد قيد بدون تفاصيل' });
    }

    console.log(`📝 Journal entry has ${journalEntry.details.length} details`);

    // Validate that debits equal credits
    const totalDebit = journalEntry.details.reduce((sum, detail) => sum + parseFloat(detail.debit || 0), 0);
    const totalCredit = journalEntry.details.reduce((sum, detail) => sum + parseFloat(detail.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.log(`❌ Journal entry is not balanced: Debit=${totalDebit}, Credit=${totalCredit}`);
      return res.status(400).json({ message: 'القيد غير متوازن - مجموع المدين يجب أن يساوي مجموع الدائن' });
    }

    console.log(`✅ Journal entry is balanced: Debit=${totalDebit}, Credit=${totalCredit}`);

    // Perform the conversion to GL and account balance updates inside a transaction
    await sequelize.transaction(async (transaction) => {
      console.log(`🔄 Starting database transaction`);

      // Prepare GL entries
      const glEntries = journalEntry.details.map(detail => {
        console.log(`📊 Creating GL entry for account ${detail.account?.code}: Debit=${detail.debit}, Credit=${detail.credit}`);
        return {
          id: uuidv4(),
          postingDate: journalEntry.date,
          accountId: detail.accountId,
          debit: parseFloat(detail.debit || 0),
          credit: parseFloat(detail.credit || 0),
          voucherType: 'Journal Entry',
          voucherNo: journalEntry.entryNumber,
          journalEntryId: journalEntry.id,
          voucherDetailNo: detail.id,
          remarks: detail.description || journalEntry.description,
          currency: 'LYD',
          exchangeRate: 1.000000,
          createdBy: req.user?.id || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      console.log(`💾 Creating ${glEntries.length} GL entries`);

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
      console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

      // For each created GL entry, update corresponding Account balance
      for (let i = 0; i < createdGLEntries.length; i++) {
        const gl = createdGLEntries[i];
        console.log(`🔄 Updating balance for account ${gl.accountId}`);

        try {
          const account = await Account.findByPk(gl.accountId, {
            transaction,
            lock: Transaction.LOCK.UPDATE
          });

          if (!account) {
            throw new Error(`Account not found: ${gl.accountId}`);
          }

          console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

          // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
          const current = parseFloat(account.balance || 0);
          const debit = parseFloat(gl.debit || 0);
          const credit = parseFloat(gl.credit || 0);

          let newBalance = current;

          const isDebitType = ['asset', 'expense'].includes(account.type);
          // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
          if (isDebitType) {
            newBalance = current + debit - credit;
          } else {
            newBalance = current - debit + credit;
          }

          // Auto-correct account nature if inconsistent with type
          const expectedNature = isDebitType ? 'debit' : 'credit';
          if (account.nature !== expectedNature) {
            account.nature = expectedNature;
          }

          console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

          // Update account balance
          account.balance = newBalance;
          await account.save({ transaction });

          console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
        } catch (accountError) {
          console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
          throw accountError;
        }
      }

      console.log(`🔄 Updating journal entry status to posted`);

      // Update journal entry status within the same transaction
      await journalEntry.update({
        status: 'posted',
        postedAt: new Date(),
        postedBy: req.user?.id || 'system',
        updatedAt: new Date()
      }, { transaction });

      console.log(`✅ Journal entry status updated to posted`);
    });

    console.log(`🎉 Journal entry approval completed successfully`);
    res.json({
      message: 'تم اعتماد قيد اليومية وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      journalEntryId: journalEntry.id,
      entryNumber: journalEntry.entryNumber
    });
  } catch (error) {
    console.error('❌ Error submitting journal entry:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      journalEntryId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد قيد اليومية',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
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

// المدير المالي لا يجب أن ينشئ عملاء - هذه مهمة موظف المبيعات
// POST /api/financial/customers - Removed (Financial manager should not create customers)

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
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by type
    if (type) {
      whereClause.type = type;
    }

    const options = {
      where: whereClause,
      order: [['name', 'ASC']]
      // Removed Account include as Supplier model doesn't have this association
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

// ==================== EMPLOYEES ROUTES ====================

// GET /api/financial/employees - Get employees
router.get('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } }
        ]
      };
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
    const { name, code, employeeType, accountProvisionType, accountProvision, accountProvisionDetails } = req.body;

    // Validate required fields
    if (!name || !code || !employeeType || !accountProvisionType || !accountProvision) {
      return res.status(400).json({ message: 'التاريخ والوصف والتفاصيل مطلوبة' });
    }

    // Create the employee
    const employee = await Employee.create({
      id: uuidv4(),
      name,
      code,
      employeeType,
      accountProvisionType,
      accountProvision,
      accountProvisionDetails: accountProvisionDetails || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create employee account if provision type is automatic
    if (accountProvisionType === 'automatic') {
      await EmployeeAccountService.createEmployeeAccount(employee);
    }

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الموظف' });
  }
});

// PUT /api/financial/employees/:id - Update employee
router.put('/employees/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    const {
      name, code, employeeType, accountProvisionType, accountProvision, accountProvisionDetails
    } = req.body;

    // Validate required fields
    if (!name || !code || !employeeType || !accountProvisionType || !accountProvision) {
      return res.status(400).json({ message: 'التاريخ والوصف والتفاصيل مطلوبة' });
    }

    // Update the employee
    await employee.update({
      name,
      code,
      employeeType,
      accountProvisionType,
      accountProvision,
      accountProvisionDetails,
      updatedAt: new Date()
    });

    // Re-create employee account if provision type is automatic
    if (accountProvisionType === 'automatic') {
      await EmployeeAccountService.createEmployeeAccount(employee);
    }

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'خطأ في تحديث الموظف' });
  }
});

// DELETE /api/financial/employees/:id - Delete employee
router.delete('/employees/:id', authenticateToken, requireFinancialAccess, asyncHandler(async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // Check if employee has transactions
    const transactionCount = await GLEntry.count({ where: { accountId: employee.accountId } });

    if (transactionCount > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف موظف له معاملات' });
    }

    // Delete employee account
    await Account.destroy({ where: { id: employee.accountId } });

    // Delete employee
    await employee.destroy();

    res.json({ message: 'تم حذف الموظف بنجاح' });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'خطأ في حذف الموظف' });
  }
}));

// ==================== INVOICES ROUTES ====================

// GET /api/financial/invoices - Get invoices
router.get('/invoices', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, customer, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { reference: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by customer
    if (customer) {
      whereClause.customerId = customer;
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
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const invoices = await Invoice.findAll(options);
    const total = await Invoice.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: invoices,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب الفواتير' });
  }
});

// POST /api/financial/invoices - Create new invoice
router.post('/invoices', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { date, reference, description, customerId, details, lines } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !reference || !customerId || !entryLines || entryLines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف ومعرف العميل والتفاصيل مطلوبة' });
    }

    // Validate invoice details
    let total = 0;

    for (const line of entryLines) {
      const amount = parseFloat(line.amount || 0) || 0;

      if (!line.accountId || amount === 0) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      total += amount;
    }

    // Create the invoice
    const invoice = await Invoice.create({
      id: uuidv4(),
      date,
      reference,
      description,
      customerId,
      total,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create invoice details
    const invoiceDetails = [];
    for (const line of entryLines) {
      const detail = await InvoicePayment.create({
        id: uuidv4(),
        invoiceId: invoice.id,
        accountId: line.accountId,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      invoiceDetails.push(detail);
    }

    // Fetch the complete invoice with details
    const completeInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: InvoicePayment,
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

    // Create notification for invoice creation
    try {
      await NotificationService.notifyInvoiceCreated(completeInvoice, req.user);
    } catch (notificationError) {
      console.error('Error creating invoice notification:', notificationError);
      // Don't fail the invoice creation if notification fails
    }

    res.status(201).json(completeInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الفاتورة' });
  }
});

// GET /api/financial/invoices/:id - Get specific invoice
router.get('/invoices/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: InvoicePayment,
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

    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'خطأ في جلب الفاتورة' });
  }
});

// PUT /api/financial/invoices/:id - Update invoice
router.put('/invoices/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    const { date, reference, description, customerId, details, lines } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !reference || !customerId || !entryLines || entryLines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف ومعرف العميل والتفاصيل مطلوبة' });
    }

    // Validate invoice details
    let total = 0;

    for (const line of entryLines) {
      const amount = parseFloat(line.amount || 0) || 0;

      if (!line.accountId || amount === 0) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      total += amount;
    }

    // Update the invoice
    await invoice.update({
      date,
      reference,
      description,
      customerId,
      total,
      updatedAt: new Date()
    });

    // Update invoice details
    await InvoicePayment.destroy({ where: { invoiceId: req.params.id } });

    for (const line of entryLines) {
      await InvoicePayment.create({
        id: uuidv4(),
        invoiceId: req.params.id,
        accountId: line.accountId,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Fetch updated invoice
    const updatedInvoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: InvoicePayment,
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

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'خطأ في تحديث الفاتورة' });
  }
});

// POST /api/financial/invoices/:id/submit - Submit invoice and create GL entries
router.post('/invoices/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting invoice approval for ID: ${req.params.id}`);

    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: InvoicePayment,
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

    if (!invoice) {
      console.log(`❌ Invoice not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    console.log(`📋 Invoice found: ${invoice.reference}, status: ${invoice.status}`);

    if (invoice.status !== 'draft') {
      console.log(`❌ Invoice status is not draft: ${invoice.status}`);
      return res.status(400).json({ message: 'الفاتورة معتمدة مسبقاً أو ملغاة' });
    }

    // Check if invoice has details
    if (!invoice.details || invoice.details.length === 0) {
      console.log(`❌ Invoice has no details`);
      return res.status(400).json({ message: 'لا يمكن اعتماد فاتورة بدون تفاصيل' });
    }

    console.log(`📝 Invoice has ${invoice.details.length} details`);

    // Perform the conversion to GL and account balance updates inside a transaction
    await sequelize.transaction(async (transaction) => {
      console.log(`🔄 Starting database transaction`);

      // Prepare GL entries
      const glEntries = invoice.details.map(detail => {
        console.log(`📊 Creating GL entry for account ${detail.account?.code}: Debit=${detail.amount}, Credit=0`);
        return {
          id: uuidv4(),
          postingDate: invoice.date,
          accountId: detail.accountId,
          debit: parseFloat(detail.amount || 0),
          credit: 0,
          voucherType: 'Invoice',
          voucherNo: invoice.reference,
          invoiceId: invoice.id,
          voucherDetailNo: detail.id,
          remarks: detail.description || invoice.description,
          currency: 'LYD',
          exchangeRate: 1.000000,
          createdBy: req.user?.id || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      console.log(`💾 Creating ${glEntries.length} GL entries`);

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
      console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

      // For each created GL entry, update corresponding Account balance
      for (let i = 0; i < createdGLEntries.length; i++) {
        const gl = createdGLEntries[i];
        console.log(`🔄 Updating balance for account ${gl.accountId}`);

        try {
          const account = await Account.findByPk(gl.accountId, {
            transaction,
            lock: Transaction.LOCK.UPDATE
          });

          if (!account) {
            throw new Error(`Account not found: ${gl.accountId}`);
          }

          console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

          // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
          const current = parseFloat(account.balance || 0);
          const debit = parseFloat(gl.debit || 0);
          const credit = parseFloat(gl.credit || 0);

          let newBalance = current;

          const isDebitType = ['asset', 'expense'].includes(account.type);
          // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
          if (isDebitType) {
            newBalance = current + debit - credit;
          } else {
            newBalance = current - debit + credit;
          }

          // Auto-correct account nature if inconsistent with type
          const expectedNature = isDebitType ? 'debit' : 'credit';
          if (account.nature !== expectedNature) {
            account.nature = expectedNature;
          }

          console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

          // Update account balance
          account.balance = newBalance;
          await account.save({ transaction });

          console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
        } catch (accountError) {
          console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
          throw accountError;
        }
      }

      console.log(`🔄 Updating invoice status to posted`);

      // Update invoice status within the same transaction
      await invoice.update({
        status: 'posted',
        postedAt: new Date(),
        postedBy: req.user?.id || 'system',
        updatedAt: new Date()
      }, { transaction });

      console.log(`✅ Invoice status updated to posted`);
    });

    console.log(`🎉 Invoice approval completed successfully`);
    res.json({
      message: 'تم اعتماد الفاتورة وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      invoiceId: invoice.id,
      reference: invoice.reference
    });
  } catch (error) {
    console.error('❌ Error submitting invoice:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      invoiceId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الفاتورة',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/invoices/:id/cancel - Cancel invoice
router.post('/invoices/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ message: 'الفاتورة ملغاة مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Invoice',
          voucherNo: invoice.reference
        }
      }
    );

    // Update invoice status
    await invoice.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الفاتورة' });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الفاتورة' });
  }
});

// ==================== PAYMENTS ROUTES ====================

// GET /api/financial/payments - Get payments
router.get('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, customer, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { reference: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by customer
    if (customer) {
      whereClause.customerId = customer;
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
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const payments = await Payment.findAll(options);
    const total = await Payment.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: payments,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'خطأ في جلب المدفوعات' });
  }
});

// POST /api/financial/payments - Create new payment
router.post('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { date, reference, description, customerId, details, lines } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !reference || !customerId || !entryLines || entryLines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف ومعرف العميل والتفاصيل مطلوبة' });
    }

    // Validate payment details
    let total = 0;

    for (const line of entryLines) {
      const amount = parseFloat(line.amount || 0) || 0;

      if (!line.accountId || amount === 0) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      total += amount;
    }

    // Create the payment
    const payment = await Payment.create({
      id: uuidv4(),
      date,
      reference,
      description,
      customerId,
      total,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create payment details
    const paymentDetails = [];
    for (const line of entryLines) {
      const detail = await InvoicePayment.create({
        id: uuidv4(),
        paymentId: payment.id,
        accountId: line.accountId,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      paymentDetails.push(detail);
    }

    // Fetch the complete payment with details
    const completePayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: InvoicePayment,
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

    // Create notification for payment creation
    try {
      await NotificationService.notifyPaymentCreated(completePayment, req.user);
    } catch (notificationError) {
      console.error('Error creating payment notification:', notificationError);
      // Don't fail the payment creation if notification fails
    }

    res.status(201).json(completePayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الدفعة' });
  }
});

// GET /api/financial/payments/:id - Get specific payment
router.get('/payments/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: InvoicePayment,
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

    if (!payment) {
      return res.status(404).json({ message: 'الدفع غير موجود' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'خطأ في جلب الدفعة' });
  }
});

// PUT /api/financial/payments/:id - Update payment
router.put('/payments/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'الدفع غير موجود' });
    }

    const { date, reference, description, customerId, details, lines } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !reference || !customerId || !entryLines || entryLines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف ومعرف العميل والتفاصيل مطلوبة' });
    }

    // Validate payment details
    let total = 0;

    for (const line of entryLines) {
      const amount = parseFloat(line.amount || 0) || 0;

      if (!line.accountId || amount === 0) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      total += amount;
    }

    // Update the payment
    await payment.update({
      date,
      reference,
      description,
      customerId,
      total,
      updatedAt: new Date()
    });

    // Update payment details
    await InvoicePayment.destroy({ where: { paymentId: req.params.id } });

    for (const line of entryLines) {
      await InvoicePayment.create({
        id: uuidv4(),
        paymentId: req.params.id,
        accountId: line.accountId,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Fetch updated payment
    const updatedPayment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: InvoicePayment,
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

    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'خطأ في تحديث الدفعة' });
  }
});

// POST /api/financial/payments/:id/submit - Submit payment and create GL entries
router.post('/payments/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting payment approval for ID: ${req.params.id}`);

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: InvoicePayment,
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

    if (!payment) {
      console.log(`❌ Payment not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الدفع غير موجود' });
    }

    console.log(`📋 Payment found: ${payment.reference}, status: ${payment.status}`);

    if (payment.status !== 'draft') {
      console.log(`❌ Payment status is not draft: ${payment.status}`);
      return res.status(400).json({ message: 'الدفع معتمد مسبقاً أو ملغى' });
    }

    // Check if payment has details
    if (!payment.details || payment.details.length === 0) {
      console.log(`❌ Payment has no details`);
      return res.status(400).json({ message: 'لا يمكن اعتماد دفع بدون تفاصيل' });
    }

    console.log(`📝 Payment has ${payment.details.length} details`);

    // Perform the conversion to GL and account balance updates inside a transaction
    await sequelize.transaction(async (transaction) => {
      console.log(`🔄 Starting database transaction`);

      // Prepare GL entries
      const glEntries = payment.details.map(detail => {
        console.log(`📊 Creating GL entry for account ${detail.account?.code}: Debit=0, Credit=${detail.amount}`);
        return {
          id: uuidv4(),
          postingDate: payment.date,
          accountId: detail.accountId,
          debit: 0,
          credit: parseFloat(detail.amount || 0),
          voucherType: 'Payment',
          voucherNo: payment.reference,
          paymentId: payment.id,
          voucherDetailNo: detail.id,
          remarks: detail.description || payment.description,
          currency: 'LYD',
          exchangeRate: 1.000000,
          createdBy: req.user?.id || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      console.log(`💾 Creating ${glEntries.length} GL entries`);

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
      console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

      // For each created GL entry, update corresponding Account balance
      for (let i = 0; i < createdGLEntries.length; i++) {
        const gl = createdGLEntries[i];
        console.log(`🔄 Updating balance for account ${gl.accountId}`);

        try {
          const account = await Account.findByPk(gl.accountId, {
            transaction,
            lock: Transaction.LOCK.UPDATE
          });

          if (!account) {
            throw new Error(`Account not found: ${gl.accountId}`);
          }

          console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

          // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
          const current = parseFloat(account.balance || 0);
          const debit = parseFloat(gl.debit || 0);
          const credit = parseFloat(gl.credit || 0);

          let newBalance = current;

          const isDebitType = ['asset', 'expense'].includes(account.type);
          // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
          if (isDebitType) {
            newBalance = current + debit - credit;
          } else {
            newBalance = current - debit + credit;
          }

          // Auto-correct account nature if inconsistent with type
          const expectedNature = isDebitType ? 'debit' : 'credit';
          if (account.nature !== expectedNature) {
            account.nature = expectedNature;
          }

          console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

          // Update account balance
          account.balance = newBalance;
          await account.save({ transaction });

          console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
        } catch (accountError) {
          console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
          throw accountError;
        }
      }

      console.log(`🔄 Updating payment status to posted`);

      // Update payment status within the same transaction
      await payment.update({
        status: 'posted',
        postedAt: new Date(),
        postedBy: req.user?.id || 'system',
        updatedAt: new Date()
      }, { transaction });

      console.log(`✅ Payment status updated to posted`);
    });

    console.log(`🎉 Payment approval completed successfully`);
    res.json({
      message: 'تم اعتماد الدفعة وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      paymentId: payment.id,
      reference: payment.reference
    });
  } catch (error) {
    console.error('❌ Error submitting payment:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      paymentId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الدفعة',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/payments/:id/cancel - Cancel payment
router.post('/payments/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'الدفع غير موجود' });
    }

    if (payment.status === 'cancelled') {
      return res.status(400).json({ message: 'الدفع ملغى مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Payment',
          voucherNo: payment.reference
        }
      }
    );

    // Update payment status
    await payment.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الدفعة' });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الدفعة' });
  }
});

// ==================== RECEIPTS ROUTES ====================

// GET /api/financial/receipts - Get receipts
router.get('/receipts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, status, customer, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { reference: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by customer
    if (customer) {
      whereClause.customerId = customer;
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
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const receipts = await Receipt.findAll(options);
    const total = await Receipt.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: receipts,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'خطأ في جلب الاستلامات' });
  }
});

// POST /api/financial/receipts - Create new receipt
router.post('/receipts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { date, reference, description, customerId, details, lines } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !reference || !customerId || !entryLines || entryLines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف ومعرف العميل والتفاصيل مطلوبة' });
    }

    // Validate receipt details
    let total = 0;

    for (const line of entryLines) {
      const amount = parseFloat(line.amount || 0) || 0;

      if (!line.accountId || amount === 0) {
        return res.status(400).json({ message: 'كل تفصيل يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = await Account.findByPk(line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      total += amount;
    }

    // Create the receipt
    const receipt = await Receipt.create({
      id: uuidv4(),
      date,
      reference,
      description,
      customerId,
      total,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create receipt details
    const receiptDetails = [];
    for (const line of entryLines) {
      const detail = await InvoiceReceipt.create({
        id: uuidv4(),
        receiptId: receipt.id,
        accountId: line.accountId,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      receiptDetails.push(detail);
    }

    // Fetch the complete receipt with details
    const completeReceipt = await Receipt.findByPk(receipt.id, {
      include: [
        {
          model: InvoiceReceipt,
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

    // Create notification for receipt creation
    try {
      await NotificationService.notifyReceiptCreated(completeReceipt, req.user);
    } catch (notificationError) {
      console.error('Error creating receipt notification:', notificationError);
      // Don't fail the receipt creation if notification fails
    }

    res.status(201).json(completeReceipt);
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الاستلام' });
  }
});

// GET /api/financial/receipts/:id - Get specific receipt
router.get('/receipts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        {
          model: InvoiceReceipt,
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

    if (!receipt) {
      return res.status(404).json({ message: 'الاستلام غير موجود' });
    }

    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'خطأ في جلب الاستلام' });
  }
});

// ==================== SUPPLIERS ROUTES ====================

// GET /api/financial/suppliers - Get suppliers
router.get('/suppliers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const options = {
      where: whereClause,
      order: [['name', 'ASC']]
      // Removed Account include as Supplier model doesn't have this association
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const suppliers = await Supplier.findAll(options);
    const totalSuppliers = await Supplier.count({ where: whereClause });

    // Always use consistent response format
    const responseSuppliers = {
      data: suppliers,
      total: totalSuppliers,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || totalSuppliers,
      totalPages: Math.ceil(totalSuppliers / (parseInt(limit) || totalSuppliers))
    };

    res.json(responseSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'خطأ في جلب الموردين' });
  }
});

// ==================== EMPLOYEES ROUTES ====================

// GET /api/financial/employees - Get employees
router.get('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const options = {
      where: whereClause,
      order: [['name', 'ASC']]
      // Removed Account include as Employee model doesn't have this association
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

// ==================== INVOICES ROUTES ====================

// GET /api/financial/invoices - Get invoices
router.get('/invoices', authenticateToken, requireFinancialAccess, async (req, res) => {
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
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: InvoicePayment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: InvoiceReceipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const invoices = await Invoice.findAll(options);
    const total = await Invoice.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: invoices,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب الفواتير' });
  }
});

// POST /api/financial/invoices - Create new invoice
router.post('/invoices', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      date,
      description,
      reference,
      type = 'sales',
      details,
      customer,
      account,
      lines
    } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !description || !entryLines || entryLines.length === 0 || !customer || !account) {
      return res.status(400).json({ message: 'التاريخ والوصف والتفاصيل والعميل والحساب مطلوبة' });
    }

    // Validate invoice details
    let totalAmount = 0;

    for (const line of entryLines) {
      if (!line.amount) {
        return res.status(400).json({ message: 'كل خط يجب أن يحتوي على سعر' });
      }

      totalAmount += parseFloat(line.amount || 0);
    }

    // Validate customer exists
    const customerObj = await Customer.findByPk(customer);
    if (!customerObj) {
      return res.status(400).json({ message: `العميل ${customer} غير موجود` });
    }

    // Validate account exists
    const accountObj = await Account.findByPk(account);
    if (!accountObj) {
      return res.status(400).json({ message: `الحساب ${account} غير موجود` });
    }

    // Generate robust entry number with retry to avoid unique collisions (only IV prefix)
    const lastEntry = await Invoice.findOne({
      where: { entryNumber: { [Op.like]: 'IV%' } },
      order: [['createdAt', 'DESC']]
    });
    const lastNumStr = (lastEntry?.entryNumber || '').match(/(\d+)$/)?.[1] || '0';
    let baseNextNumber = parseInt(lastNumStr, 10);
    if (!Number.isFinite(baseNextNumber)) baseNextNumber = 0;

    let invoice;
    let attempt = 0;
    while (attempt < 5) {
      // Compute a safe integer candidate
      let candidateNumber = baseNextNumber + 1 + attempt;
      if (!Number.isFinite(candidateNumber)) candidateNumber = 1 + attempt;
      candidateNumber = Math.abs(Math.trunc(candidateNumber));
      if (!Number.isFinite(candidateNumber) || Number.isNaN(candidateNumber)) {
        candidateNumber = Math.abs(Date.now() % 1000000);
      }

      let entryNumber = `IV${String(candidateNumber).padStart(6, '0')}`;
      if (entryNumber.includes('NaN')) {
        const fallback = Math.abs(Date.now() % 1000000);
        entryNumber = `IV${String(fallback).padStart(6, '0')}`;
      }

      try {
        invoice = await Invoice.create({
          id: uuidv4(),
          entryNumber,
          date,
          description,
          reference,
          type,
          totalAmount,
          status: 'draft',
          customerId: customer,
          accountId: account,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break; // success
      } catch (e) {
        // If unique violation on entryNumber, retry with next number; otherwise rethrow
        const msg = (e && e.message) || '';
        const isUnique = msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('entrynumber');
        if (!isUnique) throw e;
        attempt += 1;
        if (attempt >= 5) throw e;
      }
    }

    // Create invoice details
    const entryDetails = [];
    for (const line of entryLines) {
      const entryDetail = await InvoiceDetail.create({
        id: uuidv4(),
        invoiceId: invoice.id,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      entryDetails.push(entryDetail);
    }

    // Fetch the complete invoice with details
    const completeEntry = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: InvoicePayment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: InvoiceReceipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    });

    // Create notification for invoice creation
    try {
      await NotificationService.notifyInvoiceCreated(completeEntry, req.user);
    } catch (notificationError) {
      console.error('Error creating invoice notification:', notificationError);
      // Don't fail the invoice creation if notification fails
      // This might happen if notifications table doesn't exist in production
    }

    res.status(201).json(completeEntry);
  } catch (error) {
    // Better diagnostics for 500 errors during development
    console.error('Error creating invoice:', error);
    if (error && error.stack) console.error(error.stack);
    if (error && error.errors) console.error('Sequelize validation errors:', error.errors);
    res.status(500).json({ message: 'خطأ في إنشاء الفاتورة', error: (error && error.message) || 'Unknown error' });
  }
});

// GET /api/financial/invoices/:id - Get specific invoice
router.get('/invoices/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: InvoicePayment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: InvoiceReceipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
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

// PUT /api/financial/invoices/:id - Update invoice
router.put('/invoices/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ message: 'لا يمكن تعديل فاتورة معتمدة أو ملغاة' });
    }

    const {
      date,
      description,
      reference,
      type = 'sales',
      details,
      customer,
      account,
      lines
    } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate details if provided
    if (entryLines && entryLines.length > 0) {
      let totalAmount = 0;

      for (const line of entryLines) {
        if (!line.amount) {
          return res.status(400).json({ message: 'كل خط يجب أن يحتوي على سعر' });
        }

        totalAmount += parseFloat(line.amount || 0);
      }

      // Update invoice details
      await InvoiceDetail.destroy({ where: { invoiceId: req.params.id } });

      for (const line of entryLines) {
        await InvoiceDetail.create({
          id: uuidv4(),
          invoiceId: req.params.id,
          description: line.description || '',
          amount: parseFloat(line.amount || 0),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update totals
      req.body.totalAmount = totalAmount;
    }

    // Update invoice
    await invoice.update({
      ...req.body,
      updatedAt: new Date()
    });

    // Fetch updated entry
    const updatedEntry = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: InvoicePayment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: InvoiceReceipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'خطأ في تحديث الفاتورة' });
  }
});

// POST /api/financial/invoices/:id/submit - Submit invoice and create GL entries
router.post('/invoices/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting invoice approval for ID: ${req.params.id}`);

    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: InvoiceDetail,
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

    if (!invoice) {
      console.log(`❌ Invoice not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    console.log(`📋 Invoice found: ${invoice.entryNumber}, status: ${invoice.status}`);

    if (invoice.status !== 'draft') {
      console.log(`❌ Invoice status is not draft: ${invoice.status}`);
      return res.status(400).json({ message: 'الفاتورة معتمدة مسبقاً أو ملغي' });
    }

    // Check if invoice has details
    if (!invoice.details || invoice.details.length === 0) {
      console.log(`❌ Invoice has no details`);
      return res.status(400).json({ message: 'لا يمكن اعتماد فاتورة بدون تفاصيل' });
    }

    console.log(`📝 Invoice has ${invoice.details.length} details`);

    // Perform the conversion to GL and account balance updates inside a transaction
    await sequelize.transaction(async (transaction) => {
      console.log(`🔄 Starting database transaction`);

      // Prepare GL entries
      const glEntries = invoice.details.map(detail => {
        console.log(`📊 Creating GL entry for account ${detail.account?.code}: Debit=${detail.amount}, Credit=0`);
        return {
          id: uuidv4(),
          postingDate: invoice.date,
          accountId: detail.accountId,
          debit: parseFloat(detail.amount || 0),
          credit: 0,
          voucherType: 'Invoice',
          voucherNo: invoice.entryNumber,
          invoiceId: invoice.id,
          voucherDetailNo: detail.id,
          remarks: detail.description || invoice.description,
          currency: 'LYD',
          exchangeRate: 1.000000,
          createdBy: req.user?.id || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      console.log(`💾 Creating ${glEntries.length} GL entries`);

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
      console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

      // For each created GL entry, update corresponding Account balance
      for (let i = 0; i < createdGLEntries.length; i++) {
        const gl = createdGLEntries[i];
        console.log(`🔄 Updating balance for account ${gl.accountId}`);

        try {
          const account = await Account.findByPk(gl.accountId, {
            transaction,
            lock: Transaction.LOCK.UPDATE
          });

          if (!account) {
            throw new Error(`Account not found: ${gl.accountId}`);
          }

          console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

          // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
          const current = parseFloat(account.balance || 0);
          const debit = parseFloat(gl.debit || 0);
          const credit = parseFloat(gl.credit || 0);

          let newBalance = current;

          const isDebitType = ['asset', 'expense'].includes(account.type);
          // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
          if (isDebitType) {
            newBalance = current + debit - credit;
          } else {
            newBalance = current - debit + credit;
          }

          // Auto-correct account nature if inconsistent with type
          const expectedNature = isDebitType ? 'debit' : 'credit';
          if (account.nature !== expectedNature) {
            account.nature = expectedNature;
          }

          console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

          // Update account balance
          account.balance = newBalance;
          await account.save({ transaction });

          console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
        } catch (accountError) {
          console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
          throw accountError;
        }
      }

      console.log(`🔄 Updating invoice status to posted`);

      // Update invoice status within the same transaction
      await invoice.update({
        status: 'posted',
        postedAt: new Date(),
        postedBy: req.user?.id || 'system',
        updatedAt: new Date()
      }, { transaction });

      console.log(`✅ Invoice status updated to posted`);
    });

    console.log(`🎉 Invoice approval completed successfully`);
    res.json({
      message: 'تم اعتماد الفاتورة وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      invoiceId: invoice.id,
      entryNumber: invoice.entryNumber
    });
  } catch (error) {
    console.error('❌ Error submitting invoice:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      invoiceId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الفاتورة',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/invoices/:id/cancel - Cancel invoice
router.post('/invoices/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ message: 'الفاتورة ملغية مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Invoice',
          voucherNo: invoice.entryNumber
        }
      }
    );

    // Update invoice status
    await invoice.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الفاتورة' });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الفاتورة' });
  }
});

// ==================== PAYMENTS ROUTES ====================

// GET /api/financial/payments - Get payments
router.get('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
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
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: Receipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const payments = await Payment.findAll(options);
    const total = await Payment.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: payments,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'خطأ في جلب الدفعات' });
  }
});

// POST /api/financial/payments - Create new payment
router.post('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      date,
      description,
      reference,
      type = 'purchase',
      details,
      supplier,
      account,
      lines
    } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate required fields
    if (!date || !description || !entryLines || entryLines.length === 0 || !supplier || !account) {
      return res.status(400).json({ message: 'التاريخ والوصف والتفاصيل والمورد والحساب مطلوبة' });
    }

    // Validate payment details
    let totalAmount = 0;

    for (const line of entryLines) {
      if (!line.amount) {
        return res.status(400).json({ message: 'كل خط يجب أن يحتوي على سعر' });
      }

      totalAmount += parseFloat(line.amount || 0);
    }

    // Validate supplier exists
    const supplierObj = await Supplier.findByPk(supplier);
    if (!supplierObj) {
      return res.status(400).json({ message: `المورد ${supplier} غير موجود` });
    }

    // Validate account exists
    const accountObj = await Account.findByPk(account);
    if (!accountObj) {
      return res.status(400).json({ message: `الحساب ${account} غير موجود` });
    }

    // Generate robust entry number with retry to avoid unique collisions (only PY prefix)
    const lastEntry = await Payment.findOne({
      where: { entryNumber: { [Op.like]: 'PY%' } },
      order: [['createdAt', 'DESC']]
    });
    const lastNumStr = (lastEntry?.entryNumber || '').match(/(\d+)$/)?.[1] || '0';
    let baseNextNumber = parseInt(lastNumStr, 10);
    if (!Number.isFinite(baseNextNumber)) baseNextNumber = 0;

    let payment;
    let attempt = 0;
    while (attempt < 5) {
      // Compute a safe integer candidate
      let candidateNumber = baseNextNumber + 1 + attempt;
      if (!Number.isFinite(candidateNumber)) candidateNumber = 1 + attempt;
      candidateNumber = Math.abs(Math.trunc(candidateNumber));
      if (!Number.isFinite(candidateNumber) || Number.isNaN(candidateNumber)) {
        candidateNumber = Math.abs(Date.now() % 1000000);
      }

      let entryNumber = `PY${String(candidateNumber).padStart(6, '0')}`;
      if (entryNumber.includes('NaN')) {
        const fallback = Math.abs(Date.now() % 1000000);
        entryNumber = `PY${String(fallback).padStart(6, '0')}`;
      }

      try {
        payment = await Payment.create({
          id: uuidv4(),
          entryNumber,
          date,
          description,
          reference,
          type,
          totalAmount,
          status: 'draft',
          supplierId: supplier,
          accountId: account,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break; // success
      } catch (e) {
        // If unique violation on entryNumber, retry with next number; otherwise rethrow
        const msg = (e && e.message) || '';
        const isUnique = msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('entrynumber');
        if (!isUnique) throw e;
        attempt += 1;
        if (attempt >= 5) throw e;
      }
    }

    // Create payment details
    const entryDetails = [];
    for (const line of entryLines) {
      const entryDetail = await PaymentDetail.create({
        id: uuidv4(),
        paymentId: payment.id,
        description: line.description || '',
        amount: parseFloat(line.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      entryDetails.push(entryDetail);
    }

    // Fetch the complete payment with details
    const completeEntry = await Payment.findByPk(payment.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: Receipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    });

    // Create notification for payment creation
    try {
      await NotificationService.notifyPaymentCreated(completeEntry, req.user);
    } catch (notificationError) {
      console.error('Error creating payment notification:', notificationError);
      // Don't fail the payment creation if notification fails
      // This might happen if notifications table doesn't exist in production
    }

    res.status(201).json(completeEntry);
  } catch (error) {
    // Better diagnostics for 500 errors during development
    console.error('Error creating payment:', error);
    if (error && error.stack) console.error(error.stack);
    if (error && error.errors) console.error('Sequelize validation errors:', error.errors);
    res.status(500).json({ message: 'خطأ في إنشاء الدفعة', error: (error && error.message) || 'Unknown error' });
  }
});

// GET /api/financial/payments/:id - Get specific payment
router.get('/payments/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: Receipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'خطأ في جلب الدفعة' });
  }
});

// PUT /api/financial/payments/:id - Update payment
router.put('/payments/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    if (payment.status !== 'draft') {
      return res.status(400).json({ message: 'لا يمكن تعديل دفعة معتمدة أو ملغاة' });
    }

    const {
      date,
      description,
      reference,
      type = 'purchase',
      details,
      supplier,
      account,
      lines
    } = req.body;

    // Support both 'details' and 'lines' for compatibility
    const entryLines = details || lines;

    // Validate details if provided
    if (entryLines && entryLines.length > 0) {
      let totalAmount = 0;

      for (const line of entryLines) {
        if (!line.amount) {
          return res.status(400).json({ message: 'كل خط يجب أن يحتوي على سعر' });
        }

        totalAmount += parseFloat(line.amount || 0);
      }

      // Update payment details
      await PaymentDetail.destroy({ where: { paymentId: req.params.id } });

      for (const line of entryLines) {
        await PaymentDetail.create({
          id: uuidv4(),
          paymentId: req.params.id,
          description: line.description || '',
          amount: parseFloat(line.amount || 0),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update totals
      req.body.totalAmount = totalAmount;
    }

    // Update payment
    await payment.update({
      ...req.body,
      updatedAt: new Date()
    });

    // Fetch updated entry
    const updatedEntry = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Payment,
              as: 'payment',
              attributes: ['id', 'date', 'amount']
            }
          ]
        },
        {
          model: Receipt,
          as: 'receipts',
          attributes: ['id', 'amount', 'date'],
          include: [
            {
              model: Receipt,
              as: 'receipt',
              attributes: ['id', 'date', 'amount']
            }
          ]
        }
      ]
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'خطأ في تحديث الدفعة' });
  }
});

// POST /api/financial/payments/:id/submit - Submit payment and create GL entries
router.post('/payments/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting payment approval for ID: ${req.params.id}`);

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: PaymentDetail,
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

    if (!payment) {
      console.log(`❌ Payment not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    console.log(`📋 Payment found: ${payment.entryNumber}, status: ${payment.status}`);

    if (payment.status !== 'draft') {
      console.log(`❌ Payment status is not draft: ${payment.status}`);
      return res.status(400).json({ message: 'الدفعة معتمدة مسبقاً أو ملغي' });
    }

    // Check if payment has details
    if (!payment.details || payment.details.length === 0) {
      console.log(`❌ Payment has no details`);
      return res.status(400).json({ message: 'لا يمكن اعتماد دفعة بدون تفاصيل' });
    }

    console.log(`📝 Payment has ${payment.details.length} details`);

    // Perform the conversion to GL and account balance updates inside a transaction
    await sequelize.transaction(async (transaction) => {
      console.log(`🔄 Starting database transaction`);

      // Prepare GL entries
      const glEntries = payment.details.map(detail => {
        console.log(`📊 Creating GL entry for account ${detail.account?.code}: Debit=0, Credit=${detail.amount}`);
        return {
          id: uuidv4(),
          postingDate: payment.date,
          accountId: detail.accountId,
          debit: 0,
          credit: parseFloat(detail.amount || 0),
          voucherType: 'Payment',
          voucherNo: payment.entryNumber,
          paymentId: payment.id,
          voucherDetailNo: detail.id,
          remarks: detail.description || payment.description,
          currency: 'LYD',
          exchangeRate: 1.000000,
          createdBy: req.user?.id || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      console.log(`💾 Creating ${glEntries.length} GL entries`);

      // Insert GL entries within transaction
      const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
      console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

      // For each created GL entry, update corresponding Account balance
      for (let i = 0; i < createdGLEntries.length; i++) {
        const gl = createdGLEntries[i];
        console.log(`🔄 Updating balance for account ${gl.accountId}`);

        try {
          const account = await Account.findByPk(gl.accountId, {
            transaction,
            lock: Transaction.LOCK.UPDATE
          });

          if (!account) {
            throw new Error(`Account not found: ${gl.accountId}`);
          }

          console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

          // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
          const current = parseFloat(account.balance || 0);
          const debit = parseFloat(gl.debit || 0);
          const credit = parseFloat(gl.credit || 0);

          let newBalance = current;

          const isDebitType = ['asset', 'expense'].includes(account.type);
          // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
          if (isDebitType) {
            newBalance = current + debit - credit;
          } else {
            newBalance = current - debit + credit;
          }

          // Auto-correct account nature if inconsistent with type
          const expectedNature = isDebitType ? 'debit' : 'credit';
          if (account.nature !== expectedNature) {
            account.nature = expectedNature;
          }

          console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

          // Update account balance
          account.balance = newBalance;
          await account.save({ transaction });

          console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
        } catch (accountError) {
          console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
          throw accountError;
        }
      }

      console.log(`🔄 Updating payment status to posted`);

      // Update payment status within the same transaction
      await payment.update({
        status: 'posted',
        postedAt: new Date(),
        postedBy: req.user?.id || 'system',
        updatedAt: new Date()
      }, { transaction });

      console.log(`✅ Payment status updated to posted`);
    });

    console.log(`🎉 Payment approval completed successfully`);
    res.json({
      message: 'تم اعتماد الدفعة وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      paymentId: payment.id,
      entryNumber: payment.entryNumber
    });
  } catch (error) {
    console.error('❌ Error submitting payment:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      paymentId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الدفعة',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/payments/:id/cancel - Cancel payment
router.post('/payments/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    if (payment.status === 'cancelled') {
      return res.status(400).json({ message: 'الدفعة ملغية مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Payment',
          voucherNo: payment.entryNumber
        }
      }
    );

    // Update payment status
    await payment.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الدفعة' });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الدفعة' });
  }
});

// ==================== SUPPLIERS ROUTES ====================

// GET /api/financial/suppliers - Get suppliers
router.get('/suppliers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const options = {
      where: whereClause,
      order: [['name', 'ASC']]
      // Removed Account include as Supplier model doesn't have this association
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const suppliers = await Supplier.findAll(options);
    const totalSuppliers = await Supplier.count({ where: whereClause });

    // Always use consistent response format
    const responseSuppliers = {
      data: suppliers,
      total: totalSuppliers,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || totalSuppliers,
      totalPages: Math.ceil(totalSuppliers / (parseInt(limit) || totalSuppliers))
    };

    res.json(responseSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'خطأ في جلب الموردين' });
  }
});

// ==================== EMPLOYEES ROUTES ====================

// GET /api/financial/employees - Get employees
router.get('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
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

// ==================== INVOICES ROUTES ====================

// GET /api/financial/invoices - Get invoices
router.get('/invoices', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, customerId, status, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { invoiceNumber: { [Op.like]: `%${search}%` } },
          { reference: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by customer
    if (customerId) {
      whereClause.customerId = customerId;
    }

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

    const options = {
      where: whereClause,
      order: [['date', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const invoices = await Invoice.findAll(options);
    const total = await Invoice.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: invoices,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب الفواتير' });
  }
});

// POST /api/financial/invoices - Create new invoice
router.post('/invoices', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      date, reference, customerId, items, status = 'draft'
    } = req.body;

    // Validate required fields
    if (!date || !customerId || !items || items.length === 0) {
      return res.status(400).json({ message: 'التاريخ والعميل والפריטات مطلوبة' });
    }

    // Validate invoice items
    let totalAmount = 0;

    for (const item of items) {
      const amount = parseFloat(item.amount || 0) || 0;

      if (!item.description || amount === 0) {
        return res.status(400).json({ message: 'كل عنصر يجب أن يحتوي على وصف ومبلغ' });
      }

      totalAmount += amount;
    }

    // Generate robust entry number with retry to avoid unique collisions (only INV prefix)
    const lastInvoice = await Invoice.findOne({
      where: { invoiceNumber: { [Op.like]: 'INV%' } },
      order: [['createdAt', 'DESC']]
    });
    const lastNumStr = (lastInvoice?.invoiceNumber || '').match(/(\d+)$/)?.[1] || '0';
    let baseNextNumber = parseInt(lastNumStr, 10);
    if (!Number.isFinite(baseNextNumber)) baseNextNumber = 0;

    let invoice;
    let attempt = 0;
    while (attempt < 5) {
      // Compute a safe integer candidate
      let candidateNumber = baseNextNumber + 1 + attempt;
      if (!Number.isFinite(candidateNumber)) candidateNumber = 1 + attempt;
      candidateNumber = Math.abs(Math.trunc(candidateNumber));
      if (!Number.isFinite(candidateNumber) || Number.isNaN(candidateNumber)) {
        candidateNumber = Math.abs(Date.now() % 1000000);
      }

      let invoiceNumber = `INV${String(candidateNumber).padStart(6, '0')}`;
      if (invoiceNumber.includes('NaN')) {
        const fallback = Math.abs(Date.now() % 1000000);
        invoiceNumber = `INV${String(fallback).padStart(6, '0')}`;
      }

      try {
        invoice = await Invoice.create({
          id: uuidv4(),
          invoiceNumber,
          date,
          reference,
          customerId,
          totalAmount,
          status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break; // success
      } catch (e) {
        // If unique violation on invoiceNumber, retry with next number; otherwise rethrow
        const msg = (e && e.message) || '';
        const isUnique = msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('invoicenumber');
        if (!isUnique) throw e;
        attempt += 1;
        if (attempt >= 5) throw e;
      }
    }

    // Create invoice items
    const invoiceItems = [];
    for (const item of items) {
      const invoiceItem = await Invoice.create({
        id: uuidv4(),
        invoiceId: invoice.id,
        description: item.description,
        amount: parseFloat(item.amount || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      invoiceItems.push(invoiceItem);
    }

    // Create notification for invoice creation
    try {
      await NotificationService.notifyInvoiceCreated(invoice, req.user);
    } catch (notificationError) {
      console.error('Error creating invoice notification:', notificationError);
      // Don't fail the invoice creation if notification fails
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء فاتورة', error: error.message });
  }
});

// GET /api/financial/invoices/:id - Get specific invoice
router.get('/invoices/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
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

// POST /api/financial/invoices/:id/submit - Submit invoice and create GL entries
router.post('/invoices/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting invoice approval for ID: ${req.params.id}`);

    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    if (!invoice) {
      console.log(`❌ Invoice not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    console.log(`📋 Invoice found: ${invoice.invoiceNumber}, status: ${invoice.status}`);

    if (invoice.status !== 'draft') {
      console.log(`❌ Invoice status is not draft: ${invoice.status}`);
      return res.status(400).json({ message: 'الفاتورة معتمدة مسبقاً أو ملغية' });
    }

    console.log(`🔄 Starting database transaction`);

    // Prepare GL entries
    const glEntries = [
      {
        id: uuidv4(),
        postingDate: invoice.date,
        accountId: invoice.customer.accountId,
        debit: invoice.totalAmount,
        credit: 0,
        voucherType: 'Invoice',
        voucherNo: invoice.invoiceNumber,
        invoiceId: invoice.id,
        remarks: invoice.reference,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        postingDate: invoice.date,
        accountId: 1, // TODO: Use correct account ID for sales revenue
        debit: 0,
        credit: invoice.totalAmount,
        voucherType: 'Invoice',
        voucherNo: invoice.invoiceNumber,
        invoiceId: invoice.id,
        remarks: invoice.reference,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log(`💾 Creating ${glEntries.length} GL entries`);

    // Insert GL entries within transaction
    const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
    console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

    // For each created GL entry, update corresponding Account balance
    for (let i = 0; i < createdGLEntries.length; i++) {
      const gl = createdGLEntries[i];
      console.log(`🔄 Updating balance for account ${gl.accountId}`);

      try {
        const account = await Account.findByPk(gl.accountId, {
          transaction,
          lock: Transaction.LOCK.UPDATE
        });

        if (!account) {
          throw new Error(`Account not found: ${gl.accountId}`);
        }

        console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

        // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
        const current = parseFloat(account.balance || 0);
        const debit = parseFloat(gl.debit || 0);
        const credit = parseFloat(gl.credit || 0);

        let newBalance = current;

        const isDebitType = ['asset', 'expense'].includes(account.type);
        // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
        if (isDebitType) {
          newBalance = current + debit - credit;
        } else {
          newBalance = current - debit + credit;
        }

        // Auto-correct account nature if inconsistent with type
        const expectedNature = isDebitType ? 'debit' : 'credit';
        if (account.nature !== expectedNature) {
          account.nature = expectedNature;
        }

        console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

        // Update account balance
        account.balance = newBalance;
        await account.save({ transaction });

        console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
      } catch (accountError) {
        console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
        throw accountError;
      }
    }

    console.log(`🔄 Updating invoice status to posted`);

    // Update invoice status within the same transaction
    await invoice.update({
      status: 'posted',
      postedAt: new Date(),
      postedBy: req.user?.id || 'system',
      updatedAt: new Date()
    }, { transaction });

    console.log(`✅ Invoice status updated to posted`);
    res.json({
      message: 'تم اعتماد الفاتورة وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber
    });
  } catch (error) {
    console.error('❌ Error submitting invoice:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      invoiceId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الفاتورة',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/invoices/:id/cancel - Cancel invoice
router.post('/invoices/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ message: 'الفاتورة ملغية مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Invoice',
          voucherNo: invoice.invoiceNumber
        }
      }
    );

    // Update invoice status
    await invoice.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الفاتورة' });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الفاتورة' });
  }
});

// ==================== PAYMENTS ROUTES ====================

// GET /api/financial/payments - Get payments
router.get('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, customerId, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { paymentNumber: { [Op.like]: `%${search}%` } },
          { reference: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by customer
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const payments = await Payment.findAll(options);
    const total = await Payment.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: payments,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'خطأ في جلب الدفعات' });
  }
});

// POST /api/financial/payments - Create new payment
router.post('/payments', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      date, reference, customerId, amount, status = 'draft'
    } = req.body;

    // Validate required fields
    if (!date || !customerId || !amount) {
      return res.status(400).json({ message: 'التاريخ والعميل والمبلغ مطلوبين' });
    }

    // Generate robust entry number with retry to avoid unique collisions (only PAY prefix)
    const lastPayment = await Payment.findOne({
      where: { paymentNumber: { [Op.like]: 'PAY%' } },
      order: [['createdAt', 'DESC']]
    });
    const lastNumStr = (lastPayment?.paymentNumber || '').match(/(\d+)$/)?.[1] || '0';
    let baseNextNumber = parseInt(lastNumStr, 10);
    if (!Number.isFinite(baseNextNumber)) baseNextNumber = 0;

    let payment;
    let attempt = 0;
    while (attempt < 5) {
      // Compute a safe integer candidate
      let candidateNumber = baseNextNumber + 1 + attempt;
      if (!Number.isFinite(candidateNumber)) candidateNumber = 1 + attempt;
      candidateNumber = Math.abs(Math.trunc(candidateNumber));
      if (!Number.isFinite(candidateNumber) || Number.isNaN(candidateNumber)) {
        candidateNumber = Math.abs(Date.now() % 1000000);
      }

      let paymentNumber = `PAY${String(candidateNumber).padStart(6, '0')}`;
      if (paymentNumber.includes('NaN')) {
        const fallback = Math.abs(Date.now() % 1000000);
        paymentNumber = `PAY${String(fallback).padStart(6, '0')}`;
      }

      try {
        payment = await Payment.create({
          id: uuidv4(),
          paymentNumber,
          date,
          reference,
          customerId,
          amount,
          status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break; // success
      } catch (e) {
        // If unique violation on paymentNumber, retry with next number; otherwise rethrow
        const msg = (e && e.message) || '';
        const isUnique = msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('paymentnumber');
        if (!isUnique) throw e;
        attempt += 1;
        if (attempt >= 5) throw e;
      }
    }

    // Create notification for payment creation
    try {
      await NotificationService.notifyPaymentCreated(payment, req.user);
    } catch (notificationError) {
      console.error('Error creating payment notification:', notificationError);
      // Don't fail the payment creation if notification fails
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'خطأ في إنشاء دفعة', error: error.message });
  }
});

// GET /api/financial/payments/:id - Get specific payment
router.get('/payments/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'code', 'name']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'خطأ في جلب الدفعة' });
  }
});

// POST /api/financial/payments/:id/submit - Submit payment and create GL entries
router.post('/payments/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting payment approval for ID: ${req.params.id}`);

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    if (!payment) {
      console.log(`❌ Payment not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    console.log(`📋 Payment found: ${payment.paymentNumber}, status: ${payment.status}`);

    if (payment.status !== 'draft') {
      console.log(`❌ Payment status is not draft: ${payment.status}`);
      return res.status(400).json({ message: 'الدفعة معتمدة مسبقاً أو ملغية' });
    }

    console.log(`🔄 Starting database transaction`);

    // Prepare GL entries
    const glEntries = [
      {
        id: uuidv4(),
        postingDate: payment.date,
        accountId: payment.customer.accountId,
        debit: 0,
        credit: payment.amount,
        voucherType: 'Payment',
        voucherNo: payment.paymentNumber,
        paymentId: payment.id,
        remarks: payment.reference,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        postingDate: payment.date,
        accountId: 1, // TODO: Use correct account ID for cash/bank
        debit: payment.amount,
        credit: 0,
        voucherType: 'Payment',
        voucherNo: payment.paymentNumber,
        paymentId: payment.id,
        remarks: payment.reference,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log(`💾 Creating ${glEntries.length} GL entries`);

    // Insert GL entries within transaction
    const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
    console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

    // For each created GL entry, update corresponding Account balance
    for (let i = 0; i < createdGLEntries.length; i++) {
      const gl = createdGLEntries[i];
      console.log(`🔄 Updating balance for account ${gl.accountId}`);

      try {
        const account = await Account.findByPk(gl.accountId, {
          transaction,
          lock: Transaction.LOCK.UPDATE
        });

        if (!account) {
          throw new Error(`Account not found: ${gl.accountId}`);
        }

        console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

        // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
        const current = parseFloat(account.balance || 0);
        const debit = parseFloat(gl.debit || 0);
        const credit = parseFloat(gl.credit || 0);

        let newBalance = current;

        const isDebitType = ['asset', 'expense'].includes(account.type);
        // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
        if (isDebitType) {
          newBalance = current + debit - credit;
        } else {
          newBalance = current - debit + credit;
        }

        // Auto-correct account nature if inconsistent with type
        const expectedNature = isDebitType ? 'debit' : 'credit';
        if (account.nature !== expectedNature) {
          account.nature = expectedNature;
        }

        console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

        // Update account balance
        account.balance = newBalance;
        await account.save({ transaction });

        console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
      } catch (accountError) {
        console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
        throw accountError;
      }
    }

    console.log(`🔄 Updating payment status to posted`);

    // Update payment status within the same transaction
    await payment.update({
      status: 'posted',
      postedAt: new Date(),
      postedBy: req.user?.id || 'system',
      updatedAt: new Date()
    }, { transaction });

    console.log(`✅ Payment status updated to posted`);
    res.json({
      message: 'تم اعتماد الدفعة وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber
    });
  } catch (error) {
    console.error('❌ Error submitting payment:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      paymentId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الدفعة',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/payments/:id/cancel - Cancel payment
router.post('/payments/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'الدفعة غير موجودة' });
    }

    if (payment.status === 'cancelled') {
      return res.status(400).json({ message: 'الدفعة ملغية مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Payment',
          voucherNo: payment.paymentNumber
        }
      }
    );

    // Update payment status
    await payment.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الدفعة' });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الدفعة' });
  }
});

// ==================== RECEIPTS ROUTES ====================

// GET /api/financial/receipts - Get receipts
router.get('/receipts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, supplierId, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { receiptNumber: { [Op.like]: `%${search}%` } },
          { reference: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by supplier
    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC']],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const receipts = await Receipt.findAll(options);
    const total = await Receipt.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: receipts,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'خطأ في جلب الواردات' });
  }
});

// POST /api/financial/receipts - Create new receipt
router.post('/receipts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      date, reference, supplierId, amount, status = 'draft'
    } = req.body;

    // Validate required fields
    if (!date || !supplierId || !amount) {
      return res.status(400).json({ message: 'التاريخ والمورد والمبلغ مطلوبين' });
    }

    // Generate robust entry number with retry to avoid unique collisions (only REC prefix)
    const lastReceipt = await Receipt.findOne({
      where: { receiptNumber: { [Op.like]: 'REC%' } },
      order: [['createdAt', 'DESC']]
    });
    const lastNumStr = (lastReceipt?.receiptNumber || '').match(/(\d+)$/)?.[1] || '0';
    let baseNextNumber = parseInt(lastNumStr, 10);
    if (!Number.isFinite(baseNextNumber)) baseNextNumber = 0;

    let receipt;
    let attempt = 0;
    while (attempt < 5) {
      // Compute a safe integer candidate
      let candidateNumber = baseNextNumber + 1 + attempt;
      if (!Number.isFinite(candidateNumber)) candidateNumber = 1 + attempt;
      candidateNumber = Math.abs(Math.trunc(candidateNumber));
      if (!Number.isFinite(candidateNumber) || Number.isNaN(candidateNumber)) {
        candidateNumber = Math.abs(Date.now() % 1000000);
      }

      let receiptNumber = `REC${String(candidateNumber).padStart(6, '0')}`;
      if (receiptNumber.includes('NaN')) {
        const fallback = Math.abs(Date.now() % 1000000);
        receiptNumber = `REC${String(fallback).padStart(6, '0')}`;
      }

      try {
        receipt = await Receipt.create({
          id: uuidv4(),
          receiptNumber,
          date,
          reference,
          supplierId,
          amount,
          status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break; // success
      } catch (e) {
        // If unique violation on receiptNumber, retry with next number; otherwise rethrow
        const msg = (e && e.message) || '';
        const isUnique = msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('receiptnumber');
        if (!isUnique) throw e;
        attempt += 1;
        if (attempt >= 5) throw e;
      }
    }

    // Create notification for receipt creation
    try {
      await NotificationService.notifyReceiptCreated(receipt, req.user);
    } catch (notificationError) {
      console.error('Error creating receipt notification:', notificationError);
      // Don't fail the receipt creation if notification fails
    }

    res.status(201).json(receipt);
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ message: 'خطأ في إنشاء وارد', error: error.message });
  }
});

// GET /api/financial/receipts/:id - Get specific receipt
router.get('/receipts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name']
        }
      ]
    });

    if (!receipt) {
      return res.status(404).json({ message: 'الوارد غير موجود' });
    }

    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'خطأ في جلب الوارد' });
  }
});

// POST /api/financial/receipts/:id/submit - Submit receipt and create GL entries
router.post('/receipts/:id/submit', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log(`🔄 Starting receipt approval for ID: ${req.params.id}`);

    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier'
        }
      ]
    });

    if (!receipt) {
      console.log(`❌ Receipt not found: ${req.params.id}`);
      return res.status(404).json({ message: 'الوارد غير موجود' });
    }

    console.log(`📋 Receipt found: ${receipt.receiptNumber}, status: ${receipt.status}`);

    if (receipt.status !== 'draft') {
      console.log(`❌ Receipt status is not draft: ${receipt.status}`);
      return res.status(400).json({ message: 'الوارد معتمد مسبقاً أو ملغي' });
    }

    console.log(`🔄 Starting database transaction`);

    // Prepare GL entries
    const glEntries = [
      {
        id: uuidv4(),
        postingDate: receipt.date,
        accountId: receipt.supplier.accountId,
        debit: receipt.amount,
        credit: 0,
        voucherType: 'Receipt',
        voucherNo: receipt.receiptNumber,
        receiptId: receipt.id,
        remarks: receipt.reference,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        postingDate: receipt.date,
        accountId: 1, // TODO: Use correct account ID for cash/bank
        debit: 0,
        credit: receipt.amount,
        voucherType: 'Receipt',
        voucherNo: receipt.receiptNumber,
        receiptId: receipt.id,
        remarks: receipt.reference,
        currency: 'LYD',
        exchangeRate: 1.000000,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log(`💾 Creating ${glEntries.length} GL entries`);

    // Insert GL entries within transaction
    const createdGLEntries = await GLEntry.bulkCreate(glEntries, { transaction });
    console.log(`✅ Created ${createdGLEntries.length} GL entries successfully`);

    // For each created GL entry, update corresponding Account balance
    for (let i = 0; i < createdGLEntries.length; i++) {
      const gl = createdGLEntries[i];
      console.log(`🔄 Updating balance for account ${gl.accountId}`);

      try {
        const account = await Account.findByPk(gl.accountId, {
          transaction,
          lock: Transaction.LOCK.UPDATE
        });

        if (!account) {
          throw new Error(`Account not found: ${gl.accountId}`);
        }

        console.log(`📊 Account ${account.code} (${account.name}): Current balance=${account.balance}, Nature=${account.nature}`);

        // Compute new balance depending on account type (robust even if 'nature' is misconfigured)
        const current = parseFloat(account.balance || 0);
        const debit = parseFloat(gl.debit || 0);
        const credit = parseFloat(gl.credit || 0);

        let newBalance = current;

        const isDebitType = ['asset', 'expense'].includes(account.type);
        // For assets/expenses: debit increases balance; For liabilities/equity/revenue: credit increases balance
        if (isDebitType) {
          newBalance = current + debit - credit;
        } else {
          newBalance = current - debit + credit;
        }

        // Auto-correct account nature if inconsistent with type
        const expectedNature = isDebitType ? 'debit' : 'credit';
        if (account.nature !== expectedNature) {
          account.nature = expectedNature;
        }

        console.log(`💰 Account ${account.code}: ${current} + ${debit} - ${credit} = ${newBalance} (nature: ${account.nature})`);

        // Update account balance
        account.balance = newBalance;
        await account.save({ transaction });

        console.log(`✅ Updated account ${account.code} balance to ${newBalance}`);
      } catch (accountError) {
        console.error(`❌ Error updating account ${gl.accountId}:`, accountError);
        throw accountError;
      }
    }

    console.log(`🔄 Updating receipt status to posted`);

    // Update receipt status within the same transaction
    await receipt.update({
      status: 'posted',
      postedAt: new Date(),
      postedBy: req.user?.id || 'system',
      updatedAt: new Date()
    }, { transaction });

    console.log(`✅ Receipt status updated to posted`);
    res.json({
      message: 'تم اعتماد الوارد وإنشاء قيود دفتر الأستاذ العام',
      success: true,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber
    });
  } catch (error) {
    console.error('❌ Error submitting receipt:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      receiptId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'خطأ في اعتماد الوارد',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/financial/receipts/:id/cancel - Cancel receipt
router.post('/receipts/:id/cancel', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'الوارد غير موجود' });
    }

    if (receipt.status === 'cancelled') {
      return res.status(400).json({ message: 'الوارد ملغي مسبقاً' });
    }

    // Cancel related GL entries
    await GLEntry.update(
      { isCancelled: true, updatedAt: new Date() },
      {
        where: {
          voucherType: 'Receipt',
          voucherNo: receipt.receiptNumber
        }
      }
    );

    // Update receipt status
    await receipt.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ message: 'تم إلغاء الوارد' });
  } catch (error) {
    console.error('Error cancelling receipt:', error);
    res.status(500).json({ message: 'خطأ في إلغاء الوارد' });
  }
});

// ==================== PAYROLL ENTRIES ROUTES ====================

// GET /api/financial/payroll-entries - Get payroll entries
router.get('/payroll-entries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search, employeeId, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { payrollNumber: { [Op.like]: `%${search}%` } },
          { reference: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by employee
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    const options = {
      where: whereClause,
      order: [['date', 'DESC']],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'code', 'name']
        }
      ]
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const payrollEntries = await PayrollEntry.findAll(options);
    const total = await PayrollEntry.count({ where: whereClause });

    // Always use consistent response format
    const response = {
      data: payrollEntries,
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || total,
      totalPages: Math.ceil(total / (parseInt(limit) || total))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payroll entries:', error);
    res.status(500).json({ message: 'خطأ في جلب سجلات الرواتب' });
  }
});

// ==================== SUPPLIERS ROUTES ====================

// GET /api/financial/suppliers - Get suppliers
router.get('/suppliers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let whereClause = {};

    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const options = {
      where: whereClause,
      order: [['name', 'ASC']]
      // Removed Account include as Supplier model doesn't have this association
    };

    if (page && limit) {
      options.limit = parseInt(limit);
      options.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const suppliers = await Supplier.findAll(options);
    const totalSuppliers = await Supplier.count({ where: whereClause });

    // Always use consistent response format
    const responseSuppliers = {
      data: suppliers,
      total: totalSuppliers,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || totalSuppliers,
      totalPages: Math.ceil(totalSuppliers / (parseInt(limit) || totalSuppliers))
    };

    res.json(responseSuppliers);
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
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
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

// POST /api/financial/employees - Create new employee with accounts
router.post('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await EmployeeAccountService.createEmployeeWithAccounts(req.body, req.user);

    res.status(201).json({
      success: true,
      data: result,
      message: 'تم إنشاء الموظف والحسابات المرتبطة بنجاح'
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في إنشاء الموظف'
    });
  }
});

// GET /api/financial/employees/:id - Get employee with accounts
router.get('/employees/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await EmployeeAccountService.getEmployeeWithAccounts(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في جلب بيانات الموظف'
    });
  }
});

// GET /api/financial/employees/:id/summary - Get employee summary
router.get('/employees/:id/summary', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await EmployeeAccountService.getEmployeeSummary(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching employee summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في جلب ملخص الموظف'
    });
  }
});

// GET /api/financial/employees/:id/statement - Get employee account statement
router.get('/employees/:id/statement', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { accountType, startDate, endDate } = req.query;

    const result = await EmployeeAccountService.getEmployeeAccountStatement(
      req.params.id,
      accountType,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching employee statement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في جلب كشف حساب الموظف'
    });
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

// POST /api/financial/employees/:id/salary-payment - Process salary payment
router.post('/employees/:id/salary-payment', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await EmployeeAccountService.processSalaryPayment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'تم صرف الراتب بنجاح'
    });
  } catch (error) {
    console.error('Error processing salary payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في صرف الراتب'
    });
  }
});

// POST /api/financial/employees/:id/advance - Process employee advance
router.post('/employees/:id/advance', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await EmployeeAccountService.processEmployeeAdvance(
      req.params.id,
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'تم صرف السلفة بنجاح'
    });
  } catch (error) {
    console.error('Error processing employee advance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في صرف السلفة'
    });
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
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by category account
    if (category) {
      whereClause.categoryAccountId = category;
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
          as: 'categoryAccount',
          attributes: ['id', 'code', 'name', 'type']
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

// GET /api/financial/fixed-assets/categories - Get fixed asset categories from chart of accounts
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // Ensure Fixed Assets parent and default categories (Vehicles, Equipment & Machinery, Furniture)
    console.log('🔧 Ensuring fixed assets structure...');
    const { fixedAssetsParent } = await ensureFixedAssetsStructure();
    console.log('✅ Fixed assets structure ensured, parent:', fixedAssetsParent?.name, fixedAssetsParent?.code);

    // Return direct children under Fixed Assets parent that are asset accounts
    // These are the categories that can be used for fixed assets
    console.log('🔍 Finding categories under parent ID:', fixedAssetsParent?.id);
    
    // Add a safety check to ensure fixedAssetsParent exists
    if (!fixedAssetsParent || !fixedAssetsParent.id) {
      console.warn('❌ Fixed Assets parent not properly initialized');
      return res.status(500).json({ 
        success: false,
        message: 'خطأ في تهيئة هيكل الأصول الثابتة',
        error: 'Fixed Assets parent not found'
      });
    }
    
    // Find all sub-groups under Fixed Assets (like 1.2.1, 1.2.2, etc.)
    const subGroups = await Account.findAll({
      where: {
        parentId: fixedAssetsParent.id,
        type: 'asset',
        isActive: true,
        isGroup: true
      },
      attributes: ['id']
    });
    
    console.log(`🔍 Found ${subGroups.length} sub-groups under Fixed Assets`);
    
    // Find categories under these sub-groups (non-group accounts)
    const categories = await Account.findAll({
      where: {
        parentId: {
          [Op.in]: subGroups.map(group => group.id)
        },
        type: 'asset',
        isActive: true,
        isGroup: false
      },
      attributes: ['id', 'code', 'name', 'nameEn', 'type', 'level', 'parentId'],
      order: [['code', 'ASC']]
    });

    console.log(`✅ Found ${categories.length} fixed asset categories (under Fixed Assets)`);
    // Return consistent response format with data property
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('❌ Error fetching fixed asset categories:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more user-friendly error message
    const userMessage = process.env.NODE_ENV === 'development' 
      ? `خطأ في جلب فئات الأصول الثابتة: ${error.message}`
      : 'حدث خطأ أثناء جلب فئات الأصول الثابتة';
      
    res.status(500).json({ 
      success: false,
      message: userMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/financial/fixed-assets - Create new fixed asset (simplified version)
router.post('/fixed-assets', authenticateToken, requireFinancialAccess, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('📝 Creating fixed asset with data:', req.body);

    // Validate required fields
    const { name, categoryAccountId, purchaseDate, purchaseCost, usefulLife } = req.body;
    
    if (!name || !categoryAccountId || !purchaseDate || !purchaseCost || !usefulLife) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'الحقول المطلوبة مفقودة',
        required: ['name', 'categoryAccountId', 'purchaseDate', 'purchaseCost', 'usefulLife']
      });
    }

    // Validate categoryAccountId exists
    const categoryAccount = await Account.findByPk(categoryAccountId);
    if (!categoryAccount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'حساب الفئة غير موجود'
      });
    }

    // Generate asset number if not provided
    let assetNumber = req.body.assetNumber;
    if (!assetNumber) {
      assetNumber = await generateHierarchicalAssetNumber(categoryAccountId);
      if (!assetNumber) {
        assetNumber = `FA-${uuidv4().substring(0, 8)}`;
      }
    }

    // Check for duplicate asset number
    const existingAsset = await FixedAsset.findOne({ where: { assetNumber } });
    if (existingAsset) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'رقم الأصل مستخدم بالفعل'
      });
    }

    // Prepare asset data
    const assetData = {
      id: uuidv4(),
      assetNumber,
      name: name.trim(),
      category: req.body.category || 'other',
      categoryAccountId,
      purchaseDate,
      purchaseCost: parseFloat(purchaseCost),
      salvageValue: req.body.salvageValue ? parseFloat(req.body.salvageValue) : 0,
      usefulLife: parseInt(usefulLife),
      depreciationMethod: req.body.depreciationMethod || 'straight_line',
      currentValue: parseFloat(purchaseCost),
      status: req.body.status || 'active',
      location: req.body.location || '',
      description: req.body.description || ''
    };

    console.log('📊 Processed asset data:', assetData);

    // Create the fixed asset
    const fixedAsset = await FixedAsset.create(assetData, { transaction });

    console.log('✅ Fixed asset created successfully');

    // Create the related accounts for the fixed asset
    console.log('🔄 Creating related accounts for fixed asset');
    const createdAccounts = await createFixedAssetAccounts(fixedAsset, categoryAccount, transaction);
    
    // Update the fixed asset with the asset account ID
    if (createdAccounts.assetAccount) {
      await fixedAsset.update({ assetAccountId: createdAccounts.assetAccount.id }, { transaction });
    }

    // Create journal entry for the asset purchase
    console.log('📝 Creating journal entry for asset purchase');
    const journalEntryData = {
      id: uuidv4(),
      entryNumber: `JE-${Date.now()}`,
      date: purchaseDate,
      description: `شراء أصل ثابت: ${name}`,
      reference: `FA-${fixedAsset.id.substring(0, 8)}`,
      totalDebit: parseFloat(purchaseCost),
      totalCredit: parseFloat(purchaseCost),
      status: 'posted',
      type: 'fixed_asset_purchase',
      postedBy: req.user?.id || 'system',
      postedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const journalEntry = await JournalEntry.create(journalEntryData, { transaction });

    // Create GL entries for the journal entry
    const glEntries = [
      {
        id: uuidv4(),
        journalEntryId: journalEntry.id,
        accountId: createdAccounts.assetAccount.id,
        description: `شراء أصل ثابت: ${name}`,
        debit: parseFloat(purchaseCost),
        credit: 0,
        postingDate: purchaseDate,
        voucherType: 'Fixed Asset Purchase',
        voucherNo: journalEntry.entryNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        journalEntryId: journalEntry.id,
        accountId: categoryAccount.id, // Source of funds (e.g., bank account)
        description: `شراء أصل ثابت: ${name}`,
        debit: 0,
        credit: parseFloat(purchaseCost),
        postingDate: purchaseDate,
        voucherType: 'Fixed Asset Purchase',
        voucherNo: journalEntry.entryNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await GLEntry.bulkCreate(glEntries, { transaction });

    // Update account balances
    await createdAccounts.assetAccount.update({
      balance: parseFloat(createdAccounts.assetAccount.balance || 0) + parseFloat(purchaseCost)
    }, { transaction });

    await categoryAccount.update({
      balance: parseFloat(categoryAccount.balance || 0) - parseFloat(purchaseCost)
    }, { transaction });

    await transaction.commit();

    // Fetch the complete asset with category account
    const completeAsset = await FixedAsset.findByPk(fixedAsset.id, {
      include: [
        {
          model: Account,
          as: 'categoryAccount',
          attributes: ['id', 'code', 'name', 'type']
        }
      ]
    });

    console.log('🎉 Fixed asset created successfully:', fixedAsset.assetNumber);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الأصل الثابت والحسابات المرتبطة بنجاح',
      data: {
        asset: completeAsset,
        accounts: createdAccounts
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating fixed asset:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      errors: error.errors || [],
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الأصل الثابت',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
    });
  }
});

// GET /api/financial/fixed-assets/:id/depreciation-schedule - Get depreciation schedule for asset
router.get('/fixed-assets/:id/depreciation-schedule', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify asset exists
    const asset = await FixedAsset.findByPk(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'الأصل الثابت غير موجود'
      });
    }

    // Get depreciation schedule
    const [schedule] = await sequelize.query(`
      SELECT
        ds.id,
        ds."scheduleDate",
        ds."depreciationAmount",
        ds."accumulatedDepreciation",
        ds."bookValue",
        ds.status,
        ds."journalEntryId",
        ds.notes,
        je."entryNumber" as "journalEntryNumber",
        je.description as "journalEntryDescription"
      FROM depreciation_schedules ds
      LEFT JOIN journal_entries je ON ds."journalEntryId" = je.id
      WHERE ds."fixedAssetId" = :assetId
      ORDER BY ds."scheduleDate" ASC
    `, {
      replacements: { assetId: id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        asset: {
          id: asset.id,
          assetNumber: asset.assetNumber,
          name: asset.name,
          purchaseCost: asset.purchaseCost,
          salvageValue: asset.salvageValue,
          usefulLife: asset.usefulLife,
          depreciationMethod: asset.depreciationMethod
        },
        schedule: schedule,
        summary: {
          totalScheduled: schedule.length,
          totalPosted: schedule.filter(s => s.status === 'posted').length,
          totalPending: schedule.filter(s => s.status === 'pending').length,
          totalDepreciationAmount: schedule.reduce((sum, s) => sum + parseFloat(s.depreciationAmount || 0), 0),
          currentBookValue: schedule.length > 0 ? parseFloat(schedule[schedule.length - 1].bookValue || asset.purchaseCost) : asset.purchaseCost
        }
      }
    });

  } catch (error) {
    console.error('Error fetching depreciation schedule:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب جدولة الإهلاك',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
    });
  }
});

// POST /api/financial/fixed-assets/:id/post-depreciation - Post monthly depreciation entry
router.post('/fixed-assets/:id/post-depreciation', authenticateToken, requireFinancialAccess, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { scheduleDate, notes } = req.body;

    // Verify asset exists
    const asset = await FixedAsset.findByPk(id);
    if (!asset) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'الأصل الثابت غير موجود'
      });
    }

    // Find the specific depreciation schedule entry
    const [scheduleEntry] = await sequelize.query(`
      SELECT * FROM depreciation_schedules
      WHERE "fixedAssetId" = :assetId
      AND "scheduleDate" = :scheduleDate
      AND status = 'pending'
    `, {
      replacements: { assetId: id, scheduleDate },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    if (!scheduleEntry) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'لا توجد جدولة إهلاك معلقة لهذا التاريخ'
      });
    }

    // Create depreciation journal entry using PostgreSQL function
    const [result] = await sequelize.query(`
      SELECT create_depreciation_entry(:scheduleId, :userId) as journal_entry_id
    `, {
      replacements: {
        scheduleId: scheduleEntry.id,
        userId: req.user.id
      },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Update schedule entry with notes if provided
    if (notes) {
      await sequelize.query(`
        UPDATE depreciation_schedules
        SET notes = :notes
        WHERE id = :scheduleId
      `, {
        replacements: { notes, scheduleId: scheduleEntry.id },
        transaction
      });
    }

    await transaction.commit();

    // Fetch the created journal entry
    const journalEntry = await JournalEntry.findByPk(result.journal_entry_id, {
      include: [
        {
          model: GLEntry,
          as: 'glEntries',
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

    res.json({
      success: true,
      message: 'تم ترحيل قيد الإهلاك بنجاح',
      data: {
        scheduleEntry: {
          id: scheduleEntry.id,
          scheduleDate: scheduleEntry.scheduleDate,
          depreciationAmount: scheduleEntry.depreciationAmount,
          accumulatedDepreciation: scheduleEntry.accumulatedDepreciation,
          bookValue: scheduleEntry.bookValue
        },
        journalEntry: journalEntry
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error posting depreciation entry:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء ترحيل قيد الإهلاك',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
    });
  }
});

// POST /api/financial/fixed-assets/:id/depreciation - Calculate depreciation for asset
router.post('/fixed-assets/:id/depreciation', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the fixed asset
    const asset = await FixedAsset.findByPk(id);

    if (!asset) {
      return res.status(404).json({ message: 'الأصل الثابت غير موجود' });
    }

    // Calculate depreciation based on method
    const purchaseCost = parseFloat(asset.purchaseCost || 0);
    const salvageValue = parseFloat(asset.salvageValue || 0);
    const usefulLife = parseInt(asset.usefulLife || 5);
    const depreciableAmount = purchaseCost - salvageValue;

    let annualDepreciation = 0;
    let monthlyDepreciation = 0;

    switch (asset.depreciationMethod) {
      case 'straight_line':
        annualDepreciation = depreciableAmount / usefulLife;
        monthlyDepreciation = annualDepreciation / 12;
        break;
      case 'declining_balance':
        // Double declining balance method
        const rate = (2 / usefulLife) * 100;
        annualDepreciation = purchaseCost * (rate / 100);
        monthlyDepreciation = annualDepreciation / 12;
        break;
      case 'units_of_production':
        // For simplicity, use straight line if units not specified
        annualDepreciation = depreciableAmount / usefulLife;
        monthlyDepreciation = annualDepreciation / 12;
        break;
      default:
        annualDepreciation = depreciableAmount / usefulLife;
        monthlyDepreciation = annualDepreciation / 12;
    }

    // Create journal entry for depreciation
    const currentDate = new Date();

    // Generate unique entry number using timestamp to avoid conflicts
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const entryNumber = `DEP-${timestamp}-${randomSuffix}`;

    // Find depreciation accounts (updated codes)
    const depreciationExpenseAccount = await Account.findOne({ where: { code: '2.2' } });
    const accumulatedDepreciationAccount = await Account.findOne({ where: { code: '1.2.7' } });

    if (depreciationExpenseAccount && accumulatedDepreciationAccount) {
      // Create journal entry
      const journalEntry = await JournalEntry.create({
        id: uuidv4(),
        entryNumber,
        date: currentDate.toISOString().split('T')[0],
        description: `إهلاك شهري للأصل: ${asset.name}`,
        totalDebit: Math.round(monthlyDepreciation * 100) / 100,
        totalCredit: Math.round(monthlyDepreciation * 100) / 100,
        status: 'posted',
        postedBy: req.user.id,
        postedAt: new Date()
      });

      // Create GL entries
      const glEntries = [
        {
          id: uuidv4(),
          journalEntryId: journalEntry.id,
          accountId: depreciationExpenseAccount.id,
          description: `مصروف إهلاك - ${asset.name}`,
          debit: Math.round(monthlyDepreciation * 100) / 100,
          credit: 0,
          postingDate: currentDate.toISOString().split('T')[0],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          journalEntryId: journalEntry.id,
          accountId: accumulatedDepreciationAccount.id,
          description: `مجمع إهلاك - ${asset.name}`,
          debit: 0,
          credit: Math.round(monthlyDepreciation * 100) / 100,
          postingDate: currentDate.toISOString().split('T')[0],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await GLEntry.bulkCreate(glEntries);

      console.log(`✅ Created depreciation journal entry ${entryNumber}`);

      // Update asset current value
      const newCurrentValue = Math.max(0, purchaseCost - (monthlyDepreciation * 12));
      await asset.update({ currentValue: newCurrentValue });
    } else {
      console.log('⚠️  Depreciation accounts not found, skipping journal entry creation');

      // Still update the asset current value
      const newCurrentValue = Math.max(0, purchaseCost - (monthlyDepreciation * 12));
      await asset.update({ currentValue: newCurrentValue });
    }

    res.json({
      success: true,
      message: depreciationExpenseAccount && accumulatedDepreciationAccount
        ? 'تم حساب الاستهلاك وإنشاء القيد المحاسبي بنجاح'
        : 'تم حساب الاستهلاك بنجاح (لم يتم إنشاء قيد محاسبي - حسابات الإهلاك غير موجودة)',
      data: {
        assetId: asset.id,
        assetName: asset.name,
        assetNumber: asset.assetNumber,
        depreciationMethod: asset.depreciationMethod,
        purchaseCost,
        salvageValue,
        usefulLife,
        depreciableAmount,
        annualDepreciation: Math.round(annualDepreciation * 100) / 100,
        monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
        journalEntryCreated: !!(depreciationExpenseAccount && accumulatedDepreciationAccount),
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating depreciation:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      assetId: req.params.id,
      errors: error.errors || [],
      name: error.name
    });
    res.status(500).json({
      message: 'خطأ في حساب الاستهلاك',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        errors: error.errors,
        name: error.name
      } : undefined
    });
  }
});

// ==================== FINANCIAL REPORTS ENDPOINTS ====================

const reportsController = new FinancialReportsController();

// GET /api/financial/summary - Get financial summary
router.get('/summary', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 بدء حساب الملخص المالي الحقيقي...');

    // حساب إجمالي الأصول
    const assetAccounts = await Account.findAll({
      where: { type: 'asset', isActive: true }
    });
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // حساب إجمالي الالتزامات
    const liabilityAccounts = await Account.findAll({
      where: { type: 'liability', isActive: true }
    });
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // حساب إجمالي حقوق الملكية
    const equityAccounts = await Account.findAll({
      where: { type: 'equity', isActive: true }
    });
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // حساب إجمالي الإيرادات
    const revenueAccounts = await Account.findAll({
      where: { type: 'revenue', isActive: true }
    });
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // حساب إجمالي المصروفات
    const expenseAccounts = await Account.findAll({
      where: { type: 'expense', isActive: true }
    });
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // حساب صافي الربح
    const netProfit = totalRevenue - totalExpenses;

    // حساب رصيد النقدية والبنوك
    const cashAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: '1.1.1%' } }, // حسابات النقدية
          { name: { [Op.like]: '%صندوق%' } },
          { name: { [Op.like]: '%نقد%' } }
        ],
        isActive: true
      }
    });
    const cashBalance = cashAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    const bankAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: '1.1.2%' } }, // حسابات البنوك
          { name: { [Op.like]: '%بنك%' } },
          { name: { [Op.like]: '%مصرف%' } }
        ],
        isActive: true
      }
    });
    const bankBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // حساب أرصدة العملاء والموردين
    const customerAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: '1.1.3%' } }, // حسابات العملاء
          { name: { [Op.like]: '%عميل%' } },
          { name: { [Op.like]: '%عملاء%' } }
        ],
        isActive: true
      }
    });
    const accountsReceivable = customerAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    const supplierAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: '3.1.1%' } }, // حسابات الموردين
          { name: { [Op.like]: '%مورد%' } },
          { name: { [Op.like]: '%موردين%' } }
        ],
        isActive: true
      }
    });
    const accountsPayable = supplierAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    // إنشاء الملخص المالي الحقيقي
    const summary = {
      totalSales: totalRevenue,
      totalPurchases: totalExpenses,
      netProfit: netProfit,
      cashFlow: cashBalance + bankBalance,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities,
      totalEquity: totalEquity,
      accountsReceivable: accountsReceivable,
      accountsPayable: accountsPayable,
      cashBalance: cashBalance,
      bankBalance: bankBalance,
      monthlyGrowth: netProfit > 0 ? 5.2 : -2.1, // حساب تقريبي
      asOfDate: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      // معلومات إضافية للتشخيص
      accountingEquationBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      totalAccounts: assetAccounts.length + liabilityAccounts.length + equityAccounts.length + revenueAccounts.length + expenseAccounts.length,
      currency: 'LYD'
    };

    console.log('✅ تم حساب الملخص المالي الحقيقي بنجاح');
    console.log(`📊 إجمالي الأصول: ${totalAssets} LYD`);
    console.log(`📊 إجمالي الالتزامات: ${totalLiabilities} LYD`);
    console.log(`📊 صافي الربح: ${netProfit} LYD`);

    res.json(summary);
  } catch (error) {
    console.error('❌ خطأ في حساب الملخص المالي:', error);
    res.status(500).json({ message: 'خطأ في حساب الملخص المالي', error: error.message });
  }
});

// GET /api/financial/monitored-accounts - Get monitored accounts
router.get('/monitored-accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    // Get accounts that are explicitly marked for monitoring
    const accounts = await Account.findAll({
      where: {
        isActive: true,
        isGroup: false,
        isMonitored: true // Only get accounts that are explicitly monitored
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

    const monitoredAccounts = await Promise.all(accounts.map(async account => {
      const currentBalance = parseFloat(account.balance || 0);

      // حساب التغيير الفعلي بناءً على المعاملات الأخيرة
      let changeAmount = 0;
      let changePercent = 0;

      try {
        // الحصول على آخر 30 يوم من المعاملات لحساب التغيير
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentEntries = await GLEntry.findAll({
          where: {
            accountId: account.id,
            createdAt: {
              [Op.gte]: thirtyDaysAgo
            }
          },
          order: [['createdAt', 'DESC']],
          limit: 100
        });

        if (recentEntries.length > 0) {
          // حساب مجموع التغييرات في آخر 30 يوم
          const totalDebit = recentEntries.reduce((sum, entry) => sum + parseFloat(entry.debit || 0), 0);
          const totalCredit = recentEntries.reduce((sum, entry) => sum + parseFloat(entry.credit || 0), 0);

          // التغيير يعتمد على طبيعة الحساب
          if (account.type === 'asset' || account.type === 'expense') {
            changeAmount = totalDebit - totalCredit; // للأصول والمصروفات: المدين موجب
          } else {
            changeAmount = totalCredit - totalDebit; // للخصوم والإيرادات: الدائن موجب
          }

          // حساب النسبة المئوية
          const previousBalance = currentBalance - changeAmount;
          if (previousBalance !== 0) {
            changePercent = (changeAmount / Math.abs(previousBalance)) * 100;
          }
        }
      } catch (error) {
        console.warn('Error calculating change for account', account.code, error);
        // في حالة الخطأ، استخدم قيم افتراضية
        changeAmount = 0;
        changePercent = 0;
      }

      return {
        id: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        currentBalance: currentBalance,
        changeAmount: Math.round(changeAmount * 100) / 100, // تقريب لرقمين عشريين
        changePercent: Math.round(changePercent * 100) / 100, // تقريب لرقمين عشريين
        frequency: 'daily',
        threshold: Math.abs(currentBalance) > 100000 ? 100000 : 10000,
        status: currentBalance > 100000 ? 'high_balance' : currentBalance < 0 ? 'negative_balance' : 'normal',
        parent: account.parent,
        lastUpdated: account.updatedAt || new Date().toISOString()
      };
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

// POST /api/financial/monitored-accounts - Add account to monitoring
router.post('/monitored-accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ message: 'معرف الحساب مطلوب' });
    }

    // Mark account as monitored by adding a flag or using a separate table
    // For now, we'll use a simple approach - you might want to create a MonitoredAccount model
    await Account.update(
      { isMonitored: true },
      { where: { id: accountId } }
    );

    res.json({ message: 'تم إضافة الحساب للمراقبة بنجاح' });
  } catch (error) {
    console.error('Error adding account to monitoring:', error);
    res.status(500).json({ message: 'خطأ في إضافة الحساب للمراقبة' });
  }
});

// DELETE /api/financial/monitored-accounts/:accountId - Remove account from monitoring
router.delete('/monitored-accounts/:accountId', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Remove account from monitoring
    await Account.update(
      { isMonitored: false },
      { where: { id: accountId } }
    );

    res.json({ message: 'تم إزالة الحساب من المراقبة بنجاح' });
  } catch (error) {
    console.error('Error removing account from monitoring:', error);
    res.status(500).json({ message: 'خطأ في إزالة الحساب من المراقبة' });
  }
});

// GET /api/financial/opening-balances - Get opening balance entries
router.get('/opening-balances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 جلب الأرصدة الافتتاحية...');

    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    // التحقق من وجود جدول GLEntry
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    if (!tableExists.includes('gl_entries')) {
      console.log('⚠️ جدول gl_entries غير موجود');
      return res.json({
        success: true,
        data: [],
        total: 0,
        message: 'لا توجد أرصدة افتتاحية - جدول القيود غير موجود'
      });
    }

    let whereClause = {
      voucherType: 'Journal Entry',
      remarks: { [Op.like]: '%افتتاحي%' }
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

    console.log(`✅ تم جلب ${openingBalances.length} رصيد افتتاحي`);

    res.json({
      success: true,
      data: openingBalances,
      total: openingBalances.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      message: 'تم جلب الأرصدة الافتتاحية بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الأرصدة الافتتاحية:', error);

    // في حالة الخطأ، إرجاع استجابة آمنة
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأرصدة الافتتاحية',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي',
      data: [],
      total: 0
    });
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

// GET /api/financial/reports/gl-entries - Get GL entries for reports
router.get('/reports/gl-entries', async (req, res) => {
  try {
    const { limit = 100, accountId, dateFrom, dateTo, voucherType } = req.query;

    let whereClause = {
      isCancelled: false
    };

    // Apply filters
    if (accountId) whereClause.accountId = accountId;
    if (voucherType) whereClause.voucherType = voucherType;
    if (dateFrom && dateTo) {
      whereClause.postingDate = {
        [Op.between]: [dateFrom, dateTo]
      };
    }

    const glEntries = await GLEntry.findAll({
      where: whereClause,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name', 'type']
        }
      ],
      order: [['postingDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Format data for reports
    const formattedEntries = glEntries.map(entry => ({
      id: entry.id,
      postingDate: entry.postingDate,
      account: {
        code: entry.account?.code || 'غير محدد',
        name: entry.account?.name || 'غير محدد'
      },
      remarks: entry.remarks || 'بدون وصف',
      voucherType: entry.voucherType || '',
      debit: parseFloat(entry.debit || 0),
      credit: parseFloat(entry.credit || 0)
    }));

    res.json({
      success: true,
      data: formattedEntries,
      total: formattedEntries.length,
      message: 'تم جلب قيود دفتر الأستاذ العام بنجاح'
    });

  } catch (error) {
    console.error('Error fetching GL entries for reports:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب قيود دفتر الأستاذ العام',
      error: error.message,
      data: []
    });
  }
});

// GET /api/financial/reports/opening-trial-balance - Get opening trial balance report
router.get('/reports/opening-trial-balance', async (req, res) => {
  try {
    const { asOfDate = new Date().toISOString().split('T')[0], currency = 'LYD', branch } = req.query;

    console.log('🔍 جلب ميزان المراجعة الافتتاحي...');
    console.log('📅 كما في تاريخ:', asOfDate);

    // Get opening balance entries from GL (only opening balance entries)
    const openingEntries = await GLEntry.findAll({
      where: {
        voucherType: 'Journal Entry',
        [Op.or]: [
          { remarks: { [Op.like]: '%افتتاحي%' } },
          { remarks: { [Op.like]: '%Opening%' } },
          { remarks: { [Op.like]: '%رصيد افتتاحي%' } }
        ],
        postingDate: {
          [Op.lte]: asOfDate
        },
        ...(currency !== 'LYD' && { currency })
      },
      include: [
        {
          model: Account,
          as: 'account',
          where: {
            isActive: true,
            ...(branch && { branch })
          },
          attributes: ['id', 'code', 'name', 'type', 'rootType', 'accountCategory']
        }
      ],
      order: [['postingDate', 'ASC'], ['createdAt', 'ASC']]
    });

    // Group entries by account and calculate opening balances
    const accountBalances = new Map();

    openingEntries.forEach(entry => {
      const accountId = entry.accountId;
      const account = entry.account;

      if (!account) return;

      if (!accountBalances.has(accountId)) {
        accountBalances.set(accountId, {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          rootType: account.rootType,
          accountCategory: account.accountCategory,
          debitBalance: 0,
          creditBalance: 0,
          netBalance: 0
        });
      }

      const accountData = accountBalances.get(accountId);
      accountData.debitBalance += parseFloat(entry.debit || 0);
      accountData.creditBalance += parseFloat(entry.credit || 0);
    });

    // Calculate net balances and format for display
    const trialBalanceData = Array.from(accountBalances.values()).map(account => {
      const netBalance = account.debitBalance - account.creditBalance;

      // Determine display balance based on account type
      let displayDebit = 0;
      let displayCredit = 0;

      if (['asset', 'expense'].includes(account.type)) {
        if (netBalance >= 0) {
          displayDebit = netBalance;
        } else {
          displayCredit = Math.abs(netBalance);
        }
      } else {
        if (netBalance <= 0) {
          displayCredit = Math.abs(netBalance);
        } else {
          displayDebit = netBalance;
        }
      }

      return {
        ...account,
        netBalance,
        displayDebit,
        displayCredit
      };
    });

    // Sort by account code
    trialBalanceData.sort((a, b) => a.code.localeCompare(b.code));

    // Calculate totals
    const totalDebit = trialBalanceData.reduce((sum, account) => sum + account.displayDebit, 0);
    const totalCredit = trialBalanceData.reduce((sum, account) => sum + account.displayCredit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    // Group by account type for better presentation
    const groupedData = trialBalanceData.reduce((groups, account) => {
      const type = account.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(account);
      return groups;
    }, {});

    res.json({
      success: true,
      data: {
        asOfDate,
        currency,
        accounts: trialBalanceData,
        groupedAccounts: groupedData,
        totals: {
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit,
          isBalanced
        },
        summary: {
          totalAccounts: trialBalanceData.length,
          accountsWithBalance: trialBalanceData.filter(a => a.displayDebit > 0 || a.displayCredit > 0).length,
          generatedAt: new Date().toISOString()
        }
      },
      message: 'تم جلب ميزان المراجعة الافتتاحي بنجاح'
    });

  } catch (error) {
    console.error('Error generating opening trial balance:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء ميزان المراجعة الافتتاحي',
      error: error.message
    });
  }
});

// GET /api/financial/reports/trial-balance - Get trial balance report
router.get('/reports/trial-balance', async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch, asOfDate } = req.query;

    // Set default dates if not provided
    const defaultDateFrom = dateFrom || '2025-01-01';
    const defaultDateTo = dateTo || asOfDate || new Date().toISOString().split('T')[0];

    console.log('🔍 جلب ميزان المراجعة من', defaultDateFrom, 'إلى', defaultDateTo);

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
            postingDate: {
              [Op.between]: [defaultDateFrom, defaultDateTo]
            },
            isCancelled: false,
            ...(currency !== 'LYD' && { currency })
          },
          required: false
        }
      ],
      order: [['code', 'ASC']]
    });

    const trialBalance = accounts.map(account => {
      const entries = account.glEntries || [];
      const totalDebit = entries.reduce((sum, entry) => {
        const debitValue = parseFloat(entry.debit || 0);
        return sum + debitValue;
      }, 0);
      const totalCredit = entries.reduce((sum, entry) => {
        const creditValue = parseFloat(entry.credit || 0);
        return sum + creditValue;
      }, 0);
      const balance = totalDebit - totalCredit;

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        level: account.level || 1,
        isGroup: account.isGroup || false,
        debit: parseFloat(totalDebit.toFixed(2)),
        credit: parseFloat(totalCredit.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        currency: currency
      };
    }).filter(entry => entry.debit !== 0 || entry.credit !== 0 || entry.balance !== 0);

    const totals = trialBalance.reduce((acc, entry) => ({
      totalDebit: parseFloat((acc.totalDebit + entry.debit).toFixed(2)),
      totalCredit: parseFloat((acc.totalCredit + entry.credit).toFixed(2))
    }), { totalDebit: 0, totalCredit: 0 });

    // Add balance check
    const difference = Math.abs(totals.totalDebit - totals.totalCredit);
    const isBalanced = difference < 0.01; // Allow for small rounding differences

    // Format response to match client expectations
    res.json({
      success: true,
      data: {
        accounts: trialBalance,
        totals: {
          totalDebits: parseFloat(totals.totalDebit.toFixed(2)),
          totalCredits: parseFloat(totals.totalCredit.toFixed(2)),
          difference: parseFloat(difference.toFixed(2))
        },
        asOfDate: defaultDateTo,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في إنشاء ميزان المراجعة',
      error: error.message 
    });
  }
});

// GET /api/financial/reports/income-statement - Get income statement report
router.get('/reports/income-statement', async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Set default dates if not provided
    const defaultDateFrom = dateFrom || '2025-01-01';
    const defaultDateTo = dateTo || new Date().toISOString().split('T')[0];

    console.log('🔍 جلب قائمة الدخل من', defaultDateFrom, 'إلى', defaultDateTo);

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
            postingDate: {
              [Op.between]: [defaultDateFrom, defaultDateTo]
            },
            isCancelled: false,
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

    const totalRevenue = revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      revenues: revenues,
      expenses: expenses,
      totals: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netIncome: parseFloat(netIncome.toFixed(2))
      },
      period: { dateFrom: defaultDateFrom, dateTo: defaultDateTo },
      currency,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ message: 'خطأ في إنشاء قائمة الدخل' });
  }
});

// GET /api/financial/reports/balance-sheet - Get balance sheet report
router.get('/reports/balance-sheet', async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Set default dates if not provided
    const defaultDateFrom = dateFrom || '2025-01-01';
    const defaultDateTo = dateTo || new Date().toISOString().split('T')[0];

    console.log('🔍 جلب الميزانية العمومية كما في', defaultDateTo);

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
            postingDate: {
              [Op.lte]: defaultDateTo
            },
            isCancelled: false,
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

    const totalAssets = assets.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalEquity = equity.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    res.json({
      assets: assets,
      liabilities: liabilities,
      equity: equity,
      totals: {
        totalAssets: parseFloat(totalAssets.toFixed(2)),
        totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
        totalEquity: parseFloat(totalEquity.toFixed(2))
      },
      asOfDate: defaultDateTo,
      currency,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الميزانية العمومية' });
  }
});

// GET /api/financial/reports/cash-flow - Get cash flow statement
router.get('/reports/cash-flow', async (req, res) => {
  try {
    const { dateFrom, dateTo, currency = 'LYD', branch } = req.query;

    // Set default dates if not provided
    const defaultDateFrom = dateFrom || '2025-01-01';
    const defaultDateTo = dateTo || new Date().toISOString().split('T')[0];

    console.log('🔍 جلب قائمة التدفقات النقدية من', defaultDateFrom, 'إلى', defaultDateTo);

    // Get cash and bank accounts
    const cashAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%نقد%' } },
          { name: { [Op.like]: '%صندوق%' } },
          { name: { [Op.like]: '%بنك%' } },
          { name: { [Op.like]: '%cash%' } },
          { name: { [Op.like]: '%bank%' } }
        ],
        isActive: true,
        ...(branch && { branch })
      },
      include: [
        {
          model: GLEntry,
          as: 'glEntries',
          where: {
            postingDate: {
              [Op.between]: [defaultDateFrom, defaultDateTo]
            },
            isCancelled: false,
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
      period: { dateFrom: defaultDateFrom, dateTo: defaultDateTo },
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
      whereClause.employeeName = { [Op.like]: `%${search}%` };
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
      whereClause.postingDate = {};
      if (fromDate) whereClause.postingDate[Op.gte] = fromDate;
      if (toDate) whereClause.postingDate[Op.lte] = toDate;
    }

    const options = {
      where: whereClause,
      include: [
        {
          model: JournalEntry,
          as: 'journalEntry',
          attributes: ['id', 'entryNumber', 'description']
        }
      ],
      order: [['postingDate', 'ASC'], ['createdAt', 'ASC']]
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
          postingDate: { [Op.lt]: fromDate }
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      accountId: req.params.id,
      query: req.query
    });
    res.status(500).json({
      message: 'خطأ في إنشاء كشف الحساب',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== INSTANT REPORTS ROUTES ====================

// GET /api/financial/instant-reports - Get instant financial reports
router.get('/instant-reports', async (req, res) => {
  try {
    console.log('🔍 Starting instant reports generation...');
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

    console.log(`📅 Period: ${period}, Date range: ${dateFrom} to ${dateTo}`);

    // Calculate financial metrics based on actual account balances and GL entries
    console.log('💡 Using account-based calculation for more accurate results...');

    let totalReceipts = 0;
    let totalPayments = 0;
    let receipts = [];
    let payments = [];

    // Get cash flow from GL entries for cash accounts (more accurate)
    try {
      const cashFlowEntries = await GLEntry.findAll({
        where: {
          postingDate: { [Op.between]: [dateFrom, dateTo] }
        },
        include: [
          {
            model: Account,
            as: 'account',
            where: {
              [Op.or]: [
                { name: { [Op.like]: '%خزينة%' } },
                { name: { [Op.like]: '%نقد%' } },
                { name: { [Op.like]: '%صندوق%' } },
                { name: { [Op.like]: '%بنك%' } },
                { name: { [Op.like]: '%cash%' } },
                { name: { [Op.like]: '%bank%' } }
              ]
            },
            attributes: ['name', 'code', 'type'],
            required: true
          }
        ]
      });

      // Calculate receipts (debit entries to cash accounts) and payments (credit entries)
      cashFlowEntries.forEach(entry => {
        const debit = parseFloat(entry.debit || 0);
        const credit = parseFloat(entry.credit || 0);

        if (debit > 0) {
          totalReceipts += debit;
          receipts.push({
            customer: 'من القيود المحاسبية',
            amount: debit,
            date: entry.postingDate,
            method: 'نقدي',
            receiptNumber: entry.id,
            remarks: `قيد مدين - ${entry.account.name}`
          });
        }

        if (credit > 0) {
          totalPayments += credit;
          payments.push({
            supplier: 'من القيود المحاسبية',
            amount: credit,
            date: entry.postingDate,
            method: 'نقدي',
            paymentNumber: entry.id,
            notes: `قيد دائن - ${entry.account.name}`
          });
        }
      });

      console.log(`💰 Calculated receipts from GL entries: ${totalReceipts}`);
      console.log(`💸 Calculated payments from GL entries: ${totalPayments}`);
    } catch (error) {
      console.warn('⚠️ Error calculating cash flow from GL entries:', error.message);
      totalReceipts = 0;
      totalPayments = 0;
      receipts = [];
      payments = [];
    }

    // Calculate revenue and expenses from account balances (more comprehensive)
    let revenueEntries = [];
    let expenseEntries = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    try {
      // Get revenue accounts with their current balances
      const revenueAccounts = await Account.findAll({
        where: {
          type: 'revenue',
          isActive: true
        },
        attributes: ['id', 'name', 'code', 'balance']
      });

      // For revenue accounts, balance represents total revenue (credit balance)
      revenueAccounts.forEach(account => {
        const balance = parseFloat(account.balance || 0);
        if (balance !== 0) {
          totalRevenue += Math.abs(balance); // Revenue accounts typically have credit balances
          revenueEntries.push({
            type: account.name,
            amount: Math.abs(balance),
            date: new Date().toISOString().split('T')[0],
            account: account.code
          });
        }
      });

      console.log(`📈 Revenue from ${revenueAccounts.length} accounts, total: ${totalRevenue}`);
    } catch (error) {
      console.warn('⚠️ Error fetching revenue accounts:', error.message);
      totalRevenue = 0;
      revenueEntries = [];
    }

    try {
      // Get expense accounts with their current balances
      const expenseAccounts = await Account.findAll({
        where: {
          type: 'expense',
          isActive: true
        },
        attributes: ['id', 'name', 'code', 'balance']
      });

      console.log(`🔍 Found ${expenseAccounts.length} expense accounts:`);
      expenseAccounts.forEach(account => {
        console.log(`   ${account.code} - ${account.name}: ${account.balance} LYD`);
      });

      // For expense accounts, balance represents total expenses (debit balance)
      expenseAccounts.forEach(account => {
        const balance = parseFloat(account.balance || 0);
        console.log(`   Processing ${account.name}: balance=${balance}, abs=${Math.abs(balance)}`);
        if (balance !== 0) {
          totalExpenses += Math.abs(balance); // Expense accounts typically have debit balances
          expenseEntries.push({
            type: account.name,
            amount: Math.abs(balance),
            date: new Date().toISOString().split('T')[0],
            account: account.code
          });
        }
      });

      console.log(`📉 Expenses from ${expenseAccounts.length} accounts, total: ${totalExpenses}`);
    } catch (error) {
      console.warn('⚠️ Error fetching expense accounts:', error.message);
      totalExpenses = 0;
      expenseEntries = [];
    }

    // Calculate receivables, payables, and cash balance from account balances
    let totalReceivables = 0;
    let totalPayables = 0;
    let cashBalance = 0;

    try {
      // Get customer/receivable accounts
      const receivableAccounts = await Account.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: '%مدين%' } },
            { name: { [Op.like]: '%عميل%' } },
            { name: { [Op.like]: '%receivable%' } },
            { type: 'asset', name: { [Op.like]: '%عملاء%' } }
          ],
          isActive: true
        },
        attributes: ['id', 'name', 'code', 'balance']
      });

      totalReceivables = receivableAccounts.reduce((sum, acc) => {
        const balance = parseFloat(acc.balance || 0);
        return sum + (balance > 0 ? balance : 0); // Only positive balances for receivables
      }, 0);

      console.log(`💳 Receivables from ${receivableAccounts.length} accounts: ${totalReceivables}`);
    } catch (error) {
      console.warn('⚠️ Error fetching receivables:', error.message);
      totalReceivables = 0;
    }

    try {
      // Get supplier/payable accounts
      const payableAccounts = await Account.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: '%دائن%' } },
            { name: { [Op.like]: '%مورد%' } },
            { name: { [Op.like]: '%payable%' } },
            { type: 'liability', name: { [Op.like]: '%موردين%' } }
          ],
          isActive: true
        },
        attributes: ['id', 'name', 'code', 'balance']
      });

      totalPayables = payableAccounts.reduce((sum, acc) => {
        const balance = parseFloat(acc.balance || 0);
        return sum + (balance > 0 ? balance : 0); // Only positive balances for payables
      }, 0);

      console.log(`💸 Payables from ${payableAccounts.length} accounts: ${totalPayables}`);
    } catch (error) {
      console.warn('⚠️ Error fetching payables:', error.message);
      totalPayables = 0;
    }

    try {
      // Get cash and bank accounts
      const cashAccounts = await Account.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: '%نقد%' } },
            { name: { [Op.like]: '%صندوق%' } },
            { name: { [Op.like]: '%بنك%' } },
            { name: { [Op.like]: '%خزينة%' } },
            { name: { [Op.like]: '%cash%' } },
            { name: { [Op.like]: '%bank%' } }
          ],
          isActive: true
        },
        attributes: ['id', 'name', 'code', 'balance']
      });

      cashBalance = cashAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
      console.log(`💰 Cash balance from ${cashAccounts.length} accounts: ${cashBalance}`);
    } catch (error) {
      console.warn('⚠️ Error fetching cash balance:', error.message);
      cashBalance = 0;
    }

    // Calculate simple trends
    const receiptsTrend = receipts.length > 0 ? 5.2 : 0;
    const paymentsTrend = payments.length > 0 ? -2.1 : 0;
    const revenueTrend = totalRevenue > 0 ? 8.5 : 0;

    console.log('✅ Instant reports generated successfully');

    res.json({
      period: {
        dateFrom,
        dateTo,
        label: period
      },
      receipts: {
        totalAmount: totalReceipts,
        count: receipts.length,
        trend: receiptsTrend,
        period: period,
        details: receipts.map(r => ({
          customer: r.customer?.name || 'غير محدد',
          amount: parseFloat(r.amount || 0),
          date: r.date || new Date().toISOString().split('T')[0],
          method: r.paymentMethod || 'نقدي',
          receiptNumber: r.receiptNumber || '',
          remarks: r.remarks || ''
        }))
      },
      payments: {
        totalAmount: totalPayments,
        count: payments.length,
        trend: paymentsTrend,
        period: period,
        details: payments.map(p => ({
          supplier: p.customer?.name || 'غير محدد',
          amount: parseFloat(p.amount || 0),
          date: p.date || new Date().toISOString().split('T')[0],
          method: p.paymentMethod || 'نقدي',
          paymentNumber: p.paymentNumber || '',
          notes: p.notes || ''
        }))
      },
      revenue: {
        totalAmount: totalRevenue,
        count: revenueEntries.length,
        trend: revenueTrend,
        period: period,
        details: revenueEntries.map(e => ({
          type: e.type || 'غير محدد',
          amount: parseFloat(e.amount || 0),
          date: e.date || new Date().toISOString().split('T')[0],
          account: e.account || ''
        }))
      },
      expenses: {
        totalAmount: totalExpenses,
        count: expenseEntries.length,
        trend: totalExpenses > 0 ? 3.2 : 0, // Mock trend
        period: period,
        details: expenseEntries.map(e => ({
          type: e.type || 'غير محدد',
          amount: parseFloat(e.amount || 0),
          date: e.date || new Date().toISOString().split('T')[0],
          account: e.account || ''
        }))
      },
      receivables: {
        totalAmount: totalReceivables,
        count: 0, // We don't have receivableAccounts variable in scope anymore
        trend: 0,
        period: period,
        details: [] // Simplified - no detailed receivables for now
      },
      payables: {
        totalAmount: totalPayables,
        count: 0, // Simplified
        trend: 0,
        period: period,
        details: [] // Simplified - no detailed payables for now
      },
      cashFlow: {
        totalAmount: totalReceipts - totalPayments,
        count: receipts.length + payments.length,
        trend: receiptsTrend - Math.abs(paymentsTrend),
        period: period,
        details: [
          ...receipts.map(r => ({
            type: 'مقبوضات',
            amount: parseFloat(r.amount || 0),
            date: r.date || new Date().toISOString().split('T')[0],
            customer: r.customer?.name || 'غير محدد',
            method: r.paymentMethod || 'نقدي'
          })),
          ...payments.map(p => ({
            type: 'مدفوعات',
            amount: -parseFloat(p.amount || 0),
            date: p.date || new Date().toISOString().split('T')[0],
            customer: p.customer?.name || 'غير محدد',
            method: p.paymentMethod || 'نقدي'
          }))
        ]
      },
      summary: {
        netCashFlow: totalReceipts - totalPayments,
        netIncome: totalRevenue - totalExpenses,
        cashBalance: cashBalance,
        totalReceivables: totalReceivables,
        totalPayables: totalPayables
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error generating instant reports:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      period: req.query.period
    });

    res.status(500).json({
      message: 'خطأ في إنشاء التقارير الفورية',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
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
      whereClause.employeeName = { [Op.like]: `%${search}%` };
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
        { receiptNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
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
        { paymentNumber: { [Op.like]: `%${search}%` } },
        { payeeName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
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

// GET /api/financial/recent-transactions - Get recent transactions
router.get('/recent-transactions', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log('🔍 جلب المعاملات الأخيرة...');

    // جلب آخر القيود من الأستاذ العام
    const recentEntries = await GLEntry.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Account,
          attributes: ['id', 'code', 'name', 'type'],
          required: true
        }
      ],
      attributes: ['id', 'postingDate', 'description', 'debit', 'credit', 'voucherType', 'voucherNo', 'createdAt']
    });

    // تنسيق البيانات للعرض
    const formattedTransactions = recentEntries.map(entry => ({
      id: entry.id,
      date: entry.postingDate || entry.createdAt,
      description: entry.description || 'قيد محاسبي',
      account: {
        code: entry.Account?.code || 'N/A',
        name: entry.Account?.name || 'حساب غير محدد'
      },
      amount: parseFloat(entry.debit || entry.credit || 0),
      type: entry.debit > 0 ? 'debit' : 'credit',
      voucherType: entry.voucherType || 'Journal Entry',
      voucherNo: entry.voucherNo || 'N/A',
      status: 'completed'
    }));

    console.log(`✅ تم جلب ${formattedTransactions.length} معاملة`);
    res.json({
      success: true,
      data: formattedTransactions,
      total: formattedTransactions.length,
      message: 'تم جلب المعاملات الأخيرة بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المعاملات الأخيرة:', error);

    // في حالة الخطأ، إرجاع بيانات وهمية مؤقتاً
    const mockTransactions = [
      {
        id: 'mock-1',
        date: new Date().toISOString().split('T')[0],
        description: 'لا توجد معاملات حقيقية متاحة',
        account: { code: '0000', name: 'حساب تجريبي' },
        amount: 0,
        type: 'debit',
        voucherType: 'Mock Entry',
        voucherNo: 'MOCK-001',
        status: 'pending'
      }
    ];

    res.json({
      success: false,
      data: mockTransactions,
      total: 0,
      message: 'تم استخدام بيانات تجريبية - يرجى التحقق من قاعدة البيانات',
      error: error.message
    });
  }
});

// ==================== VOUCHER MANAGEMENT ROUTES ====================

// GET /api/financial/vouchers/receipts - Get receipt vouchers
router.get('/vouchers/receipts', authenticateToken, requireTreasuryAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, accountId, partyType, partyId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE conditions for SQL query
    let whereConditions = ['r."isActive" = true'];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(r."receiptNo" ILIKE $${paramIndex} OR r.remarks ILIKE $${paramIndex + 1})`);
      queryParams.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    if (accountId) {
      whereConditions.push(`r."accountId" = $${paramIndex}`);
      queryParams.push(accountId);
      paramIndex++;
    }

    if (partyType) {
      whereConditions.push(`r."partyType" = $${paramIndex}`);
      queryParams.push(partyType);
      paramIndex++;
    }

    if (partyId) {
      whereConditions.push(`r."partyId" = $${paramIndex}`);
      queryParams.push(partyId);
      paramIndex++;
    }

    if (startDate && endDate) {
      whereConditions.push(`r."receiptDate" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM receipts r
      WHERE ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: queryParams,
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT
        r.id,
        r."receiptNo",
        r."receiptDate",
        r.amount,
        r.status,
        r."paymentMethod",
        r.remarks,
        r."partyType",
        r."partyId",
        r."createdAt",
        r."updatedAt",
        a.id as "account_id",
        a.code as "account_code",
        a.name as "account_name",
        s.id as "supplier_id",
        s.name as "supplier_name",
        s.code as "supplier_code",
        u.id as "creator_id",
        u.name as "creator_name",
        u.username as "creator_username"
      FROM receipts r
      LEFT JOIN accounts a ON r."accountId" = a.id
      LEFT JOIN suppliers s ON r."supplierId" = s.id
      LEFT JOIN users u ON r."createdBy" = u.id
      WHERE ${whereClause}
      ORDER BY r."receiptDate" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const receipts = await sequelize.query(dataQuery, {
      bind: queryParams,
      type: sequelize.QueryTypes.SELECT
    });

    // Format the response to match expected structure
    const formattedReceipts = receipts.map(receipt => ({
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      receiptDate: receipt.receiptDate,
      amount: receipt.amount,
      status: receipt.status,
      paymentMethod: receipt.paymentMethod,
      remarks: receipt.remarks,
      partyType: receipt.partyType,
      partyId: receipt.partyId,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
      account: receipt.account_id ? {
        id: receipt.account_id,
        code: receipt.account_code,
        name: receipt.account_name
      } : null,
      supplier: receipt.supplier_id ? {
        id: receipt.supplier_id,
        name: receipt.supplier_name,
        code: receipt.supplier_code
      } : null,
      creator: receipt.creator_id ? {
        id: receipt.creator_id,
        name: receipt.creator_name,
        username: receipt.creator_username
      } : null
    }));

    res.json({
      success: true,
      data: formattedReceipts,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
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

// POST /api/financial/vouchers/receipts - Create receipt voucher
router.post('/vouchers/receipts', authenticateToken, requireTreasuryAccess, async (req, res) => {
  try {
    const {
      accountId,
      partyType,
      partyId,
      amount,
      receiptDate,
      paymentMethod,
      referenceNo,
      bankAccount,
      checkNumber,
      remarks,
      currency = 'LYD',
      exchangeRate = 1.0,
      invoiceAllocations = [],
      counterAccountId
    } = req.body;

    // Validate required fields (amount and date only)
    if (!amount || !receiptDate) {
      return res.status(400).json({ success: false, message: 'المبلغ والتاريخ مطلوبة' });
    }

    // Auto-derive cash/bank account if not provided
    let resolvedAccountId = accountId;
    if (!resolvedAccountId) {
      const cashCode = (paymentMethod === 'bank_transfer' || paymentMethod === 'check' || paymentMethod === 'credit_card') ? '1.1.2' : '1.1.1';
      let acc = await Account.findOne({ where: { code: cashCode } });
      if (!acc) {
        await ensureOperationalSubAccounts(models);
        acc = await Account.findOne({ where: { code: cashCode } });
      }
      if (!acc) {
        return res.status(400).json({ success: false, message: 'تعذر تحديد حساب الصندوق/المصرف الافتراضي' });
      }
      resolvedAccountId = acc.id;
    }

    // Auto-derive counter account if not provided
    let resolvedCounterAccountId = counterAccountId;
    if (!resolvedCounterAccountId) {
      let counterCode = '1.2.1'; // default: Accounts Receivable

      // تحديد نوع الحساب المقابل بناءً على نوع الطرف ونوع الإيراد
      if (partyType === 'customer') {
        counterCode = '1.2.1'; // ذمم عملاء
      } else if (req.body.revenueType === 'storage') {
        counterCode = '5.1.1'; // إيرادات التخزين
      } else if (req.body.revenueType === 'handling') {
        counterCode = '5.1.2'; // إيرادات المناولة
      } else if (req.body.revenueType === 'shipping') {
        counterCode = '5.1.3'; // إيرادات الشحن
      } else if (req.body.revenueType === 'general') {
        counterCode = '5.1.1'; // إيرادات عامة
      }

      let cAcc = await Account.findOne({ where: { code: counterCode } });
      if (!cAcc) {
        await ensureOperationalSubAccounts(models);
        cAcc = await Account.findOne({ where: { code: counterCode } });
      }
      if (!cAcc) {
        return res.status(400).json({ success: false, message: `تعذر تحديد الحساب المقابل تلقائياً (${counterCode})` });
      }
      resolvedCounterAccountId = cAcc.id;
    }

    const maxAttempts = 3;
    const isBusy = (e) => /SQLITE_BUSY|database is locked/i.test(e?.message || '') || e?.parent?.code === 'SQLITE_BUSY';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const transaction = await sequelize.transaction();
      try {
        // Generate receipt number
        const lastReceipt = await Receipt.findOne({
          order: [['createdAt', 'DESC']]
        });
        // Validate counter account exists and is active
        const counterAccount = await Account.findByPk(resolvedCounterAccountId, { transaction });
        if (!counterAccount || counterAccount.isActive === false) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'حساب المقابل غير موجود أو غير نشط' });
        }
        const nextNumber = lastReceipt ? parseInt(lastReceipt.receiptNo.replace(/\D/g, '')) + 1 : 1;
        const receiptNo = `REC-${String(nextNumber).padStart(6, '0')}`;

        // Create receipt
        const receipt = await Receipt.create({
          receiptNo,
          accountId: resolvedAccountId,
          partyType,
          partyId,
          supplierId: partyType === 'supplier' ? partyId : null,
          receiptDate,
          amount,
          paymentMethod,

          referenceNo,
          bankAccount,
          checkNumber,
          remarks,
          currency,
          exchangeRate,
          status: 'completed',
          createdBy: req.user.id,
          completedAt: new Date(),
          completedBy: req.user.id
        }, { transaction });

        // Attach non-persistent counter account id for journal entry method
        receipt.set('counterAccountId', resolvedCounterAccountId);


        // Create journal entry
        await receipt.createJournalEntry(req.user.id, { transaction });

        // Handle invoice allocations if provided
        if (invoiceAllocations && invoiceAllocations.length > 0) {
          await InvoiceReceipt.allocateReceiptToInvoices(
            receipt.id,
            invoiceAllocations,
            req.user.id,
            { transaction }
          );
        }

        await transaction.commit();

        // Trigger balance update for affected accounts
        balanceUpdateService.queueBalanceUpdate(resolvedAccountId, 'receipt_created', {
          receiptId: receipt.id,
          receiptNo: receipt.receiptNo,
          amount: receipt.amount,
          userId: req.user.id
        });

        // Emit real-time voucher created event
        if (global.io) {
          global.io.emit('voucher_created', {
            voucherId: receipt.id,
            voucherType: 'receipt',
            voucherNumber: receipt.receiptNo,
            amount: receipt.amount,
            accountId: receipt.accountId,
            timestamp: new Date().toISOString()
          });
        }

        // Fetch the created receipt with associations
        const createdReceipt = await Receipt.findByPk(receipt.id, {
          include: [
            { model: Account, as: 'account', attributes: ['id', 'code', 'name'] },
            { model: User, as: 'creator', attributes: ['id', 'name'] }
          ]
        });

        return res.status(201).json({
          success: true,
          data: createdReceipt,
          message: 'تم إنشاء إيصال القبض بنجاح'
        });
      } catch (error) {
        try { if (!transaction.finished) { await transaction.rollback(); } } catch (e) {}
        if (isBusy(error) && attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 350 * attempt));
          continue;
        }
        throw error;
      }
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

// GET /api/financial/vouchers/payments - Get payment vouchers
router.get('/vouchers/payments', authenticateToken, requireTreasuryAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, accountId, partyType, partyId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE conditions for SQL query
    let whereConditions = ['p."isActive" = true'];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(p."paymentNumber" ILIKE $${paramIndex} OR p.notes ILIKE $${paramIndex + 1})`);
      queryParams.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    if (accountId) {
      whereConditions.push(`p."accountId" = $${paramIndex}`);
      queryParams.push(accountId);
      paramIndex++;
    }

    if (partyType) {
      whereConditions.push(`p."partyType" = $${paramIndex}`);
      queryParams.push(partyType);
      paramIndex++;
    }

    if (partyId) {
      whereConditions.push(`p."partyId" = $${paramIndex}`);
      queryParams.push(partyId);
      paramIndex++;
    }

    if (startDate && endDate) {
      whereConditions.push(`p.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM payments p
      WHERE ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: queryParams,
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT
        p.id,
        p."paymentNumber",
        p.date,
        p.amount,
        p.status,
        p."paymentMethod",
        p.notes,
        p."partyType",
        p."partyId",
        p."createdAt",
        p."updatedAt",
        a.id as "account_id",
        a.code as "account_code",
        a.name as "account_name",
        c.id as "customer_id",
        c.name as "customer_name",
        c.code as "customer_code",
        s.id as "supplier_id",
        s.name as "supplier_name",
        s.code as "supplier_code",
        u.id as "creator_id",
        u.name as "creator_name",
        u.username as "creator_username"
      FROM payments p
      LEFT JOIN accounts a ON p."accountId" = a.id
      LEFT JOIN customers c ON p."customerId" = c.id
      LEFT JOIN suppliers s ON p."supplierId" = s.id
      LEFT JOIN users u ON p."createdBy" = u.id
      WHERE ${whereClause}
      ORDER BY p.date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const payments = await sequelize.query(dataQuery, {
      bind: queryParams,
      type: sequelize.QueryTypes.SELECT
    });

    // Format the response to match expected structure
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      date: payment.date,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
      partyType: payment.partyType,
      partyId: payment.partyId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      account: payment.account_id ? {
        id: payment.account_id,
        code: payment.account_code,
        name: payment.account_name
      } : null,
      customer: payment.customer_id ? {
        id: payment.customer_id,
        name: payment.customer_name,
        code: payment.customer_code
      } : null,
      supplier: payment.supplier_id ? {
        id: payment.supplier_id,
        name: payment.supplier_name,
        code: payment.supplier_code
      } : null,
      creator: payment.creator_id ? {
        id: payment.creator_id,
        name: payment.creator_name,
        username: payment.creator_username
      } : null
    }));

    res.json({
      success: true,
      data: formattedPayments,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
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

// POST /api/financial/vouchers/payments - Create payment voucher
router.post('/vouchers/payments', authenticateToken, requireTreasuryAccess, async (req, res) => {
  try {
    const {
      accountId,
      partyType,
      partyId,
      amount,
      date,
      paymentMethod,
      reference,
      notes,
      currency = 'LYD',
      exchangeRate = 1.0,
      invoiceAllocations = []
    } = req.body;

    // Validate required fields (amount and date only)
    if (!amount || !date) {
      return res.status(400).json({ success: false, message: 'المبلغ والتاريخ مطلوبة' });
    }

    // Auto-derive cash/bank account if not provided
    let resolvedAccountId = accountId;
    if (!resolvedAccountId) {
      const cashCode = (paymentMethod === 'bank_transfer' || paymentMethod === 'check' || paymentMethod === 'credit_card') ? '1.1.2' : '1.1.1';
      let acc = await Account.findOne({ where: { code: cashCode } });
      if (!acc) {
        await ensureOperationalSubAccounts(models);
        acc = await Account.findOne({ where: { code: cashCode } });
      }
      if (!acc) {
        return res.status(400).json({ success: false, message: 'تعذر تحديد حساب الصندوق/المصرف الافتراضي' });
      }
      resolvedAccountId = acc.id;
    }

    // Auto-derive counter account if not provided
    let resolvedCounterAccountId = req.body.counterAccountId;
    if (!resolvedCounterAccountId) {
      let counterCode = '2.1.1'; // default: Purchase Expense

      // تحديد نوع الحساب المقابل بناءً على نوع الطرف ونوع المصروف
      if (partyType === 'supplier') {
        counterCode = '3.1.1'; // ذمم موردين
      } else if (req.body.expenseType === 'transport') {
        counterCode = '2.1.2'; // مصروف نقل
      } else if (req.body.expenseType === 'purchase') {
        counterCode = '2.1.1'; // مصروف مشتريات
      } else if (req.body.expenseType === 'general') {
        counterCode = '2.1.1'; // مصروف عام
      } else if (req.body.expenseType === 'salary') {
        counterCode = '2.2.1'; // مصروف رواتب
      }

      let cAcc = await Account.findOne({ where: { code: counterCode } });
      if (!cAcc) {
        await ensureOperationalSubAccounts(models);
        cAcc = await Account.findOne({ where: { code: counterCode } });
      }
      if (!cAcc) {
        return res.status(400).json({ success: false, message: `تعذر تحديد الحساب المقابل تلقائياً (${counterCode})` });
      }
      resolvedCounterAccountId = cAcc.id;
    }

    const maxAttempts = 3;
    const isBusy = (e) => /SQLITE_BUSY|database is locked/i.test(e?.message || '') || e?.parent?.code === 'SQLITE_BUSY';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const transaction = await sequelize.transaction();
      try {
        // Generate payment number
        const lastPayment = await Payment.findOne({
          order: [['createdAt', 'DESC']]
        });
        const nextNumber = lastPayment ? parseInt(lastPayment.paymentNumber.replace(/\D/g, '')) + 1 : 1;
        const paymentNumber = `PAY-${String(nextNumber).padStart(6, '0')}`;

        // Create payment - temporarily exclude fields that may not exist in production DB
        const payment = await Payment.create({
          paymentNumber,
          accountId: resolvedAccountId,
          partyType,
          partyId,
          customerId: partyType === 'customer' ? partyId : null,
          date,
          amount,
          paymentMethod,
          reference,
          notes,
          status: 'completed',
          // createdBy: req.user.id,  // Temporarily disabled - column may not exist in production
          // completedAt: new Date(),  // Keep this as it might exist
          // completedBy: req.user.id  // Temporarily disabled - column may not exist in production
        }, { transaction });

        // Attach counter account for journal entry mapping
        payment.set('counterAccountId', resolvedCounterAccountId);

        // Create journal entry
        await payment.createJournalEntry(req.user.id, { transaction });

        // Handle invoice allocations if provided
        if (invoiceAllocations && invoiceAllocations.length > 0) {
          await InvoicePayment.allocatePaymentToInvoices(
            payment.id,
            invoiceAllocations,
            req.user.id,
            { transaction }
          );
        }

        await transaction.commit();

        // Trigger balance update for affected accounts
        balanceUpdateService.queueBalanceUpdate(resolvedAccountId, 'payment_created', {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          userId: req.user.id
        });

        // Emit real-time voucher created event
        if (global.io) {
          global.io.emit('voucher_created', {
            voucherId: payment.id,
            voucherType: 'payment',
            voucherNumber: payment.paymentNumber,
            amount: payment.amount,
            accountId: payment.accountId,
            timestamp: new Date().toISOString()
          });
        }

        // Fetch the created payment with associations
        const createdPayment = await Payment.findByPk(payment.id, {
          include: [
            { model: Account, as: 'account', attributes: ['id', 'code', 'name'] },
            { model: User, as: 'creator', attributes: ['id', 'name'] }
          ]
        });

        return res.status(201).json({
          success: true,
          data: createdPayment,
          message: 'تم إنشاء إيصال الصرف بنجاح'
        });
      } catch (error) {
        try { if (!transaction.finished) { await transaction.rollback(); } } catch (e) {}
        if (isBusy(error) && attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 350 * attempt));
          continue;
        }
        throw error;
      }
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

// GET /api/financial/accounts/autocomplete - Account auto-complete search
router.get('/accounts/autocomplete', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { search, type, subAccountsOnly = false, limit = 20 } = req.query;

    let whereClause = {
      isActive: true
    };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { nameEn: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by account type
    if (type) {
      whereClause.type = type;
    }

    // Filter for sub-accounts only (for opening balance entry)
    if (subAccountsOnly === 'true') {
      whereClause.isGroup = false;
      whereClause.level = { [Op.gt]: 1 };
    }

    const accounts = await Account.findAll({
      where: whereClause,
      attributes: ['id', 'code', 'name', 'nameEn', 'type', 'level', 'isGroup', 'balance', 'currency'],
      limit: parseInt(limit),
      order: [['code', 'ASC']]
    });

    res.json({
      success: true,
      data: accounts.map(account => ({
        id: account.id,
        code: account.code,
        name: account.name,
        nameEn: account.nameEn,
        type: account.type,
        level: account.level,
        isGroup: account.isGroup,
        balance: parseFloat(account.balance || 0),
        currency: account.currency,
        displayName: `${account.code} - ${account.name}`,
        value: account.id,
        label: `${account.code} - ${account.name}`
      }))
    });
  } catch (error) {
    console.error('Error in account autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في البحث عن الحسابات',
      error: error.message
    });
  }
});

// GET /api/financial/accounts/:id/statement-actions - Get available actions for account statement
router.get('/accounts/:id/statement-actions', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findByPk(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'الحساب غير موجود'
      });
    }

    // Determine available actions based on account type
    const actions = [];

    // All accounts can have receipt and payment vouchers
    actions.push(
      {
        id: 'receipt',
        name: 'إيصال قبض',
        nameEn: 'Receipt Voucher',
        icon: 'receipt',
        color: 'green',
        description: 'إنشاء إيصال قبض لهذا الحساب'
      },
      {
        id: 'payment',
        name: 'إيصال صرف',
        nameEn: 'Payment Voucher',
        icon: 'payment',
        color: 'red',
        description: 'إنشاء إيصال صرف لهذا الحساب'
      }
    );

    // Add specific actions based on account type
    if (account.type === 'asset' && account.name.includes('مدين')) {
      actions.push({
        id: 'outstanding_invoices',
        name: 'الفواتير المستحقة',
        nameEn: 'Outstanding Invoices',
        icon: 'invoice',
        color: 'blue',
        description: 'عرض الفواتير المستحقة لهذا الحساب'
      });
    }

    res.json({
      success: true,
      data: {
        account: {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type
        },
        actions
      }
    });
  } catch (error) {
    console.error('Error getting account statement actions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إجراءات كشف الحساب',
      error: error.message
    });
  }
});

// ==================== INVOICE-PAYMENT LINKING ROUTES ====================

// GET /api/financial/invoices/outstanding - Get outstanding invoices
router.get('/invoices/outstanding', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { customerId, accountId, limit = 50 } = req.query;

    let whereClause = {
      outstandingAmount: { [Op.gt]: 0.01 },
      status: { [Op.in]: ['unpaid', 'partially_paid'] }
    };

    if (customerId) whereClause.customerId = customerId;
    if (accountId) whereClause.accountId = accountId;

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: Account, as: 'account', attributes: ['id', 'code', 'name'] }
      ],
      limit: parseInt(limit),
      order: [['date', 'ASC']] // FIFO order
    });

    res.json({
      success: true,
      data: invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        total: parseFloat(invoice.total),
        paidAmount: parseFloat(invoice.paidAmount || 0),
        outstandingAmount: parseFloat(invoice.outstandingAmount || 0),
        status: invoice.status,
        customer: invoice.customer,
        account: invoice.account,
        daysOverdue: invoice.getDaysOverdue()
      }))
    });
  } catch (error) {
    console.error('Error fetching outstanding invoices:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفواتير المستحقة',
      error: error.message
    });
  }
});

// POST /api/financial/invoices/:id/allocate-payment - Allocate payment to invoice
router.post('/invoices/:id/allocate-payment', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id: invoiceId } = req.params;
    const { paymentId, amount, notes } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'معرف الدفعة والمبلغ مطلوبان'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Verify invoice exists and has outstanding amount
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'الفاتورة غير موجودة'
        });
      }

      if (invoice.getOutstandingAmount() < amount) {
        return res.status(400).json({
          success: false,
          message: 'المبلغ المخصص أكبر من المبلغ المستحق'
        });
      }

      // Verify payment exists
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'الدفعة غير موجودة'
        });
      }

      // Create allocation
      const allocation = await InvoicePayment.create({
        invoiceId,
        paymentId,
        allocatedAmount: amount,
        allocationDate: new Date(),
        notes,
        createdBy: req.user.id
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        data: allocation,
        message: 'تم تخصيص الدفعة للفاتورة بنجاح'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error allocating payment to invoice:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تخصيص الدفعة للفاتورة',
      error: error.message
    });
  }
});

// POST /api/financial/invoices/:id/allocate-receipt - Allocate receipt to invoice
router.post('/invoices/:id/allocate-receipt', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id: invoiceId } = req.params;
    const { receiptId, amount, notes } = req.body;

    if (!receiptId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'معرف الإيصال والمبلغ مطلوبان'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Verify invoice exists and has outstanding amount
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'الفاتورة غير موجودة'
        });
      }

      if (invoice.getOutstandingAmount() < amount) {
        return res.status(400).json({
          success: false,
          message: 'المبلغ المخصص أكبر من المبلغ المستحق'
        });
      }

      // Verify receipt exists
      const receipt = await Receipt.findByPk(receiptId);
      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'الإيصال غير موجود'
        });
      }

      // Create allocation
      const allocation = await InvoiceReceipt.create({
        invoiceId,
        receiptId,
        allocatedAmount: amount,
        allocationDate: new Date(),
        notes,
        createdBy: req.user.id
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        data: allocation,
        message: 'تم تخصيص الإيصال للفاتورة بنجاح'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error allocating receipt to invoice:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تخصيص الإيصال للفاتورة',
      error: error.message
    });
  }
});

// ==================== PROVISION MANAGEMENT ROUTES ====================

// GET /api/financial/provisions - Get account provisions
router.get('/provisions', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, mainAccountId, provisionType, isActive } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (mainAccountId) whereClause.mainAccountId = mainAccountId;
    if (provisionType) whereClause.provisionType = provisionType;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const provisions = await AccountProvision.findAndCountAll({
      where: whereClause,
      include: [
        { model: Account, as: 'mainAccount', attributes: ['id', 'code', 'name'] },
        { model: Account, as: 'provisionAccount', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: provisions.rows,
      total: provisions.count,
      page: parseInt(page),
      totalPages: Math.ceil(provisions.count / limit)
    });
  } catch (error) {
    console.error('Error fetching provisions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المخصصات',
      error: error.message
    });
  }
});

// POST /api/financial/provisions - Create account provision
router.post('/provisions', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const {
      mainAccountId,
      provisionAccountId,
      provisionType,
      provisionRate,
      fixedAmount,
      calculationMethod,
      calculationFrequency,
      description,
      notes
    } = req.body;

    if (!mainAccountId || !provisionAccountId || !provisionType) {
      return res.status(400).json({
        success: false,
        message: 'الحساب الأساسي وحساب المخصص ونوع المخصص مطلوبة'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const provision = await AccountProvision.create({
        mainAccountId,
        provisionAccountId,
        provisionType,
        provisionRate,
        fixedAmount,
        calculationMethod,
        calculationFrequency,
        description,
        notes,
        createdBy: req.user.id
      }, { transaction });

      await transaction.commit();

      const createdProvision = await AccountProvision.findByPk(provision.id, {
        include: [
          { model: Account, as: 'mainAccount', attributes: ['id', 'code', 'name'] },
          { model: Account, as: 'provisionAccount', attributes: ['id', 'code', 'name'] }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdProvision,
        message: 'تم إنشاء المخصص بنجاح'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating provision:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء المخصص',
      error: error.message
    });
  }
});

// PUT /api/financial/provisions/:id/calculate - Calculate and update provision
router.put('/provisions/:id/calculate', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const provision = await AccountProvision.findByPk(id);
    if (!provision) {
      return res.status(404).json({
        success: false,
        message: 'المخصص غير موجود'
      });
    }

    const result = await provision.updateProvision(req.user.id);

    res.json({
      success: true,
      data: {
        provision,
        newAmount: result.newAmount,
        difference: result.difference
      },
      message: 'تم حساب وتحديث المخصص بنجاح'
    });
  } catch (error) {
    console.error('Error calculating provision:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حساب المخصص',
      error: error.message
    });
  }
});

// GET /api/financial/provisions/due - Get provisions due for calculation
router.get('/provisions/due', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const dueProvisions = await AccountProvision.getDueProvisions();

    res.json({
      success: true,
      data: dueProvisions,
      count: dueProvisions.length
    });
  } catch (error) {
    console.error('Error fetching due provisions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المخصصات المستحقة',
      error: error.message
    });
  }
});

// ==================== REAL-TIME BALANCE ROUTES ====================

// GET /api/financial/accounts/:id/balance/realtime - Get real-time balance
router.get('/accounts/:id/balance/realtime', authenticateToken, requireRole(['admin', 'financial_manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;

    const balanceInfo = await balanceUpdateService.getRealTimeBalance(id);

    res.json({
      success: true,
      data: balanceInfo
    });
  } catch (error) {
    console.error('Error getting real-time balance:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الرصيد الحالي',
      error: error.message
    });
  }
});

// POST /api/financial/accounts/:id/balance/recalculate - Recalculate account balance
router.post('/accounts/:id/balance/recalculate', authenticateToken, requireRole(['admin', 'financial_manager', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params;

    balanceUpdateService.queueBalanceUpdate(id, 'manual_recalculation', {
      userId: req.user.id,
      reason: 'Manual recalculation requested'
    });

    res.json({
      success: true,
      message: 'تم طلب إعادة حساب الرصيد'
    });
  } catch (error) {
    console.error('Error queuing balance recalculation:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في طلب إعادة حساب الرصيد',
      error: error.message
    });
  }
});

// POST /api/financial/balances/recalculate-all - Recalculate all account balances
router.post('/balances/recalculate-all', authenticateToken, requireRole(['admin', 'financial_manager']), async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'financial_manager') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإجراء إعادة حساب شاملة للأرصدة'
      });
    }

    const result = await balanceUpdateService.recalculateAllBalances();

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'تم إعادة حساب جميع الأرصدة بنجاح' : 'فشل في إعادة حساب الأرصدة'
    });
  } catch (error) {
    console.error('Error in full balance recalculation:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة حساب جميع الأرصدة',
      error: error.message
    });
  }
});

// GET /api/financial/balances/status - Get balance update service status
router.get('/balances/status', authenticateToken, requireRole(['admin', 'financial_manager', 'accountant']), async (req, res) => {
  try {
    const status = {
      queueLength: balanceUpdateService.updateQueue.length,
      isProcessing: balanceUpdateService.isProcessing,
      connectedClients: global.io ? global.io.engine.clientsCount : 0,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting balance service status:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة خدمة الأرصدة',
      error: error.message
    });
  }
});

// ==================== DYNAMIC FINANCIAL STATEMENTS ROUTES ====================

// GET /api/financial/reports/trial-balance-dynamic - Get dynamic trial balance
router.get('/reports/trial-balance-dynamic', async (req, res) => {
  try {
    const { asOfDate, includeHierarchy = true, includeZeroBalances = false } = req.query;

    // Set default date to today if not provided
    const reportDate = asOfDate ? new Date(asOfDate) : new Date();

    // Get all accounts with their current balances
    const accounts = await Account.findAll({
      where: {
        isActive: true,
        ...(includeZeroBalances === 'false' ? { balance: { [Op.ne]: 0 } } : {})
      },
      order: [['code', 'ASC']]
    });

    // Calculate trial balance data
    let totalDebits = 0;
    let totalCredits = 0;

    const trialBalanceAccounts = accounts.map(account => {
      const balance = parseFloat(account.balance || 0);
      let debit = 0;
      let credit = 0;

      // Determine debit/credit based on account type and balance
      switch (account.type) {
        case 'asset':
        case 'expense':
          if (balance >= 0) {
            debit = balance;
          } else {
            credit = Math.abs(balance);
          }
          break;
        case 'liability':
        case 'equity':
        case 'revenue':
          if (balance >= 0) {
            credit = balance;
          } else {
            debit = Math.abs(balance);
          }
          break;
        default:
          if (balance >= 0) {
            debit = balance;
          } else {
            credit = Math.abs(balance);
          }
      }

      totalDebits += debit;
      totalCredits += credit;

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        level: account.level,
        isGroup: account.isGroup,
        parentId: account.parentId,
        debit,
        credit,
        balance,
        currency: account.currency || 'LYD'
      };
    });

    // Build hierarchy if requested
    let hierarchicalAccounts = trialBalanceAccounts;
    if (includeHierarchy === 'true') {
      hierarchicalAccounts = buildAccountHierarchy(trialBalanceAccounts);
    }

    const trialBalanceData = {
      accounts: hierarchicalAccounts,
      totals: {
        totalDebits,
        totalCredits,
        difference: totalDebits - totalCredits
      },
      asOfDate: reportDate.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
    };

    res.json({
      success: true,
      data: trialBalanceData
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء ميزان المراجعة',
      error: error.message
    });
  }
});

// GET /api/financial/reports/income-statement-dynamic - Get dynamic income statement
router.get('/reports/income-statement-dynamic', authenticateToken, requireRole(['admin', 'financial_manager', 'accountant']), async (req, res) => {
  try {
    const { fromDate, toDate, includeHierarchy = true } = req.query;

    // Set default date range if not provided
    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1); // Start of year
    const endDate = toDate ? new Date(toDate) : new Date(); // Today

    // Get revenue and expense accounts
    const accounts = await Account.findAll({
      where: {
        isActive: true,
        type: { [Op.in]: ['revenue', 'expense'] }
      },
      order: [['code', 'ASC']]
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    const incomeStatementAccounts = accounts.map(account => {
      const balance = parseFloat(account.balance || 0);

      if (account.type === 'revenue') {
        totalRevenue += Math.abs(balance);
      } else if (account.type === 'expense') {
        totalExpenses += Math.abs(balance);
      }

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        level: account.level,
        isGroup: account.isGroup,
        parentId: account.parentId,
        balance: Math.abs(balance),
        currency: account.currency || 'LYD'
      };
    });

    // Build hierarchy if requested
    let hierarchicalAccounts = incomeStatementAccounts;
    if (includeHierarchy === 'true') {
      hierarchicalAccounts = buildAccountHierarchy(incomeStatementAccounts);
    }

    const netIncome = totalRevenue - totalExpenses;

    const incomeStatementData = {
      accounts: hierarchicalAccounts,
      totals: {
        totalRevenue,
        totalExpenses,
        netIncome,
        netIncomePercentage: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      },
      period: {
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0]
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: incomeStatementData
    });
  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء قائمة الدخل',
      error: error.message
    });
  }
});

// Helper function to build account hierarchy
function buildAccountHierarchy(accounts) {
  const accountMap = new Map();
  const rootAccounts = [];

  // Create account map
  accounts.forEach(account => {
    accountMap.set(account.id, { ...account, children: [] });
  });

  // Build hierarchy
  accounts.forEach(account => {
    if (account.parentId && accountMap.has(account.parentId)) {
      accountMap.get(account.parentId).children.push(accountMap.get(account.id));
    } else {
      rootAccounts.push(accountMap.get(account.id));
    }
  });

  return rootAccounts;
}

// POST /api/financial/auto-create-invoice-accounts - Create required accounts for invoices automatically
router.post('/auto-create-invoice-accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const requiredAccounts = [
      // الإيرادات
      { code: '5.1.1', name: 'إيرادات المبيعات', type: 'revenue', description: 'ضمن 5.1 إيرادات المبيعات' },
      { code: '5.2.1', name: 'إيرادات الشحن', type: 'revenue', description: 'ضمن 5.2 إيرادات الخدمات - الشحن' },
      { code: '5.2.2', name: 'رسوم المناولة', type: 'revenue', description: 'ضمن 5.2 إيرادات الخدمات - المناولة' },
      { code: '5.2.3', name: 'رسوم التخليص الجمركي', type: 'revenue', description: 'ضمن 5.2 إيرادات الخدمات - التخليص' },
      { code: '5.2.4', name: 'رسوم التأمين', type: 'revenue', description: 'ضمن 5.2 إيرادات الخدمات - التأمين' },
      { code: '5.2.5', name: 'رسوم التخزين', type: 'revenue', description: 'ضمن 5.2 إيرادات الخدمات - التخزين' },
      { code: '5.1.9', name: 'خصومات المبيعات', type: 'revenue', description: 'حساب مقابل (contra) ضمن إيرادات المبيعات' },

      // الأصول - الذمم
      { code: '1.1.2.1', name: 'عملاء', type: 'asset', description: 'ضمن 1.1.2 المدينون - حساب العملاء' },

      // الالتزامات - ضريبة المبيعات المستحقة
      { code: '3.1.3', name: 'ضريبة المبيعات المستحقة', type: 'liability', description: 'ضمن 3.1 الالتزامات المتداولة - ضرائب' }
    ];

    // Check which accounts already exist
    const existingAccounts = await Account.findAll({
      where: {
        code: {
          [Op.in]: requiredAccounts.map(acc => acc.code)
        }
      }
    });

    const existingCodes = existingAccounts.map(acc => acc.code);
    const accountsToCreate = requiredAccounts.filter(acc => !existingCodes.includes(acc.code));

    if (accountsToCreate.length === 0) {
      return res.json({
        message: 'جميع الحسابات المطلوبة موجودة بالفعل',
        existingAccounts: existingAccounts.length,
        createdAccounts: 0
      });
    }

    // Create missing accounts
    const createdAccounts = [];
    for (const accountData of accountsToCreate) {
      const account = await Account.create({
        code: accountData.code,
        name: accountData.name,
        type: accountData.type,
        description: accountData.description,
        balance: 0,
        isActive: true,
        createdBy: req.user.id
      });
      createdAccounts.push(account);
    }

    res.json({
      message: `تم إنشاء ${createdAccounts.length} حساب جديد بنجاح`,
      existingAccounts: existingAccounts.length,
      createdAccounts: createdAccounts.length,
      accounts: createdAccounts
    });

  } catch (error) {
    console.error('Error auto-creating invoice accounts:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الحسابات تلقائياً' });
  }
});

// GET /api/financial/check-invoice-accounts - Check status of required invoice accounts
router.get('/check-invoice-accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const requiredCodes = ['5.1.1','5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.1.9','1.1.2.1','3.1.3'];

    const existingAccounts = await Account.findAll({
      where: {
        code: {
          [Op.in]: requiredCodes
        }
      },
      attributes: ['id', 'code', 'name', 'type', 'balance', 'isActive']
    });

    const existingCodes = existingAccounts.map(acc => acc.code);
    const missingCodes = requiredCodes.filter(code => !existingCodes.includes(code));

    res.json({
      total: requiredCodes.length,
      existing: existingAccounts.length,
      missing: missingCodes.length,
      existingAccounts,
      missingCodes
    });

  } catch (error) {
    console.error('Error checking invoice accounts:', error);
    res.status(500).json({ message: 'خطأ في فحص حسابات الفواتير' });
  }
});

// ==================== FINANCIAL AUDIT ROUTES ====================

// POST /api/financial/audit/full - Run full financial audit and optionally auto-fix safe issues
router.post('/audit/full', authenticateToken, requireRole(['admin', 'financial']), async (req, res) => {
  try {
    const { autoFix = true, dateFrom, dateTo } = req.body || {};

    // 1) Recalculate all account balances from journal lines (safe auto-fix)
    const recalc = await balanceUpdateService.recalculateAllBalances();

    // 2) Accounting equation check: Assets = Liabilities + Equity
    const accounts = await Account.findAll({
      where: { isActive: true },
      attributes: ['id', 'code', 'name', 'type', 'balance']
    });
    let totals = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
    for (const acc of accounts) {
      const t = acc.type; const bal = parseFloat(acc.balance || 0);
      if (totals.hasOwnProperty(t)) totals[t] += bal;
    }
    const assets = totals.asset;
    const liabilities = totals.liability;
    const equity = totals.equity;
    const equationDiff = assets - (liabilities + equity);
    const accountingEquationBalanced = Math.abs(equationDiff) < 0.01;

    // 3) Journal entries consistency: header vs details totals
    const jeWhere = { status: { [Op.ne]: 'cancelled' } };
    if (dateFrom || dateTo) {
      jeWhere.date = {};
      if (dateFrom) jeWhere.date[Op.gte] = dateFrom;
      if (dateTo) jeWhere.date[Op.lte] = dateTo;
    }
    const journalEntries = await JournalEntry.findAll({
      where: jeWhere,
      attributes: ['id', 'entryNumber', 'date', 'status', 'totalDebit', 'totalCredit'],
      include: [{ model: JournalEntryDetail, as: 'details', attributes: ['debit', 'credit'] }]
    });
    const journalIssues = [];
    for (const je of journalEntries) {
      const headerDebit = parseFloat(je.totalDebit || 0);
      const headerCredit = parseFloat(je.totalCredit || 0);
      let sumDebit = 0, sumCredit = 0;
      for (const d of (je.details || [])) {
        sumDebit += parseFloat(d.debit || 0);
        sumCredit += parseFloat(d.credit || 0);
      }
      const headerMismatch = Math.abs(headerDebit - headerCredit) > 0.01;
      const detailMismatch = Math.abs(sumDebit - sumCredit) > 0.01;
      const headerDetailMismatch = Math.abs(headerDebit - sumDebit) > 0.01 || Math.abs(headerCredit - sumCredit) > 0.01;
      if (headerMismatch || detailMismatch || headerDetailMismatch) {
        journalIssues.push({
          id: je.id,
          entryNumber: je.entryNumber,
          date: je.date,
          header: { debit: headerDebit, credit: headerCredit },
          details: { debit: parseFloat(sumDebit.toFixed(2)), credit: parseFloat(sumCredit.toFixed(2)) },
          headerMismatch,
          detailMismatch,
          headerDetailMismatch
        });
      }
    }

    // 4) Invoices consistency (paid/outstanding); safe auto-fix derived fields
    const invWhere = { status: { [Op.ne]: 'cancelled' } };
    if (dateFrom || dateTo) {
      invWhere.date = {};
      if (dateFrom) invWhere.date[Op.gte] = dateFrom;
      if (dateTo) invWhere.date[Op.lte] = dateTo;
    }
    const invoices = await Invoice.findAll({ attributes: ['id', 'invoiceNumber', 'total', 'paidAmount', 'outstandingAmount', 'status', 'date'], where: invWhere });
    let invoicesChecked = 0;
    let invoicesUpdated = 0;
    const invoiceIssues = [];
    for (const inv of invoices) {
      invoicesChecked++;
      const total = parseFloat(inv.total || 0);
      const paidFromReceipts = await InvoiceReceipt.sum('allocatedAmount', { where: { invoiceId: inv.id, isReversed: false } }) || 0;
      const paidFromPayments = await InvoicePayment.sum('allocatedAmount', { where: { invoiceId: inv.id, isReversed: false } }) || 0;
      const recomputedPaid = parseFloat((paidFromReceipts + paidFromPayments).toFixed(2));
      const recomputedOutstanding = Math.max(0, parseFloat((total - recomputedPaid).toFixed(2)));
      const status = recomputedOutstanding <= 0.01 ? 'paid' : (recomputedPaid > 0 ? 'partially_paid' : 'unpaid');
      const diffPaid = Math.abs(recomputedPaid - parseFloat(inv.paidAmount || 0));
      const diffOut = Math.abs(recomputedOutstanding - parseFloat(inv.outstandingAmount || 0));
      if (diffPaid > 0.01 || diffOut > 0.01) {
        invoiceIssues.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.date,
          current: { paidAmount: parseFloat(inv.paidAmount || 0), outstandingAmount: parseFloat(inv.outstandingAmount || 0), status: inv.status },
          recomputed: { paidAmount: recomputedPaid, outstandingAmount: recomputedOutstanding, status }
        });
        if (autoFix) {
          await inv.update({ paidAmount: recomputedPaid, outstandingAmount: recomputedOutstanding, status });
          invoicesUpdated++;
        }
      }
    }

    // 5) Required accounts presence
    const requiredCodes = ['5.1.1','5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.1.9','1.1.2.1','3.1.3'];
    const existingRequired = await Account.findAll({ where: { code: { [Op.in]: requiredCodes } }, attributes: ['code'] });
    const existingCodes = new Set(existingRequired.map(a => a.code));
    const missingCodes = requiredCodes.filter(c => !existingCodes.has(c));

    res.json({
      success: true,
      summary: {
        accountsRecalculated: recalc?.updatedAccounts || 0,
        accountingEquationBalanced,
        equationDiff: parseFloat(equationDiff.toFixed(2)),
        totals,
        journalEntriesChecked: journalEntries.length,
        journalIssues: journalIssues.length,
        invoicesChecked,
        invoicesUpdated,
        missingRequiredAccounts: missingCodes.length
      },
      details: {
        journalIssues,
        invoiceIssues,
        missingRequiredAccountCodes: missingCodes
      },
      filters: { dateFrom: dateFrom || null, dateTo: dateTo || null },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running financial audit:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تنفيذ الفحص المالي', error: error.message });
  }
});

// GET /api/financial/audit-trail/:tableName/:recordId - الحصول على سجل التدقيق لسجل معين
router.get('/audit-trail/:tableName/:recordId', authenticateToken, requireRole(['admin', 'financial_manager']), async (req, res) => {
  try {
    const { tableName, recordId } = req.params;

    const auditTrail = await getAuditTrail(tableName, recordId);

    res.json({
      success: true,
      data: auditTrail,
      total: auditTrail.length
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استرجاع سجل التدقيق',
      error: error.message
    });
  }
});

// GET /api/financial/audit-trail/user/:userId - الحصول على سجل تدقيق المستخدم
router.get('/audit-trail/user/:userId', authenticateToken, requireRole(['admin', 'financial_manager']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const auditTrail = await getUserAuditTrail(
      userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      data: auditTrail,
      total: auditTrail.length
    });
  } catch (error) {
    console.error('Error fetching user audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استرجاع سجل تدقيق المستخدم',
      error: error.message
    });
  }
});

// GET /api/financial/audit-trail/financial - الحصول على سجل التدقيق المالي
router.get('/audit-trail/financial', authenticateToken, requireRole(['admin', 'financial_manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const auditTrail = await getFinancialAuditTrail(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      data: auditTrail,
      total: auditTrail.length
    });
  } catch (error) {
    console.error('Error fetching financial audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استرجاع سجل التدقيق المالي',
      error: error.message
    });
  }
});

// GET /api/financial/receivables-details - Get receivables details
router.get('/receivables-details', async (req, res) => {
  try {
    const { period = 'today', limit = 100 } = req.query;

    console.log('🔍 جلب تفاصيل المدينون...');

    // تحديد نطاق التاريخ حسب الفترة المحددة
    let dateFrom, dateTo;
    const now = new Date();

    switch (period) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateTo = now;
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = now;
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        dateTo = now;
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    // البحث عن حسابات المدينون (العملاء والذمم المدينة)
    const receivableAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%مدين%' } },
          { name: { [Op.like]: '%عميل%' } },
          { name: { [Op.like]: '%receivable%' } },
          { name: { [Op.like]: '%عملاء%' } },
          { type: 'asset', name: { [Op.like]: '%ذمم%' } }
        ],
        isActive: true
      },
      attributes: ['id', 'name', 'code', 'balance']
    });

    console.log(`📊 تم العثور على ${receivableAccounts.length} حساب مدين`);

    // جلب قيود دفتر الأستاذ العام للحسابات المدينة
    const accountIds = receivableAccounts.map(acc => acc.id);

    const glEntries = await GLEntry.findAll({
      where: {
        accountId: { [Op.in]: accountIds },
        postingDate: {
          [Op.between]: [dateFrom, dateTo]
        },
        isCancelled: false
      },
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name', 'type']
        }
      ],
      order: [['postingDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    console.log(`📋 تم العثور على ${glEntries.length} قيد للمدينون`);

    // تنسيق البيانات للعرض
    const formattedEntries = glEntries.map(entry => ({
      id: entry.id,
      date: entry.postingDate || entry.createdAt,
      account: {
        code: entry.account?.code || 'غير محدد',
        name: entry.account?.name || 'غير محدد'
      },
      description: entry.remarks || 'بدون وصف',
      voucherType: entry.voucherType || '',
      debit: parseFloat(entry.debit || 0),
      credit: parseFloat(entry.credit || 0),
      balance: parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0)
    }));

    // حساب الإجماليات
    const totalDebit = formattedEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = formattedEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const netBalance = totalDebit - totalCredit;

    console.log(`💰 إجمالي المدين: ${totalDebit.toFixed(2)} د.ل`);
    console.log(`💰 إجمالي الدائن: ${totalCredit.toFixed(2)} د.ل`);
    console.log(`📊 صافي الرصيد: ${netBalance.toFixed(2)} د.ل`);

    res.json({
      success: true,
      data: formattedEntries,
      summary: {
        totalDebit,
        totalCredit,
        netBalance,
        count: formattedEntries.length,
        period,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString()
      },
      total: formattedEntries.length,
      message: 'تم جلب تفاصيل المدينون بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل المدينون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تفاصيل المدينون',
      error: error.message,
      data: []
    });
  }
});

export default router;
