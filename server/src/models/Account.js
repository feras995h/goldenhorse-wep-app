import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Account = sequelize.define('Account', {
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
    type: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false
    },
    rootType: {
      type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
      allowNull: false
    },
    reportType: {
      type: DataTypes.ENUM('Balance Sheet', 'Profit and Loss'),
      allowNull: false
    },
    accountCategory: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10
      }
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    freezeAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: -999999999999.99,
        max: 999999999999.99
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD',
      validate: {
        len: [3, 3]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accountType: {
      type: DataTypes.ENUM('main', 'sub'),
      allowNull: false,
      defaultValue: 'main'
    },
    nature: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
      defaultValue: 'debit'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isSystemAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isMonitored: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this account is being monitored for changes'
    }
  }, {
    tableName: 'accounts',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['type']
      },
      {
        fields: ['parentId']
      },
      {
        fields: ['isGroup']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isMonitored']
      }
    ]
  });

  // Instance methods
  Account.prototype.getBalance = function() {
    return parseFloat(this.balance) || 0;
  };

  Account.prototype.isDebitBalance = function() {
    return ['asset', 'expense'].includes(this.type);
  };

  Account.prototype.isCreditBalance = function() {
    return ['liability', 'equity', 'revenue'].includes(this.type);
  };

  // Class methods
  Account.findByCode = function(code) {
    return this.findOne({ where: { code } });
  };

  Account.findActive = function() {
    return this.findAll({ where: { isActive: true } });
  };

  Account.findGroups = function() {
    return this.findAll({ where: { isGroup: true } });
  };

  Account.findLedgers = function() {
    return this.findAll({ where: { isGroup: false } });
  };

  Account.findByType = function(type) {
    return this.findAll({ where: { type } });
  };

  // Associations
  Account.associate = (models) => {
    // Self-referencing association for parent-child accounts
    Account.belongsTo(Account, { as: 'parent', foreignKey: 'parentId' });
    Account.hasMany(Account, { as: 'children', foreignKey: 'parentId' });
    
    // Association with GL Entries
    Account.hasMany(models.GLEntry, { foreignKey: 'accountId', as: 'glEntries' });
  };

  return Account;
};

