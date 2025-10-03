import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ShippingInvoice = sequelize.define('ShippingInvoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'invoice_number'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'total_amount'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    },
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'shipment_id',
      references: {
        model: 'shipments',
        key: 'id'
      }
    },
    outstandingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'outstanding_amount'
    }
  }, {
    tableName: 'shipping_invoices',
    underscored: false,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (invoice) => {
        // Calculate outstanding amount if not set
        if (invoice.outstandingAmount === undefined || invoice.outstandingAmount === null) {
          invoice.outstandingAmount = invoice.totalAmount || 0;
        }
      },
      beforeUpdate: (invoice) => {
        // You can add custom logic here if needed
      }
    }
  });

  // Associations
  ShippingInvoice.associate = (models) => {
    ShippingInvoice.belongsTo(models.Customer, { 
      foreignKey: { name: 'customerId', field: 'customer_id' }, 
      as: 'customer' 
    });
    ShippingInvoice.belongsTo(models.Shipment, { 
      foreignKey: { name: 'shipmentId', field: 'shipment_id' }, 
      as: 'shipment' 
    });
  };

  return ShippingInvoice;
};
