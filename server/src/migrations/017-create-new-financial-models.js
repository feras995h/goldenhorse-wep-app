'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create suppliers table
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      nameEn: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      contactPerson: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
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
        allowNull: true
      },
      taxNumber: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      creditLimit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paymentTerms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      currency: {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        allowNull: false,
        defaultValue: 'LYD'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create receipt_vouchers table
    await queryInterface.createTable('receipt_vouchers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      voucherNumber: {
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
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      customerName: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      shipmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shipments',
          key: 'id'
        }
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'other'),
        allowNull: false,
        defaultValue: 'cash'
      },
      currency: {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        allowNull: false,
        defaultValue: 'LYD'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('invoice_payment', 'advance_payment', 'settlement', 'refund', 'other'),
        allowNull: false,
        defaultValue: 'invoice_payment'
      },
      purposeDescription: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      debitAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      creditAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0000
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
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
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create payment_vouchers table
    await queryInterface.createTable('payment_vouchers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      voucherNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      beneficiaryId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        }
      },
      beneficiaryName: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('invoice_payment', 'operating_expenses', 'shipping_costs', 'salary', 'rent', 'utilities', 'other'),
        allowNull: false,
        defaultValue: 'invoice_payment'
      },
      purposeDescription: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'other'),
        allowNull: false,
        defaultValue: 'cash'
      },
      currency: {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        allowNull: false,
        defaultValue: 'LYD'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      debitAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      creditAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0000
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
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
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create purchase_invoices table
    await queryInterface.createTable('purchase_invoices', {
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
        allowNull: false
      },
      supplierId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'suppliers',
          key: 'id'
        }
      },
      shipmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shipments',
          key: 'id'
        }
      },
      serviceDescription: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      serviceDescriptionEn: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 1.000
      },
      unitPrice: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      taxAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      paidAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      outstandingamount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      currency: {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        allowNull: false,
        defaultValue: 'LYD'
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0000
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      paymentStatus: {
        type: Sequelize.ENUM('unpaid', 'partial', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'unpaid'
      },
      debitAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      creditAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
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
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create warehouse table
    await queryInterface.createTable('warehouse', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      internalShipmentNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      trackingNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      supplierId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        }
      },
      originCountry: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'China'
      },
      destinationCountry: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Libya'
      },
      weight: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      volume: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: true
      },
      cargoType: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      arrivalDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      departureDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      storageLocation: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('stored', 'shipped', 'delivered', 'returned'),
        allowNull: false,
        defaultValue: 'stored'
      },
      salesInvoiceId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'sales_invoices',
          key: 'id'
        }
      },
      purchaseInvoiceId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'purchase_invoices',
          key: 'id'
        }
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
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add new fields to sales_invoices table
    await queryInterface.addColumn('sales_invoices', 'serviceDescription', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('sales_invoices', 'serviceDescriptionEn', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('sales_invoices', 'shipmentNumbers', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('sales_invoices', 'serviceType', {
      type: Sequelize.ENUM('sea_freight', 'air_freight', 'land_freight', 'express', 'other'),
      allowNull: true,
      defaultValue: 'sea_freight'
    });

    await queryInterface.addColumn('sales_invoices', 'weight', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true
    });

    await queryInterface.addColumn('sales_invoices', 'volume', {
      type: Sequelize.DECIMAL(15, 3),
      allowNull: true
    });

    await queryInterface.addColumn('sales_invoices', 'cbm', {
      type: Sequelize.DECIMAL(15, 3),
      allowNull: true
    });

    // Create indexes for better performance
    await queryInterface.addIndex('suppliers', ['code']);
    await queryInterface.addIndex('suppliers', ['name']);
    await queryInterface.addIndex('suppliers', ['isActive']);

    await queryInterface.addIndex('receipt_vouchers', ['voucherNumber']);
    await queryInterface.addIndex('receipt_vouchers', ['date']);
    await queryInterface.addIndex('receipt_vouchers', ['customerId']);
    await queryInterface.addIndex('receipt_vouchers', ['status']);

    await queryInterface.addIndex('payment_vouchers', ['voucherNumber']);
    await queryInterface.addIndex('payment_vouchers', ['date']);
    await queryInterface.addIndex('payment_vouchers', ['beneficiaryId']);
    await queryInterface.addIndex('payment_vouchers', ['status']);

    await queryInterface.addIndex('purchase_invoices', ['invoiceNumber']);
    await queryInterface.addIndex('purchase_invoices', ['date']);
    await queryInterface.addIndex('purchase_invoices', ['supplierId']);
    await queryInterface.addIndex('purchase_invoices', ['status']);
    await queryInterface.addIndex('purchase_invoices', ['outstandingamount']);

    await queryInterface.addIndex('warehouse', ['internalShipmentNumber']);
    await queryInterface.addIndex('warehouse', ['trackingNumber']);
    await queryInterface.addIndex('warehouse', ['customerId']);
    await queryInterface.addIndex('warehouse', ['status']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('warehouse');
    await queryInterface.dropTable('purchase_invoices');
    await queryInterface.dropTable('payment_vouchers');
    await queryInterface.dropTable('receipt_vouchers');
    await queryInterface.dropTable('suppliers');

    // Remove added columns from sales_invoices
    await queryInterface.removeColumn('sales_invoices', 'serviceDescription');
    await queryInterface.removeColumn('sales_invoices', 'serviceDescriptionEn');
    await queryInterface.removeColumn('sales_invoices', 'shipmentNumbers');
    await queryInterface.removeColumn('sales_invoices', 'serviceType');
    await queryInterface.removeColumn('sales_invoices', 'weight');
    await queryInterface.removeColumn('sales_invoices', 'volume');
    await queryInterface.removeColumn('sales_invoices', 'cbm');
  }
};
