import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const EmployeeAdvance = sequelize.define('EmployeeAdvance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    advanceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    purpose: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    repaymentSchedule: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },

    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'employee_advances',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['advanceNumber']
      },
      {
        fields: ['employeeId']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      }
    ],
    hooks: {
      beforeCreate: (advance) => {
        // Add any create logic here if needed
      },
      beforeUpdate: (advance) => {
        // Add any update logic here if needed
      }
    }
  });

  // Instance methods
  EmployeeAdvance.prototype.getAmount = function() {
    return parseFloat(this.amount) || 0;
  };



  EmployeeAdvance.prototype.isPaid = function() {
    return this.status === 'paid';
  };

  EmployeeAdvance.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  EmployeeAdvance.prototype.approve = function() {
    this.status = 'approved';
    return this.save();
  };

  EmployeeAdvance.prototype.pay = function() {
    this.status = 'paid';
    return this.save();
  };

  // Class methods
  EmployeeAdvance.findByAdvanceNumber = function(advanceNumber) {
    return this.findOne({ where: { advanceNumber } });
  };

  EmployeeAdvance.findByEmployee = function(employeeId) {
    return this.findAll({
      where: { employeeId },
      order: [['date', 'DESC']]
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
    EmployeeAdvance.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
  };

  return EmployeeAdvance;
};

