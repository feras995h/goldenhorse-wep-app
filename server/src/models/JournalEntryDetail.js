import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const JournalEntryDetail = sequelize.define('JournalEntryDetail', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journal_entries',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    debit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    credit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'journal_entry_details',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['journalEntryId']
      },
      {
        fields: ['accountId']
      }
    ],
    hooks: {
      beforeCreate: (detail) => {
        // Ensure either debit or credit is provided, but not both
        if (detail.debit === 0 && detail.credit === 0) {
          throw new Error('Either debit or credit amount must be provided');
        }
        if (detail.debit > 0 && detail.credit > 0) {
          throw new Error('Cannot have both debit and credit amounts');
        }
      },
      beforeUpdate: (detail) => {
        if (detail.changed('debit') || detail.changed('credit')) {
          if (detail.debit === 0 && detail.credit === 0) {
            throw new Error('Either debit or credit amount must be provided');
          }
          if (detail.debit > 0 && detail.credit > 0) {
            throw new Error('Cannot have both debit and credit amounts');
          }
        }
      }
    }
  });

  // Instance methods
  JournalEntryDetail.prototype.getDebit = function() {
    return parseFloat(this.debit) || 0;
  };

  JournalEntryDetail.prototype.getCredit = function() {
    return parseFloat(this.credit) || 0;
  };

  JournalEntryDetail.prototype.getAmount = function() {
    return this.getDebit() > 0 ? this.getDebit() : this.getCredit();
  };

  JournalEntryDetail.prototype.isDebit = function() {
    return this.getDebit() > 0;
  };

  JournalEntryDetail.prototype.isCredit = function() {
    return this.getCredit() > 0;
  };

  // Class methods
  JournalEntryDetail.findByJournalEntry = function(journalEntryId) {
    return this.findAll({
      where: { journalEntryId },
      order: [['createdAt', 'ASC']]
    });
  };

  JournalEntryDetail.findByAccount = function(accountId) {
    return this.findAll({
      where: { accountId },
      order: [['createdAt', 'DESC']]
    });
  };

  // Associations
  JournalEntryDetail.associate = (models) => {
    JournalEntryDetail.belongsTo(models.JournalEntry, { 
      foreignKey: 'journalEntryId', 
      as: 'journalEntry',
      onDelete: 'CASCADE'
    });
    JournalEntryDetail.belongsTo(models.Account, { 
      foreignKey: 'accountId', 
      as: 'account',
      onDelete: 'RESTRICT'
    });
  };

  return JournalEntryDetail;
};
