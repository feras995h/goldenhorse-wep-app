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
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
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
      }
    ],
    hooks: {
      beforeCreate: (invoice) => {
        // Calculate total if not provided
        if (!invoice.total) {
          invoice.total = invoice.subtotal + invoice.taxAmount;
        }
        // Calculate balance if not provided
        if (!invoice.balance) {
          invoice.balance = invoice.total - invoice.paidAmount;
        }
      },
      beforeUpdate: (invoice) => {
        // Recalculate total if subtotal or taxAmount changed
        if (invoice.changed('subtotal') || invoice.changed('taxAmount')) {
          invoice.total = invoice.subtotal + invoice.taxAmount;
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
    return this.balance <= 0;
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

  // Associations
  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return Invoice;
};

