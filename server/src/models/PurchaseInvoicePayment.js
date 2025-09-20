import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PurchaseInvoicePayment = sequelize.define('PurchaseInvoicePayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'معرف فاتورة الشراء'
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'معرف الدفعة'
  },
  allocatedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'المبلغ المخصص'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'LYD',
    comment: 'العملة'
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 1,
    comment: 'سعر الصرف'
  },
  allocationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'تاريخ التخصيص'
  },
  settlementOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'ترتيب التسوية'
  },
  isFullySettled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'هل تم التسوية بالكامل'
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'المبلغ المتبقي'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'ملاحظات'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'أنشأ بواسطة'
  },
  isReversed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'هل تم عكس التخصيص'
  },
  reversedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'تاريخ العكس'
  },
  reversedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'عكس بواسطة'
  },
  reversalReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'سبب العكس'
  }
  }, {
    tableName: 'purchase_invoice_payments',
    timestamps: true,
    comment: 'جدول تخصيص دفعات فواتير الشراء'
  });

  return PurchaseInvoicePayment;
};