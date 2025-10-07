import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PaymentVoucher = sequelize.define('PaymentVoucher', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    voucherNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    beneficiaryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    beneficiaryName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true, // Temporarily nullable to resolve immediate query issues. Should be properly linked in future migrations.
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account associated with this payment voucher'
    },
    purpose: {
      type: DataTypes.ENUM('invoice_payment', 'operating_expenses', 'shipping_costs', 'salary', 'rent', 'utilities', 'other'),
      allowNull: false,
      defaultValue: 'invoice_payment'
    },
    purposeDescription: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'other'),
      allowNull: false,
      defaultValue: 'cash'
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      allowNull: false,
      defaultValue: 'LYD'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    debitAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    creditAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1.0000,
      validate: {
        min: 0.0001,
        max: 999999.9999
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'payment_vouchers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (voucher) => {
        // Generate voucher number if not provided
        if (!voucher.voucherNumber) {
          const lastVoucher = await PaymentVoucher.findOne({
            order: [['createdAt', 'DESC']]
          });
          const nextNumber = lastVoucher ? 
            (parseInt(String(lastVoucher.voucherNumber).replace(/\D/g, ''), 10) + 1) : 1;
          voucher.voucherNumber = `PV-${String(nextNumber).padStart(6, '0')}`;
        }
      }
    }
  });

  // Associations
  PaymentVoucher.associate = (models) => {
    PaymentVoucher.belongsTo(models.Supplier, { foreignKey: 'beneficiaryId', as: 'beneficiary' });
    PaymentVoucher.belongsTo(models.Account, { foreignKey: 'debitAccountId', as: 'debitAccount' });
    PaymentVoucher.belongsTo(models.Account, { foreignKey: 'creditAccountId', as: 'creditAccount' });
    PaymentVoucher.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    PaymentVoucher.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
  };

  // Instance methods
  PaymentVoucher.prototype.createJournalEntry = async function(userId, options = {}) {
    const t = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;

    try {
      const { JournalEntry, JournalEntryDetail, GLEntry } = sequelize.models;

      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({ order: [['createdAt', 'DESC']] });
      const nextNumber = lastEntry ? 
        (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `JE-${String(nextNumber).padStart(6, '0')}`;

      const description = `Payment voucher ${this.voucherNumber} - ${this.purposeDescription || this.purpose}`;

      // Create JE header
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description,
        totalDebit: this.amount,
        totalCredit: this.amount,
        status: 'posted',
        type: 'payment_voucher',
        createdBy: userId
      }, { transaction: t });

      // Create JE details
      const details = [
        {
          journalEntryId: journalEntry.id,
          accountId: this.debitAccountId,
          debit: this.amount,
          credit: 0,
          description: `Payment to ${this.beneficiaryName}`
        },
        {
          journalEntryId: journalEntry.id,
          accountId: this.creditAccountId,
          debit: 0,
          credit: this.amount,
          description: `Payment made to ${this.beneficiaryName}`
        }
      ];

      await JournalEntryDetail.bulkCreate(details, { transaction: t });

      // Create GL entries
      const glEntries = details.map(detail => ({
        postingDate: this.date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Payment Voucher',
        voucherNo: this.voucherNumber,
        journalEntryId: journalEntry.id,
        remarks: detail.description,
        currency: this.currency,
        exchangeRate: this.exchangeRate,
        createdBy: userId
      }));

      await GLEntry.bulkCreate(glEntries, { transaction: t });

      // Update account balances
      for (const detail of details) {
        const account = await sequelize.models.Account.findByPk(detail.accountId, { 
          transaction: t, 
          lock: t.LOCK.UPDATE 
        });
        if (account) {
          const currentBalance = parseFloat(account.balance || 0);
          const newBalance = currentBalance + detail.debit - detail.credit;
          await account.update({ balance: newBalance }, { transaction: t });
        }
      }

      if (shouldCommit) await t.commit();
      return journalEntry;
    } catch (error) {
      if (shouldCommit) await t.rollback();
      throw error;
    }
  };

  return PaymentVoucher;
};