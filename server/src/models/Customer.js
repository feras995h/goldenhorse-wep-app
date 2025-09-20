import { DataTypes, Op } from 'sequelize';

export default (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 20]
      }
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Reference to the customer account in chart of accounts'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(200),
      allowNull: true
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    taxNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },


    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: -999999999999.99,
        max: 999999999999.99
      }
    },

    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual'
    },
    customerType: {
      type: DataTypes.ENUM('local', 'foreign'),
      defaultValue: 'local',
      allowNull: false,
      validate: {
        isIn: [['local', 'foreign']]
      },
      comment: 'Customer classification: local or foreign'
    },
    nationality: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Customer nationality for foreign customers'
    },
    passportNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Passport number for foreign customers'
    },
    residencyStatus: {
      type: DataTypes.ENUM('resident', 'non_resident', 'tourist'),
      allowNull: true,
      comment: 'Residency status for foreign customers'
    },
    paymentTerms: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 365
      }
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      defaultValue: 'LYD'
    },



  }, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (customer) => {
        // Generate customer code if not provided
        if (!customer.code) {
          const lastCustomer = await Customer.findOne({
            order: [['code', 'DESC']]
          });

          let nextNumber = 1;
          if (lastCustomer && lastCustomer.code) {
            // Extract number from customer code (assuming format like "C000001")
            const match = lastCustomer.code.match(/\d+$/);
            if (match) {
              nextNumber = parseInt(match[0]) + 1;
            }
          }

          // Generate code based on customer type
          const prefix = customer.customerType === 'foreign' ? 'CF' : 'CL';
          customer.code = `${prefix}${String(nextNumber).padStart(6, '0')}`;
        }

        // Auto-assign account based on customer type
        if (!customer.accountId) {
          await customer.assignAccountByType();
        }
      },
      afterCreate: async (customer, options) => {
        // Create corresponding account in chart of accounts
        const { Account } = sequelize.models;

        try {
          // Find the customers parent account (usually under receivables)
          const customersParentAccount = await Account.findOne({
            where: {
              [Op.or]: [
                { name: { [Op.like]: '%عملاء%' } },
                { name: { [Op.like]: '%customers%' } },
                { name: { [Op.like]: '%receivables%' } },
                { name: { [Op.like]: '%مدينون%' } }
              ],
              type: 'asset'
            }
          });

          const customerAccount = await Account.create({
            code: customer.code,
            name: customer.name,
            nameEn: customer.nameEn,
            type: 'asset',
            accountCategory: 'receivables',
            parentId: customersParentAccount?.id || null,
            level: customersParentAccount ? (customersParentAccount.level + 1) : 1,
            isActive: true,
            currency: customer.currency,
            balance: 0,
            description: `حساب العميل: ${customer.name}`
          }, { transaction: options.transaction });

          // Update customer with account reference
          await customer.update({
            accountId: customerAccount.id
          }, { transaction: options.transaction });

        } catch (error) {
          console.error('Error creating customer account:', error);
          // Don't fail customer creation if account creation fails
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['code']
      },

      {
        fields: ['isActive']
      },

      {
        fields: ['email']
      }
    ]
  });

  // Instance methods
  Customer.prototype.getBalance = function() {
    return parseFloat(this.balance) || 0;
  };

  Customer.prototype.isOverCreditLimit = function() {
    return this.getBalance() > this.creditLimit;
  };

  Customer.prototype.getDaysOverdue = function() {
    // This would need to be implemented based on invoice due dates
    return 0;
  };

  Customer.prototype.assignAccountByType = async function() {
    const { Account, AccountMapping } = this.sequelize.models;

    try {
      // Get active account mapping
      const activeMapping = await AccountMapping.getActiveMapping();
      if (!activeMapping) {
        console.warn('No active account mapping found for customer account assignment');
        return;
      }

      let targetAccountId;

      if (this.customerType === 'local') {
        // Assign to local customers account
        targetAccountId = activeMapping.localCustomersAccount || activeMapping.accountsReceivableAccount;
      } else if (this.customerType === 'foreign') {
        // Assign to foreign customers account
        targetAccountId = activeMapping.foreignCustomersAccount || activeMapping.accountsReceivableAccount;
      }

      if (targetAccountId) {
        this.accountId = targetAccountId;
      }
    } catch (error) {
      console.error('Error assigning account by customer type:', error);
    }
  };

  Customer.prototype.getDisplayName = function() {
    const typeLabel = this.customerType === 'foreign' ? '(أجنبي)' : '(محلي)';
    return `${this.name} ${typeLabel}`;
  };

  Customer.prototype.isLocal = function() {
    return this.customerType === 'local';
  };

  Customer.prototype.isForeign = function() {
    return this.customerType === 'foreign';
  };

  Customer.prototype.getAccountingCurrency = function() {
    // Foreign customers might use different currencies
    if (this.customerType === 'foreign' && this.currency !== 'LYD') {
      return this.currency;
    }
    return 'LYD'; // Default to LYD for local customers
  };

  // Class methods
  Customer.findByCode = function(code) {
    return this.findOne({ where: { code } });
  };

  Customer.findActive = function() {
    return this.findAll({ where: { isActive: true } });
  };

  Customer.findOverCreditLimit = function() {
    return this.findAll({
      where: {
        isActive: true,
        balance: {
          [sequelize.Op.gt]: sequelize.col('creditLimit')
        }
      }
    });
  };

  Customer.findLocalCustomers = async function(options = {}) {
    return await this.findAll({
      where: { customerType: 'local', ...options.where },
      ...options
    });
  };

  Customer.findForeignCustomers = async function(options = {}) {
    return await this.findAll({
      where: { customerType: 'foreign', ...options.where },
      ...options
    });
  };

  Customer.getCustomerStats = async function() {
    const [localCount, foreignCount] = await Promise.all([
      this.count({ where: { customerType: 'local', isActive: true } }),
      this.count({ where: { customerType: 'foreign', isActive: true } })
    ]);

    return {
      total: localCount + foreignCount,
      local: localCount,
      foreign: foreignCount,
      localPercentage: localCount > 0 ? ((localCount / (localCount + foreignCount)) * 100).toFixed(1) : 0,
      foreignPercentage: foreignCount > 0 ? ((foreignCount / (localCount + foreignCount)) * 100).toFixed(1) : 0
    };
  };

  // Associations
  Customer.associate = (models) => {
    Customer.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    Customer.hasMany(models.Invoice, { foreignKey: 'customerId', as: 'invoices' });
    Customer.hasMany(models.Payment, { foreignKey: 'customerId', as: 'payments' });
  };

  return Customer;
};

