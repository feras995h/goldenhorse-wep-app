import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const EmployeeAdvance = sequelize.define('EmployeeAdvance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
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
    advanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    repaymentPlan: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'custom'),
      defaultValue: 'monthly'
    },
    monthlyAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    totalRepaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD',
      validate: {
        len: [3, 3]
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check'),
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
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'employee_advances',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['employeeId']
      },
      {
        fields: ['advanceDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      }
    ],
    hooks: {
      beforeCreate: (advance) => {
        // Set remaining amount equal to advance amount initially
        advance.remainingAmount = advance.amount;
      },
      beforeUpdate: (advance) => {
        if (advance.changed('status')) {
          if (advance.status === 'approved') {
            advance.approvedAt = new Date();
          } else if (advance.status === 'paid') {
            advance.paidAt = new Date();
          }
        }
        // Update remaining amount
        advance.remainingAmount = advance.amount - advance.totalRepaid;
      }
    }
  });

  // Instance methods
  EmployeeAdvance.prototype.getAmount = function() {
    return parseFloat(this.amount) || 0;
  };

  EmployeeAdvance.prototype.getTotalRepaid = function() {
    return parseFloat(this.totalRepaid) || 0;
  };

  EmployeeAdvance.prototype.getRemainingAmount = function() {
    return parseFloat(this.remainingAmount) || 0;
  };

  EmployeeAdvance.prototype.isFullyRepaid = function() {
    return this.getRemainingAmount() <= 0;
  };

  EmployeeAdvance.prototype.isPaid = function() {
    return this.status === 'paid';
  };

  EmployeeAdvance.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  EmployeeAdvance.prototype.approve = function(approvedBy) {
    this.status = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    return this.save();
  };

  EmployeeAdvance.prototype.pay = function(paidBy) {
    this.status = 'paid';
    this.paidBy = paidBy;
    this.paidAt = new Date();
    return this.save();
  };

  EmployeeAdvance.prototype.addRepayment = function(amount) {
    this.totalRepaid += amount;
    this.remainingAmount = this.amount - this.totalRepaid;
    if (this.remainingAmount <= 0) {
      this.status = 'completed';
    }
    return this.save();
  };

  // Class methods
  EmployeeAdvance.findByEmployee = function(employeeId) {
    return this.findAll({
      where: { employeeId },
      order: [['advanceDate', 'DESC']]
    });
  };

  EmployeeAdvance.findByStatus = function(status) {
    return this.findAll({ where: { status } });
  };

  EmployeeAdvance.findPending = function() {
    return this.findAll({ where: { status: 'pending' } });
  };

  EmployeeAdvance.findApproved = function() {
    return this.findAll({ where: { status: 'approved' } });
  };

  EmployeeAdvance.findPaid = function() {
    return this.findAll({ where: { status: 'paid' } });
  };

  EmployeeAdvance.findCompleted = function() {
    return this.findAll({ where: { status: 'completed' } });
  };

  // Associations
  EmployeeAdvance.associate = (models) => {
    EmployeeAdvance.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    EmployeeAdvance.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    EmployeeAdvance.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
    EmployeeAdvance.belongsTo(models.User, { foreignKey: 'paidBy', as: 'payer' });
  };

  return EmployeeAdvance;
};

