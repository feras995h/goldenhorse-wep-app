import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read JSON data
const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to write JSON data
const writeJsonFile = async (filename, data) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

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
    const accounts = await readJsonFile('accounts.json');
    const { page, limit, search, type } = req.query;
    
    let filteredAccounts = accounts;
    
    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredAccounts = filteredAccounts.filter(account => 
        account.name.toLowerCase().includes(searchTerm) ||
        account.code.includes(searchTerm) ||
        (account.nameEn && account.nameEn.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filter by account type
    if (type) {
      filteredAccounts = filteredAccounts.filter(account => account.type === type);
    }
    
    // Sort by code
    filteredAccounts.sort((a, b) => a.code.localeCompare(b.code));
    
    if (page && limit) {
      const result = paginate(filteredAccounts, page, limit);
      res.json(result);
    } else {
      res.json({ data: filteredAccounts, total: filteredAccounts.length });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'خطأ في جلب الحسابات' });
  }
});

// POST /api/financial/accounts - Create new account
router.post('/accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const accounts = await readJsonFile('accounts.json');
    const { code, name, nameEn, type, parentId, currency = 'LYD' } = req.body;
    
    // Validate required fields
    if (!code || !name || !type) {
      return res.status(400).json({ message: 'الرمز والاسم ونوع الحساب مطلوبة' });
    }
    
    // Check if account code already exists
    if (accounts.find(acc => acc.code === code)) {
      return res.status(400).json({ message: 'رمز الحساب موجود مسبقاً' });
    }
    
    // Determine level based on parent
    let level = 1;
    if (parentId) {
      const parent = accounts.find(acc => acc.id === parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }
    
    const newAccount = {
      id: uuidv4(),
      code,
      name,
      nameEn,
      type,
      parentId,
      level,
      isActive: true,
      balance: 0,
      currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    await writeJsonFile('accounts.json', accounts);
    
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الحساب' });
  }
});

// PUT /api/financial/accounts/:id - Update account
router.put('/accounts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const accounts = await readJsonFile('accounts.json');
    const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
    
    if (accountIndex === -1) {
      return res.status(404).json({ message: 'الحساب غير موجود' });
    }
    
    const { code, name, nameEn, type, parentId, isActive, currency } = req.body;
    
    // Check if new code conflicts with existing accounts (excluding current account)
    if (code && code !== accounts[accountIndex].code) {
      if (accounts.find(acc => acc.code === code && acc.id !== req.params.id)) {
        return res.status(400).json({ message: 'رمز الحساب موجود مسبقاً' });
      }
    }
    
    // Update account
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      code: code || accounts[accountIndex].code,
      name: name || accounts[accountIndex].name,
      nameEn: nameEn || accounts[accountIndex].nameEn,
      type: type || accounts[accountIndex].type,
      parentId: parentId || accounts[accountIndex].parentId,
      isActive: isActive !== undefined ? isActive : accounts[accountIndex].isActive,
      currency: currency || accounts[accountIndex].currency,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile('accounts.json', accounts);
    res.json(accounts[accountIndex]);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'خطأ في تحديث الحساب' });
  }
});

// DELETE /api/financial/accounts/:id - Delete account
router.delete('/accounts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const accounts = await readJsonFile('accounts.json');
    const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
    
    if (accountIndex === -1) {
      return res.status(404).json({ message: 'الحساب غير موجود' });
    }
    
    // Check if account has balance
    if (accounts[accountIndex].balance !== 0) {
      return res.status(400).json({ message: 'لا يمكن حذف حساب له رصيد' });
    }
    
    // Check if account has child accounts
    const hasChildren = accounts.some(acc => acc.parentId === req.params.id);
    if (hasChildren) {
      return res.status(400).json({ message: 'لا يمكن حذف حساب له حسابات فرعية' });
    }
    
    accounts.splice(accountIndex, 1);
    await writeJsonFile('accounts.json', accounts);
    
    res.json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'خطأ في حذف الحساب' });
  }
});

// ==================== CUSTOMERS ROUTES ====================

// GET /api/financial/customers - Get customers
router.get('/customers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const customers = await readJsonFile('customers.json');
    const { page, limit, search, type } = req.query;
    
    let filteredCustomers = customers;
    
    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.code.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }
    
    // Filter by customer type
    if (type) {
      filteredCustomers = filteredCustomers.filter(customer => customer.type === type);
    }
    
    // Sort by name
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
    
    if (page && limit) {
      const result = paginate(filteredCustomers, page, limit);
      res.json(result);
    } else {
      res.json({ data: filteredCustomers, total: filteredCustomers.length });
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'خطأ في جلب العملاء' });
  }
});

