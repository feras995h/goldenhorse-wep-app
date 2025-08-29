import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNo: {
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
    invoiceDate: {
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
    totalAmount: {
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
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    netAmount: {
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
      type: DataTypes.ENUM('draft', 'submitted', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
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
    paymentTerms: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 365
      }
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
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    submittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['invoiceNo']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['invoiceDate']
      },
      {
        fields: ['dueDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      }
    ],
    hooks: {
      beforeCreate: (invoice) => {
        // Calculate net amount if not provided
        if (!invoice.netAmount) {
          invoice.netAmount = invoice.totalAmount + invoice.taxAmount - invoice.discountAmount;
        }
      },
      beforeUpdate: (invoice) => {
        if (invoice.changed('status') && invoice.status === 'submitted') {
          invoice.submittedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  Invoice.prototype.getBalance = function() {
    return parseFloat(this.netAmount) - parseFloat(this.paidAmount);
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
    return this.getBalance() <= 0;
  };

  // Class methods
  Invoice.findByInvoiceNo = function(invoiceNo) {
    return this.findOne({ where: { invoiceNo } });
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
      order: [['invoiceDate', 'DESC']]
    });
  };

  // Associations
  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Invoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Invoice.belongsTo(models.User, { foreignKey: 'submittedBy', as: 'submitter' });
  };

  return Invoice;
};

