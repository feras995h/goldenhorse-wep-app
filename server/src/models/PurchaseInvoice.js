import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PurchaseInvoice = sequelize.define('PurchaseInvoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
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
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'shipments',
        key: 'id'
      }
    },
    serviceDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    serviceDescriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 1.000,
      validate: {
        min: 0.001,
        max: 999999.999
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    outstandingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'outstandingamount',
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      allowNull: false,
      defaultValue: 'LYD'
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
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'overdue'),
      allowNull: false,
      defaultValue: 'unpaid'
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'purchase_invoices',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (invoice) => {
        // Generate invoice number if not provided
        if (!invoice.invoiceNumber) {
          const lastInvoice = await PurchaseInvoice.findOne({
            order: [['createdAt', 'DESC']]
          });
          const nextNumber = lastInvoice ? 
            (parseInt(String(lastInvoice.invoiceNumber).replace(/\D/g, ''), 10) + 1) : 1;
          invoice.invoiceNumber = `PUR-${String(nextNumber).padStart(6, '0')}`;
        }

        // Calculate outstanding amount
        const total = parseFloat(invoice.total || 0);
        const paidAmount = parseFloat(invoice.paidAmount || 0);
        invoice.outstandingAmount = Math.max(0, total - paidAmount);
      },
      beforeUpdate: (invoice) => {
        // Calculate outstanding amount
        if (invoice.changed('total') || invoice.changed('paidAmount')) {
          const total = parseFloat(invoice.total || 0);
          const paidAmount = parseFloat(invoice.paidAmount || 0);
          invoice.outstandingAmount = Math.max(0, total - paidAmount);
        }
      }
    }
  });

  // Associations
  PurchaseInvoice.associate = (models) => {
    PurchaseInvoice.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    PurchaseInvoice.belongsTo(models.Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
    PurchaseInvoice.belongsTo(models.Account, { foreignKey: 'debitAccountId', as: 'debitAccount' });
    PurchaseInvoice.belongsTo(models.Account, { foreignKey: 'creditAccountId', as: 'creditAccount' });
    PurchaseInvoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  // Instance methods
  PurchaseInvoice.prototype.createJournalEntry = async function(userId, options = {}) {
    const t = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;

    try {
      const { JournalEntry, JournalEntryDetail, GLEntry } = sequelize.models;

      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({ order: [['createdAt', 'DESC']] });
      const nextNumber = lastEntry ? 
        (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `JE-${String(nextNumber).padStart(6, '0')}`;

      const description = `Purchase invoice ${this.invoiceNumber} - ${this.serviceDescription}`;

      // Create JE header
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description,
        totalDebit: this.total,
        totalCredit: this.total,
        status: 'posted',
        type: 'purchase_invoice',
        createdBy: userId
      }, { transaction: t });

      // Create JE details
      const details = [
        {
          journalEntryId: journalEntry.id,
          accountId: this.debitAccountId,
          debit: this.total,
          credit: 0,
          description: `Purchase from ${this.supplier?.name || 'Supplier'}`
        },
        {
          journalEntryId: journalEntry.id,
          accountId: this.creditAccountId,
          debit: 0,
          credit: this.total,
          description: `Purchase invoice ${this.invoiceNumber}`
        }
      ];

      await JournalEntryDetail.bulkCreate(details, { transaction: t });

      // Create GL entries
      const glEntries = details.map(detail => ({
        postingDate: this.date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Purchase Invoice',
        voucherNo: this.invoiceNumber,
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

  return PurchaseInvoice;
};