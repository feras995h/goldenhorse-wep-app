import { DataTypes } from 'sequelize';

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
      type: DataTypes.TEXT, // Use TEXT for SQLite compatibility
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

  // Create users table
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
      type: DataTypes.ENUM('admin', 'financial', 'sales', 'customer_service', 'operations'),
      allowNull: false,
      defaultValue: 'operations'
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

  // Create accounts table
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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(100)
    },
    type: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'income', 'expense'),
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
      type: DataTypes.STRING(50)
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
      defaultValue: 0
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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

  // Create employees table
  await queryInterface.createTable('employees', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeNumber: {
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
    position: {
      type: DataTypes.STRING(50)
    },
    department: {
      type: DataTypes.STRING(50)
    },
    hireDate: {
      type: DataTypes.DATEONLY
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2)
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

  // Create settings table
  await queryInterface.createTable('settings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      allowNull: false,
      defaultValue: 'string'
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

  // Add indexes
  await queryInterface.addIndex('users', ['username']);
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('accounts', ['code']);
  await queryInterface.addIndex('accounts', ['type']);
  await queryInterface.addIndex('accounts', ['parentId']);
  await queryInterface.addIndex('gl_entries', ['entryNumber']);
  await queryInterface.addIndex('gl_entries', ['date']);
  await queryInterface.addIndex('gl_entries', ['status']);
  await queryInterface.addIndex('gl_entry_details', ['glEntryId']);
  await queryInterface.addIndex('gl_entry_details', ['accountId']);
  await queryInterface.addIndex('customers', ['code']);
  await queryInterface.addIndex('customers', ['name']);
  await queryInterface.addIndex('employees', ['employeeNumber']);
  await queryInterface.addIndex('employees', ['name']);
  await queryInterface.addIndex('settings', ['key']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('gl_entry_details');
  await queryInterface.dropTable('gl_entries');
  await queryInterface.dropTable('settings');
  await queryInterface.dropTable('employees');
  await queryInterface.dropTable('customers');
  await queryInterface.dropTable('accounts');
  await queryInterface.dropTable('users');
  await queryInterface.dropTable('roles');
}

