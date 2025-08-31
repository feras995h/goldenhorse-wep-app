import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import models from '../models/index.js';

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

// Helper function for pagination
const paginate = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    total: data.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(data.length / limit)
  };
};

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
    
    if (page && limit) {
      res.json({
        data: accounts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(accounts);
    }
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
      return res.status(400).json({ message: 'نوع الحساب غير صحيح' });
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
    
    const newAccount = await Account.create(accountData);
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الحساب' });
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

// DELETE /api/financial/accounts/:id - Delete account
router.delete('/accounts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'الحساب غير موجود' });
    }
    
    // Check if account has children
    const children = await Account.findAll({ where: { parentId: req.params.id } });
    if (children.length > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف الحساب لوجود حسابات فرعية' });
    }
    
    // Check if account has GL entries
    const glEntries = await GLEntry.findAll({ where: { accountId: req.params.id } });
    if (glEntries.length > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف الحساب لوجود قيود مرتبطة به' });
    }
    
    await account.destroy();
    res.json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'خطأ في حذف الحساب' });
  }
});

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
    
    if (page && limit) {
      res.json({
        data: glEntries,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(glEntries);
    }
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
    
    if (page && limit) {
      res.json({
        data: journalEntries,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(journalEntries);
    }
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

    // Create GL entries from journal entry details
    const glEntries = [];
    for (const detail of journalEntry.details) {
      glEntries.push({
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
      });
    }

    // Save GL entries
    await GLEntry.bulkCreate(glEntries);

    // Update journal entry status
    await journalEntry.update({
      status: 'posted',
      postedAt: new Date(),
      postedBy: req.user.id,
      updatedAt: new Date()
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
    
    if (page && limit) {
      res.json({
        data: customers,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(customers);
    }
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
    
    if (page && limit) {
      res.json({
        data: suppliers,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(suppliers);
    }
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
    
    if (page && limit) {
      res.json({
        data: employees,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(employees);
    }
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
    
    if (page && limit) {
      res.json({
        data: fixedAssets,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(fixedAssets);
    }
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

export default router;
