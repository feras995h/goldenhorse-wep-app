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
      field: 'invoice_number'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'total_amount'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    },
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'shipment_id',
      references: {
        model: 'shipments',
        key: 'id'
      }
    },
    outstandingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'outstanding_amount'
    }
  }, {
    tableName: 'shipping_invoices',
    underscored: false,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (invoice) => {
        // Calculate outstanding amount if not set
        if (invoice.outstandingAmount === undefined || invoice.outstandingAmount === null) {
          invoice.outstandingAmount = invoice.totalAmount || 0;
        }
      },
      beforeUpdate: (invoice) => {
        // You can add custom logic here if needed
      }
    }
  ,
    hooks: {
      afterCreate: async (invoice, options) => {
        if (!invoice.totalAmount || parseFloat(invoice.totalAmount) <= 0) return;
        // Attempt to auto-post accounting entries; fail if accounting engine fails to avoid silent inconsistencies
        try {
          if (typeof invoice.createJournalEntryAndAffectBalance === 'function') {
            await invoice.createJournalEntryAndAffectBalance(invoice.createdBy, { transaction: options.transaction });
          }
        } catch (e) {
          throw e;
        }
      }
    }
  });

  // Associations
  ShippingInvoice.associate = (models) => {
    ShippingInvoice.belongsTo(models.Customer, { 
      foreignKey: { name: 'customerId', field: 'customer_id' }, 
      as: 'customer' 
    });
    ShippingInvoice.belongsTo(models.Shipment, { 
      foreignKey: { name: 'shipmentId', field: 'shipment_id' }, 
      as: 'shipment' 
    });
  };

  // Instance method to create JE for shipping invoice
  ShippingInvoice.prototype.createJournalEntryAndAffectBalance = async function(userId, options = {}) {
    const t = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;
    try {
      const { JournalEntry, JournalEntryDetail, GLEntry, AccountMapping, Account } = sequelize.models;
      const total = parseFloat(this.totalAmount || 0);
      if (!userId) throw new Error('User ID is required for shipping invoice accounting');
      if (!this.invoiceNumber) throw new Error('Invoice number is required');
      if (total <= 0) throw new Error('Shipping invoice total must be greater than zero');

      // Avoid duplicates
      const existing = await JournalEntry.findOne({ where: { type: 'shipping_invoice', voucherNo: this.invoiceNumber }, transaction: t });
      if (existing) return existing;

      // Enforce posting within open accounting periods if enabled
      const enforcePeriods = String(process.env.ACCOUNTING_ENFORCE_PERIODS || 'false').toLowerCase() === 'true';
      if (enforcePeriods) {
        const { AccountingPeriod } = sequelize.models;
        if (!AccountingPeriod) {
          throw new Error('Accounting periods model not available while enforcement is enabled');
        }
        const Op = sequelize.Sequelize.Op;
        const postDate = this.date;
        if (!postDate) {
          throw new Error('Posting date is required to validate accounting period');
        }
        const openPeriod = await AccountingPeriod.findOne({
          where: {
            status: 'open',
            startDate: { [Op.lte]: postDate },
            endDate: { [Op.gte]: postDate }
          },
          transaction: t
        });
        if (!openPeriod) {
          throw new Error('لا يمكن الترحيل خارج فترة محاسبية مفتوحة. الرجاء إنشاء/فتح الفترة أولاً.');
        }
      }

      const mapping = await AccountMapping.getActiveMapping();
      if (!mapping) throw new Error('No active account mapping');
      const arId = mapping.accountsReceivableAccount;
      const revenueId = mapping.shippingRevenueAccount || mapping.salesRevenueAccount;
      if (!arId || !revenueId) throw new Error('Missing AR or Revenue account in mapping');

      // Validate accounts
      const accounts = await Account.findAll({ where: { id: { [sequelize.Sequelize.Op.in]: [arId, revenueId] } }, transaction: t });
      if (accounts.length < 2) throw new Error('Required accounts not found for shipping invoice');

      // Create JE
      const last = await JournalEntry.findOne({ order: [['createdAt', 'DESC']], transaction: t });
      const next = last ? (parseInt(String(last.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `SHN-${String(next).padStart(6, '0')}`;
      const je = await JournalEntry.create({
        entryNumber,
        date: this.date || new Date(),
        description: `Shipping Invoice ${this.invoiceNumber}`,
        totalDebit: total,
        totalCredit: total,
        status: 'posted',
        type: 'shipping_invoice',
        voucherType: 'Shipping Invoice',
        voucherNo: this.invoiceNumber,
        currency: 'LYD',
        exchangeRate: 1,
        createdBy: userId
      }, { transaction: t });

      const details = [
        { journalEntryId: je.id, accountId: arId, debit: total, credit: 0, description: `AR - Shipping ${this.invoiceNumber}` },
        { journalEntryId: je.id, accountId: revenueId, debit: 0, credit: total, description: `Revenue - Shipping ${this.invoiceNumber}` }
      ];
      await JournalEntryDetail.bulkCreate(details, { transaction: t });

      // GL
      const gls = details.map(d => ({
        postingDate: this.date || new Date(), accountId: d.accountId, debit: d.debit, credit: d.credit,
        voucherType: 'Shipping Invoice', voucherNo: this.invoiceNumber, journalEntryId: je.id, remarks: d.description,
        currency: 'LYD', exchangeRate: 1, createdBy: userId, postingStatus: 'posted'
      }));
      await GLEntry.bulkCreate(gls, { transaction: t });

      // Update balances
      for (const d of details) {
        const acc = await Account.findByPk(d.accountId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!acc) throw new Error(`Account not found: ${d.accountId}`);
        const cur = parseFloat(acc.balance || 0);
        const newBal = acc.nature === 'debit' ? (cur + d.debit - d.credit) : (cur + d.credit - d.debit);
        await acc.update({ balance: newBal, updatedAt: new Date() }, { transaction: t });
      }

      await this.update({ journalEntryId: je.id }, { transaction: t });
      if (shouldCommit) await t.commit();
      return je;
    } catch (error) {
      if (shouldCommit) await t.rollback();
      throw error;
    }
  };

  return ShippingInvoice;
};