// POST /api/financial/customers - Create new customer
router.post('/customers', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const customers = await readJsonFile('customers.json');
    const { 
      code, name, nameEn, type, email, phone, address, 
      taxNumber, creditLimit = 0, paymentTerms = 30, currency = 'LYD' 
    } = req.body;
    
    // Validate required fields
    if (!code || !name || !type) {
      return res.status(400).json({ message: 'الرمز والاسم ونوع العميل مطلوبة' });
    }
    
    // Check if customer code already exists
    if (customers.find(cust => cust.code === code)) {
      return res.status(400).json({ message: 'رمز العميل موجود مسبقاً' });
    }
    
    const newCustomer = {
      id: uuidv4(),
      code,
      name,
      nameEn,
      type,
      email,
      phone,
      address,
      taxNumber,
      creditLimit: parseFloat(creditLimit),
      paymentTerms: parseInt(paymentTerms),
      currency,
      isActive: true,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    customers.push(newCustomer);
    await writeJsonFile('customers.json', customers);
    
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'خطأ في إنشاء العميل' });
  }
});

// PUT /api/financial/customers/:id - Update customer
router.put('/customers/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const customers = await readJsonFile('customers.json');
    const customerIndex = customers.findIndex(cust => cust.id === req.params.id);
    
    if (customerIndex === -1) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.balance;
    delete updateData.createdAt;
    
    // Check if new code conflicts with existing customers (excluding current customer)
    if (updateData.code && updateData.code !== customers[customerIndex].code) {
      if (customers.find(cust => cust.code === updateData.code && cust.id !== req.params.id)) {
        return res.status(400).json({ message: 'رمز العميل موجود مسبقاً' });
      }
    }
    
    // Update customer
    customers[customerIndex] = {
      ...customers[customerIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile('customers.json', customers);
    res.json(customers[customerIndex]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'خطأ في تحديث العميل' });
  }
});

// GET /api/financial/customers/:id - Get customer by ID
router.get('/customers/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const customers = await readJsonFile('customers.json');
    const customer = customers.find(cust => cust.id === req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'خطأ في جلب العميل' });
  }
});

// ==================== EMPLOYEES ROUTES ====================

// GET /api/financial/employees - Get employees
router.get('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const employees = await readJsonFile('employees.json');
    const { page, limit, search, department, isActive } = req.query;

    let filteredEmployees = employees;

    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.employeeNumber.includes(searchTerm) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by department
    if (department) {
      filteredEmployees = filteredEmployees.filter(employee => employee.department === department);
    }

    // Filter by active status
    if (isActive !== undefined) {
      filteredEmployees = filteredEmployees.filter(employee => employee.isActive === (isActive === 'true'));
    }

    // Sort by name
    filteredEmployees.sort((a, b) => a.name.localeCompare(b.name));

    if (page && limit) {
      const result = paginate(filteredEmployees, page, limit);
      res.json(result);
    } else {
      res.json({ data: filteredEmployees, total: filteredEmployees.length });
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'خطأ في جلب الموظفين' });
  }
});

// POST /api/financial/employees - Create new employee
router.post('/employees', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const employees = await readJsonFile('employees.json');
    const {
      employeeNumber, name, nameEn, position, department, branch,
      hireDate, salary, currency = 'LYD', bankAccount, phone, email,
      address, nationalId
    } = req.body;

    // Validate required fields
    if (!employeeNumber || !name || !position || !department || !hireDate || !salary) {
      return res.status(400).json({ message: 'جميع البيانات الأساسية مطلوبة' });
    }

    // Check if employee number already exists
    if (employees.find(emp => emp.employeeNumber === employeeNumber)) {
      return res.status(400).json({ message: 'رقم الموظف موجود مسبقاً' });
    }

    const newEmployee = {
      id: uuidv4(),
      employeeNumber,
      name,
      nameEn,
      position,
      department,
      branch,
      hireDate,
      salary: parseFloat(salary),
      currency,
      bankAccount,
      phone,
      email,
      address,
      nationalId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    employees.push(newEmployee);
    await writeJsonFile('employees.json', employees);

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الموظف' });
  }
});

