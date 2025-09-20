import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const InvoiceReceipt = sequelize.define('InvoiceReceipt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    receiptId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'receipts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    allocatedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
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
    allocationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    settlementOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Order of settlement for FIFO processing'
    },
    isFullySettled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this allocation fully settles the invoice'
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Remaining amount on invoice after this allocation'
    },
    notes: {
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
    isReversed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this allocation has been reversed'
    },
    reversedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reversedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reversalReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'invoice_receipts',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['invoiceId']
      },
      {
        fields: ['receiptId']
      },
      {
        fields: ['allocationDate']
      },
      {
        fields: ['settlementOrder']
      },
      {
        fields: ['isFullySettled']
      },
      {
        fields: ['isReversed']
      },
      {
        unique: true,
        fields: ['invoiceId', 'receiptId', 'settlementOrder']
      }
    ],
    hooks: {
      beforeValidate: async (invoiceReceipt) => {
        // Auto-calculate settlement order for FIFO
        if (!invoiceReceipt.settlementOrder) {
          const lastAllocation = await InvoiceReceipt.findOne({
            where: { invoiceId: invoiceReceipt.invoiceId },
            order: [['settlementOrder', 'DESC']]
          });
          invoiceReceipt.settlementOrder = lastAllocation ? lastAllocation.settlementOrder + 1 : 1;
        }
      },
      afterCreate: async (invoiceReceipt, options) => {
        // Update invoice outstanding amount
        await invoiceReceipt.updateInvoiceOutstanding({ transaction: options?.transaction });
      },
      afterUpdate: async (invoiceReceipt, options) => {
        // Update invoice outstanding amount if allocation changed
        if (invoiceReceipt.changed('allocatedAmount') || invoiceReceipt.changed('isReversed')) {
          await invoiceReceipt.updateInvoiceOutstanding({ transaction: options?.transaction });
        }
      }
    }
  });

  // Instance methods
  InvoiceReceipt.prototype.updateInvoiceOutstanding = async function(options = {}) {
    const { Invoice } = sequelize.models;
    
    // Calculate total allocated amount for this invoice (from both payments and receipts)
    const totalFromReceipts = await InvoiceReceipt.sum('allocatedAmount', {
      where: {
        invoiceId: this.invoiceId,
        isReversed: false
      }
    , transaction: options.transaction }) || 0;

    const { InvoicePayment } = sequelize.models;
    const totalFromPayments = await InvoicePayment.sum('allocatedAmount', {
      where: {
        invoiceId: this.invoiceId,
        isReversed: false
      }
    , transaction: options.transaction }) || 0;

    const totalAllocated = totalFromReceipts + totalFromPayments;

    // Get invoice and update outstanding amount
    const invoice = await Invoice.findByPk(this.invoiceId, { transaction: options.transaction });
    if (invoice) {
      const outstandingAmount = parseFloat(invoice.total) - totalAllocated;
      await invoice.update({
        paidAmount: totalAllocated,
        outstandingAmount: Math.max(0, outstandingAmount),
        status: outstandingAmount <= 0.01 ? 'paid' :
                totalAllocated > 0 ? 'partially_paid' : 'unpaid'
      }, { transaction: options.transaction });
    }
  };

  InvoiceReceipt.prototype.reverse = async function(userId, reason) {
    await this.update({
      isReversed: true,
      reversedAt: new Date(),
      reversedBy: userId,
      reversalReason: reason
    });
  };

  // Static methods
  InvoiceReceipt.allocateReceiptToInvoices = async function(receiptId, invoiceAllocations, userId, options = {}) {
    const externalTx = options.transaction || null;
    const transaction = externalTx || await sequelize.transaction();

    try {
      const allocations = [];

      for (const allocation of invoiceAllocations) {
        const invoiceReceipt = await InvoiceReceipt.create({
          invoiceId: allocation.invoiceId,
          receiptId: receiptId,
          allocatedAmount: allocation.amount,
          allocationDate: allocation.date || new Date(),
          currency: allocation.currency || 'LYD',
          exchangeRate: allocation.exchangeRate || 1.0,
          notes: allocation.notes,
          createdBy: userId
        }, { transaction });

        allocations.push(invoiceReceipt);
      }

      if (!externalTx) await transaction.commit();
      return allocations;
    } catch (error) {
      if (!externalTx) await transaction.rollback();
      throw error;
    }
  };

  // Associations
  InvoiceReceipt.associate = (models) => {
    InvoiceReceipt.belongsTo(models.Invoice, { 
      foreignKey: 'invoiceId', 
      as: 'invoice' 
    });
    InvoiceReceipt.belongsTo(models.Receipt, { 
      foreignKey: 'receiptId', 
      as: 'receipt' 
    });
    InvoiceReceipt.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator' 
    });
    InvoiceReceipt.belongsTo(models.User, { 
      foreignKey: 'reversedBy', 
      as: 'reverser' 
    });
  };

  return InvoiceReceipt;
};
