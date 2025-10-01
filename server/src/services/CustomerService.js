import models from '../models/index.js';
import cacheManager, { cacheKeys } from '../utils/cacheManager.js';

const { Customer, Invoice, Payment, Account } = models;

/**
 * Customer Service Layer
 * Handles all customer-related business logic
 */
class CustomerService {

  /**
   * Get customers with caching and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Customers data
   */
  static async getCustomers(params = {}) {
    try {
      const cacheKey = cacheKeys.customers(params);
      
      // Try cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { page = 1, limit = 50, search, type, status = 'active' } = params;
      const offset = (page - 1) * limit;

      // Build where clause
      let whereClause = {};
      
      if (status === 'active') {
        whereClause.isActive = true;
      } else if (status === 'inactive') {
        whereClause.isActive = false;
      }

      if (search) {
        whereClause[models.sequelize.Op.or] = [
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { code: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { phone: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      if (type) {
        whereClause.type = type;
      }

      // Execute query with aggregated data
      const { count, rows } = await Customer.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']],
        include: [
          {
            model: Account,
            attributes: ['id', 'code', 'name', 'balance']
          }
        ]
      });

      // Add summary statistics for each customer
      const customersWithStats = await Promise.all(
        rows.map(async (customer) => {
          const stats = await this.getCustomerStats(customer.id);
          return {
            ...customer.toJSON(),
            stats
          };
        })
      );

      const result = {
        data: customersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };

      // Cache for 5 minutes
      await cacheManager.set(cacheKey, result, 300);

      return result;

    } catch (error) {
      throw new DatabaseError('Failed to fetch customers', error, 'getCustomers');
    }
  }

  /**
   * Get customer statistics
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer statistics
   */
  static async getCustomerStats(customerId) {
    try {
      const [invoiceStats, paymentStats] = await Promise.all([
        Invoice.findOne({
          where: { customerId },
          attributes: [
            [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'totalInvoices'],
            [models.sequelize.fn('SUM', models.sequelize.col('totalAmount')), 'totalInvoiced'],
            [models.sequelize.fn('SUM', models.sequelize.col('paidAmount')), 'totalPaid']
          ],
          raw: true
        }),
        Payment.findOne({
          where: { customerId },
          attributes: [
            [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'totalPayments'],
            [models.sequelize.fn('SUM', models.sequelize.col('amount')), 'totalPaymentAmount']
          ],
          raw: true
        })
      ]);

      return {
        totalInvoices: parseInt(invoiceStats?.totalInvoices || 0),
        totalInvoiced: parseFloat(invoiceStats?.totalInvoiced || 0),
        totalPaid: parseFloat(invoiceStats?.totalPaid || 0),
        totalPayments: parseInt(paymentStats?.totalPayments || 0),
        totalPaymentAmount: parseFloat(paymentStats?.totalPaymentAmount || 0),
        outstandingBalance: parseFloat(invoiceStats?.totalInvoiced || 0) - parseFloat(invoiceStats?.totalPaid || 0)
      };

    } catch (error) {
      console.warn('Failed to get customer stats:', error.message);
      return {
        totalInvoices: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        totalPayments: 0,
        totalPaymentAmount: 0,
        outstandingBalance: 0
      };
    }
  }

  /**
   * Get single customer by ID with caching
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer data
   */
  static async getCustomerById(customerId) {
    try {
      const cacheKey = cacheKeys.customer(customerId);
      
      // Try cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const customer = await Customer.findByPk(customerId, {
        include: [
          {
            model: Account,
            attributes: ['id', 'code', 'name', 'balance']
          }
        ]
      });

      if (!customer) {
        throw new ValidationAppError('العميل غير موجود', null, 'customerId');
      }

      // Add statistics
      const stats = await this.getCustomerStats(customerId);
      const customerWithStats = {
        ...customer.toJSON(),
        stats
      };

      // Cache for 10 minutes
      await cacheManager.set(cacheKey, customerWithStats, 600);

      return customerWithStats;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch customer', error, 'getCustomerById');
    }
  }

