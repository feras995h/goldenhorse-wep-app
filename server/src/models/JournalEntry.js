import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const JournalEntry = sequelize.define('JournalEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entryNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 20]
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    totalDebit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    totalCredit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      defaultValue: 'draft'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    postedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    postedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'journal_entries',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['entryNumber']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      }
    ],
    hooks: {
      beforeCreate: (entry) => {
        // Validate that debits equal credits (compare numerically to avoid string/decimal issues)
        const td = parseFloat(entry.totalDebit) || 0;
        const tc = parseFloat(entry.totalCredit) || 0;
        if (Math.abs(td - tc) > 0.01) {
          throw new Error('Total debits must equal total credits');
        }
      },
      beforeUpdate: (entry) => {
        if (entry.changed('totalDebit') || entry.changed('totalCredit')) {
          const td = parseFloat(entry.totalDebit) || 0;
          const tc = parseFloat(entry.totalCredit) || 0;
          if (Math.abs(td - tc) > 0.01) {
            throw new Error('Total debits must equal total credits');
          }
        }
        if (entry.changed('status')) {
          if (entry.status === 'submitted') {
            entry.submittedAt = new Date();
          } else if (entry.status === 'posted') {
            entry.postedAt = new Date();
          } else if (entry.status === 'cancelled') {
            entry.cancelledAt = new Date();
          }
        }
      }
    }
  });

  // Instance methods
  JournalEntry.prototype.getTotalDebit = function() {
    return parseFloat(this.totalDebit) || 0;
  };

  JournalEntry.prototype.getTotalCredit = function() {
    return parseFloat(this.totalCredit) || 0;
  };

  JournalEntry.prototype.isBalanced = function() {
    return this.getTotalDebit() === this.getTotalCredit();
  };

  JournalEntry.prototype.isPosted = function() {
    return this.status === 'posted';
  };

  JournalEntry.prototype.isCancelled = function() {
    return this.status === 'cancelled';
  };

  JournalEntry.prototype.post = function(postedBy) {
    this.status = 'posted';
    this.postedBy = postedBy;
    this.postedAt = new Date();
    return this.save();
  };

  // Class methods
  JournalEntry.findByEntryNumber = function(entryNumber) {
    return this.findOne({ where: { entryNumber } });
  };

  JournalEntry.findByStatus = function(status) {
    return this.findAll({ where: { status } });
  };

  JournalEntry.findPosted = function() {
    return this.findAll({ where: { status: 'posted' } });
  };

  JournalEntry.findByDateRange = function(startDate, endDate) {
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
  JournalEntry.associate = (models) => {
    JournalEntry.belongsTo(models.User, { foreignKey: 'postedBy', as: 'poster' });
    JournalEntry.hasMany(models.JournalEntryDetail, { 
      foreignKey: 'journalEntryId', 
      as: 'details',
      onDelete: 'CASCADE'
    });
  };

  return JournalEntry;
};

