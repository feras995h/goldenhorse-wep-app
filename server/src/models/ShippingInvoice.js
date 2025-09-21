import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ShippingInvoice = sequelize.define('ShippingInvoice', {
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
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'shipments',
        key: 'id'
      }
    },
    trackingNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    shippingCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    handlingFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    storageFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    customsClearanceFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    insuranceFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    additionalFees: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
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
      defaultValue: 0.00,
      validate: {
        min: 0,
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
      defaultValue: 'LYD'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.0000,
      validate: {
        min: 0.0001,
        max: 999999.9999
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'overdue'),
      defaultValue: 'unpaid'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'credit_card', 'check', 'other'),
      allowNull: true
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    itemDescriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 999999
      }
    },
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        min: 0,
        max: 9999999.999
      }
    },
    volume: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
      }
    },
    originLocation: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    destinationLocation: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    terms: {
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
    }
  }, {
    tableName: 'shipping_invoices',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: (invoice) => {
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
  ShippingInvoice.associate = (models) => {
    ShippingInvoice.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    ShippingInvoice.belongsTo(models.Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
    ShippingInvoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  // Instance methods
  ShippingInvoice.prototype.createJournalEntryAndAffectBalance = async function(userId, options = {}) {
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
      const shippingRevenueAccountId = mapping.shippingRevenueAccount;
      const taxAccountId = mapping.salesTaxAccount;
      const discountAccountId = mapping.discountAccount;

      if (!receivableAccountId || !shippingRevenueAccountId) {
        throw new Error('Required accounts for Shipping Invoice are not configured');
      }

      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({ order: [['createdAt', 'DESC']] });
      const nextNumber = lastEntry ? (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `SHI-${String(nextNumber).padStart(6, '0')}`;

      const description = `Shipping invoice ${this.invoiceNumber}${this.notes ? ' - ' + this.notes : ''}`;

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
        type: 'shipping_invoice',
        createdBy: userId
      }, { transaction: t });

      const details = [];

      // 1. Debit: Accounts Receivable
      details.push({
        journalEntryId: journalEntry.id,
        accountId: receivableAccountId,
        debit: total,
        credit: 0,
        description: `Shipping invoice ${this.invoiceNumber} - ${this.customer?.name || 'Customer'}`
      });

      // 2. Credit: Shipping Revenue (subtotal)
      details.push({
        journalEntryId: journalEntry.id,
        accountId: shippingRevenueAccountId,
        debit: 0,
        credit: subtotal,
        description: `Shipping revenue - ${this.invoiceNumber}`
      });

      // 3. Credit: Sales Tax (if applicable)
      if (tax > 0 && taxAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: taxAccountId,
          debit: 0,
          credit: tax,
          description: `Shipping tax - ${this.invoiceNumber}`
        });
      }

      // 4. Debit: Shipping Discount (if applicable)
      if (discount > 0 && discountAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: discountAccountId,
          debit: discount,
          credit: 0,
          description: `Shipping discount - ${this.invoiceNumber}`
        });
      }

      await JournalEntryDetail.bulkCreate(details, { transaction: t });

      // Create GL entries
      const glEntries = details.map(detail => ({
        postingDate: this.date,
        accountId: detail.accountId,
        debit: detail.debit,
        credit: detail.credit,
        voucherType: 'Shipping Invoice',
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

  return ShippingInvoice;
};