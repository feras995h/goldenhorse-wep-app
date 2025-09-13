import { DataTypes } from 'sequelize';

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

          customer.code = `C${String(nextNumber).padStart(6, '0')}`;
        }
      },
      afterCreate: async (customer, options) => {
        // Create corresponding account in chart of accounts
        const { Account } = sequelize.models;

        try {
          // Find the customers parent account (usually under receivables)
          const customersParentAccount = await Account.findOne({
            where: {
              [sequelize.Op.or]: [
                { name: { [sequelize.Op.iLike]: '%عملاء%' } },
                { name: { [sequelize.Op.iLike]: '%customers%' } },
                { name: { [sequelize.Op.iLike]: '%receivables%' } },
                { name: { [sequelize.Op.iLike]: '%مدينون%' } }
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

  // Associations
  Customer.associate = (models) => {
    Customer.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    Customer.hasMany(models.Invoice, { foreignKey: 'customerId', as: 'invoices' });
    Customer.hasMany(models.Payment, { foreignKey: 'customerId', as: 'payments' });
  };

  return Customer;
};

