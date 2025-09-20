import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const InvoicePayment = sequelize.define('InvoicePayment', {
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
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'payments',
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
    tableName: 'invoice_payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['invoiceId']
      },
      {
        fields: ['paymentId']
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
        fields: ['invoiceId', 'paymentId', 'settlementOrder']
      }
    ],
    hooks: {
      beforeValidate: async (invoicePayment) => {
        // Auto-calculate settlement order for FIFO
        if (!invoicePayment.settlementOrder) {
          const lastAllocation = await InvoicePayment.findOne({
            where: { invoiceId: invoicePayment.invoiceId },
            order: [['settlementOrder', 'DESC']]
          });
          invoicePayment.settlementOrder = lastAllocation ? lastAllocation.settlementOrder + 1 : 1;
        }
      },
      afterCreate: async (invoicePayment, options) => {
        // Update invoice outstanding amount
        await invoicePayment.updateInvoiceOutstanding({ transaction: options?.transaction });
      },
      afterUpdate: async (invoicePayment, options) => {
        // Update invoice outstanding amount if allocation changed
        if (invoicePayment.changed('allocatedAmount') || invoicePayment.changed('isReversed')) {
          await invoicePayment.updateInvoiceOutstanding({ transaction: options?.transaction });
        }
      }
    }
  });

  // Instance methods
  InvoicePayment.prototype.updateInvoiceOutstanding = async function(options = {}) {
    const { Invoice } = sequelize.models;
    
    // Calculate total allocated amount for this invoice
    const totalAllocated = await InvoicePayment.sum('allocatedAmount', {
      where: {
        invoiceId: this.invoiceId,
        isReversed: false
      }
    , transaction: options.transaction }) || 0;

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

  InvoicePayment.prototype.reverse = async function(userId, reason) {
    await this.update({
      isReversed: true,
      reversedAt: new Date(),
      reversedBy: userId,
      reversalReason: reason
    });
  };

  // Static methods
  InvoicePayment.allocatePaymentToInvoices = async function(paymentId, invoiceAllocations, userId, options = {}) {
    const externalTx = options.transaction || null;
    const transaction = externalTx || await sequelize.transaction();

    try {
      const allocations = [];

      for (const allocation of invoiceAllocations) {
        const invoicePayment = await InvoicePayment.create({
          invoiceId: allocation.invoiceId,
          paymentId: paymentId,
          allocatedAmount: allocation.amount,
          allocationDate: allocation.date || new Date(),
          currency: allocation.currency || 'LYD',
          exchangeRate: allocation.exchangeRate || 1.0,
          notes: allocation.notes,
          createdBy: userId
        }, { transaction });

        allocations.push(invoicePayment);
      }

      if (!externalTx) await transaction.commit();
      return allocations;
    } catch (error) {
      if (!externalTx) await transaction.rollback();
      throw error;
    }
  };

  // Associations
  InvoicePayment.associate = (models) => {
    InvoicePayment.belongsTo(models.Invoice, { 
      foreignKey: 'invoiceId', 
      as: 'invoice' 
    });
    InvoicePayment.belongsTo(models.Payment, { 
      foreignKey: 'paymentId', 
      as: 'payment' 
    });
    InvoicePayment.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator' 
    });
    InvoicePayment.belongsTo(models.User, { 
      foreignKey: 'reversedBy', 
      as: 'reverser' 
    });
  };

  return InvoicePayment;
};
