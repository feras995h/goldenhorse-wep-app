import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Receipt = sequelize.define('Receipt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    receiptNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true, // Made nullable for flexible party linking
      references: {
        model: 'suppliers',
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
      comment: 'Account to be credited for this receipt'
    },
    partyType: {
      type: DataTypes.ENUM('supplier', 'customer', 'employee', 'account'),
      allowNull: true, // Will be required in future migration
      defaultValue: 'supplier',
      comment: 'Type of party this receipt is from/to'
    },
    partyId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Generic party ID - can reference supplier, customer, employee, or account'
    },
    voucherType: {
      type: DataTypes.ENUM('receipt', 'payment'),
      allowNull: false,
      defaultValue: 'receipt',
      comment: 'Type of voucher - receipt or payment'
    },
    receiptDate: {
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
    referenceNo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bankAccount: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    checkNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'failed'),
      defaultValue: 'pending'
    },
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
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
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
    }
  }, {
    tableName: 'receipts',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['receiptNo']
      },
      {
        fields: ['supplierId']
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
        fields: ['receiptDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['paymentMethod']
      }
    ],
    hooks: {
      beforeUpdate: (receipt) => {
        if (receipt.changed('status') && receipt.status === 'completed') {
          receipt.completedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  Receipt.prototype.getAmount = function() {
    return parseFloat(this.amount) || 0;
  };

  Receipt.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  Receipt.prototype.complete = function(completedBy) {
    this.status = 'completed';
    this.completedBy = completedBy;
    this.completedAt = new Date();
    return this.save();
  };

  // Class methods
  Receipt.findByReceiptNo = function(receiptNo) {
    return this.findOne({ where: { receiptNo } });
  };

  Receipt.findBySupplier = function(supplierId) {
    return this.findAll({
      where: { supplierId },
      order: [['receiptDate', 'DESC']]
    });
  };

  Receipt.findCompleted = function() {
    return this.findAll({ where: { status: 'completed' } });
  };

  Receipt.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        receiptDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['receiptDate', 'ASC']]
    });
  };

  // New methods for enhanced functionality
  Receipt.prototype.createJournalEntry = async function(userId, options = {}) {
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
      const entryNumber = `REC-${String(nextNumber).padStart(6, '0')}`;

      // Create journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.receiptDate,
        description: `Receipt voucher ${this.receiptNo} - ${this.remarks || 'Receipt transaction'}`,
        totalDebit: this.amount,
        totalCredit: this.amount,
        status: 'posted',
        type: 'receipt',
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
          debit: this.amount,
          credit: 0,
          description: `Receipt from ${this.partyType} - ${this.receiptNo}`
        },
        {
          journalEntryId: journalEntry.id,
          accountId: this.getCounterAccountId(), // Cash/Bank account
          debit: 0,
          credit: this.amount,
          description: `Receipt payment - ${this.paymentMethod}`
        }
      ];

      await JournalEntryDetail.bulkCreate(details, { transaction });

      // Create GL entries
      const glEntries = details.map(detail => ({
        postingDate: this.receiptDate,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Receipt Entry',
        voucherNo: this.receiptNo,
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

  Receipt.prototype.getCounterAccountId = function() {
    // TODO: Implement proper mapping based on payment method and party
    // Fallback for dev/test: if no mapping exists, use the same account to avoid null FK
    return this.counterAccountId || this.accountId || null;
  };

  Receipt.findByAccount = function(accountId) {
    return this.findAll({
      where: { accountId },
      order: [['receiptDate', 'DESC']]
    });
  };

  Receipt.findByParty = function(partyType, partyId) {
    return this.findAll({
      where: { partyType, partyId },
      order: [['receiptDate', 'DESC']]
    });
  };

  // Associations
  Receipt.associate = (models) => {
    Receipt.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    Receipt.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Receipt.belongsTo(models.User, { foreignKey: 'completedBy', as: 'completer' });
    Receipt.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });

    // Invoice linking associations
    Receipt.hasMany(models.InvoiceReceipt, { foreignKey: 'receiptId', as: 'invoiceAllocations' });
  };

  return Receipt;
};

