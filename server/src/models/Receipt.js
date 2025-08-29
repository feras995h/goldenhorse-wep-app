import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Receipt = sequelize.define('Receipt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    receiptNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    receiptDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'other'),
      allowNull: false,
      defaultValue: 'cash'
    },
    referenceNo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bankAccount: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    checkNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'failed'),
      defaultValue: 'pending'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD',
      validate: {
        len: [3, 3]
      }
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 1.000000,
      validate: {
        min: 0.000001,
        max: 999999.999999
      }
    },
    remarks: {
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
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'receipts',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['receiptNo']
      },
      {
        fields: ['supplierId']
      },
      {
        fields: ['receiptDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['paymentMethod']
      }
    ],
    hooks: {
      beforeUpdate: (receipt) => {
        if (receipt.changed('status') && receipt.status === 'completed') {
          receipt.completedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  Receipt.prototype.getAmount = function() {
    return parseFloat(this.amount) || 0;
  };

  Receipt.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  Receipt.prototype.complete = function(completedBy) {
    this.status = 'completed';
    this.completedBy = completedBy;
    this.completedAt = new Date();
    return this.save();
  };

  // Class methods
  Receipt.findByReceiptNo = function(receiptNo) {
    return this.findOne({ where: { receiptNo } });
  };

  Receipt.findBySupplier = function(supplierId) {
    return this.findAll({
      where: { supplierId },
      order: [['receiptDate', 'DESC']]
    });
  };

  Receipt.findCompleted = function() {
    return this.findAll({ where: { status: 'completed' } });
  };

  Receipt.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        receiptDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['receiptDate', 'ASC']]
    });
  };

  // Associations
  Receipt.associate = (models) => {
    Receipt.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    Receipt.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Receipt.belongsTo(models.User, { foreignKey: 'completedBy', as: 'completer' });
  };

  return Receipt;
};