// PUT /api/financial/employees/:id - Update employee
router.put('/employees/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const employees = await readJsonFile('employees.json');
    const employeeIndex = employees.findIndex(emp => emp.id === req.params.id);

    if (employeeIndex === -1) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.createdAt;

    // Check if new employee number conflicts
    if (updateData.employeeNumber && updateData.employeeNumber !== employees[employeeIndex].employeeNumber) {
      if (employees.find(emp => emp.employeeNumber === updateData.employeeNumber && emp.id !== req.params.id)) {
        return res.status(400).json({ message: 'رقم الموظف موجود مسبقاً' });
      }
    }

    // Update employee
    employees[employeeIndex] = {
      ...employees[employeeIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('employees.json', employees);
    res.json(employees[employeeIndex]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'خطأ في تحديث الموظف' });
  }
});

// GET /api/financial/employees/:id - Get employee by ID
router.get('/employees/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const employees = await readJsonFile('employees.json');
    const employee = employees.find(emp => emp.id === req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'خطأ في جلب الموظف' });
  }
});

// ==================== JOURNAL ENTRIES ROUTES ====================

// GET /api/financial/journal-entries - Get journal entries
router.get('/journal-entries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntries = await readJsonFile('journal-entries.json');
    const { page, limit, search, status, type, dateFrom, dateTo } = req.query;

    let filteredEntries = journalEntries;

    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredEntries = filteredEntries.filter(entry =>
        entry.entryNumber.toLowerCase().includes(searchTerm) ||
        entry.description.toLowerCase().includes(searchTerm) ||
        (entry.reference && entry.reference.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by status
    if (status) {
      filteredEntries = filteredEntries.filter(entry => entry.status === status);
    }

    // Filter by type
    if (type) {
      filteredEntries = filteredEntries.filter(entry => entry.type === type);
    }

    // Filter by date range
    if (dateFrom) {
      filteredEntries = filteredEntries.filter(entry => entry.date >= dateFrom);
    }
    if (dateTo) {
      filteredEntries = filteredEntries.filter(entry => entry.date <= dateTo);
    }

    // Sort by date (newest first)
    filteredEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (page && limit) {
      const result = paginate(filteredEntries, page, limit);
      res.json(result);
    } else {
      res.json({ data: filteredEntries, total: filteredEntries.length });
    }
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'خطأ في جلب قيود اليومية' });
  }
});

// POST /api/financial/journal-entries - Create new journal entry
router.post('/journal-entries', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntries = await readJsonFile('journal-entries.json');
    const accounts = await readJsonFile('accounts.json');

    const {
      date, description, reference, type = 'manual',
      sourceDocument, sourceId, currency = 'LYD',
      exchangeRate = 1, lines
    } = req.body;

    // Validate required fields
    if (!date || !description || !lines || lines.length === 0) {
      return res.status(400).json({ message: 'التاريخ والوصف والقيود مطلوبة' });
    }

    // Validate journal entry lines
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (!line.accountId || (!line.debit && !line.credit)) {
        return res.status(400).json({ message: 'كل قيد يجب أن يحتوي على حساب ومبلغ' });
      }

      // Check if account exists
      const account = accounts.find(acc => acc.id === line.accountId);
      if (!account) {
        return res.status(400).json({ message: `الحساب ${line.accountId} غير موجود` });
      }

      totalDebit += parseFloat(line.debit || 0);
      totalCredit += parseFloat(line.credit || 0);
    }

    // Check if debit equals credit
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'إجمالي المدين يجب أن يساوي إجمالي الدائن' });
    }

    // Generate entry number
    const entryNumber = `JE${String(journalEntries.length + 1).padStart(6, '0')}`;

    // Prepare journal entry lines with account details
    const processedLines = lines.map(line => {
      const account = accounts.find(acc => acc.id === line.accountId);
      return {
        id: uuidv4(),
        accountId: line.accountId,
        accountCode: account.code,
        accountName: account.name,
        description: line.description || '',
        debit: parseFloat(line.debit || 0),
        credit: parseFloat(line.credit || 0),
        currency,
        exchangeRate: parseFloat(exchangeRate)
      };
    });

    const newJournalEntry = {
      id: uuidv4(),
      entryNumber,
      date,
      description,
      reference,
      status: 'draft',
      type,
      sourceDocument,
      sourceId,
      totalDebit,
      totalCredit,
      currency,
      exchangeRate: parseFloat(exchangeRate),
      attachments: [],
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: processedLines
    };

    journalEntries.push(newJournalEntry);
    await writeJsonFile('journal-entries.json', journalEntries);

    res.status(201).json(newJournalEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ message: 'خطأ في إنشاء قيد اليومية' });
  }
});

