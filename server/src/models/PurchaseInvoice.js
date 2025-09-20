import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PurchaseInvoice = sequelize.define('PurchaseInvoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'رقم فاتورة الشراء'
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'معرف المورد'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'تاريخ الفاتورة'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'تاريخ الاستحقاق'
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'المجموع الفرعي'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'مبلغ الضريبة'
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'المجموع الكلي'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'المبلغ المدفوع'
  },
  outstandingAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'المبلغ المتبقي'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
    defaultValue: 'pending',
    comment: 'حالة الفاتورة'
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
  accountId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'معرف الحساب'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'ملاحظات'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'أنشأ بواسطة'
  }
  }, {
    tableName: 'purchase_invoices',
    timestamps: true,
    comment: 'جدول فواتير الشراء'
  });

  return PurchaseInvoice;
};