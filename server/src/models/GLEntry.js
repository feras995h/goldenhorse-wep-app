import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const GLEntry = sequelize.define('GLEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    postingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    debit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    credit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    voucherType: {
      type: DataTypes.ENUM(
        'Journal Entry',
        'Sales Invoice',
        'Purchase Invoice',
        'Payment Entry',
        'Receipt Entry',
        'Bank Reconciliation',
        'Asset Purchase',
        'Asset Sale',
        'Depreciation',
        'Payroll Entry'
      ),
      allowNull: false
    },
    voucherNo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'journal_entries',
        key: 'id'
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isCancelled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    }
  }, {
    tableName: 'gl_entries',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['postingDate']
      },
      {
        fields: ['accountId']
      },
      {
        fields: ['voucherType']
      },
      {
        fields: ['voucherNo']
      },
      {
        fields: ['isCancelled']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['postingDate', 'accountId']
      }
    ],
    hooks: {
      beforeCreate: (entry) => {
        // Ensure either debit or credit is set, not both
        if (entry.debit > 0 && entry.credit > 0) {
          throw new Error('GL Entry cannot have both debit and credit amounts');
        }
        if (entry.debit === 0 && entry.credit === 0) {
          throw new Error('GL Entry must have either debit or credit amount');
        }
      },
      beforeUpdate: (entry) => {
        if (entry.changed('isCancelled') && entry.isCancelled) {
          entry.cancelledAt = new Date();
        }
      }
    }
  });

  // Instance methods
  GLEntry.prototype.getAmount = function() {
    return this.debit > 0 ? this.debit : this.credit;
  };

  GLEntry.prototype.isDebit = function() {
    return this.debit > 0;
  };

  GLEntry.prototype.isCredit = function() {
    return this.credit > 0;
  };

  GLEntry.prototype.cancel = function(cancelledBy) {
    this.isCancelled = true;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    return this.save();
  };

  // Class methods
  GLEntry.findByVoucher = function(voucherType, voucherNo) {
    return this.findAll({
      where: { voucherType, voucherNo, isCancelled: false }
    });
  };

  GLEntry.findByAccount = function(accountId, startDate, endDate) {
    const where = { accountId, isCancelled: false };
    if (startDate) where.postingDate = { [sequelize.Op.gte]: startDate };
    if (endDate) where.postingDate = { [sequelize.Op.lte]: endDate };
    
    return this.findAll({
      where,
      order: [['postingDate', 'ASC'], ['createdAt', 'ASC']]
    });
  };

  GLEntry.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        postingDate: {
          [sequelize.Op.between]: [startDate, endDate]
        },
        isCancelled: false
      },
      order: [['postingDate', 'ASC'], ['createdAt', 'ASC']]
    });
  };

  // Associations
  GLEntry.associate = (models) => {
    GLEntry.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    GLEntry.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    GLEntry.belongsTo(models.User, { foreignKey: 'cancelledBy', as: 'canceller' });
    GLEntry.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
  };

  return GLEntry;
};

