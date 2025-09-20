import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PaymentVoucher = sequelize.define('PaymentVoucher', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    voucherNumber: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'posted'
    }
  }, {
    tableName: 'payment_vouchers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['supplierId'] },
      { fields: ['voucherNumber'] }
    ]
  });

  PaymentVoucher.associate = (models) => {
    PaymentVoucher.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    PaymentVoucher.hasMany(models.PurchaseInvoicePayment, { foreignKey: 'paymentVoucherId', as: 'invoicePayments' });
  };

  return PaymentVoucher;
};
