import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PayrollEntry = sequelize.define('PayrollEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entryNumber: {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
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
      type: DataTypes.ENUM('draft', 'approved', 'paid', 'cancelled'),
      defaultValue: 'draft'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },

  }, {
    tableName: 'payroll_entries',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['entryNumber']
      },
      {
        fields: ['employeeId']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['employeeId', 'date']
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
        // Add any update logic here if needed
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

  PayrollEntry.prototype.approve = function() {
    this.status = 'approved';
    return this.save();
  };

  PayrollEntry.prototype.pay = function() {
    this.status = 'paid';
    return this.save();
  };

  // Class methods
  PayrollEntry.findByEntryNumber = function(entryNumber) {
    return this.findOne({ where: { entryNumber } });
  };

  PayrollEntry.findByEmployee = function(employeeId) {
    return this.findAll({
      where: { employeeId },
      order: [['date', 'DESC']]
    });
  };

  PayrollEntry.findByDate = function(date) {
    return this.findAll({ where: { date } });
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
  };

  return PayrollEntry;
};

