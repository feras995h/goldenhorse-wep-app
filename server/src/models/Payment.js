import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    paymentNumber: {
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
    date: {
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
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'failed'),
      defaultValue: 'pending'
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },

  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['paymentNumber']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentMethod']
      }
    ],
    hooks: {
      beforeUpdate: (payment) => {
        // Add any update logic here if needed
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

  Payment.prototype.complete = function() {
    this.status = 'completed';
    return this.save();
  };

  // Class methods
  Payment.findByPaymentNumber = function(paymentNumber) {
    return this.findOne({ where: { paymentNumber } });
  };

  Payment.findByCustomer = function(customerId) {
    return this.findAll({
      where: { customerId },
      order: [['date', 'DESC']]
    });
  };

  Payment.findCompleted = function() {
    return this.findAll({ where: { status: 'completed' } });
  };

  Payment.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        date: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['date', 'ASC']]
    });
  };

  // Associations
  Payment.associate = (models) => {
    Payment.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return Payment;
};

