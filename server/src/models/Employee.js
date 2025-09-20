import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 20]
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    salary: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    bankAccount: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    taxNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergencyPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    branch: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      defaultValue: 'LYD'
    },
    salaryAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    advanceAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    custodyAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: -999999999999.99,
        max: 999999999999.99
      }
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['department']
      },
      {
        fields: ['accountId']
      },
      {
        fields: ['email']
      }
    ]
  });

  // Instance methods
  Employee.prototype.getSalary = function() {
    return parseFloat(this.salary) || 0;
  };

  Employee.prototype.isTerminated = function() {
    return this.terminationDate !== null;
  };

  Employee.prototype.getYearsOfService = function() {
    if (!this.hireDate) return 0;
    const hireDate = new Date(this.hireDate);
    const endDate = this.terminationDate ? new Date(this.terminationDate) : new Date();
    return Math.floor((endDate - hireDate) / (1000 * 60 * 60 * 24 * 365));
  };

  // Class methods
  Employee.findByCode = function(code) {
    return this.findOne({ where: { code } });
  };

  Employee.findActive = function() {
    return this.findAll({ where: { isActive: true } });
  };

  Employee.findByDepartment = function(department) {
    return this.findAll({ where: { department, isActive: true } });
  };

  // Associations
  Employee.associate = (models) => {
    Employee.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    Employee.belongsTo(models.Account, { foreignKey: 'salaryAccountId', as: 'salaryAccount' });
    Employee.belongsTo(models.Account, { foreignKey: 'advanceAccountId', as: 'advanceAccount' });
    Employee.belongsTo(models.Account, { foreignKey: 'custodyAccountId', as: 'custodyAccount' });
    Employee.hasMany(models.PayrollEntry, { foreignKey: 'employeeId', as: 'payrollEntries' });
    Employee.hasMany(models.EmployeeAdvance, { foreignKey: 'employeeId', as: 'advances' });
  };

  return Employee;
};

