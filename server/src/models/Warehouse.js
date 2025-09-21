import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Warehouse = sequelize.define('Warehouse', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    internalShipmentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    trackingNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    originCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'China'
    },
    destinationCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Libya'
    },
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: 0.001,
        max: 999999.999
      }
    },
    volume: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
      }
    },
    cargoType: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    arrivalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    departureDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    storageLocation: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('stored', 'shipped', 'delivered', 'returned'),
      allowNull: false,
      defaultValue: 'stored'
    },
    salesInvoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales_invoices',
        key: 'id'
      }
    },
    purchaseInvoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'purchase_invoices',
        key: 'id'
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
    }
  }, {
    tableName: 'warehouse',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (warehouse) => {
        // Generate internal shipment number if not provided
        if (!warehouse.internalShipmentNumber) {
          const lastWarehouse = await Warehouse.findOne({
            order: [['createdAt', 'DESC']]
          });
          const nextNumber = lastWarehouse ? 
            (parseInt(String(lastWarehouse.internalShipmentNumber).replace(/\D/g, ''), 10) + 1) : 1;
          warehouse.internalShipmentNumber = `WH-${String(nextNumber).padStart(6, '0')}`;
        }
      }
    }
  });

  // Associations
  Warehouse.associate = (models) => {
    Warehouse.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Warehouse.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    Warehouse.belongsTo(models.SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'salesInvoice' });
    Warehouse.belongsTo(models.PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'purchaseInvoice' });
    Warehouse.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return Warehouse;
};