// PUT /api/financial/journal-entries/:id - Update journal entry
router.put('/journal-entries/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntries = await readJsonFile('journal-entries.json');
    const entryIndex = journalEntries.findIndex(entry => entry.id === req.params.id);

    if (entryIndex === -1) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    const entry = journalEntries[entryIndex];

    // Only allow editing draft entries
    if (entry.status !== 'draft') {
      return res.status(400).json({ message: 'لا يمكن تعديل قيد معتمد أو ملغي' });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.entryNumber;
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Update entry
    journalEntries[entryIndex] = {
      ...entry,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('journal-entries.json', journalEntries);
    res.json(journalEntries[entryIndex]);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ message: 'خطأ في تحديث قيد اليومية' });
  }
});

// POST /api/financial/journal-entries/:id/approve - Approve journal entry
router.post('/journal-entries/:id/approve', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntries = await readJsonFile('journal-entries.json');
    const accounts = await readJsonFile('accounts.json');

    const entryIndex = journalEntries.findIndex(entry => entry.id === req.params.id);

    if (entryIndex === -1) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    const entry = journalEntries[entryIndex];

    if (entry.status !== 'draft') {
      return res.status(400).json({ message: 'القيد معتمد مسبقاً أو ملغي' });
    }

    // Update account balances
    for (const line of entry.lines) {
      const accountIndex = accounts.findIndex(acc => acc.id === line.accountId);
      if (accountIndex !== -1) {
        const account = accounts[accountIndex];

        // Update balance based on account type and debit/credit
        if (['asset', 'expense'].includes(account.type)) {
          // Debit increases, credit decreases
          accounts[accountIndex].balance += line.debit - line.credit;
        } else {
          // Credit increases, debit decreases
          accounts[accountIndex].balance += line.credit - line.debit;
        }

        accounts[accountIndex].updatedAt = new Date().toISOString();
      }
    }

    // Update journal entry status
    journalEntries[entryIndex] = {
      ...entry,
      status: 'approved',
      approvedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('journal-entries.json', journalEntries);
    await writeJsonFile('accounts.json', accounts);

    res.json(journalEntries[entryIndex]);
  } catch (error) {
    console.error('Error approving journal entry:', error);
    res.status(500).json({ message: 'خطأ في اعتماد قيد اليومية' });
  }
});

// GET /api/financial/journal-entries/:id - Get journal entry by ID
router.get('/journal-entries/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const journalEntries = await readJsonFile('journal-entries.json');
    const entry = journalEntries.find(entry => entry.id === req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'قيد اليومية غير موجود' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'خطأ في جلب قيد اليومية' });
  }
});

// ==================== FINANCIAL SUMMARY ROUTE ====================

// GET /api/financial/summary - Get financial summary
router.get('/summary', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const accounts = await readJsonFile('accounts.json');
    const customers = await readJsonFile('customers.json');
    const invoices = await readJsonFile('invoices.json');

    // Calculate summary data
    const assetAccounts = accounts.filter(acc => acc.type === 'asset');
    const liabilityAccounts = accounts.filter(acc => acc.type === 'liability');
    const equityAccounts = accounts.filter(acc => acc.type === 'equity');
    const revenueAccounts = accounts.filter(acc => acc.type === 'revenue');
    const expenseAccounts = accounts.filter(acc => acc.type === 'expense');

    const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Get cash balance (assuming account code 1111 is cash)
    const cashAccount = accounts.find(acc => acc.code === '1111');
    const cashBalance = cashAccount ? cashAccount.balance : 0;

    // Calculate accounts receivable
    const accountsReceivable = customers.reduce((sum, customer) => sum + customer.balance, 0);

    // Calculate accounts payable from invoices
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    const accountsPayable = unpaidInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

    const summary = {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      totalAssets,
      totalLiabilities,
      totalEquity,
      cashBalance,
      accountsReceivable,
      accountsPayable,
      currency: 'LYD',
      asOfDate: new Date().toISOString()
    };

    res.json(summary);
  } catch (error) {
    console.error('Error generating financial summary:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الملخص المالي' });
  }
});

export default router;
