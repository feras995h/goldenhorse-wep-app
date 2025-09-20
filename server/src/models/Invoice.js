import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Invoice = sequelize.define('Invoice', {
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
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    },
    outstandingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Amount still outstanding on this invoice'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account to be debited for this invoice (usually Accounts Receivable)'
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },

  }, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['invoiceNumber']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['date']
      },
      {
        fields: ['dueDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['outstandingAmount']
      },
      {
        fields: ['accountId']
      },
      {
        fields: ['createdBy']
      }
    ],
    hooks: {
      beforeCreate: (invoice) => {
        // Calculate total if not provided
        if (!invoice.total) {
          invoice.total = invoice.subtotal + invoice.taxAmount;
        }
        // Set initial outstanding amount
        if (invoice.outstandingAmount === undefined || invoice.outstandingAmount === null) {
          invoice.outstandingAmount = invoice.total - (invoice.paidAmount || 0);
        }
        // Set initial status based on payment
        if (!invoice.status || invoice.status === 'draft') {
          const outstanding = invoice.total - (invoice.paidAmount || 0);
          if (outstanding <= 0.01) {
            invoice.status = 'paid';
          } else if (invoice.paidAmount > 0) {
            invoice.status = 'partially_paid';
          } else {
            invoice.status = 'unpaid';
          }
        }
      },
      beforeUpdate: (invoice) => {
        // Recalculate total if subtotal or taxAmount changed
        if (invoice.changed('subtotal') || invoice.changed('taxAmount')) {
          invoice.total = invoice.subtotal + invoice.taxAmount;
        }
        // Update outstanding amount if total or paidAmount changed
        if (invoice.changed('total') || invoice.changed('paidAmount')) {
          invoice.outstandingAmount = invoice.total - (invoice.paidAmount || 0);

          // Update status based on payment
          const outstanding = invoice.outstandingAmount;
          if (outstanding <= 0.01) {
            invoice.status = 'paid';
          } else if (invoice.paidAmount > 0) {
            invoice.status = 'partially_paid';
          } else {
            invoice.status = 'unpaid';
          }
        }
        // Recalculate balance if total or paidAmount changed
        if (invoice.changed('total') || invoice.changed('paidAmount')) {
          invoice.balance = invoice.total - invoice.paidAmount;
        }
      }
    }
  });

  // Instance methods
  Invoice.prototype.getBalance = function() {
    return parseFloat(this.total) - parseFloat(this.paidAmount);
  };

  Invoice.prototype.getOutstandingAmount = function() {
    return parseFloat(this.outstandingAmount) || this.getBalance();
  };

  Invoice.prototype.isOverdue = function() {
    return this.dueDate < new Date().toISOString().split('T')[0] && this.status !== 'paid';
  };

  Invoice.prototype.getDaysOverdue = function() {
    if (!this.isOverdue()) return 0;
    const dueDate = new Date(this.dueDate);
    const today = new Date();
    return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  };

  Invoice.prototype.isFullyPaid = function() {
    return this.getOutstandingAmount() <= 0.01;
  };

  Invoice.prototype.createJournalEntry = async function(userId) {
    const { JournalEntry, JournalEntryDetail, GLEntry, Account } = sequelize.models;

    if (!this.accountId) {
      throw new Error('Account ID is required to create journal entry');
    }

    const transaction = await sequelize.transaction();

    try {
      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({
        order: [['createdAt', 'DESC']]
      });
      const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace(/\D/g, '')) + 1 : 1;
      const entryNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

      // Create journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description: `Sales invoice ${this.invoiceNumber} - ${this.notes || 'Sales transaction'}`,
        totalDebit: this.total,
        totalCredit: this.total,
        status: 'posted',
        type: 'sales_invoice',
        createdBy: userId
      }, { transaction });

      // Create journal entry details
      // Get account IDs from mapping
      const salesAccountId = await this.getSalesAccountId();
      const taxAccountId = await this.getTaxAccountId();
      const discountAccountId = await this.getDiscountAccountId();

      const details = [
        {
          journalEntryId: journalEntry.id,
          accountId: this.accountId, // Accounts Receivable
          debit: this.total,
          credit: 0,
          description: `${this.type === 'shipping' ? 'Shipping' : 'Sales'} invoice ${this.invoiceNumber}`
        }
      ];

      // Add sales revenue entry
      if (salesAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: salesAccountId,
          debit: 0,
          credit: this.subtotal,
          description: `${this.type === 'shipping' ? 'Shipping' : 'Sales'} revenue - ${this.invoiceNumber}`
        });
      }

      // Add discount entry if applicable
      if (this.discountAmount > 0 && discountAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: discountAccountId,
          debit: this.discountAmount,
          credit: 0,
          description: `Sales discount - ${this.invoiceNumber}`
        });
      }

      // Add tax entry if applicable
      if (this.taxAmount > 0 && taxAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: taxAccountId,
          debit: 0,
          credit: this.taxAmount,
          description: `Sales tax - ${this.invoiceNumber}`
        });
      }

      await JournalEntryDetail.bulkCreate(details, { transaction });

      // Create GL entries
      const glEntries = details.map(detail => ({
        postingDate: this.date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Sales Invoice',
        voucherNo: this.invoiceNumber,
        journalEntryId: journalEntry.id,
        remarks: detail.description,
        currency: this.currency,
        exchangeRate: this.exchangeRate,
        createdBy: userId
      }));

      await GLEntry.bulkCreate(glEntries, { transaction });

      await transaction.commit();
      return journalEntry;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  Invoice.prototype.getSalesAccountId = async function() {
    const { AccountMapping } = sequelize.models;
    try {
      const mapping = await AccountMapping.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
      });

      if (this.type === 'shipping') {
        return mapping?.shippingRevenueAccount || null;
      } else {
        return mapping?.salesRevenueAccount || null;
      }
    } catch (error) {
      console.error('Error getting sales account ID:', error);
      return null;
    }
  };

  Invoice.prototype.getTaxAccountId = async function() {
    const { AccountMapping } = sequelize.models;
    try {
      const mapping = await AccountMapping.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
      });
      return mapping?.salesTaxAccount || null;
    } catch (error) {
      console.error('Error getting tax account ID:', error);
      return null;
    }
  };

  Invoice.prototype.getDiscountAccountId = async function() {
    const { AccountMapping } = sequelize.models;
    try {
      const mapping = await AccountMapping.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
      });
      return mapping?.discountAccount || null;
    } catch (error) {
      console.error('Error getting discount account ID:', error);
      return null;
    }
  };

  // Class methods
  Invoice.findByInvoiceNumber = function(invoiceNumber) {
    return this.findOne({ where: { invoiceNumber } });
  };

  Invoice.findOverdue = function() {
    return this.findAll({
      where: {
        dueDate: {
          [sequelize.Op.lt]: new Date().toISOString().split('T')[0]
        },
        status: {
          [sequelize.Op.ne]: 'paid'
        }
      }
    });
  };

  Invoice.findByCustomer = function(customerId) {
    return this.findAll({
      where: { customerId },
      order: [['date', 'DESC']]
    });
  };

  Invoice.findOutstanding = function(customerId = null) {
    const whereClause = {
      outstandingAmount: {
        [sequelize.Op.gt]: 0.01
      },
      status: {
        [sequelize.Op.in]: ['unpaid', 'partially_paid']
      }
    };

    if (customerId) {
      whereClause.customerId = customerId;
    }

    return this.findAll({
      where: whereClause,
      order: [['date', 'ASC']] // FIFO order
    });
  };

  Invoice.findByAccount = function(accountId) {
    return this.findAll({
      where: { accountId },
      order: [['date', 'DESC']]
    });
  };

  // Associations
  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Invoice.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    Invoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });

    // Invoice linking associations
    Invoice.hasMany(models.InvoicePayment, { foreignKey: 'invoiceId', as: 'paymentAllocations' });
    Invoice.hasMany(models.InvoiceReceipt, { foreignKey: 'invoiceId', as: 'receiptAllocations' });
  };

  return Invoice;
};

