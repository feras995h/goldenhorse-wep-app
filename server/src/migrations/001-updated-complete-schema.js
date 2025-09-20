import { DataTypes } from 'sequelize';

/**
 * Migration محدث يحتوي على جميع الجداول والأعمدة المطلوبة
 * Updated Complete Schema Migration - Golden Horse Shipping System
 */

export async function up(queryInterface, Sequelize) {
  // Create roles table
  await queryInterface.createTable('roles', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    permissions: {
      type: DataTypes.TEXT,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('permissions');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('permissions', JSON.stringify(value || {}));
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create users table with all required columns
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'financial_manager', 'sales_manager', 'user'),
      allowNull: false,
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    passwordChangedAt: {
      type: DataTypes.DATE
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create accounts table with all required columns
  await queryInterface.createTable('accounts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(200)
    },
    type: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false
    },
    rootType: {
      type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
      allowNull: false
    },
    reportType: {
      type: DataTypes.ENUM('Balance Sheet', 'Profit and Loss'),
      allowNull: false
    },
    accountCategory: {
      type: DataTypes.STRING(50)
    },
    accountType: {
      type: DataTypes.ENUM('main', 'sub', 'detail', 'group'),
      allowNull: false,
      defaultValue: 'main'
    },
    parentId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    freezeAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD'
    },
    description: {
      type: DataTypes.TEXT
    },
    nature: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
      defaultValue: 'debit'
    },
    notes: {
      type: DataTypes.TEXT
    },
    isSystemAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isMonitored: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create gl_entries table
  await queryInterface.createTable('gl_entries', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entryNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING(100)
    },
    description: {
      type: DataTypes.TEXT
    },
    totalDebit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalCredit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    postedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    postedAt: {
      type: DataTypes.DATE
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create gl_entry_details table
  await queryInterface.createTable('gl_entry_details', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    glEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'gl_entries',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    debit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    credit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create vouchers table
  await queryInterface.createTable('vouchers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    voucherNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('receipt', 'payment'),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_DATE')
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    accountId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    counterAccountId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    partyType: {
      type: DataTypes.STRING(20)
    },
    partyId: {
      type: DataTypes.UUID
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      defaultValue: 'cash'
    },
    reference: {
      type: DataTypes.STRING(100)
    },
    notes: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });

  // Create customers table
  await queryInterface.createTable('customers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(100)
    },
    contactPerson: {
      type: DataTypes.STRING(100)
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    email: {
      type: DataTypes.STRING(100)
    },
    address: {
      type: DataTypes.TEXT
    },
    taxNumber: {
      type: DataTypes.STRING(50)
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'wholesale'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create invoices table
  await queryInterface.createTable('invoices', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customerId: {
      type: DataTypes.UUID,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: Sequelize.literal('CURRENT_DATE')
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create sales_invoices table
  await queryInterface.createTable('sales_invoices', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customerId: {
      type: DataTypes.UUID,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: Sequelize.literal('CURRENT_DATE')
    },
    dueDate: {
      type: DataTypes.DATEONLY
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create shipping_invoices table
  await queryInterface.createTable('shipping_invoices', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: Sequelize.literal('CURRENT_DATE')
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    paid_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Add all indexes
  await queryInterface.addIndex('users', ['username']);
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('accounts', ['code']);
  await queryInterface.addIndex('accounts', ['type']);
  await queryInterface.addIndex('accounts', ['parentId']);
  await queryInterface.addIndex('accounts', ['isActive']);
  await queryInterface.addIndex('gl_entries', ['entryNumber']);
  await queryInterface.addIndex('gl_entries', ['date']);
  await queryInterface.addIndex('gl_entries', ['status']);
  await queryInterface.addIndex('gl_entry_details', ['glEntryId']);
  await queryInterface.addIndex('gl_entry_details', ['accountId']);
  await queryInterface.addIndex('vouchers', ['voucherNumber']);
  await queryInterface.addIndex('vouchers', ['type']);
  await queryInterface.addIndex('vouchers', ['date']);
  await queryInterface.addIndex('vouchers', ['isActive']);
  await queryInterface.addIndex('customers', ['code']);
  await queryInterface.addIndex('customers', ['name']);
  await queryInterface.addIndex('customers', ['isActive']);
  await queryInterface.addIndex('invoices', ['invoiceNumber']);
  await queryInterface.addIndex('invoices', ['customerId']);
  await queryInterface.addIndex('invoices', ['date']);
  await queryInterface.addIndex('invoices', ['status']);
  await queryInterface.addIndex('sales_invoices', ['invoiceNumber']);
  await queryInterface.addIndex('sales_invoices', ['customerId']);
  await queryInterface.addIndex('sales_invoices', ['isActive']);
  await queryInterface.addIndex('shipping_invoices', ['invoice_number']);
  await queryInterface.addIndex('shipping_invoices', ['customer_id']);
  await queryInterface.addIndex('shipping_invoices', ['status']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('shipping_invoices');
  await queryInterface.dropTable('sales_invoices');
  await queryInterface.dropTable('invoices');
  await queryInterface.dropTable('customers');
  await queryInterface.dropTable('vouchers');
  await queryInterface.dropTable('gl_entry_details');
  await queryInterface.dropTable('gl_entries');
  await queryInterface.dropTable('accounts');
  await queryInterface.dropTable('users');
  await queryInterface.dropTable('roles');
}
