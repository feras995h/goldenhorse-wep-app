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
    outstandingAmount: {
      type: DataTypes.DECIMAL(15, 2),
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
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Additional fields from DB
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'invoiceDate'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'totalAmount'
    },
    postedStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'posted_status'
    },
    postedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'posted_at'
    },
    postedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'posted_by'
    },
    documentNo: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'document_no'
    },
    fiscalYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'fiscal_year'
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'can_edit'
    },
    voidReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'void_reason'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'isActive'
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
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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

        // Tax amount should be provided directly
        // if (!invoice.taxAmount && invoice.taxPercent > 0) {
        //   const taxableAmount = invoice.subtotal - (invoice.discountAmount || 0);
        //   invoice.taxAmount = (taxableAmount * invoice.taxPercent) / 100;
        // }

        // Calculate total
        invoice.total = (invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxAmount || 0);
        
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

        // Recalculate tax amount if changed
        // if (invoice.changed('taxPercent') || invoice.changed('subtotal') || invoice.changed('discountAmount')) {
        //   if (invoice.taxPercent > 0) {
        //     const taxableAmount = invoice.subtotal - (invoice.discountAmount || 0);
        //     invoice.taxAmount = (taxableAmount * invoice.taxPercent) / 100;
        //   }
        // }

        // Recalculate total if any component changed
        if (invoice.changed('subtotal') || invoice.changed('discountAmount') || 
            invoice.changed('taxAmount')) {
          invoice.total = (invoice.subtotal || 0) - (invoice.discountAmount || 0) + 
                         (invoice.taxAmount || 0);
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
      },
      // Automatically create accounting entries after creation
      afterCreate: async (invoice, options) => {
        // Automatic and strict: fail the creation if accounting fails
        await invoice.createJournalEntryAndAffectBalance(invoice.createdBy, { transaction: options.transaction });
      },
      // If status changes to a posted/paid-like state and no JE exists, ensure creation
      afterUpdate: async (invoice, options) => {
        const postedStates = ['sent', 'paid'];
        if ((invoice.changed('status') && postedStates.includes(invoice.status)) || invoice.changed('total')) {
          try {
            await invoice.createJournalEntryAndAffectBalance(invoice.createdBy, { transaction: options.transaction });
          } catch (e) {
            // Strict policy: rethrow to prevent silent inconsistency
            throw e;
          }
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
      foreignKey: { name: 'customerId', field: 'customer_id' }, 
      as: 'customer' 
    });
    SalesInvoice.belongsTo(models.User, { 
      foreignKey: { name: 'createdBy', field: 'created_by' }, 
      as: 'creator' 
    });
    SalesInvoice.hasMany(models.SalesInvoiceItem, { 
      foreignKey: { name: 'invoiceId', field: 'invoice_id' }, 
      as: 'items' 
    });
  };

  // Instance methods
  SalesInvoice.prototype.createJournalEntryAndAffectBalance = async function(userId, options = {}) {
    const t = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;
    const force = options.force || false;

    try {
      const { JournalEntry, JournalEntryDetail, GLEntry, AccountMapping, Account } = sequelize.models;

      // Enhanced validation
      if (!userId) {
        throw new Error('User ID is required for journal entry creation');
      }

      if (!this.invoiceNumber) {
        throw new Error('Invoice number is required for journal entry creation');
      }

      // Check for duplicate journal entries (unless forced)
      if (!force) {
        const existingEntry = await JournalEntry.findOne({
          where: {
            type: 'sales_invoice',
            voucherNo: this.invoiceNumber
          },
          transaction: t
        });
        
        if (existingEntry) {
          console.log(`⚠️ Journal entry already exists for invoice ${this.invoiceNumber}`);
          return existingEntry;
        }
      }

      // Get active account mapping with enhanced error handling
      const mapping = await AccountMapping.getActiveMapping();
      if (!mapping) {
        throw new Error('No active account mapping configured. Please configure account mapping in Admin > Settings > Accounting.');
      }
      
      // Validate mapping with detailed error messages
      try {
        mapping.validateMapping();
      } catch (validationError) {
        throw new Error(`Account mapping validation failed: ${validationError.message}. Please review your account mapping configuration.`);
      }

      // Enhanced amount validation and calculation
      const total = parseFloat(this.total || 0);
      const subtotal = parseFloat(this.subtotal || 0);
      const tax = parseFloat(this.taxAmount || 0);
      const discount = parseFloat(this.discountAmount || 0);

      if (total <= 0) {
        throw new Error(`Invalid invoice total: ${total}. Invoice total must be greater than zero.`);
      }

      // Validate amount consistency
      const calculatedTotal = subtotal + tax - discount;
      if (Math.abs(calculatedTotal - total) > 0.01) {
        throw new Error(`Amount calculation error: calculated total (${calculatedTotal.toFixed(2)}) does not match invoice total (${total.toFixed(2)})`);
      }

      // Get and validate account IDs
      const receivableAccountId = mapping.accountsReceivableAccount;
      const salesRevenueAccountId = mapping.salesRevenueAccount;
      const taxAccountId = mapping.salesTaxAccount;
      const discountAccountId = mapping.discountAccount;

      if (!receivableAccountId || !salesRevenueAccountId) {
        throw new Error('Critical accounts missing: Accounts Receivable and Sales Revenue accounts must be configured in account mapping.');
      }

      // Verify all required accounts exist
      const requiredAccountIds = [receivableAccountId, salesRevenueAccountId];
      if (tax > 0 && taxAccountId) requiredAccountIds.push(taxAccountId);
      if (discount > 0 && discountAccountId) requiredAccountIds.push(discountAccountId);

      const existingAccounts = await Account.findAll({
        where: { id: { [sequelize.Sequelize.Op.in]: requiredAccountIds } },
        transaction: t
      });

      if (existingAccounts.length !== requiredAccountIds.length) {
        const foundIds = existingAccounts.map(acc => acc.id);
        const missingIds = requiredAccountIds.filter(id => !foundIds.includes(id));
        throw new Error(`Required accounts not found in chart of accounts. Missing account IDs: ${missingIds.join(', ')}`);
      }

      // Generate enhanced journal entry number
      const lastEntry = await JournalEntry.findOne({ 
        order: [['createdAt', 'DESC']], 
        transaction: t 
      });
      const nextNumber = lastEntry ? (parseInt(String(lastEntry.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
      const entryNumber = `SIN-${String(nextNumber).padStart(6, '0')}`;

      const description = `Sales Invoice ${this.invoiceNumber}${this.customer?.name ? ` - ${this.customer.name}` : ''}${this.notes ? ` (${this.notes})` : ''}`;

      // Create enhanced journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber,
        date: this.date,
        description,
        totalDebit: total,
        totalCredit: total,
        status: 'posted',
        type: 'sales_invoice',
        voucherType: 'Sales Invoice',
        voucherNo: this.invoiceNumber,
        currency: this.currency || 'LYD',
        exchangeRate: this.exchangeRate || 1.0,
        createdBy: userId,
        notes: `Auto-generated for sales invoice. Subtotal: ${subtotal}, Tax: ${tax}, Discount: ${discount}`
      }, { transaction: t });

      const details = [];
      let totalDebits = 0;
      let totalCredits = 0;

      // 1. Debit: Accounts Receivable (full invoice amount)
      details.push({
        journalEntryId: journalEntry.id,
        accountId: receivableAccountId,
        debit: total,
        credit: 0,
        description: `Sales invoice ${this.invoiceNumber} - ${this.customer?.name || 'Customer'}`,
        currency: this.currency || 'LYD',
        exchangeRate: this.exchangeRate || 1.0
      });
      totalDebits += total;

      // 2. Credit: Sales Revenue (subtotal)
      details.push({
        journalEntryId: journalEntry.id,
        accountId: salesRevenueAccountId,
        debit: 0,
        credit: subtotal,
        description: `Sales revenue - Invoice ${this.invoiceNumber}`,
        currency: this.currency || 'LYD',
        exchangeRate: this.exchangeRate || 1.0
      });
      totalCredits += subtotal;

      // 3. Credit: Sales Tax (if applicable)
      if (tax > 0 && taxAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: taxAccountId,
          debit: 0,
          credit: tax,
          description: `Sales tax - Invoice ${this.invoiceNumber}`,
          currency: this.currency || 'LYD',
          exchangeRate: this.exchangeRate || 1.0
        });
        totalCredits += tax;
      }

      // 4. Debit: Sales Discount (if applicable)
      if (discount > 0 && discountAccountId) {
        details.push({
          journalEntryId: journalEntry.id,
          accountId: discountAccountId,
          debit: discount,
          credit: 0,
          description: `Sales discount - Invoice ${this.invoiceNumber}`,
          currency: this.currency || 'LYD',
          exchangeRate: this.exchangeRate || 1.0
        });
        totalDebits += discount;
      }

      // Final validation: Double-entry principle
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Double-entry accounting validation failed: Total debits (${totalDebits.toFixed(2)}) must equal total credits (${totalCredits.toFixed(2)})`);
      }

      // Create journal entry details
      await JournalEntryDetail.bulkCreate(details, { transaction: t });

      // Create enhanced GL entries
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
        createdBy: userId,
        postingStatus: 'posted',
        period: new Date(this.date).toISOString().substring(0, 7) // YYYY-MM format
      }));

      await GLEntry.bulkCreate(glEntries, { transaction: t });

      // Enhanced account balance updates with proper nature-based calculation
      const balanceUpdates = [];
      for (const detail of details) {
        const account = await Account.findByPk(detail.accountId, { 
          transaction: t, 
          lock: t.LOCK.UPDATE 
        });
        
        if (!account) {
          throw new Error(`Account not found during balance update: ${detail.accountId}`);
        }

        const currentBalance = parseFloat(account.balance || 0);
        let newBalance;
        
        // Apply balance changes based on account nature (debit/credit)
        if (account.nature === 'debit') {
          // For debit accounts: increase with debits, decrease with credits
          newBalance = currentBalance + detail.debit - detail.credit;
        } else {
          // For credit accounts: increase with credits, decrease with debits  
          newBalance = currentBalance + detail.credit - detail.debit;
        }

        await account.update({ 
          balance: newBalance,
          lastTransactionDate: this.date,
          updatedAt: new Date()
        }, { transaction: t });
        
        balanceUpdates.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountNature: account.nature,
          previousBalance: currentBalance,
          newBalance: newBalance,
          debitAmount: detail.debit,
          creditAmount: detail.credit
        });
      }

      // Store journal entry reference in invoice
      await this.update({ 
        journalEntryId: journalEntry.id,
        accountingStatus: 'posted' 
      }, { transaction: t });

      // Log successful creation with details
      console.log(`✅ Enhanced journal entry created for invoice ${this.invoiceNumber}:`);
      console.log(`   📊 Entry Number: ${entryNumber}`);
      console.log(`   💰 Total Amount: ${total} ${this.currency || 'LYD'}`);
      console.log(`   📋 Details: ${details.length} line items`);
      console.log(`   🏦 Accounts Updated: ${balanceUpdates.length}`);
      console.log(`   ⚖️ Double-Entry Validated: Debits=${totalDebits}, Credits=${totalCredits}`);

      if (shouldCommit) await t.commit();
      
      // Return comprehensive result
      return {
        success: true,
        journalEntry,
        balanceUpdates,
        summary: {
          entryNumber,
          totalDebits,
          totalCredits,
          detailsCount: details.length,
          accountsAffected: balanceUpdates.length,
          currency: this.currency || 'LYD',
          exchangeRate: this.exchangeRate || 1.0
        }
      };
    } catch (error) {
      if (shouldCommit) await t.rollback();
      console.error(`❌ Enhanced accounting engine error for invoice ${this.invoiceNumber}:`, {
        error: error.message,
        stack: error.stack,
        invoiceData: {
          invoiceNumber: this.invoiceNumber,
          total: this.total,
          subtotal: this.subtotal,
          taxAmount: this.taxAmount,
          discountAmount: this.discountAmount,
          currency: this.currency
        }
      });
      throw new Error(`Accounting Engine Failure: ${error.message}`);
    }
  };

  return SalesInvoice;
};
