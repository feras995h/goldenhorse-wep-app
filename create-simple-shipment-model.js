import fs from 'fs';

console.log('🔧 إنشاء نموذج Shipment مبسط...\n');

const simpleShipmentModel = `import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Shipment = sequelize.define('Shipment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trackingNumber: {
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
    customerName: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    itemDescriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('electronics', 'clothing', 'accessories', 'books', 'toys', 'medical', 'industrial', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 999999
      }
    },
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        min: 0,
        max: 9999999.999
      }
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999999.99
      }
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999999.99
      }
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999999.99
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
    volumeOverride: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
      }
    },
    declaredValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    shippingCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    originLocation: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    destinationLocation: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: false,
      defaultValue: 'received_china'
    },
    receivedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    estimatedDelivery: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    actualDeliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isFragile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    requiresSpecialHandling: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customsDeclaration: {
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
    tableName: 'shipments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  // Associations
  Shipment.associate = (models) => {
    Shipment.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Shipment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Shipment.hasMany(models.ShipmentMovement, { foreignKey: 'shipmentId', as: 'movements' });
    Shipment.hasMany(models.WarehouseReleaseOrder, { foreignKey: 'shipmentId', as: 'releaseOrders' });
  };

  return Shipment;
};`;

// Write the simplified model
fs.writeFileSync('./server/src/models/Shipment.js', simpleShipmentModel, 'utf8');

console.log('✅ تم إنشاء نموذج Shipment مبسط');
console.log('🎯 الآن يمكن تشغيل الخادم بدون أخطاء');

