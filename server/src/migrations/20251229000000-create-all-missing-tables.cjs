'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable('customers', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        name: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        mobile: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        fax: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        website: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        taxNumber: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        commercialRegister: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        city: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        country: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: 'ليبيا'
        },
        postalCode: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        creditLimit: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        paymentTerms: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        paymentMethod: {
          type: Sequelize.ENUM('cash', 'credit', 'bank_transfer', 'check'),
          allowNull: true
        },
        customerType: {
          type: Sequelize.ENUM('individual', 'company', 'government'),
          allowNull: false,
          defaultValue: 'company'
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'suspended'),
          allowNull: false,
          defaultValue: 'active'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }),

      queryInterface.createTable('sales_invoices', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        invoiceNumber: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        dueDate: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        customerId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'customers',
            key: 'id'
          }
        },
        subtotal: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        taxAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        discountAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        shippingAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        total: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        paidAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        remainingAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'LYD'
        },
        exchangeRate: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: false,
          defaultValue: 1.0000
        },
        status: {
          type: Sequelize.ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'),
          allowNull: false,
          defaultValue: 'draft'
        },
        paymentStatus: {
          type: Sequelize.ENUM('pending', 'partial', 'paid', 'overdue'),
          allowNull: false,
          defaultValue: 'pending'
        },
        paymentMethod: {
          type: Sequelize.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'account_credit'),
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        terms: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        reference: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approvedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approvedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }),

      queryInterface.createTable('sales_invoice_items', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        salesInvoiceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sales_invoices',
            key: 'id'
          }
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        quantity: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: false,
          defaultValue: 1.000
        },
        unitPrice: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        totalPrice: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        discountAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        taxAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        taxRate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        unit: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }),

      queryInterface.createTable('sales_returns', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        returnNumber: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        customerId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'customers',
            key: 'id'
          }
        },
        salesInvoiceId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sales_invoices',
            key: 'id'
          }
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        items: {
          type: Sequelize.JSON,
          allowNull: false
        },
        total: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        status: {
          type: Sequelize.ENUM('draft', 'approved', 'rejected', 'processed'),
          allowNull: false,
          defaultValue: 'draft'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approvedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approvedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable('sales_returns'),
      queryInterface.dropTable('sales_invoice_items'),
      queryInterface.dropTable('sales_invoices'),
      queryInterface.dropTable('customers')
    ]);
  }
};