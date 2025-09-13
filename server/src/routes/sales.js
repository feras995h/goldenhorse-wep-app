import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  validateCustomer,
  validatePayment,
  validateInvoice,
  handleValidationErrors,
  commonValidations
} from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';
import models from '../models/index.js';
import { Op } from 'sequelize';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();
const { 
  Customer, 
  Invoice, 
  Payment, 
  Receipt,
  Account,
  GLEntry,
  sequelize
} = models;

// Middleware to ensure sales role access
const requireSalesAccess = requireRole(['admin', 'sales', 'financial']);

// ==================== CUSTOMERS ROUTES ====================

// GET /api/sales/customers - Get customers with pagination and search
router.get('/customers', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query;
    
    let whereClause = {};
    
    // Filter by search term
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Filter by customer type
    if (type) {
      whereClause.type = type;
    }
    
    // Filter by status
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }
    
    const options = {
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'code', 'name', 'balance']
        }
      ]
    };
    
    const customers = await Customer.findAll(options);
    const total = await Customer.count({ where: whereClause });
    
    // Calculate customer statistics
    const customersData = customers.map(customer => ({
      id: customer.id,
      code: customer.code,
      name: customer.name,
      nameEn: customer.nameEn,
      type: customer.type,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      creditLimit: parseFloat(customer.creditLimit || 0),
      balance: parseFloat(customer.balance || 0),
      paymentTerms: customer.paymentTerms,
      currency: customer.currency,
      isActive: customer.isActive,
      account: customer.account,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }));
    
    const response = {
      data: customersData,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'خطأ في جلب العملاء' });
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

// POST /api/sales/customers - Create new customer
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
    
    const newCustomer = await Customer.create({
      id: uuidv4(),
      code: code || undefined, // Let the model generate it if not provided
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
router.get('/invoices', authenticateToken, requireSalesAccess, async (req, res) => {
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
        [Op.iLike]: `%${search}%`
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
    
    const invoices = await Invoice.findAll(options);
    const total = await Invoice.count({ where: whereClause });
    
    const response = {
      data: invoices,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب الفواتير' });
  }
});

// GET /api/sales/invoices/:id - Get single invoice
router.get('/invoices/:id', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findByPk(id, {
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

    const newInvoice = await Invoice.create({
      invoiceNumber: invoiceNumber,
      customerId,
      date,
      dueDate,
      subtotal: total,
      total: total,
      status: 'draft',
      notes,
      terms,
      items: JSON.stringify(items)
    });

    // Fetch the created invoice with customer details
    const invoiceWithCustomer = await Invoice.findByPk(newInvoice.id, {
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
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الفاتورة' });
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

// POST /api/sales/payments - Create payment
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
      reference
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
    
    // Generate payment number
    const lastPayment = await Payment.findOne({
      order: [['paymentNumber', 'DESC']]
    });
    
    const nextNumber = lastPayment ? 
      parseInt(lastPayment.paymentNumber.replace('PAY', '')) + 1 : 1;
    const paymentNumber = `PAY${String(nextNumber).padStart(6, '0')}`;
    
    const newPayment = await Payment.create({
      id: uuidv4(),
      paymentNumber,
      customerId,
      amount: parseFloat(amount),
      date,
      paymentMethod,
      description,
      reference,
      status: 'confirmed',
      createdBy: req.user.id
    });
    
    // Update customer balance
    await customer.update({
      balance: parseFloat(customer.balance) - parseFloat(amount)
    });
    
    res.status(201).json({
      message: 'تم إنشاء المدفوعة بنجاح',
      payment: newPayment
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
router.get('/summary', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    console.log('🔍 بدء حساب ملخص المبيعات...');

    // Create a simplified summary for now
    const summary = {
      totalSales: 0,
      totalOrders: 0,
      activeCustomers: 0,
      averageOrderValue: 0,
      monthlyGrowth: 0,
      totalInvoices: 0,
      totalPayments: 0,
      lowStockItems: 0,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ تم إنشاء ملخص المبيعات بنجاح');
    res.json(summary);
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'خطأ في جلب ملخص المبيعات' });
  }
});

// GET /api/sales/analytics - Get sales analytics
router.get('/analytics', authenticateToken, requireSalesAccess, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Mock analytics data for now
    const analytics = {
      period,
      totalRevenue: 125000,
      totalOrders: 85,
      averageOrderValue: 1470.59,
      customerGrowth: 12.5,
      topSellingProducts: [
        { id: '1', name: 'منتج أ', sales: 25000, quantity: 50 },
        { id: '2', name: 'منتج ب', sales: 18000, quantity: 120 },
        { id: '3', name: 'منتج ج', sales: 15000, quantity: 80 }
      ],
      salesByCategory: [
        { category: 'إلكترونيات', amount: 45000, percentage: 36 },
        { category: 'مكتبية', amount: 30000, percentage: 24 },
        { category: 'منزلية', amount: 25000, percentage: 20 }
      ],
      generatedAt: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'خطأ في جلب تحليلات المبيعات' });
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
    
    // Get sales data
    const [totalSales, totalInvoices, totalPayments, activeCustomers] = await Promise.all([
      Invoice.sum('totalAmount', {
        where: {
          date: { [Op.gte]: startDate },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      Invoice.count({
        where: {
          date: { [Op.gte]: startDate },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      Payment.sum('amount', {
        where: {
          date: { [Op.gte]: startDate }
        }
      }),
      Customer.count({
        where: { isActive: true }
      })
    ]);
    
    // Get top customers
    const topCustomers = await Customer.findAll({
      attributes: [
        'id', 'code', 'name', 'balance',
        [sequelize.fn('COUNT', sequelize.col('invoices.id')), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.col('invoices.totalAmount')), 'totalPurchases']
      ],
      include: [
        {
          model: Invoice,
          as: 'invoices',
          attributes: [],
          where: {
            date: { [Op.gte]: startDate },
            status: { [Op.ne]: 'cancelled' }
          },
          required: false
        }
      ],
      group: ['Customer.id'],
      order: [[sequelize.literal('totalPurchases'), 'DESC']],
      limit: 5,
      subQuery: false
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
      topCustomers: topCustomers.map(customer => ({
        id: customer.id,
        code: customer.code,
        name: customer.name,
        balance: parseFloat(customer.balance || 0),
        invoiceCount: parseInt(customer.dataValues.invoiceCount || 0),
        totalPurchases: parseFloat(customer.dataValues.totalPurchases || 0)
      }))
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'خطأ في جلب تحليلات المبيعات' });
  }
});

export default router;
