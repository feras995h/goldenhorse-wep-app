import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    paymentNo: {
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
    paymentDate: {
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
    tableName: 'payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['paymentNo']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['paymentDate']
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
      beforeUpdate: (payment) => {
        if (payment.changed('status') && payment.status === 'completed') {
          payment.completedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  Payment.prototype.getAmount = function() {
    return parseFloat(this.amount) || 0;
  };

  Payment.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  Payment.prototype.complete = function(completedBy) {
    this.status = 'completed';
    this.completedBy = completedBy;
    this.completedAt = new Date();
    return this.save();
  };

  // Class methods
  Payment.findByPaymentNo = function(paymentNo) {
    return this.findOne({ where: { paymentNo } });
  };

  Payment.findByCustomer = function(customerId) {
    return this.findAll({
      where: { customerId },
      order: [['paymentDate', 'DESC']]
    });
  };

  Payment.findCompleted = function() {
    return this.findAll({ where: { status: 'completed' } });
  };

  Payment.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        paymentDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['paymentDate', 'ASC']]
    });
  };

  // Associations
  Payment.associate = (models) => {
    Payment.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Payment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Payment.belongsTo(models.User, { foreignKey: 'completedBy', as: 'completer' });
  };

  return Payment;
};

