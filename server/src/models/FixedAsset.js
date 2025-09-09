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
      type: DataTypes.ENUM('buildings', 'machinery', 'vehicles', 'equipment', 'furniture', 'computers', 'other'),
      allowNull: false,
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


  }, {
    tableName: 'fixed_assets',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['assetNumber']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      }
    ],
    hooks: {
      beforeCreate: (asset) => {
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

  FixedAsset.findByCategory = function(category) {
    return this.findAll({ where: { category } });
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

  // Associations
  FixedAsset.associate = (models) => {
    // Add associations if needed
  };

  return FixedAsset;
};

