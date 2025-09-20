import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Optional linkage to a known item code; if not available, use description
    itemCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Product/service code if available (e.g., from SalesInvoiceItem)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Item description (fallback key for movements when no itemCode)'
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'قطعة',
    },
    direction: {
      type: DataTypes.ENUM('in', 'out', 'adjustment'),
      allowNull: false,
      defaultValue: 'out',
    },
    reason: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Reason for movement (e.g., warehouse_release, sales_invoice)'
    },
    referenceType: {
      type: DataTypes.ENUM('warehouse_release', 'sales_invoice', 'sales_return', 'adjustment', 'shipment'),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    warehouseLocation: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Optional foreign keys for richer linking
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'shipments', key: 'id' }
    },
    warehouseReleaseOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'warehouse_release_orders', key: 'id' }
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sales_invoices', key: 'id' }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  }, {
    tableName: 'stock_movements',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['itemCode'] },
      { fields: ['direction'] },
      { fields: ['referenceType'] },
      { fields: ['shipmentId'] },
      { fields: ['warehouseReleaseOrderId'] },
      { fields: ['invoiceId'] },
      { fields: ['date'] },
    ]
  });

  StockMovement.associate = (models) => {
    StockMovement.belongsTo(models.Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
    StockMovement.belongsTo(models.WarehouseReleaseOrder, { foreignKey: 'warehouseReleaseOrderId', as: 'releaseOrder' });
    StockMovement.belongsTo(models.SalesInvoice, { foreignKey: 'invoiceId', as: 'invoice' });
    StockMovement.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return StockMovement;
};

