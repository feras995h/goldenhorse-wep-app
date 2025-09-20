import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SalesReturn = sequelize.define('SalesReturn', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    returnNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'customers', key: 'id' }
    },
    originalInvoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'invoices', key: 'id' }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      defaultValue: 'posted'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'sales_returns',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { unique: true, fields: ['returnNumber'] },
      { fields: ['customerId'] },
      { fields: ['originalInvoiceId'] },
      { fields: ['date'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeValidate: async (sr) => {
        // Auto-generate return number SRN-000001
        if (!sr.returnNumber) {
          const last = await SalesReturn.findOne({
            order: [[sequelize.literal("CAST(SUBSTRING(returnNumber, 5) AS INTEGER)"), 'DESC']]
          });
          let next = 1;
          if (last && last.returnNumber) {
            const n = parseInt(String(last.returnNumber).slice(4), 10);
            if (!isNaN(n)) next = n + 1;
          }
          sr.returnNumber = `SRN-${String(next).padStart(6, '0')}`;
        }
        // Ensure total is subtotal + tax if not provided or inconsistent
        if (sr.total === null || sr.total === undefined || Number(sr.total) === 0) {
          const subtotal = parseFloat(sr.subtotal || 0);
          const tax = parseFloat(sr.taxAmount || 0);
          sr.total = (subtotal + tax).toFixed(2);
        }
      }
    }
  });

  // Instance methods
  SalesReturn.prototype.createJournalEntryAndAffectBalance = async function(userId, options = {}) {
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
      // Use discountAccount as Sales Returns (contra revenue) if available, else fallback to salesRevenueAccount
      const salesReturnsAccountId = mapping.discountAccount || mapping.salesRevenueAccount;
      const taxAccountId = mapping.salesTaxAccount; // reverse tax if present

      if (!receivableAccountId || !salesReturnsAccountId) {
        throw new Error('Required accounts for Sales Return are not configured');
      }

      // Generate journal entry number
      const lastEntry = await JournalEntry.findOne({ order: [['createdAt', 'DESC']] });
      const nextNumber = lastEntry ? (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `SRN-${String(nextNumber).padStart(6, '0')}`;

      const description = `Sales return ${this.returnNumber}${this.reason ? ' - ' + this.reason : ''}`;

      const total = parseFloat(this.total || 0);
      const subtotal = parseFloat(this.subtotal || 0);
      const tax = parseFloat(this.taxAmount || 0);

      // Create JE header
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description,
        totalDebit: total,
        totalCredit: total,
        status: 'posted',
        type: 'sales_return',
        createdBy: userId
      }, { transaction: t });

      const details = [];
      // Debit Sales Returns (contra revenue): subtotal
      if (subtotal > 0) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: salesReturnsAccountId,
          debit: subtotal,
          credit: 0,
          description: `Sales return - ${this.returnNumber}`
        });
      }
      // Debit Tax (reverse liability): taxAmount
      if (taxAccountId && tax > 0) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: taxAccountId,
          debit: tax,
          credit: 0,
          description: `Sales return tax reversal - ${this.returnNumber}`
        });
      }
      // Credit Accounts Receivable: total
      details.push({
        journalEntryId: journalEntry.id,
        accountId: receivableAccountId,
        debit: 0,
        credit: total,
        description: `AR credit for sales return - ${this.returnNumber}`
      });

      await JournalEntryDetail.bulkCreate(details, { transaction: t });

      // Create GL entries
      const glEntries = details.map(d => ({
        postingDate: this.date,
        accountId: d.accountId,
        debit: d.debit,
        credit: d.credit,
        voucherType: 'Sales Return',
        voucherNo: this.returnNumber,
        journalEntryId: journalEntry.id,
        remarks: d.description,
        currency: 'LYD',
        exchangeRate: 1.0,
        createdBy: userId
      }));
      await GLEntry.bulkCreate(glEntries, { transaction: t });

      // Decrease customer balance (reduce receivable)
      const customer = await Customer.findByPk(this.customerId, { transaction: t, lock: t.LOCK.UPDATE });
      if (customer) {
        const newBalance = parseFloat(customer.balance || 0) - total;
        await customer.update({ balance: newBalance }, { transaction: t });
      }

      if (shouldCommit) await t.commit();
      return journalEntry;
    } catch (err) {
      if (shouldCommit) await t.rollback();
      throw err;
    }
  };

  // Associations
  SalesReturn.associate = (models) => {
    SalesReturn.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    SalesReturn.belongsTo(models.Invoice, { foreignKey: 'originalInvoiceId', as: 'originalInvoice' });
    SalesReturn.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return SalesReturn;
};

