import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AccountMapping = sequelize.define('AccountMapping', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    salesRevenueAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for sales revenue'
    },
    salesTaxAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for sales tax payable'
    },
    accountsReceivableAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for accounts receivable'
    },
    localCustomersAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for local customers receivables'
    },
    foreignCustomersAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for foreign customers receivables'
    },
    discountAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for sales discounts'
    },
    shippingRevenueAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for shipping revenue'
    },
    handlingFeeAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for handling fees'
    },
    customsClearanceAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for customs clearance fees'
    },
    insuranceAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for insurance fees'
    },
    storageAccount: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for storage fees'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this mapping is currently active'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of this account mapping configuration'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'account_mappings',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['salesRevenueAccount']
      },
      {
        fields: ['salesTaxAccount']
      },
      {
        fields: ['accountsReceivableAccount']
      }
    ],
    hooks: {
      beforeCreate: async (accountMapping) => {
        // Deactivate other active mappings when creating a new one
        if (accountMapping.isActive) {
          await AccountMapping.update(
            { isActive: false },
            { where: { isActive: true } }
          );
        }
      },
      beforeUpdate: async (accountMapping) => {
        // Deactivate other active mappings when activating this one
        if (accountMapping.isActive && accountMapping.changed('isActive')) {
          await AccountMapping.update(
            { isActive: false },
            { 
              where: { 
                isActive: true,
                id: { [sequelize.Sequelize.Op.ne]: accountMapping.id }
              }
            }
          );
        }
      }
    }
  });

  // Instance methods
  AccountMapping.prototype.validateMapping = function() {
    const requiredFields = [
      'salesRevenueAccount',
      'salesTaxAccount',
      'accountsReceivableAccount'
    ];
    
    const missingFields = requiredFields.filter(field => !this[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required account mappings: ${missingFields.join(', ')}`);
    }
    
    return true;
  };

  AccountMapping.prototype.getAccountMapping = function() {
    return {
      salesRevenueAccount: this.salesRevenueAccount,
      salesTaxAccount: this.salesTaxAccount,
      accountsReceivableAccount: this.accountsReceivableAccount,
      localCustomersAccount: this.localCustomersAccount,
      foreignCustomersAccount: this.foreignCustomersAccount,
      discountAccount: this.discountAccount,
      shippingRevenueAccount: this.shippingRevenueAccount,
      handlingFeeAccount: this.handlingFeeAccount,
      customsClearanceAccount: this.customsClearanceAccount,
      insuranceAccount: this.insuranceAccount,
      storageAccount: this.storageAccount
    };
  };

  // Class methods
  AccountMapping.getActiveMapping = async function() {
    return await this.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });
  };

  AccountMapping.createDefaultMapping = async function(userId) {
    const { Account } = sequelize.models;
    
    try {
      // Find default accounts by common patterns
      const salesAccount = await Account.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { name: { [sequelize.Sequelize.Op.like]: '%مبيعات%' } },
            { name: { [sequelize.Sequelize.Op.like]: '%sales%' } },
            { code: { [sequelize.Sequelize.Op.like]: '41%' } }
          ],
          type: 'revenue'
        }
      });

      const taxAccount = await Account.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { name: { [sequelize.Sequelize.Op.like]: '%ضريبة%' } },
            { name: { [sequelize.Sequelize.Op.like]: '%tax%' } },
            { code: { [sequelize.Sequelize.Op.like]: '23%' } }
          ],
          type: 'liability'
        }
      });

      const receivableAccount = await Account.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { name: { [sequelize.Sequelize.Op.like]: '%ذمم%' } },
            { name: { [sequelize.Sequelize.Op.like]: '%عملاء%' } },
            { name: { [sequelize.Sequelize.Op.like]: '%receivable%' } },
            { code: { [sequelize.Sequelize.Op.like]: '12%' } }
          ],
          type: 'asset'
        }
      });

      return await this.create({
        salesRevenueAccount: salesAccount?.id,
        salesTaxAccount: taxAccount?.id,
        accountsReceivableAccount: receivableAccount?.id,
        description: 'Default account mapping created automatically',
        isActive: true,
        createdBy: userId
      });
    } catch (error) {
      console.error('Error creating default account mapping:', error);
      throw error;
    }
  };

  // Associations
  AccountMapping.associate = (models) => {
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'salesRevenueAccount', 
      as: 'salesRevenueAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'salesTaxAccount', 
      as: 'salesTaxAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'accountsReceivableAccount', 
      as: 'accountsReceivableAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'discountAccount', 
      as: 'discountAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'shippingRevenueAccount', 
      as: 'shippingRevenueAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'handlingFeeAccount', 
      as: 'handlingFeeAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'customsClearanceAccount', 
      as: 'customsClearanceAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'insuranceAccount', 
      as: 'insuranceAccountDetails' 
    });
    AccountMapping.belongsTo(models.Account, { 
      foreignKey: 'storageAccount', 
      as: 'storageAccountDetails' 
    });
    
    AccountMapping.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    AccountMapping.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
  };

  return AccountMapping;
};
