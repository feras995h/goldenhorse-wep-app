import fs from 'fs';

console.log('🔧 إنشاء نموذج ShippingInvoice مبسط...\n');

const simpleShippingInvoiceModel = `import { DataTypes } from 'sequelize';

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
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'shipments',
        key: 'id'
      }
    },
    trackingNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
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
    handlingFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    storageFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    customsClearanceFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    insuranceFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    additionalFees: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      defaultValue: 'LYD'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.0000,
      validate: {
        min: 0.0001,
        max: 999999.9999
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'overdue'),
      defaultValue: 'unpaid'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'credit_card', 'check', 'other'),
      allowNull: true
    },
    paymentReference: {
      type: DataTypes.STRING(100),
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
    volume: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    terms: {
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
    tableName: 'shipping_invoices',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  // Associations
  ShippingInvoice.associate = (models) => {
    ShippingInvoice.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    ShippingInvoice.belongsTo(models.Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
    ShippingInvoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return ShippingInvoice;
};`;

// Write the simplified model
fs.writeFileSync('./server/src/models/ShippingInvoice.js', simpleShippingInvoiceModel, 'utf8');

console.log('✅ تم إنشاء نموذج ShippingInvoice مبسط');
console.log('🎯 الآن يمكن تشغيل الخادم بدون أخطاء');