  /**
   * Create new customer with validation
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  static async createCustomer(customerData) {
    try {
      // Validate required fields
      const { code, name, type = 'individual' } = customerData;
      
      if (!code || !name) {
        throw new ValidationAppError('البيانات المطلوبة مفقودة', {
          code: !code ? 'رمز العميل مطلوب' : null,
          name: !name ? 'اسم العميل مطلوب' : null
        });
      }

      // Check if code already exists
      const existingCustomer = await Customer.findOne({ where: { code } });
      if (existingCustomer) {
        throw new ValidationAppError('رمز العميل موجود بالفعل', null, 'code');
      }

      // Validate email if provided
      if (customerData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
          throw new ValidationAppError('البريد الإلكتروني غير صحيح', null, 'email');
        }

        // Check if email already exists
        const existingEmail = await Customer.findOne({ where: { email: customerData.email } });
        if (existingEmail) {
          throw new ValidationAppError('البريد الإلكتروني موجود بالفعل', null, 'email');
        }
      }

      // Create customer
      const customer = await Customer.create({
        ...customerData,
        type,
        isActive: true,
        balance: 0.00,
        creditUsed: 0.00
      });

      // Invalidate related cache
      await cacheManager.invalidate(['customers:*']);

      return customer;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to create customer', error, 'createCustomer');
    }
  }

  /**
   * Update customer with validation
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated customer
   */
  static async updateCustomer(customerId, updateData) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new ValidationAppError('العميل غير موجود', null, 'customerId');
      }

      // Check if code is being changed and if it already exists
      if (updateData.code && updateData.code !== customer.code) {
        const existingCustomer = await Customer.findOne({ 
          where: { 
            code: updateData.code,
            id: { [models.sequelize.Op.ne]: customerId }
          } 
        });
        
        if (existingCustomer) {
          throw new ValidationAppError('رمز العميل موجود بالفعل', null, 'code');
        }
      }

      // Validate email if being changed
      if (updateData.email && updateData.email !== customer.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          throw new ValidationAppError('البريد الإلكتروني غير صحيح', null, 'email');
        }

        const existingEmail = await Customer.findOne({ 
          where: { 
            email: updateData.email,
            id: { [models.sequelize.Op.ne]: customerId }
          } 
        });
        
        if (existingEmail) {
          throw new ValidationAppError('البريد الإلكتروني موجود بالفعل', null, 'email');
        }
      }

      // Update customer
      await customer.update(updateData);

      // Invalidate cache
      await cacheManager.invalidate([
        `customer:${customerId}`,
        'customers:*'
      ]);

      return customer;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to update customer', error, 'updateCustomer');
    }
  }

  /**
   * Delete customer with validation
   * @param {string} customerId - Customer ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteCustomer(customerId) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new ValidationAppError('العميل غير موجود', null, 'customerId');
      }

      // Check if customer has invoices
      const invoiceCount = await Invoice.count({ where: { customerId } });
      if (invoiceCount > 0) {
        throw new ValidationAppError('لا يمكن حذف عميل له فواتير', null, 'customerId');
      }

      // Check if customer has payments
      const paymentCount = await Payment.count({ where: { customerId } });
      if (paymentCount > 0) {
        throw new ValidationAppError('لا يمكن حذف عميل له مدفوعات', null, 'customerId');
      }

      // Check if customer has outstanding balance
      if (parseFloat(customer.balance) !== 0) {
        throw new ValidationAppError('لا يمكن حذف عميل له رصيد مستحق', null, 'customerId');
      }

      // Delete customer
      await customer.destroy();

      // Invalidate cache
      await cacheManager.invalidate([
        `customer:${customerId}`,
        'customers:*'
      ]);

      return true;

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete customer', error, 'deleteCustomer');
    }
  }

  /**
   * Get customer account statement
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Account statement
   */
  static async getCustomerStatement(customerId, params = {}) {
    try {
      const { dateFrom, dateTo, limit = 100 } = params;
      
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new ValidationAppError('العميل غير موجود', null, 'customerId');
      }

      // Build date filter
      let dateFilter = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter[models.sequelize.Op.gte] = new Date(dateFrom);
        if (dateTo) dateFilter[models.sequelize.Op.lte] = new Date(dateTo);
      }

      // Get invoices and payments
      const [invoices, payments] = await Promise.all([
        Invoice.findAll({
          where: {
            customerId,
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
          },
          limit: parseInt(limit),
          order: [['date', 'DESC']]
        }),
        Payment.findAll({
          where: {
            customerId,
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
          },
          limit: parseInt(limit),
          order: [['date', 'DESC']]
        })
      ]);

      // Combine and sort transactions
      const transactions = [
        ...invoices.map(inv => ({
          ...inv.toJSON(),
          type: 'invoice',
          amount: inv.totalAmount,
          balance: inv.totalAmount - inv.paidAmount
        })),
        ...payments.map(pay => ({
          ...pay.toJSON(),
          type: 'payment',
          amount: -pay.amount,
          balance: 0
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate running balance
      let runningBalance = parseFloat(customer.balance);
      for (let i = transactions.length - 1; i >= 0; i--) {
        runningBalance += transactions[i].amount;
        transactions[i].runningBalance = runningBalance;
      }

      return {
        customer: customer.toJSON(),
        transactions,
        summary: {
          currentBalance: parseFloat(customer.balance),
          totalInvoices: invoices.length,
          totalPayments: payments.length,
          totalInvoiced: invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
          totalPaid: payments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0)
        }
      };

    } catch (error) {
      if (error instanceof ValidationAppError) {
        throw error;
      }
      throw new DatabaseError('Failed to get customer statement', error, 'getCustomerStatement');
    }
  }

  /**
   * Get customers summary statistics
   * @returns {Promise<Object>} Summary statistics
   */
  static async getCustomersSummary() {
    try {
      const cacheKey = 'customers_summary';
      
      // Try cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const [totalStats, typeStats, statusStats] = await Promise.all([
        Customer.findOne({
          attributes: [
            [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'totalCustomers'],
            [models.sequelize.fn('SUM', models.sequelize.col('balance')), 'totalBalance'],
            [models.sequelize.fn('SUM', models.sequelize.col('creditLimit')), 'totalCreditLimit'],
            [models.sequelize.fn('SUM', models.sequelize.col('creditUsed')), 'totalCreditUsed']
          ],
          raw: true
        }),
        Customer.findAll({
          attributes: [
            'type',
            [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
          ],
          group: ['type'],
          raw: true
        }),
        Customer.findAll({
          attributes: [
            'isActive',
            [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
          ],
          group: ['isActive'],
          raw: true
        })
      ]);

      const summary = {
        total: {
          customers: parseInt(totalStats?.totalCustomers || 0),
          balance: parseFloat(totalStats?.totalBalance || 0),
          creditLimit: parseFloat(totalStats?.totalCreditLimit || 0),
          creditUsed: parseFloat(totalStats?.totalCreditUsed || 0)
        },
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = parseInt(stat.count);
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.isActive ? 'active' : 'inactive'] = parseInt(stat.count);
          return acc;
        }, {})
      };

      // Cache for 10 minutes
      await cacheManager.set(cacheKey, summary, 600);

      return summary;

    } catch (error) {
      throw new DatabaseError('Failed to get customers summary', error, 'getCustomersSummary');
    }
  }
}

export default CustomerService;
