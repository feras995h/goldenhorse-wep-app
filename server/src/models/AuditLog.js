import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tableName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'اسم الجدول المتأثر'
    },
    recordId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'معرف السجل المتأثر'
    },
    action: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'POST', 'UNPOST'),
      allowNull: false,
      comment: 'نوع العملية المنفذة'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'المستخدم الذي نفذ العملية'
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'القيم القديمة قبل التغيير'
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'القيم الجديدة بعد التغيير'
    },
    changedFields: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'قائمة الحقول المتغيرة'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'وصف العملية'
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      comment: 'عنوان IP للمستخدم'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'معلومات المتصفح'
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'معرف الجلسة'
    },
    isSystemAction: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'هل العملية تلقائية من النظام'
    },
    severity: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      defaultValue: 'MEDIUM',
      comment: 'مستوى أهمية العملية'
    },
    category: {
      type: DataTypes.ENUM(
        'ACCOUNTING', 'FINANCIAL', 'CUSTOMER', 'INVOICE', 'PAYMENT', 
        'INVENTORY', 'USER', 'SYSTEM', 'SECURITY', 'CONFIGURATION'
      ),
      allowNull: false,
      comment: 'فئة العملية'
    },
    relatedRecords: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'السجلات المرتبطة المتأثرة'
    },
    businessImpact: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'تأثير العملية على العمل'
    },
    complianceFlags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'علامات الامتثال والمراجعة'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false, // لا نحتاج updatedAt لسجلات التدقيق
    indexes: [
      {
        fields: ['tableName']
      },
      {
        fields: ['recordId']
      },
      {
        fields: ['action']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['category']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['tableName', 'recordId']
      },
      {
        fields: ['userId', 'createdAt']
      },
      {
        fields: ['category', 'action']
      }
    ],
    hooks: {
      beforeCreate: (auditLog) => {
        // تحديد مستوى الأهمية تلقائياً حسب نوع العملية
        if (!auditLog.severity) {
          switch (auditLog.action) {
            case 'DELETE':
            case 'CANCEL':
              auditLog.severity = 'HIGH';
              break;
            case 'POST':
            case 'UNPOST':
              auditLog.severity = 'MEDIUM';
              break;
            case 'CREATE':
            case 'UPDATE':
              auditLog.severity = 'LOW';
              break;
            default:
              auditLog.severity = 'MEDIUM';
          }
        }

        // تحديد الفئة تلقائياً حسب اسم الجدول
        if (!auditLog.category) {
          const table = auditLog.tableName.toLowerCase();
          if (table.includes('account') || table.includes('gl_') || table.includes('journal')) {
            auditLog.category = 'ACCOUNTING';
          } else if (table.includes('invoice') || table.includes('payment')) {
            auditLog.category = 'FINANCIAL';
          } else if (table.includes('customer')) {
            auditLog.category = 'CUSTOMER';
          } else if (table.includes('user')) {
            auditLog.category = 'USER';
          } else {
            auditLog.category = 'SYSTEM';
          }
        }
      }
    }
  });

  // Instance methods
  AuditLog.prototype.getFormattedChanges = function() {
    if (!this.changedFields || !this.oldValues || !this.newValues) {
      return null;
    }

    return this.changedFields.map(field => ({
      field,
      oldValue: this.oldValues[field],
      newValue: this.newValues[field]
    }));
  };

  AuditLog.prototype.hasFinancialImpact = function() {
    return ['ACCOUNTING', 'FINANCIAL'].includes(this.category) ||
           ['accounts', 'gl_entries', 'journal_entries', 'invoices', 'payments'].includes(this.tableName);
  };

  // Class methods
  AuditLog.logAction = async function(params) {
    const {
      tableName,
      recordId,
      action,
      userId,
      oldValues = null,
      newValues = null,
      description = null,
      ipAddress = null,
      userAgent = null,
      sessionId = null,
      isSystemAction = false,
      category = null,
      severity = null,
      relatedRecords = null,
      businessImpact = null,
      complianceFlags = null
    } = params;

    // تحديد الحقول المتغيرة
    let changedFields = null;
    if (oldValues && newValues) {
      changedFields = Object.keys(newValues).filter(key => 
        JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
      );
    }

    return await this.create({
      tableName,
      recordId,
      action,
      userId,
      oldValues,
      newValues,
      changedFields,
      description,
      ipAddress,
      userAgent,
      sessionId,
      isSystemAction,
      category,
      severity,
      relatedRecords,
      businessImpact,
      complianceFlags
    });
  };

  AuditLog.findByRecord = function(tableName, recordId) {
    return this.findAll({
      where: { tableName, recordId },
      order: [['createdAt', 'DESC']],
      include: [{ model: sequelize.models.User, as: 'user', attributes: ['id', 'username', 'name'] }]
    });
  };

  AuditLog.findByUser = function(userId, startDate = null, endDate = null) {
    const where = { userId };
    if (startDate) where.createdAt = { [sequelize.Op.gte]: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, [sequelize.Op.lte]: endDate };

    return this.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: sequelize.models.User, as: 'user', attributes: ['id', 'username', 'name'] }]
    });
  };

  AuditLog.findFinancialChanges = function(startDate = null, endDate = null) {
    const where = {
      category: ['ACCOUNTING', 'FINANCIAL']
    };
    if (startDate) where.createdAt = { [sequelize.Op.gte]: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, [sequelize.Op.lte]: endDate };

    return this.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: sequelize.models.User, as: 'user', attributes: ['id', 'username', 'name'] }]
    });
  };

  // Associations
  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
};
