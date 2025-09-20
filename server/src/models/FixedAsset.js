import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const FixedAsset = sequelize.define('FixedAsset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    assetNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('vehicles', 'equipment', 'furniture', 'machinery', 'other'),
      defaultValue: 'other'
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    purchaseCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999999999999.99
      }
    },
    salvageValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    usefulLife: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      }
    },
    depreciationMethod: {
      type: DataTypes.ENUM('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production'),
      defaultValue: 'straight_line'
    },
    currentValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'disposed', 'sold', 'damaged', 'maintenance'),
      defaultValue: 'active'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoryAccountId: {
      type: DataTypes.UUID,
      allowNull: true, // Made nullable to match database
      comment: 'Reference to the fixed asset category account from chart of accounts'
    }
    // Removed the missing columns that don't exist in the database:
    // assetAccountId, depreciationExpenseAccountId, accumulatedDepreciationAccountId
  }, {
    tableName: 'fixed_assets',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['assetNumber']
      }
      // Removed index on categoryAccountId since it's nullable
    ],
    hooks: {
      beforeCreate: async (asset) => {
        // Generate asset number if not provided
        if (!asset.assetNumber) {
          const lastAsset = await FixedAsset.findOne({
            order: [['assetNumber', 'DESC']]
          });

          let nextNumber = 1;
          if (lastAsset && lastAsset.assetNumber) {
            // Extract number from asset number (assuming format like "FA000001")
            const match = lastAsset.assetNumber.match(/\d+$/);
            if (match) {
              nextNumber = parseInt(match[0]) + 1;
            }
          }

          asset.assetNumber = `FA${String(nextNumber).padStart(6, '0')}`;
        }

        // Calculate current value initially
        asset.currentValue = asset.purchaseCost;
      },
      beforeUpdate: (asset) => {
        // Add any update logic here if needed
      }
    }
  });

  // Instance methods
  FixedAsset.prototype.getCost = function() {
    return parseFloat(this.purchaseCost) || 0;
  };

  FixedAsset.prototype.getCurrentValue = function() {
    return parseFloat(this.currentValue) || 0;
  };



  FixedAsset.prototype.getSalvageValue = function() {
    return parseFloat(this.salvageValue) || 0;
  };

  FixedAsset.prototype.isActive = function() {
    return this.status === 'active';
  };

  FixedAsset.prototype.isDisposed = function() {
    return this.status === 'disposed';
  };

  FixedAsset.prototype.getAge = function() {
    const purchaseDate = new Date(this.purchaseDate);
    const today = new Date();
    return Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24 * 365));
  };

  FixedAsset.prototype.calculateDepreciation = function() {
    const annualDepreciation = (this.purchaseCost - this.salvageValue) / this.usefulLife;
    return annualDepreciation;
  };



  FixedAsset.prototype.dispose = function() {
    this.status = 'disposed';
    return this.save();
  };

  // Class methods
  FixedAsset.findByAssetNumber = function(assetNumber) {
    return this.findOne({ where: { assetNumber } });
  };

  FixedAsset.findActive = function() {
    return this.findAll({ where: { status: 'active' } });
  };

  FixedAsset.findByCategory = function(categoryAccountId) {
    return this.findAll({ where: { categoryAccountId } });
  };



  FixedAsset.findDisposed = function() {
    return this.findAll({ where: { status: 'disposed' } });
  };

  FixedAsset.findByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        purchaseDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
  };

  // Associations - simplified to match actual database structure
  FixedAsset.associate = (models) => {
    // Only keep the association that actually exists in the database
    // The other associations (assetAccount, depreciationExpenseAccount, accumulatedDepreciationAccount) 
    // don't exist in the actual database table
    if (models.Account) {
      FixedAsset.belongsTo(models.Account, {
        foreignKey: 'categoryAccountId',
        as: 'categoryAccount',
        onDelete: 'SET NULL' // Changed from RESTRICT to SET NULL to match nullable column
      });
    }
  };

  return FixedAsset;
};

