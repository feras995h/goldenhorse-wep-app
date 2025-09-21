import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SalesInvoice = sequelize.define('SalesInvoice', {
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
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100.00
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
    taxPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100.00
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
      defaultValue: 'LYD'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.0000,
      validate: {
        min: 0.0001,
        max: 999999.9999
      },
      comment: 'Exchange rate to LYD'
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'overpaid'),
      defaultValue: 'unpaid'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'account_credit'),
      allowNull: true
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Payment reference number or transaction ID'
    },
    paymentTerms: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 365
      },
      comment: 'Payment terms in days'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes not visible to customer'
    },
    terms: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Invoice terms and conditions'
    },
    // Sales specific fields
    salesPerson: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Sales person responsible for this sale'
    },
    salesChannel: {
      type: DataTypes.ENUM('direct', 'online', 'phone', 'email', 'referral'),
      defaultValue: 'direct'
    },
    deliveryMethod: {
      type: DataTypes.ENUM('pickup', 'delivery', 'shipping'),
      defaultValue: 'pickup'
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
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
    tableName: 'sales_invoices',
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
        fields: ['paymentStatus']
      },
      {
        fields: ['salesPerson']
      },
      {
        fields: ['outstandingAmount']
      }
    ],
    hooks: {
      beforeCreate: async (invoice) => {
        // Generate invoice number if not provided
        if (!invoice.invoiceNumber) {
          const lastInvoice = await SalesInvoice.findOne({
            order: [['invoiceNumber', 'DESC']]
          });

          let nextNumber = 1;
          if (lastInvoice && lastInvoice.invoiceNumber) {
            const match = lastInvoice.invoiceNumber.match(/SL(\d+)$/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }

          invoice.invoiceNumber = `SL${String(nextNumber).padStart(6, '0')}`;
        }

        // Calculate discount amount from percentage if not provided
        if (!invoice.discountAmount && invoice.discountPercent > 0) {
          invoice.discountAmount = (invoice.subtotal * invoice.discountPercent) / 100;
        }

        // Calculate tax amount from percentage if not provided
        if (!invoice.taxAmount && invoice.taxPercent > 0) {
          const taxableAmount = invoice.subtotal - (invoice.discountAmount || 0);
          invoice.taxAmount = (taxableAmount * invoice.taxPercent) / 100;
        }

        // Calculate total
        invoice.total = (invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxAmount || 0) + (invoice.deliveryFee || 0);
        
        // Calculate outstanding amount
        const total = parseFloat(invoice.total || 0);
        const paidAmount = parseFloat(invoice.paidAmount || 0);
        invoice.outstandingAmount = Math.max(0, total - paidAmount);
      },
      beforeUpdate: (invoice) => {
        // Recalculate discount amount if percentage changed
        if (invoice.changed('discountPercent') || invoice.changed('subtotal')) {
          if (invoice.discountPercent > 0) {
            invoice.discountAmount = (invoice.subtotal * invoice.discountPercent) / 100;
          }
        }

        // Recalculate tax amount if percentage changed
        if (invoice.changed('taxPercent') || invoice.changed('subtotal') || invoice.changed('discountAmount')) {
          if (invoice.taxPercent > 0) {
            const taxableAmount = invoice.subtotal - (invoice.discountAmount || 0);
            invoice.taxAmount = (taxableAmount * invoice.taxPercent) / 100;
          }
        }

        // Recalculate total if any component changed
        if (invoice.changed('subtotal') || invoice.changed('discountAmount') || 
            invoice.changed('taxAmount') || invoice.changed('deliveryFee')) {
          invoice.total = (invoice.subtotal || 0) - (invoice.discountAmount || 0) + 
                         (invoice.taxAmount || 0) + (invoice.deliveryFee || 0);
        }

        // Update payment status based on paid amount
        if (invoice.changed('paidAmount') || invoice.changed('total')) {
          const paidAmount = parseFloat(invoice.paidAmount || 0);
          const total = parseFloat(invoice.total || 0);
          
          if (paidAmount === 0) {
            invoice.paymentStatus = 'unpaid';
          } else if (paidAmount < total) {
            invoice.paymentStatus = 'partial';
          } else if (paidAmount === total) {
            invoice.paymentStatus = 'paid';
          } else {
            invoice.paymentStatus = 'overpaid';
          }
        }

        // Calculate outstanding amount
        if (invoice.changed('total') || invoice.changed('paidAmount')) {
          const total = parseFloat(invoice.total || 0);
          const paidAmount = parseFloat(invoice.paidAmount || 0);
          invoice.outstandingAmount = Math.max(0, total - paidAmount);
        }
      }
    }
  });

  // Instance methods
  SalesInvoice.prototype.getBalance = function() {
    return parseFloat(this.total) - parseFloat(this.paidAmount);
  };

  SalesInvoice.prototype.isOverdue = function() {
    return this.dueDate < new Date().toISOString().split('T')[0] && this.paymentStatus !== 'paid';
  };

  SalesInvoice.prototype.getDaysOverdue = function() {
    if (!this.isOverdue()) return 0;
    const dueDate = new Date(this.dueDate);
    const today = new Date();
    return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  };

  SalesInvoice.prototype.isFullyPaid = function() {
    return this.getBalance() <= 0;
  };

  // Class methods
  SalesInvoice.findByInvoiceNumber = function(invoiceNumber) {
    return this.findOne({ where: { invoiceNumber } });
  };

  SalesInvoice.findOverdue = function() {
    return this.findAll({
      where: {
        dueDate: {
          [sequelize.Op.lt]: new Date().toISOString().split('T')[0]
        },
        paymentStatus: {
          [sequelize.Op.ne]: 'paid'
        }
      }
    });
  };

  SalesInvoice.findByCustomer = function(customerId) {
    return this.findAll({
      where: { customerId },
      order: [['date', 'DESC']]
    });
  };

  SalesInvoice.findBySalesPerson = function(salesPerson) {
    return this.findAll({
      where: { salesPerson },
      order: [['date', 'DESC']]
    });
  };

  // Associations
  SalesInvoice.associate = (models) => {
    SalesInvoice.belongsTo(models.Customer, { 
      foreignKey: 'customerId', 
      as: 'customer' 
    });
    SalesInvoice.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator' 
    });
    SalesInvoice.hasMany(models.SalesInvoiceItem, { 
      foreignKey: 'invoiceId', 
      as: 'items' 
    });
  };

  // Instance methods
  SalesInvoice.prototype.createJournalEntryAndAffectBalance = async function(userId, options = {}) {
    const t = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;

    try {
      const { JournalEntry, JournalEntryDetail, GLEntry, AccountMapping, Customer } = sequelize.models;

      // Get active account mapping
      const mapping = await AccountMapping.getActiveMapping();
      if (!mapping) throw new Error('No active account mapping configured');
      mapping.validateMapping();

      // Determine accounts
      const receivableAccountId = mapping.accountsReceivableAccount;
      const salesRevenueAccountId = mapping.salesRevenueAccount;
      const taxAccountId = mapping.salesTaxAccount;
      const discountAccountId = mapping.discountAccount;

      if (!receivableAccountId || !salesRevenueAccountId) {
        throw new Error('Required accounts for Sales Invoice are not configured');
      }

      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({ order: [['createdAt', 'DESC']] });
      const nextNumber = lastEntry ? (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `SIN-${String(nextNumber).padStart(6, '0')}`;

      const description = `Sales invoice ${this.invoiceNumber}${this.notes ? ' - ' + this.notes : ''}`;

      const total = parseFloat(this.total || 0);
      const subtotal = parseFloat(this.subtotal || 0);
      const tax = parseFloat(this.taxAmount || 0);
      const discount = parseFloat(this.discountAmount || 0);

      // Create JE header
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description,
        totalDebit: total,
        totalCredit: total,
        status: 'posted',
        type: 'sales_invoice',
        createdBy: userId
      }, { transaction: t });

      const details = [];

      // 1. Debit: Accounts Receivable
      details.push({
        journalEntryId: journalEntry.id,
        accountId: receivableAccountId,
        debit: total,
        credit: 0,
        description: `Sales invoice ${this.invoiceNumber} - ${this.customer?.name || 'Customer'}`
      });

      // 2. Credit: Sales Revenue (subtotal)
      details.push({
        journalEntryId: journalEntry.id,
        accountId: salesRevenueAccountId,
        debit: 0,
        credit: subtotal,
        description: `Sales revenue - ${this.invoiceNumber}`
      });

      // 3. Credit: Sales Tax (if applicable)
      if (tax > 0 && taxAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: taxAccountId,
          debit: 0,
          credit: tax,
          description: `Sales tax - ${this.invoiceNumber}`
        });
      }

      // 4. Debit: Sales Discount (if applicable)
      if (discount > 0 && discountAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: discountAccountId,
          debit: discount,
          credit: 0,
          description: `Sales discount - ${this.invoiceNumber}`
        });
      }

      await JournalEntryDetail.bulkCreate(details, { transaction: t });

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
        currency: this.currency || 'LYD',
        exchangeRate: this.exchangeRate || 1.0,
        createdBy: userId
      }));

      await GLEntry.bulkCreate(glEntries, { transaction: t });

      // Update account balances
      for (const detail of details) {
        const account = await Account.findByPk(detail.accountId, { transaction: t, lock: t.LOCK.UPDATE });
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

  return SalesInvoice;
};
