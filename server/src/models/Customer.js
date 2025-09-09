import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Customer = sequelize.define('Customer', {
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
    taxNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },


    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: -999999999999.99,
        max: 999999999999.99
      }
    },

    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual'
    },
    paymentTerms: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 365
      }
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      defaultValue: 'LYD'
    },



  }, {
    tableName: 'customers',
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
        fields: ['email']
      }
    ]
  });

  // Instance methods
  Customer.prototype.getBalance = function() {
    return parseFloat(this.balance) || 0;
  };

  Customer.prototype.isOverCreditLimit = function() {
    return this.getBalance() > this.creditLimit;
  };

  Customer.prototype.getDaysOverdue = function() {
    // This would need to be implemented based on invoice due dates
    return 0;
  };

  // Class methods
  Customer.findByCode = function(code) {
    return this.findOne({ where: { code } });
  };

  Customer.findActive = function() {
    return this.findAll({ where: { isActive: true } });
  };

  Customer.findOverCreditLimit = function() {
    return this.findAll({
      where: {
        isActive: true,
        balance: {
          [sequelize.Op.gt]: sequelize.col('creditLimit')
        }
      }
    });
  };

  // Associations
  Customer.associate = (models) => {
    Customer.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    Customer.hasMany(models.Invoice, { foreignKey: 'customerId', as: 'invoices' });
    Customer.hasMany(models.Payment, { foreignKey: 'customerId', as: 'payments' });
  };

  return Customer;
};

