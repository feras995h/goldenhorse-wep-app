import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const WarehouseReleaseOrder = sequelize.define('WarehouseReleaseOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shipments',
        key: 'id'
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
    trackingNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    // Release order details
    releaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: true
      }
    },
    requestedBy: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Name of person requesting the release'
    },
    requestedByPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    authorizedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who authorized the release'
    },
    warehouseLocation: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'المخزن الرئيسي - طرابلس'
    },
    // Item details from shipment
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 999999
      }
    },
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: 0,
        max: 9999999.999
      },
      comment: 'Weight in kilograms'
    },
    volume: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
      },
      comment: 'Volume in cubic centimeters'
    },
    // Release conditions and requirements
    releaseConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special conditions for release (e.g., payment required, documents needed)'
    },
    documentsRequired: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'List of required documents for release'
    },
    documentsReceived: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'List of documents actually received'
    },
    // Payment and fees
    storageFeesAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Storage fees in LYD'
    },
    handlingFeesAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Handling fees in LYD'
    },
    totalFeesAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Total fees in LYD'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'waived'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'account_credit'),
      allowNull: true
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // Status and tracking
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'released', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    releaseExecutedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    releasedToName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Name of person who received the items'
    },
    releasedToPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    releasedToIdNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'ID number of person who received the items'
    },
    // Additional information
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes not visible to customer'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    releasedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who executed the release'
    }
  }, {
    tableName: 'warehouse_release_orders',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (releaseOrder, options) => {
        // Generate order number if not provided
        if (!releaseOrder.orderNumber) {
          try {
            const lastOrder = await releaseOrder.constructor.findOne({
              order: [['orderNumber', 'DESC']],
              transaction: options.transaction
            });

            let nextNumber = 1;
            if (lastOrder && lastOrder.orderNumber) {
              // Extract number from order number (assuming format like "WRO-2024-001")
              const match = lastOrder.orderNumber.match(/\d+$/);
              if (match) {
                nextNumber = parseInt(match[0]) + 1;
              }
            }

            const year = new Date().getFullYear();
            releaseOrder.orderNumber = `WRO-${year}-${String(nextNumber).padStart(3, '0')}`;
          } catch (error) {
            // Fallback to timestamp-based number if query fails
            const timestamp = Date.now().toString().slice(-6);
            const year = new Date().getFullYear();
            releaseOrder.orderNumber = `WRO-${year}-${timestamp}`;
          }
        }

        // Calculate total fees
        releaseOrder.totalFeesAmount =
          parseFloat(releaseOrder.storageFeesAmount || 0) +
          parseFloat(releaseOrder.handlingFeesAmount || 0);
      },
      beforeUpdate: async (releaseOrder) => {
        // Recalculate total fees if individual fees changed
        if (releaseOrder.changed('storageFeesAmount') || releaseOrder.changed('handlingFeesAmount')) {
          releaseOrder.totalFeesAmount = 
            parseFloat(releaseOrder.storageFeesAmount || 0) + 
            parseFloat(releaseOrder.handlingFeesAmount || 0);
        }

        // Set approval date when status changes to approved
        if (releaseOrder.changed('status') && releaseOrder.status === 'approved' && !releaseOrder.approvalDate) {
          releaseOrder.approvalDate = new Date();
        }

        // Set release executed date when status changes to released
        if (releaseOrder.changed('status') && releaseOrder.status === 'released' && !releaseOrder.releaseExecutedDate) {
          releaseOrder.releaseExecutedDate = new Date();
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['orderNumber']
      },
      {
        fields: ['shipmentId']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['trackingNumber']
      },
      {
        fields: ['status']
      },
      {
        fields: ['releaseDate']
      },
      {
        fields: ['paymentStatus']
      },
      {
        fields: ['authorizedBy']
      },
      {
        fields: ['createdBy']
      }
    ]
  });

  // Instance methods
  WarehouseReleaseOrder.prototype.getStatusText = function() {
    const statusTexts = {
      'draft': 'مسودة',
      'pending_approval': 'في انتظار الموافقة',
      'approved': 'معتمد',
      'released': 'تم الصرف',
      'cancelled': 'ملغي'
    };
    return statusTexts[this.status] || this.status;
  };

  WarehouseReleaseOrder.prototype.getPaymentStatusText = function() {
    const paymentStatusTexts = {
      'pending': 'في انتظار الدفع',
      'partial': 'دفع جزئي',
      'paid': 'مدفوع',
      'waived': 'معفي'
    };
    return paymentStatusTexts[this.paymentStatus] || this.paymentStatus;
  };

  WarehouseReleaseOrder.prototype.canBeReleased = function() {
    return this.status === 'approved' && 
           (this.paymentStatus === 'paid' || this.paymentStatus === 'waived');
  };

  WarehouseReleaseOrder.prototype.getDaysInWarehouse = function() {
    const releaseDate = new Date(this.releaseDate);
    const today = new Date();
    const diffTime = Math.abs(today - releaseDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Class methods
  WarehouseReleaseOrder.findByOrderNumber = function(orderNumber) {
    return this.findOne({ where: { orderNumber } });
  };

  WarehouseReleaseOrder.findByStatus = function(status) {
    return this.findAll({ where: { status } });
  };

  WarehouseReleaseOrder.findByShipment = function(shipmentId) {
    return this.findAll({ where: { shipmentId } });
  };

  WarehouseReleaseOrder.findPendingPayment = function() {
    return this.findAll({
      where: {
        paymentStatus: ['pending', 'partial'],
        status: { [sequelize.Op.ne]: 'cancelled' }
      }
    });
  };

  // Associations
  WarehouseReleaseOrder.associate = (models) => {
    WarehouseReleaseOrder.belongsTo(models.Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
    WarehouseReleaseOrder.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    WarehouseReleaseOrder.belongsTo(models.User, { foreignKey: 'authorizedBy', as: 'authorizer' });
    WarehouseReleaseOrder.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    WarehouseReleaseOrder.belongsTo(models.User, { foreignKey: 'releasedBy', as: 'releaser' });
    WarehouseReleaseOrder.hasMany(models.ShipmentMovement, { 
      foreignKey: 'warehouseReleaseOrderId', 
      as: 'movements' 
    });
  };

  return WarehouseReleaseOrder;
};
