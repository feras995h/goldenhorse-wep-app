import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const FixedAsset = sequelize.define('FixedAsset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
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
    nameEn: {
      type: DataTypes.STRING(200),
      allowNull: true
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
    cost: {
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
    depreciationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    accumulatedDepreciation: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
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
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    responsiblePerson: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    supplier: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    warrantyExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    lastMaintenanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    nextMaintenanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    disposedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    disposedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    disposalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    }
  }, {
    tableName: 'fixed_assets',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['department']
      },
      {
        fields: ['createdBy']
      }
    ],
    hooks: {
      beforeCreate: (asset) => {
        // Calculate current value initially
        asset.currentValue = asset.cost;
      },
      beforeUpdate: (asset) => {
        // Update current value based on accumulated depreciation
        asset.currentValue = asset.cost - asset.accumulatedDepreciation;
        
        if (asset.changed('status') && asset.status === 'disposed') {
          asset.disposedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  FixedAsset.prototype.getCost = function() {
    return parseFloat(this.cost) || 0;
  };

  FixedAsset.prototype.getCurrentValue = function() {
    return parseFloat(this.currentValue) || 0;
  };

  FixedAsset.prototype.getAccumulatedDepreciation = function() {
    return parseFloat(this.accumulatedDepreciation) || 0;
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
    const annualDepreciation = (this.cost - this.salvageValue) / this.usefulLife;
    return annualDepreciation;
  };

  FixedAsset.prototype.addDepreciation = function(amount) {
    this.accumulatedDepreciation += amount;
    this.currentValue = this.cost - this.accumulatedDepreciation;
    return this.save();
  };

  FixedAsset.prototype.dispose = function(disposedBy, disposalAmount = 0) {
    this.status = 'disposed';
    this.disposedBy = disposedBy;
    this.disposedAt = new Date();
    this.disposalAmount = disposalAmount;
    return this.save();
  };

  // Class methods
  FixedAsset.findByCode = function(code) {
    return this.findOne({ where: { code } });
  };

  FixedAsset.findActive = function() {
    return this.findAll({ where: { status: 'active' } });
  };

  FixedAsset.findByCategory = function(category) {
    return this.findAll({ where: { category } });
  };

  FixedAsset.findByDepartment = function(department) {
    return this.findAll({ where: { department } });
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
    FixedAsset.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    FixedAsset.belongsTo(models.User, { foreignKey: 'disposedBy', as: 'disposer' });
  };

  return FixedAsset;
};

