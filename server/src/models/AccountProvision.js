import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AccountProvision = sequelize.define('AccountProvision', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mainAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    provisionAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    provisionType: {
      type: DataTypes.ENUM(
        'doubtful_debts',
        'depreciation',
        'warranty',
        'bad_debts',
        'inventory_obsolescence',
        'legal_claims',
        'employee_benefits',
        'tax_provision',
        'other'
      ),
      allowNull: false,
      comment: 'Type of provision being created'
    },
    provisionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Provision rate as percentage (e.g., 5.00 for 5%)'
    },
    fixedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Fixed provision amount if not percentage-based'
    },
    calculationMethod: {
      type: DataTypes.ENUM('percentage', 'fixed_amount', 'manual'),
      allowNull: false,
      defaultValue: 'percentage',
      comment: 'How the provision amount is calculated'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this provision is currently active'
    },
    autoCalculate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether to automatically calculate provision amounts'
    },
    calculationFrequency: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'annually', 'manual'),
      defaultValue: 'monthly',
      comment: 'How often to recalculate the provision'
    },
    lastCalculationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Date of last provision calculation'
    },
    nextCalculationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Date of next scheduled provision calculation'
    },
    currentProvisionAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Current provision amount'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the provision purpose'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the provision'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    lastUpdatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'account_provisions',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['mainAccountId']
      },
      {
        fields: ['provisionAccountId']
      },
      {
        fields: ['provisionType']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['autoCalculate']
      },
      {
        fields: ['nextCalculationDate']
      },
      {
        unique: true,
        fields: ['mainAccountId', 'provisionType']
      }
    ],
    hooks: {
      beforeCreate: async (provision) => {
        // Set next calculation date based on frequency
        if (provision.autoCalculate && provision.calculationFrequency !== 'manual') {
          provision.nextCalculationDate = provision.calculateNextDate();
        }
      },
      beforeUpdate: async (provision) => {
        // Update next calculation date if frequency changed
        if (provision.changed('calculationFrequency') && provision.autoCalculate) {
          provision.nextCalculationDate = provision.calculateNextDate();
        }
      }
    }
  });

  // Instance methods
  AccountProvision.prototype.calculateNextDate = function() {
    const today = new Date();
    const nextDate = new Date(today);
    
    switch (this.calculationFrequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        return null;
    }
    
    return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

  AccountProvision.prototype.calculateProvisionAmount = async function() {
    const { Account } = sequelize.models;
    
    const mainAccount = await Account.findByPk(this.mainAccountId);
    if (!mainAccount) {
      throw new Error('Main account not found');
    }
    
    let provisionAmount = 0;
    
    switch (this.calculationMethod) {
      case 'percentage':
        if (this.provisionRate) {
          provisionAmount = (parseFloat(mainAccount.balance) * this.provisionRate) / 100;
        }
        break;
      case 'fixed_amount':
        provisionAmount = parseFloat(this.fixedAmount || 0);
        break;
      case 'manual':
        // Manual calculation - return current amount
        provisionAmount = parseFloat(this.currentProvisionAmount);
        break;
    }
    
    return Math.max(0, provisionAmount);
  };

  AccountProvision.prototype.updateProvision = async function(userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const newAmount = await this.calculateProvisionAmount();
      const difference = newAmount - parseFloat(this.currentProvisionAmount);
      
      if (Math.abs(difference) > 0.01) { // Only update if significant difference
        // Update provision amount
        await this.update({
          currentProvisionAmount: newAmount,
          lastCalculationDate: new Date(),
          lastUpdatedBy: userId,
          nextCalculationDate: this.autoCalculate ? this.calculateNextDate() : null
        }, { transaction });
        
        // Create journal entry for the adjustment
        if (difference !== 0) {
          await this.createProvisionJournalEntry(difference, userId, transaction);
        }
      }
      
      await transaction.commit();
      return { newAmount, difference };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  AccountProvision.prototype.createProvisionJournalEntry = async function(amount, userId, transaction) {
    const { JournalEntry, JournalEntryDetail, GLEntry } = sequelize.models;
    
    // Generate journal entry number
    const lastEntry = await JournalEntry.findOne({
      order: [['createdAt', 'DESC']]
    });
    const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace(/\D/g, '')) + 1 : 1;
    const entryNumber = `PROV-${String(nextNumber).padStart(6, '0')}`;
    
    // Create journal entry
    const journalEntry = await JournalEntry.create({
      entryNumber,
      date: new Date(),
      description: `Provision adjustment for ${this.provisionType}`,
      totalDebit: Math.abs(amount),
      totalCredit: Math.abs(amount),
      status: 'posted',
      type: 'provision',
      createdBy: userId
    }, { transaction });
    
    // Create journal entry details
    const details = [];
    
    if (amount > 0) {
      // Increase provision - Debit expense, Credit provision
      details.push({
        journalEntryId: journalEntry.id,
        accountId: this.mainAccountId,
        debit: amount,
        credit: 0,
        description: `Provision expense for ${this.provisionType}`
      });
      details.push({
        journalEntryId: journalEntry.id,
        accountId: this.provisionAccountId,
        debit: 0,
        credit: amount,
        description: `Provision liability for ${this.provisionType}`
      });
    } else {
      // Decrease provision - Debit provision, Credit expense
      const absAmount = Math.abs(amount);
      details.push({
        journalEntryId: journalEntry.id,
        accountId: this.provisionAccountId,
        debit: absAmount,
        credit: 0,
        description: `Provision reversal for ${this.provisionType}`
      });
      details.push({
        journalEntryId: journalEntry.id,
        accountId: this.mainAccountId,
        debit: 0,
        credit: absAmount,
        description: `Provision expense reversal for ${this.provisionType}`
      });
    }
    
    await JournalEntryDetail.bulkCreate(details, { transaction });
    
    // Create GL entries
    const glEntries = details.map(detail => ({
      postingDate: new Date(),
      accountId: detail.accountId,
      debit: detail.debit,
      credit: detail.credit,
      voucherType: 'Provision Entry',
      voucherNo: entryNumber,
      journalEntryId: journalEntry.id,
      remarks: detail.description,
      currency: 'LYD',
      exchangeRate: 1.0,
      createdBy: userId
    }));
    
    await GLEntry.bulkCreate(glEntries, { transaction });
    
    return journalEntry;
  };

  // Static methods
  AccountProvision.getDueProvisions = async function() {
    const today = new Date().toISOString().split('T')[0];
    
    return await AccountProvision.findAll({
      where: {
        isActive: true,
        autoCalculate: true,
        nextCalculationDate: {
          [sequelize.Op.lte]: today
        }
      },
      include: [
        { model: sequelize.models.Account, as: 'mainAccount' },
        { model: sequelize.models.Account, as: 'provisionAccount' }
      ]
    });
  };

  // Associations
  AccountProvision.associate = (models) => {
    AccountProvision.belongsTo(models.Account, { 
      foreignKey: 'mainAccountId', 
      as: 'mainAccount' 
    });
    AccountProvision.belongsTo(models.Account, { 
      foreignKey: 'provisionAccountId', 
      as: 'provisionAccount' 
    });
    AccountProvision.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator' 
    });
    AccountProvision.belongsTo(models.User, { 
      foreignKey: 'lastUpdatedBy', 
      as: 'updater' 
    });
  };

  return AccountProvision;
};
