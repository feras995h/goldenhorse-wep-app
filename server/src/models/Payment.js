import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true, // Made nullable for flexible party linking
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    // New fields for enhanced voucher management
    accountId: {
      type: DataTypes.UUID,
      allowNull: true, // Will be required in future migration
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account to be debited for this payment'
    },
    partyType: {
      type: DataTypes.ENUM('supplier', 'customer', 'employee', 'account'),
      allowNull: true, // Will be required in future migration
      defaultValue: 'customer',
      comment: 'Type of party this payment is from/to'
    },
    partyId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Generic party ID - can reference supplier, customer, employee, or account'
    },
    voucherType: {
      type: DataTypes.ENUM('receipt', 'payment'),
      allowNull: false,
      defaultValue: 'payment',
      comment: 'Type of voucher - receipt or payment'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'other'),
      allowNull: false,
      defaultValue: 'cash'
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'failed'),
      defaultValue: 'pending'
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Temporarily comment out currency fields that may not exist in production DB
    /*
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD',
      validate: {
        len: [3, 3]
      }
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 1.000000,
      validate: {
        min: 0.000001,
        max: 999999.999999
      }
    },
    */
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true, // Will be required in future migration
      references: {
        model: 'users',
        key: 'id'
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },

  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['paymentNumber']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['accountId']
      },
      {
        fields: ['partyType']
      },
      {
        fields: ['partyId']
      },
      {
        fields: ['voucherType']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentMethod']
      }
    ],
    hooks: {
      beforeUpdate: (payment) => {
        if (payment.changed('status') && payment.status === 'completed') {
          payment.completedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  Payment.prototype.getAmount = function() {
    return parseFloat(this.amount) || 0;
  };

  Payment.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  Payment.prototype.complete = function(completedBy) {
    this.status = 'completed';
    this.completedBy = completedBy;
    this.completedAt = new Date();
    return this.save();
  };

  // Class methods
  Payment.findByPaymentNumber = function(paymentNumber) {
    return this.findOne({ where: { paymentNumber } });
  };

  Payment.findByCustomer = function(customerId) {
    return this.findAll({
      where: { customerId },
      order: [['date', 'DESC']]
    });
  };

  Payment.findCompleted = function() {
    return this.findAll({ where: { status: 'completed' } });
  };

  Payment.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        date: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['date', 'ASC']]
    });
  };

  // New methods for enhanced functionality
  Payment.prototype.createJournalEntry = async function(userId, options = {}) {
    const { JournalEntry, JournalEntryDetail, GLEntry, Account } = sequelize.models;

    if (!this.accountId) {
      throw new Error('Account ID is required to create journal entry');
    }

    const externalTx = options.transaction || null;
    const transaction = externalTx || await sequelize.transaction();

    try {
      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({
        order: [['createdAt', 'DESC']]
      });
      const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace(/\D/g, '')) + 1 : 1;
      const entryNumber = `PAY-${String(nextNumber).padStart(6, '0')}`;

      // Create journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description: `Payment voucher ${this.paymentNumber} - ${this.notes || 'Payment transaction'}`,
        totalDebit: this.amount,
        totalCredit: this.amount,
        status: 'posted',
        type: 'payment',
        createdBy: userId
      }, { transaction });

      // Get account details
      const account = await Account.findByPk(this.accountId, { transaction });
      if (!account) {
        throw new Error('Account not found');
      }

      // Create journal entry details
      const details = [
        {
          journalEntryId: journalEntry.id,
          accountId: this.accountId,
          debit: 0,
          credit: this.amount,
          description: `Payment to ${this.partyType} - ${this.paymentNumber}`
        },
        {
          journalEntryId: journalEntry.id,
          accountId: this.getCounterAccountId(), // Cash/Bank account
          debit: this.amount,
          credit: 0,
          description: `Payment disbursement - ${this.paymentMethod}`
        }
      ];

      await JournalEntryDetail.bulkCreate(details, { transaction });

      // Create GL entries
      const glEntries = details.map(detail => ({
        postingDate: this.date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Payment Entry',
        voucherNo: this.paymentNumber,
        journalEntryId: journalEntry.id,
        remarks: detail.description,
        currency: this.currency,
        exchangeRate: this.exchangeRate,
        createdBy: userId
      }));

      await GLEntry.bulkCreate(glEntries, { transaction });

      if (!externalTx) await transaction.commit();
      return journalEntry;
    } catch (error) {
      if (!externalTx) await transaction.rollback();
      throw error;
    }
  };

  Payment.prototype.getCounterAccountId = function() {
    // TODO: Implement proper mapping based on payment method and party
    // Fallback for dev/test: if no mapping exists, use the same account to avoid null FK
    return this.counterAccountId || this.accountId || null;
  };

  Payment.findByAccount = function(accountId) {
    return this.findAll({
      where: { accountId },
      order: [['date', 'DESC']]
    });
  };

  Payment.findByParty = function(partyType, partyId) {
    return this.findAll({
      where: { partyType, partyId },
      order: [['date', 'DESC']]
    });
  };

  // Associations
  Payment.associate = (models) => {
    Payment.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Payment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Payment.belongsTo(models.User, { foreignKey: 'completedBy', as: 'completer' });
    Payment.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });

    // Invoice linking associations
    Payment.hasMany(models.InvoicePayment, { foreignKey: 'paymentId', as: 'invoiceAllocations' });
    // Sales invoice linking associations
    Payment.hasMany(models.SalesInvoicePayment, { foreignKey: 'paymentId', as: 'salesInvoiceAllocations' });
  };

  return Payment;
};

