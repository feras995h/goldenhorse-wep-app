import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AccountingPeriod = sequelize.define('AccountingPeriod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2050
      }
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'archived'),
      defaultValue: 'open',
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archivedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // إحصائيات الفترة
    totalTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalDebit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    totalCredit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'accounting_periods',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['year', 'month'],
        name: 'unique_year_month'
      },
      {
        fields: ['status']
      },
      {
        fields: ['startDate', 'endDate']
      }
    ],
    hooks: {
      beforeCreate: (period) => {
        // التأكد من أن تاريخ البداية قبل تاريخ النهاية
        if (period.startDate >= period.endDate) {
          throw new Error('تاريخ بداية الفترة يجب أن يكون قبل تاريخ النهاية');
        }
        
        // تحديد تواريخ الفترة تلقائياً إذا لم تكن محددة
        if (!period.startDate || !period.endDate) {
          const startDate = new Date(period.year, period.month - 1, 1);
          const endDate = new Date(period.year, period.month, 0);
          
          period.startDate = startDate.toISOString().split('T')[0];
          period.endDate = endDate.toISOString().split('T')[0];
        }
      },
      
      beforeUpdate: (period) => {
        // منع تعديل الفترات المؤرشفة
        if (period.previous('status') === 'archived') {
          throw new Error('لا يمكن تعديل الفترات المؤرشفة');
        }
        
        // تسجيل وقت الإقفال
        if (period.changed('status') && period.status === 'closed' && !period.closedAt) {
          period.closedAt = new Date();
        }
        
        // تسجيل وقت الأرشفة
        if (period.changed('status') && period.status === 'archived' && !period.archivedAt) {
          period.archivedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  AccountingPeriod.prototype.isOpen = function() {
    return this.status === 'open';
  };

  AccountingPeriod.prototype.isClosed = function() {
    return this.status === 'closed';
  };

  AccountingPeriod.prototype.isArchived = function() {
    return this.status === 'archived';
  };

  AccountingPeriod.prototype.canModify = function() {
    return this.status === 'open';
  };

  AccountingPeriod.prototype.close = async function(userId) {
    if (this.status !== 'open') {
      throw new Error('يمكن إقفال الفترات المفتوحة فقط');
    }
    
    this.status = 'closed';
    this.closedAt = new Date();
    this.closedBy = userId;
    
    return await this.save();
  };

  AccountingPeriod.prototype.archive = async function(userId) {
    if (this.status !== 'closed') {
      throw new Error('يمكن أرشفة الفترات المقفلة فقط');
    }
    
    this.status = 'archived';
    this.archivedAt = new Date();
    this.archivedBy = userId;
    
    return await this.save();
  };

  AccountingPeriod.prototype.reopen = async function() {
    if (this.status === 'archived') {
      throw new Error('لا يمكن إعادة فتح الفترات المؤرشفة');
    }
    
    if (this.status === 'closed') {
      this.status = 'open';
      this.closedAt = null;
      this.closedBy = null;
      
      return await this.save();
    }
    
    throw new Error('الفترة مفتوحة بالفعل');
  };

  // Class methods
  AccountingPeriod.getCurrentPeriod = async function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    return await this.findOne({
      where: { year, month }
    });
  };

  AccountingPeriod.getOrCreateCurrentPeriod = async function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    let period = await this.findOne({
      where: { year, month }
    });
    
    if (!period) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      period = await this.create({
        year,
        month,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'open'
      });
    }
    
    return period;
  };

  AccountingPeriod.findByDate = async function(date) {
    const targetDate = new Date(date);
    
    return await this.findOne({
      where: {
        startDate: { [sequelize.Sequelize.Op.lte]: targetDate },
        endDate: { [sequelize.Sequelize.Op.gte]: targetDate }
      }
    });
  };

  AccountingPeriod.getOpenPeriods = async function() {
    return await this.findAll({
      where: { status: 'open' },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  };

  AccountingPeriod.getClosedPeriods = async function() {
    return await this.findAll({
      where: { status: 'closed' },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  };

  // Associations
  AccountingPeriod.associate = (models) => {
    AccountingPeriod.belongsTo(models.User, { 
      foreignKey: 'closedBy', 
      as: 'closedByUser',
      onDelete: 'SET NULL'
    });
    AccountingPeriod.belongsTo(models.User, { 
      foreignKey: 'archivedBy', 
      as: 'archivedByUser',
      onDelete: 'SET NULL'
    });
  };

  return AccountingPeriod;
};
