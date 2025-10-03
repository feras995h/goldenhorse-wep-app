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

        // Auto-assign account based on customer type will be handled in afterCreate hook
        // This ensures proper account creation with transaction consistency
      },
      afterCreate: async (customer, options) => {
        // Enhanced automatic account creation for customers
        const { Account } = sequelize.models;

        try {
          console.log(`🔄 Creating account for new customer: ${customer.name} (${customer.code})`);
          
          // Find the appropriate parent account based on customer type
          let customersParentAccount;
          
          if (customer.customerType === 'foreign') {
            // Look for foreign customers account first
            customersParentAccount = await Account.findOne({
              where: {
                [Op.or]: [
                  { code: '1202' }, // Foreign customers receivables
                  { name: { [Op.like]: '%عملاء أجانب%' } },
                  { name: { [Op.like]: '%foreign customers%' } }
                ],
                type: 'asset'
              },
              transaction: options.transaction
            });
          }
          
          if (!customersParentAccount) {
            // Fallback to main receivables account
            customersParentAccount = await Account.findOne({
              where: {
                [Op.or]: [
                  { code: '1201' }, // Main accounts receivable
                  { name: { [Op.like]: '%ذمم العملاء%' } },
                  { name: { [Op.like]: '%عملاء%' } },
                  { name: { [Op.like]: '%receivable%' } }
                ],
                type: 'asset',
                isGroup: true
              },
              transaction: options.transaction
            });
          }

          if (!customersParentAccount) {
            console.warn(`⚠️ No suitable parent account found for customer ${customer.code}`);
            return;
          }

          // Generate enhanced account code
          const accountCode = `${customersParentAccount.code}-${customer.code}`;
          
          // Check if account already exists
          const existingAccount = await Account.findOne({
            where: { code: accountCode },
            transaction: options.transaction
          });

          if (existingAccount) {
            console.log(`ℹ️ Account already exists for customer ${customer.code}: ${accountCode}`);
            await customer.update({
              accountId: existingAccount.id
            }, { transaction: options.transaction });
            return;
          }

          // Create enhanced customer account
          const customerAccount = await Account.create({
            code: accountCode,
            name: `${customer.name} (${customer.customerType === 'foreign' ? 'أجنبي' : 'محلي'})`,
            nameEn: `${customer.nameEn || customer.name} (${customer.customerType === 'foreign' ? 'Foreign' : 'Local'})`,
            type: 'asset',
            rootType: 'current_assets',
            reportType: 'balance_sheet',
            parentId: customersParentAccount.id,
            level: customersParentAccount.level + 1,
            isGroup: false,
            isActive: true,
            currency: customer.currency || 'LYD',
            balance: 0,
            nature: 'debit',
            description: `Customer account - ${customer.name} (${customer.code}) - ${customer.customerType}`,
            accountCategory: 'receivables',
            customerType: customer.customerType,
            customerCode: customer.code
          }, { transaction: options.transaction });

          // Update customer with account reference
          await customer.update({
            accountId: customerAccount.id
          }, { transaction: options.transaction });

          console.log(`✅ Successfully created account for customer: ${customer.name}`);
          console.log(`   📊 Account Code: ${accountCode}`);
          console.log(`   🏷️ Account ID: ${customerAccount.id}`);
          console.log(`   🌍 Customer Type: ${customer.customerType}`);
          console.log(`   💰 Currency: ${customer.currency || 'LYD'}`);

        } catch (error) {
          console.error(`❌ Error creating account for customer ${customer.name}:`, {
            error: error.message,
            customerCode: customer.code,
            customerType: customer.customerType,
            stack: error.stack
          });
          
          // Don't fail customer creation if account creation fails
          // but log it for investigation
          console.warn(`⚠️ Customer ${customer.code} created without automatic account. Manual account creation may be required.`);
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

  /**
   * إنشاء أو الحصول على حساب العميل في دليل الحسابات
   */
  Customer.prototype.ensureAccount = async function(transaction) {
    const { Account } = this.sequelize.models;
    const t = transaction || await this.sequelize.transaction();
    const shouldCommit = !transaction;

    try {
      // البحث عن الحساب الموجود
      let account = await Account.findOne({
        where: { 
          code: `1201-${this.code}`,
          type: 'asset'
        },
        transaction: t
      });

      if (!account) {
        // البحث عن الحساب الأب (ذمم العملاء)
        const parentAccount = await Account.findOne({
          where: { 
            code: '1201',
            isGroup: true
          },
          transaction: t
        });

        if (!parentAccount) {
          throw new Error('حساب ذمم العملاء الرئيسي غير موجود');
        }

        // إنشاء الحساب
        account = await Account.create({
          code: `1201-${this.code}`,
          name: `ذمم العميل - ${this.name}`,
          nameEn: `Customer AR - ${this.name}`,
          type: 'asset',
          rootType: 'current_assets',
          reportType: 'balance_sheet',
          parentId: parentAccount.id,
          level: parentAccount.level + 1,
          isGroup: false,
          isActive: true,
          balance: 0,
          currency: this.currency || 'LYD',
          nature: 'debit',
          description: `حساب العميل: ${this.name} (${this.code})`
        }, { transaction: t });

        console.log(`✅ تم إنشاء حساب للعميل: ${this.name} (${account.code})`);
      }

      if (shouldCommit) await t.commit();
      return account;
    } catch (error) {
      if (shouldCommit) await t.rollback();
      throw error;
    }
  };

  /**
   * Hook: إنشاء حساب تلقائياً عند إنشاء عميل جديد
   */
  Customer.addHook('afterCreate', async (customer, options) => {
    try {
      await customer.ensureAccount(options.transaction);
    } catch (error) {
      console.error(`❌ فشل إنشاء حساب للعميل ${customer.name}:`, error.message);
      // لا نفشل العملية، فقط نسجل الخطأ
    }
  });

  // Associations
  Customer.associate = (models) => {
    Customer.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    Customer.hasMany(models.Invoice, { foreignKey: 'customerId', as: 'invoices' });
    Customer.hasMany(models.Payment, { foreignKey: 'customerId', as: 'payments' });
  };

  return Customer;
};

