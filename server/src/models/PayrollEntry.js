import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PayrollEntry = sequelize.define('PayrollEntry', {
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
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2000,
        max: 2100
      }
    },
    basicSalary: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    allowances: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    deductions: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    netSalary: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'calculated', 'approved', 'paid', 'cancelled'),
      defaultValue: 'draft'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD',
      validate: {
        len: [3, 3]
      }
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
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
    tableName: 'payroll_entries',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['employeeId']
      },
      {
        fields: ['month', 'year']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      },
      {
        unique: true,
        fields: ['employeeId', 'month', 'year']
      }
    ],
    hooks: {
      beforeCreate: (entry) => {
        // Calculate net salary if not provided
        if (!entry.netSalary) {
          entry.netSalary = entry.basicSalary + entry.allowances - entry.deductions;
        }
      },
      beforeUpdate: (entry) => {
        if (entry.changed('status')) {
          if (entry.status === 'approved') {
            entry.approvedAt = new Date();
          } else if (entry.status === 'paid') {
            entry.paidAt = new Date();
          }
        }
      }
    }
  });

  // Instance methods
  PayrollEntry.prototype.getNetSalary = function() {
    return parseFloat(this.netSalary) || 0;
  };

  PayrollEntry.prototype.getBasicSalary = function() {
    return parseFloat(this.basicSalary) || 0;
  };

  PayrollEntry.prototype.getAllowances = function() {
    return parseFloat(this.allowances) || 0;
  };

  PayrollEntry.prototype.getDeductions = function() {
    return parseFloat(this.deductions) || 0;
  };

  PayrollEntry.prototype.isPaid = function() {
    return this.status === 'paid';
  };

  PayrollEntry.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  PayrollEntry.prototype.approve = function(approvedBy) {
    this.status = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    return this.save();
  };

  PayrollEntry.prototype.pay = function(paidBy, paymentDate) {
    this.status = 'paid';
    this.paidBy = paidBy;
    this.paidAt = new Date();
    if (paymentDate) {
      this.paymentDate = paymentDate;
    }
    return this.save();
  };

  // Class methods
  PayrollEntry.findByEmployee = function(employeeId) {
    return this.findAll({
      where: { employeeId },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  };

  PayrollEntry.findByMonthYear = function(month, year) {
    return this.findAll({ where: { month, year } });
  };

  PayrollEntry.findByStatus = function(status) {
    return this.findAll({ where: { status } });
  };

  PayrollEntry.findPaid = function() {
    return this.findAll({ where: { status: 'paid' } });
  };

  PayrollEntry.findApproved = function() {
    return this.findAll({ where: { status: 'approved' } });
  };

  // Associations
  PayrollEntry.associate = (models) => {
    PayrollEntry.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    PayrollEntry.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    PayrollEntry.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
    PayrollEntry.belongsTo(models.User, { foreignKey: 'paidBy', as: 'payer' });
  };

  return PayrollEntry;
};

