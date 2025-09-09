import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Supplier = sequelize.define('Supplier', {
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

  }, {
    tableName: 'suppliers',
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
  Supplier.prototype.getBalance = function() {
    return parseFloat(this.balance) || 0;
  };

  // Class methods
  Supplier.findByCode = function(code) {
    return this.findOne({ where: { code } });
  };

  Supplier.findActive = function() {
    return this.findAll({ where: { isActive: true } });
  };

  // Associations
  Supplier.associate = (models) => {
    Supplier.hasMany(models.Receipt, { foreignKey: 'supplierId', as: 'receipts' });
  };

  return Supplier;
};

