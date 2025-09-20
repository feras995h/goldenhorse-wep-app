import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SalesInvoicePayment = sequelize.define('SalesInvoicePayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sales_invoices',
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
      validate: { len: [3, 3] }
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 1.000000,
      validate: { min: 0.000001, max: 999999.999999 }
    },
    allocationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: { isDate: true }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    }
  }, {
    tableName: 'sales_invoice_payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['invoiceId'] },
      { fields: ['paymentId'] },
      { fields: ['allocationDate'] },
      { unique: true, fields: ['invoiceId', 'paymentId'] }
    ]
  });

  // Associations
  SalesInvoicePayment.associate = (models) => {
    SalesInvoicePayment.belongsTo(models.SalesInvoice, { foreignKey: 'invoiceId', as: 'invoice' });
    SalesInvoicePayment.belongsTo(models.Payment, { foreignKey: 'paymentId', as: 'payment' });
    SalesInvoicePayment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return SalesInvoicePayment;
};

